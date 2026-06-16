'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, X, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { useCategories, type Category } from '@/hooks/queries/useCategories'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopifyVariant {
  sku: string
  price: number
  compareAtPrice: number
  stock: number
  weightGrams: number
  attributes: { name: string; value: string }[]
}

interface ShopifyProduct {
  handle: string
  name: string
  shortDescription: string
  descriptionHtml: string
  shopifyType: string
  tags: string[]
  status: string
  weightGrams: number
  imageUrls: string[]
  variants: ShopifyVariant[]
  minPrice: number
}

interface ImportConfig {
  typeToCategory: Record<string, string>
  priceMode: 'retail' | 'percent'
  pricePercent: number
  defaultMoq: number
  defaultLeadTime: string
  enabledZones: string[]
}

interface RowOverride {
  price: string
  moq: string
  skip: boolean
}

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

type Step = 'upload' | 'configure' | 'review' | 'done'

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_TIMES = [
  { value: 'ONE_TO_THREE_DAYS', label: '1–3 days' },
  { value: 'ONE_TO_TWO_WEEKS', label: '1–2 weeks' },
  { value: 'TWO_TO_FOUR_WEEKS', label: '2–4 weeks' },
]

const SHIPPING_ZONES = [
  { label: 'India (Domestic)', value: 'DOMESTIC' },
  { label: 'South Asia', value: 'SOUTH_ASIA' },
  { label: 'Southeast Asia', value: 'SOUTHEAST_ASIA' },
  { label: 'Middle East', value: 'MIDDLE_EAST' },
  { label: 'Europe', value: 'EUROPE' },
  { label: 'North America', value: 'NORTH_AMERICA' },
  { label: 'Oceania', value: 'OCEANIA' },
  { label: 'Rest of World', value: 'REST_OF_WORLD' },
]

// ─── Shopify CSV Parser ───────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  values.push(current)
  return values
}

function normalizeHeader(h: string): string {
  return h
    .replace(/[()]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function stripHtml(html: string): string {
  try {
    const div = document.createElement('div')
    div.innerHTML = html
    return (div.textContent ?? '').replace(/\s+/g, ' ').trim()
  } catch {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

function parseShopifyCsv(text: string): ShopifyProduct[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) throw new Error('File must have a header row and at least one product row')

  const rawHeaders = parseCsvLine(lines[0])
  const headers = rawHeaders.map(normalizeHeader)

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.every((v) => !v.trim())) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })
    rows.push(row)
  }

  // Group by Handle
  const handleMap = new Map<string, Record<string, string>[]>()
  const handleOrder: string[] = []
  for (const row of rows) {
    const handle = (row['handle'] ?? '').trim()
    if (!handle) continue
    if (!handleMap.has(handle)) { handleMap.set(handle, []); handleOrder.push(handle) }
    handleMap.get(handle)!.push(row)
  }

  const products: ShopifyProduct[] = []

  for (const handle of handleOrder) {
    const groupRows = handleMap.get(handle)!
    const first = groupRows[0]

    const descHtml = first['body_html'] ?? ''
    const shortDescription = stripHtml(descHtml).slice(0, 160) || (first['title'] ?? '').slice(0, 160)

    // Collect image URLs (deduped, excluding empty)
    const imageUrls = [...new Set(groupRows.map((r) => r['image_src']).filter(Boolean))]

    // Collect variants — filter out the Shopify default "Title / Default Title" pseudo-variant
    const variants: ShopifyVariant[] = []
    const seenSkus = new Set<string>()

    for (const row of groupRows) {
      const sku = row['variant_sku']?.trim() ?? ''

      const attrs: { name: string; value: string }[] = []
      for (const n of [1, 2, 3]) {
        const name = row[`option${n}_name`]?.trim() ?? ''
        const value = row[`option${n}_value`]?.trim() ?? ''
        if (name && value && name.toLowerCase() !== 'title' && value.toLowerCase() !== 'default title') {
          attrs.push({ name, value })
        }
      }

      // Skip rows with no real variant data
      if (!sku && attrs.length === 0) continue
      if (sku && seenSkus.has(sku)) continue
      if (sku) seenSkus.add(sku)

      const price = parseFloat(row['variant_price'] ?? '0') || 0
      const compareAtPrice = parseFloat(row['variant_compare_at_price'] ?? '0') || 0
      const stock = parseInt(row['variant_inventory_qty'] ?? '0', 10) || 0
      const grams = parseInt(row['variant_grams'] ?? '0', 10) || 0

      variants.push({ sku, price, compareAtPrice, stock, weightGrams: grams, attributes: attrs })
    }

    // Tags: Shopify stores comma-separated in a single cell
    const tags = (first['tags'] ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)

    // Weight: use first variant's weight, fallback to 0 (user must have set product weight)
    const weightGrams = variants[0]?.weightGrams || parseInt(first['variant_grams'] ?? '0', 10) || 0

    // Min price across variants (or 0 if no variants)
    const minPrice = variants.length
      ? Math.min(...variants.map((v) => v.price).filter((p) => p > 0))
      : 0

    const status = (first['status'] ?? 'active').toLowerCase()

    products.push({
      handle,
      name: (first['title'] ?? handle).slice(0, 80),
      shortDescription,
      descriptionHtml: descHtml,
      shopifyType: (first['type'] ?? '').trim(),
      tags,
      status,
      weightGrams,
      imageUrls,
      variants,
      minPrice,
    })
  }

  return products
}

// ─── Price computation ────────────────────────────────────────────────────────

function computePrice(product: ShopifyProduct, config: ImportConfig, override?: string): number {
  const raw = parseFloat(override ?? '') || null
  if (raw !== null && raw > 0) return raw
  const base = product.minPrice || 1
  return config.priceMode === 'retail'
    ? base
    : Math.max(0.01, Math.round(base * config.pricePercent) / 100)
}

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────

function UploadStep({ onParsed }: { onParsed: (p: ShopifyProduct[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please upload a .csv file exported from Shopify')
      return
    }
    setParsing(true)
    try {
      const text = await file.text()
      const products = parseShopifyCsv(text)
      if (products.length === 0) throw new Error('No products found in the CSV file')
      onParsed(products)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse CSV')
    } finally {
      setParsing(false)
    }
  }, [onParsed])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div className="max-w-xl">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${
          dragging ? 'border-accent bg-accent/5' : 'border-border-warm hover:border-accent hover:bg-muted-bg/50'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleChange} />
        <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
          <Upload size={22} className="text-muted-text" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-[600] font-public-sans text-primary">
            {parsing ? 'Parsing CSV…' : 'Drop your Shopify CSV here'}
          </p>
          <p className="text-[13px] font-public-sans text-muted-text mt-1">
            or click to browse · .csv files only
          </p>
        </div>
        {parsing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-surface/70">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="mt-6 p-4 rounded border border-border-warm bg-muted-bg/30">
        <p className="text-[13px] font-[600] font-public-sans text-primary mb-2">
          How to export from Shopify
        </p>
        <ol className="text-[13px] font-public-sans text-muted-text space-y-1 list-decimal list-inside">
          <li>Go to <span className="font-[500] text-primary">Products</span> in your Shopify admin</li>
          <li>Click <span className="font-[500] text-primary">Export</span> (top-right)</li>
          <li>Choose <span className="font-[500] text-primary">All products</span> and format <span className="font-[500] text-primary">CSV for Excel</span></li>
          <li>Click <span className="font-[500] text-primary">Export products</span> — Shopify emails you the file</li>
        </ol>
        <p className="text-[12px] font-public-sans text-muted-text mt-3">
          Note: Product images are not imported automatically. You can add them after listing from the product edit page.
        </p>
      </div>
    </div>
  )
}

// ─── Step 2: Configure ────────────────────────────────────────────────────────

function ConfigureStep({
  products,
  config,
  setConfig,
  categories,
  onBack,
  onNext,
}: {
  products: ShopifyProduct[]
  config: ImportConfig
  setConfig: React.Dispatch<React.SetStateAction<ImportConfig>>
  categories: Category[]
  onBack: () => void
  onNext: () => void
}) {
  const uniqueTypes = [...new Set(products.map((p) => p.shopifyType))]
  const totalVariants = products.reduce((s, p) => s + p.variants.length, 0)

  function setTypeCategory(type: string, catSlug: string) {
    setConfig((c) => ({ ...c, typeToCategory: { ...c.typeToCategory, [type]: catSlug } }))
  }

  function toggleZone(zone: string) {
    setConfig((c) => {
      const has = c.enabledZones.includes(zone)
      if (has && c.enabledZones.length === 1) { toast.error('At least one shipping zone is required'); return c }
      return { ...c, enabledZones: has ? c.enabledZones.filter((z) => z !== zone) : [...c.enabledZones, zone] }
    })
  }

  const unmappedTypes = uniqueTypes.filter((t) => !config.typeToCategory[t])
  const canProceed = unmappedTypes.length === 0

  return (
    <div className="max-w-2xl space-y-6">
      {/* Summary */}
      <div className="bg-muted-bg/40 border border-border-warm rounded p-4 text-[13px] font-public-sans text-muted-text">
        Found <span className="font-[600] text-primary">{products.length} products</span>
        {' · '}<span className="font-[600] text-primary">{uniqueTypes.length} product types</span>
        {totalVariants > 0 && <>{' · '}<span className="font-[600] text-primary">{totalVariants} variants</span></>}
      </div>

      {/* Category mapping */}
      <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
        <div>
          <h2 className="text-[15px] font-[600] font-public-sans text-primary">Category Mapping</h2>
          <p className="text-[13px] font-public-sans text-muted-text mt-0.5">
            Map each Shopify product type to a Solomon Bharat category
          </p>
        </div>
        <div className="space-y-3">
          {uniqueTypes.map((type) => (
            <div key={type || '__empty__'} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-public-sans text-primary truncate">
                  {type || <span className="italic text-muted-text">No type / untagged</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 text-muted-text text-[12px]">→</div>
              <select
                value={config.typeToCategory[type] ?? ''}
                onChange={(e) => setTypeCategory(type, e.target.value)}
                className="w-52 h-9 px-3 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {!canProceed && (
          <p className="text-[12px] font-public-sans text-amber-600">
            Please map all product types before continuing
          </p>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
        <div>
          <h2 className="text-[15px] font-[600] font-public-sans text-primary">Wholesale Pricing</h2>
          <p className="text-[13px] font-public-sans text-muted-text mt-0.5">
            Shopify stores retail prices. Set how wholesale prices should be calculated.
          </p>
        </div>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              checked={config.priceMode === 'retail'}
              onChange={() => setConfig((c) => ({ ...c, priceMode: 'retail' }))}
              className="mt-0.5"
            />
            <div>
              <p className="text-[14px] font-[500] font-public-sans text-primary">Use Shopify price as wholesale</p>
              <p className="text-[12px] font-public-sans text-muted-text">Import the Shopify price as-is</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              checked={config.priceMode === 'percent'}
              onChange={() => setConfig((c) => ({ ...c, priceMode: 'percent' }))}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className="text-[14px] font-[500] font-public-sans text-primary">Set wholesale as % of Shopify price</p>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={config.pricePercent}
                  onChange={(e) => setConfig((c) => ({ ...c, pricePercent: Number(e.target.value) }))}
                  disabled={config.priceMode !== 'percent'}
                  className="w-20 h-8 px-3 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors disabled:opacity-40"
                />
                <span className="text-[13px] font-public-sans text-muted-text">% of Shopify price</span>
                {config.priceMode === 'percent' && (
                  <span className="text-[12px] font-public-sans text-muted-text">
                    (e.g. ₹2,000 Shopify → ₹{Math.round(2000 * config.pricePercent / 100).toLocaleString('en-IN')} wholesale)
                  </span>
                )}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Defaults */}
      <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
        <h2 className="text-[15px] font-[600] font-public-sans text-primary">Import Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-[600] font-public-sans text-primary">Default MOQ (units)</label>
            <input
              type="number"
              min={1}
              value={config.defaultMoq}
              onChange={(e) => setConfig((c) => ({ ...c, defaultMoq: Math.max(1, parseInt(e.target.value) || 1) }))}
              className="h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-[11px] font-public-sans text-muted-text">You can edit per-product in the next step</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-[600] font-public-sans text-primary">Lead Time</label>
            <select
              value={config.defaultLeadTime}
              onChange={(e) => setConfig((c) => ({ ...c, defaultLeadTime: e.target.value }))}
              className="h-9 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
            >
              {LEAD_TIMES.map((lt) => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-[600] font-public-sans text-primary">Shipping Zones</label>
          <div className="flex flex-wrap gap-2">
            {SHIPPING_ZONES.map((zone) => {
              const selected = config.enabledZones.includes(zone.value)
              return (
                <button
                  key={zone.value}
                  type="button"
                  onClick={() => toggleZone(zone.value)}
                  className={`h-8 px-3 rounded border text-[12px] font-[500] font-public-sans transition-colors ${
                    selected
                      ? 'border-accent bg-accent text-white'
                      : 'border-border-warm bg-muted-bg/30 text-primary hover:border-accent'
                  }`}
                >
                  {zone.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} className="mr-1.5" aria-hidden="true" />
          Back
        </Button>
        <Button variant="primary" size="sm" onClick={onNext} disabled={!canProceed}>
          Review {products.length} products
          <ChevronRight size={14} className="ml-1.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function ReviewStep({
  products,
  config,
  categories,
  overrides,
  setOverrides,
  onBack,
  onImport,
  importing,
}: {
  products: ShopifyProduct[]
  config: ImportConfig
  categories: Category[]
  overrides: Record<string, RowOverride>
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, RowOverride>>>
  onBack: () => void
  onImport: () => void
  importing: boolean
}) {
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.name]))

  function getOverride(handle: string): RowOverride {
    return overrides[handle] ?? { price: '', moq: '', skip: false }
  }

  function updateOverride(handle: string, patch: Partial<RowOverride>) {
    setOverrides((prev) => ({ ...prev, [handle]: { ...getOverride(handle), ...patch } }))
  }

  const activeProducts = products.filter((p) => !getOverride(p.handle).skip)
  const skippedCount = products.length - activeProducts.length

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-[600] font-public-sans text-primary">
            {activeProducts.length} product{activeProducts.length !== 1 ? 's' : ''} ready to import
          </p>
          {skippedCount > 0 && (
            <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
              {skippedCount} product{skippedCount !== 1 ? 's' : ''} skipped
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} disabled={importing}>
            <ArrowLeft size={14} className="mr-1.5" aria-hidden="true" />
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onImport}
            disabled={importing || activeProducts.length === 0}
          >
            {importing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                Importing…
              </>
            ) : (
              `Import ${activeProducts.length} product${activeProducts.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border-warm rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] font-public-sans">
            <thead>
              <tr className="border-b border-border-warm bg-muted-bg/40">
                <th className="text-left px-4 py-2.5 font-[600] text-muted-text w-8" />
                <th className="text-left px-4 py-2.5 font-[600] text-muted-text">Product</th>
                <th className="text-left px-4 py-2.5 font-[600] text-muted-text">Category</th>
                <th className="text-left px-4 py-2.5 font-[600] text-muted-text w-16">Vars</th>
                <th className="text-left px-4 py-2.5 font-[600] text-muted-text w-36">Wholesale Price (₹)</th>
                <th className="text-left px-4 py-2.5 font-[600] text-muted-text w-24">MOQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm">
              {products.map((p) => {
                const ov = getOverride(p.handle)
                const price = computePrice(p, config, ov.price)
                const catSlug = config.typeToCategory[p.shopifyType] ?? ''
                const catName = catMap[catSlug] ?? catSlug

                return (
                  <tr
                    key={p.handle}
                    className={`transition-colors ${ov.skip ? 'opacity-40 bg-muted-bg/20' : 'hover:bg-muted-bg/20'}`}
                  >
                    {/* Skip toggle */}
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => updateOverride(p.handle, { skip: !ov.skip })}
                        title={ov.skip ? 'Include this product' : 'Skip this product'}
                        className="text-muted-text hover:text-error transition-colors"
                        aria-label={ov.skip ? 'Include' : 'Skip'}
                      >
                        <X size={13} />
                      </button>
                    </td>

                    {/* Product name */}
                    <td className="px-4 py-2.5">
                      <p className="font-[500] text-primary leading-snug max-w-[220px] truncate" title={p.name}>
                        {p.name}
                      </p>
                      {p.tags.length > 0 && (
                        <p className="text-[11px] text-muted-text truncate max-w-[220px]">
                          {p.tags.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-2.5 text-primary">{catName || '—'}</td>

                    {/* Variants */}
                    <td className="px-4 py-2.5 text-muted-text text-center">
                      {p.variants.length > 0 ? p.variants.length : '—'}
                    </td>

                    {/* Wholesale price (editable) */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-text">₹</span>
                        <input
                          type="number"
                          min={1}
                          placeholder={String(Math.round(price))}
                          value={ov.price}
                          onChange={(e) => updateOverride(p.handle, { price: e.target.value })}
                          disabled={ov.skip}
                          className="w-24 h-7 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors disabled:opacity-40"
                        />
                      </div>
                      {!ov.price && p.minPrice > 0 && (
                        <p className="text-[11px] text-muted-text mt-0.5">
                          Shopify: {formatInr(p.minPrice)}
                        </p>
                      )}
                    </td>

                    {/* MOQ (editable) */}
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={1}
                        placeholder={String(config.defaultMoq)}
                        value={ov.moq}
                        onChange={(e) => updateOverride(p.handle, { moq: e.target.value })}
                        disabled={ov.skip}
                        className="w-16 h-7 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors disabled:opacity-40"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[12px] font-public-sans text-muted-text">
        Leave price/MOQ blank to use the defaults from the previous step. Click × to skip a product.
      </p>
    </div>
  )
}

// ─── Step Done ────────────────────────────────────────────────────────────────

function DoneStep({ result, onImportMore }: { result: ImportResult; onImportMore: () => void }) {
  const router = useRouter()
  const allGood = result.errors.length === 0

  return (
    <div className="max-w-xl space-y-6">
      <div className={`border rounded-lg p-6 ${allGood ? 'border-success/30 bg-success/5' : 'border-amber-200 bg-amber-50/60'}`}>
        <div className="flex items-center gap-3 mb-4">
          {allGood
            ? <CheckCircle size={24} className="text-success shrink-0" aria-hidden="true" />
            : <AlertCircle size={24} className="text-amber-500 shrink-0" aria-hidden="true" />
          }
          <h2 className="text-[18px] font-[600] font-public-sans text-primary">
            Import {allGood ? 'Complete' : 'Finished with Warnings'}
          </h2>
        </div>

        <div className="space-y-1 text-[14px] font-public-sans">
          <p><span className="font-[600] text-success">{result.created}</span> <span className="text-primary">product{result.created !== 1 ? 's' : ''} created successfully</span></p>
          {result.skipped > 0 && (
            <p><span className="font-[600] text-muted-text">{result.skipped}</span> <span className="text-muted-text">skipped (already exist or invalid)</span></p>
          )}
        </div>

        {result.errors.length > 0 && (
          <div className="mt-4 border-t border-amber-200 pt-4">
            <p className="text-[13px] font-[600] font-public-sans text-amber-700 mb-2">
              {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''}
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <li key={i} className="text-[12px] font-public-sans text-amber-700">• {e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="text-[13px] font-public-sans text-muted-text">
        Product images were not imported — open each product in the edit page to add photos.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => router.push('/portal/products')}>
          View Products
        </Button>
        <Button variant="ghost" size="sm" onClick={onImportMore}>
          Import Another CSV
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [config, setConfig] = useState<ImportConfig>({
    typeToCategory: {},
    priceMode: 'retail',
    pricePercent: 60,
    defaultMoq: 10,
    defaultLeadTime: 'ONE_TO_TWO_WEEKS',
    enabledZones: ['DOMESTIC'],
  })
  const [overrides, setOverrides] = useState<Record<string, RowOverride>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const { data: categoriesData } = useCategories()
  const categories = categoriesData ?? []

  function handleParsed(parsed: ShopifyProduct[]) {
    setProducts(parsed)
    // Pre-fill category mapping where Shopify type exactly matches a category name
    const autoMap: Record<string, string> = {}
    for (const type of [...new Set(parsed.map((p) => p.shopifyType))]) {
      const match = categories.find((c) => c.name.toLowerCase() === type.toLowerCase())
      if (match) autoMap[type] = match.slug
    }
    setConfig((c) => ({ ...c, typeToCategory: autoMap }))
    setOverrides({})
    setStep('configure')
  }

  async function handleImport() {
    setImporting(true)
    try {
      const activeProducts = products.filter((p) => !overrides[p.handle]?.skip)
      const payload = activeProducts.map((p) => {
        const ov = overrides[p.handle] ?? { price: '', moq: '' }
        const wholesalePriceInr = computePrice(p, config, ov.price)
        const moq = parseInt(ov.moq || '') || config.defaultMoq
        const catSlug = config.typeToCategory[p.shopifyType]

        return {
          name: p.name,
          shortDescription: p.shortDescription || p.name.slice(0, 160),
          fullDescription: p.descriptionHtml || null,
          categories: catSlug ? [catSlug] : [],
          tags: p.tags,
          wholesalePriceInr,
          moq,
          weightGrams: p.weightGrams || 100,
          leadTime: config.defaultLeadTime,
          enabledZones: config.enabledZones,
          availability: p.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          variants: p.variants
            .filter((v) => v.sku)
            .map((v) => ({
              sku: v.sku,
              priceInr: config.priceMode === 'retail'
                ? v.price || wholesalePriceInr
                : Math.max(0.01, (v.price || wholesalePriceInr) * config.pricePercent / 100),
              stock: v.stock,
              attributes: v.attributes,
            })),
        }
      })

      const res = await api.post('/products/import-shopify', { products: payload })
      setResult(res.data.data)
      setStep('done')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStep('upload')
    setProducts([])
    setConfig({ typeToCategory: {}, priceMode: 'retail', pricePercent: 60, defaultMoq: 10, defaultLeadTime: 'ONE_TO_TWO_WEEKS', enabledZones: ['DOMESTIC'] })
    setOverrides({})
    setResult(null)
  }

  // Step progress indicators
  const STEPS: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'configure', label: 'Configure' },
    { key: 'review', label: 'Review' },
    { key: 'done', label: 'Done' },
  ]
  const currentIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/portal/products"
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
          aria-label="Back to products"
        >
          <ArrowLeft size={15} aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
            Import from Shopify
          </h1>
          <p className="text-[13px] font-public-sans text-muted-text mt-0.5">
            Upload your Shopify product export CSV to list products on Solomon Bharat
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {step !== 'done' && (
        <div className="flex items-center gap-0 mb-8 max-w-sm">
          {STEPS.filter((s) => s.key !== 'done').map((s, idx) => {
            const done = currentIndex > idx
            const active = currentIndex === idx
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-[700] transition-colors ${
                    done ? 'bg-success text-white' : active ? 'bg-accent text-white' : 'bg-muted-bg text-muted-text'
                  }`}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[12px] font-[500] font-public-sans ${active ? 'text-primary' : 'text-muted-text'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && <div className="flex-1 h-px bg-border-warm mx-3" />}
              </div>
            )
          })}
        </div>
      )}

      {/* Step content */}
      {step === 'upload' && <UploadStep onParsed={handleParsed} />}
      {step === 'configure' && (
        <ConfigureStep
          products={products}
          config={config}
          setConfig={setConfig}
          categories={categories}
          onBack={() => setStep('upload')}
          onNext={() => setStep('review')}
        />
      )}
      {step === 'review' && (
        <ReviewStep
          products={products}
          config={config}
          categories={categories}
          overrides={overrides}
          setOverrides={setOverrides}
          onBack={() => setStep('configure')}
          onImport={handleImport}
          importing={importing}
        />
      )}
      {step === 'done' && result && (
        <DoneStep result={result} onImportMore={reset} />
      )}
    </div>
  )
}
