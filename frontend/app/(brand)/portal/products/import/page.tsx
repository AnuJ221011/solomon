'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { useCategories, type Category } from '@/hooks/queries/useCategories'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedVariant {
  sku: string
  price: number
  stock: number
  weightGrams: number
  attributes: { name: string; value: string }[]
}

interface ParsedProduct {
  handle: string
  name: string
  description: string
  sourceCategory: string  // raw category from CSV, used for auto-matching
  images: string[]
  tags: string[]
  status: string
  weightGrams: number
  variants: ParsedVariant[]
  minPrice: number
}

interface ImportResult {
  created: number
  skipped: number
  errors: string[]
}

interface ImportSummary {
  result: ImportResult
  detected: 'WooCommerce' | 'Shopify' | 'Generic'
}

interface ParseState {
  products: ParsedProduct[]
  categoryMap: Record<string, string>  // sourceCategory → platform category name
  detected: ImportSummary['detected']
}

type Step = 'upload' | 'preview' | 'done'

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

// Parses a single CSV line (used only for header detection — no multiline fields there).
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

// Streaming CSV parser — correctly handles quoted fields that span multiple lines.
// WooCommerce exports product descriptions with real newlines inside quoted cells,
// which breaks any approach that pre-splits the file on \n.
function parseAllCsvRecords(csv: string): string[][] {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') { field += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      record.push(field)
      field = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && csv[i + 1] === '\n') i++
      record.push(field)
      field = ''
      if (record.some((f) => f)) records.push(record)
      record = []
    } else {
      field += ch
    }
  }
  // Flush trailing record
  record.push(field)
  if (record.some((f) => f)) records.push(record)

  return records
}

function normalizeHeader(h: string): string {
  return h.replace(/[()]/g, '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
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

function parseCsvToRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const records = parseAllCsvRecords(text)
  if (records.length < 2) throw new Error('File must have a header row and at least one data row')

  const headers = records[0].map(normalizeHeader)

  const rows: Record<string, string>[] = []
  for (let i = 1; i < records.length; i++) {
    const values = records[i]
    if (values.every((v) => !v.trim())) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })
    rows.push(row)
  }
  return { headers, rows }
}

// ─── Format Detection ─────────────────────────────────────────────────────────

function detectFormat(headers: string[]): 'shopify' | 'woocommerce' | 'generic' {
  const h = new Set(headers)
  if (h.has('handle') && h.has('title')) return 'shopify'
  if (h.has('id') && h.has('type') && h.has('regular_price')) return 'woocommerce'
  return 'generic'
}

// ─── WooCommerce Parser ───────────────────────────────────────────────────────

function parseWoocommerce(text: string): ParsedProduct[] {
  const { headers, rows } = parseCsvToRows(text)

  const productRows = rows.filter((r) => r['type'] === 'simple' || r['type'] === 'variable')
  const variationRows = rows.filter((r) => r['type'] === 'variation')

  const varsByParent = new Map<string, Record<string, string>[]>()
  for (const vRow of variationRows) {
    const parentId = (vRow['parent'] ?? '').replace(/^id:/i, '').trim()
    if (!parentId) continue
    if (!varsByParent.has(parentId)) varsByParent.set(parentId, [])
    varsByParent.get(parentId)!.push(vRow)
  }

  const products: ParsedProduct[] = []

  for (const row of productRows) {
    const id = (row['id'] ?? '').trim()
    const name = (row['name'] ?? '').trim().slice(0, 80)
    if (!name || row['published'] === '-1') continue

    const descHtml = row['description'] ?? ''
    const shortDescText =
      stripHtml(row['short_description'] ?? '').slice(0, 160) ||
      stripHtml(descHtml).slice(0, 160) || name

    const imageUrls = (row['images'] ?? '').split(',').map((u) => u.trim()).filter(Boolean)
    const category = (row['categories'] ?? '').split(',')[0]?.trim() ?? ''
    const tags = (row['tags'] ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)
    const weightLbs = parseFloat(row['weight_lbs'] ?? '0') || 0
    const weightGrams = Math.round(weightLbs * 453.592)
    const regularPrice = parseFloat(row['regular_price'] ?? '0') || 0
    const salePrice = parseFloat(row['sale_price'] ?? '0') || 0
    const effectivePrice = salePrice > 0 ? salePrice : regularPrice

    const variations = varsByParent.get(id) ?? []
    const variants: ParsedVariant[] = []
    const seenSkus = new Set<string>()

    for (const vRow of variations) {
      if (vRow['published'] === '-1') continue
      const vSku = (vRow['sku'] ?? '').trim()
      if (vSku && seenSkus.has(vSku)) continue
      if (vSku) seenSkus.add(vSku)

      const vRegularPrice = parseFloat(vRow['regular_price'] ?? '0') || 0
      const vSalePrice = parseFloat(vRow['sale_price'] ?? '0') || 0
      const vPrice = vSalePrice > 0 ? vSalePrice : (vRegularPrice || effectivePrice)
      const vWeightLbs = parseFloat(vRow['weight_lbs'] ?? '0') || weightLbs
      const vWeightGrams = Math.round(vWeightLbs * 453.592) || weightGrams

      const attrs: { name: string; value: string }[] = []
      for (const n of [1, 2, 3]) {
        const an = (vRow[`attribute_${n}_name`] ?? '').trim()
        const av = (vRow[`attribute_${n}_values`] ?? '').trim()
        if (an && av) attrs.push({ name: an, value: av })
      }
      if (vSku || attrs.length > 0) {
        variants.push({ sku: vSku, price: vPrice, stock: parseInt(vRow['stock'] ?? '0', 10) || 0, weightGrams: vWeightGrams, attributes: attrs })
      }
    }

    const minPrice =
      variants.length > 0
        ? Math.min(...variants.map((v) => v.price).filter((p) => p > 0)) || effectivePrice
        : effectivePrice

    products.push({ handle: id, name, description: descHtml || shortDescText, sourceCategory: category, images: imageUrls, tags, status: 'active', weightGrams, variants, minPrice })
  }
  return products
}

// ─── Shopify Parser ───────────────────────────────────────────────────────────

function parseShopify(text: string): ParsedProduct[] {
  const { rows } = parseCsvToRows(text)

  const handleMap = new Map<string, Record<string, string>[]>()
  const handleOrder: string[] = []
  for (const row of rows) {
    const handle = (row['handle'] ?? '').trim()
    if (!handle) continue
    if (!handleMap.has(handle)) { handleMap.set(handle, []); handleOrder.push(handle) }
    handleMap.get(handle)!.push(row)
  }

  const products: ParsedProduct[] = []

  for (const handle of handleOrder) {
    const groupRows = handleMap.get(handle)!
    const first = groupRows[0]

    const descHtml = first['body_html'] ?? ''
    const shortDescription = stripHtml(descHtml).slice(0, 160) || (first['title'] ?? '').slice(0, 160)

    const variants: ParsedVariant[] = []
    const seenSkus = new Set<string>()
    for (const row of groupRows) {
      const sku = (row['variant_sku'] ?? '').trim()
      const attrs: { name: string; value: string }[] = []
      for (const n of [1, 2, 3]) {
        const name = (row[`option${n}_name`] ?? '').trim()
        const value = (row[`option${n}_value`] ?? '').trim()
        if (name && value && name.toLowerCase() !== 'title' && value.toLowerCase() !== 'default title') {
          attrs.push({ name, value })
        }
      }
      if (!sku && attrs.length === 0) continue
      if (sku && seenSkus.has(sku)) continue
      if (sku) seenSkus.add(sku)
      variants.push({
        sku,
        price: parseFloat(row['variant_price'] ?? '0') || 0,
        stock: parseInt(row['variant_inventory_qty'] ?? '0', 10) || 0,
        weightGrams: parseInt(row['variant_grams'] ?? '0', 10) || 0,
        attributes: attrs,
      })
    }

    const tags = (first['tags'] ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)
    const weightGrams = variants[0]?.weightGrams || parseInt(first['variant_grams'] ?? '0', 10) || 0
    const minPrice = variants.length ? Math.min(...variants.map((v) => v.price).filter((p) => p > 0)) : 0
    const images = [...new Set(groupRows.map((r) => (r['image_src'] ?? '').trim()).filter(Boolean))]

    products.push({
      handle,
      name: (first['title'] ?? handle).slice(0, 80),
      description: descHtml || shortDescription,
      sourceCategory: (first['type'] ?? '').trim(),
      images,
      tags,
      status: (first['status'] ?? 'active').toLowerCase(),
      weightGrams,
      variants,
      minPrice,
    })
  }
  return products
}

// ─── Generic CSV Parser ───────────────────────────────────────────────────────
// Auto-detects columns from any product CSV using header pattern matching,
// then falls back to data-driven heuristics if no match found.

function findCol(headers: string[], ...patterns: string[]): string {
  for (const pattern of patterns) {
    const match = headers.find(
      (h) => h === pattern || h.startsWith(pattern + '_') || h.endsWith('_' + pattern) || h.includes(pattern),
    )
    if (match) return match
  }
  return ''
}

function pickTextCol(rows: Record<string, string>[], headers: string[]): string {
  const sample = rows.slice(0, 20)
  for (const h of headers) {
    const vals = sample.map((r) => r[h]).filter(Boolean)
    if (vals.length < 3) continue
    const numRatio = vals.filter((v) => !isNaN(parseFloat(v))).length / vals.length
    if (numRatio < 0.2 && vals.some((v) => v.length > 3)) return h
  }
  return headers[0] ?? ''
}

function pickNumericCol(rows: Record<string, string>[], headers: string[]): string {
  const sample = rows.slice(0, 20)
  for (const h of headers) {
    const vals = sample.map((r) => r[h]).filter(Boolean)
    if (vals.length < 3) continue
    const numRatio = vals.filter((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0).length / vals.length
    if (numRatio > 0.6) return h
  }
  return ''
}

function parseGeneric(text: string): ParsedProduct[] {
  const { headers, rows } = parseCsvToRows(text)

  const nameCol =
    findCol(headers, 'product_name', 'item_name', 'name', 'title', 'product_title', 'product') ||
    pickTextCol(rows, headers)

  const priceCol =
    findCol(headers, 'regular_price', 'retail_price', 'selling_price', 'wholesale_price', 'mrp', 'price', 'cost', 'rate', 'amount') ||
    pickNumericCol(rows, headers)

  const shortDescCol = findCol(headers, 'short_description', 'short_desc', 'excerpt', 'brief', 'subtitle')
  const fullDescCol = findCol(headers, 'full_description', 'long_description', 'description', 'body_html', 'body', 'details', 'desc')
  const categoryCol = findCol(headers, 'categories', 'category', 'product_type', 'type', 'collection', 'department', 'genre')
  const imageCol = findCol(headers, 'image_src', 'image_url', 'image', 'images', 'photo', 'thumbnail', 'picture')
  const tagsCol = findCol(headers, 'tags', 'keywords', 'labels')
  const weightCol = findCol(headers, 'weight_g', 'weight_gram', 'weight_grams', 'weight_kg', 'weight_kgs', 'weight_lbs', 'weight_lb', 'weight_oz', 'weight')
  const stockCol = findCol(headers, 'stock', 'inventory_qty', 'inventory', 'quantity', 'qty', 'available_stock')
  const skuCol = findCol(headers, 'sku', 'product_code', 'item_code', 'barcode', 'product_id')

  if (!nameCol) {
    throw new Error(
      'Could not detect a product name column. For best results, export using WooCommerce (Products → Export) or Shopify.',
    )
  }

  const weightUnit: 'g' | 'kg' | 'lbs' | 'oz' =
    weightCol.includes('lbs') || weightCol.includes('_lb') ? 'lbs' :
    weightCol.includes('_kg') || weightCol === 'kg' ? 'kg' :
    weightCol.includes('oz') ? 'oz' : 'g'

  const products: ParsedProduct[] = []

  rows.forEach((row, idx) => {
    const name = (row[nameCol] ?? '').trim().slice(0, 80)
    if (!name) return

    const price = parseFloat(row[priceCol] ?? '0') || 0
    const descHtml = row[fullDescCol] ?? ''
    const shortDescText =
      stripHtml(row[shortDescCol] ?? '').slice(0, 160) ||
      stripHtml(descHtml).slice(0, 160) || name
    const category = (row[categoryCol] ?? '').split(',')[0]?.trim() ?? ''
    const tags = (row[tagsCol] ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)

    const rawWeight = parseFloat(row[weightCol] ?? '0') || 0
    let weightGrams = 0
    if (rawWeight > 0) {
      switch (weightUnit) {
        case 'kg': weightGrams = Math.round(rawWeight * 1000); break
        case 'lbs': weightGrams = Math.round(rawWeight * 453.592); break
        case 'oz': weightGrams = Math.round(rawWeight * 28.3495); break
        default: weightGrams = Math.round(rawWeight)
      }
    }

    const sku = (row[skuCol] ?? '').trim()
    const stock = parseInt(row[stockCol] ?? '0', 10) || 0
    const variants: ParsedVariant[] = sku
      ? [{ sku, price, stock, weightGrams, attributes: [] }]
      : []

    const images = imageCol
      ? (row[imageCol] ?? '').split(',').map((u: string) => u.trim()).filter(Boolean)
      : []

    products.push({
      handle: `row${idx}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
      name,
      description: descHtml || shortDescText,
      sourceCategory: category,
      images,
      tags,
      status: 'active',
      weightGrams,
      variants,
      minPrice: price,
    })
  })

  return products
}

// ─── Auto-Import Pipeline ─────────────────────────────────────────────────────

// Returns sourceCategory → platform category NAME (not slug).
// Product.categories stores names as String[] — not IDs or slugs.
function autoMatchCategories(
  products: ParsedProduct[],
  categories: Category[],
): Record<string, string> {
  const map: Record<string, string> = {}
  const uniqueTypes = [...new Set(products.map((p) => p.sourceCategory))]
  for (const type of uniqueTypes) {
    if (!type) continue
    const norm = type.toLowerCase().trim()
    let match = categories.find((c) => c.name.toLowerCase() === norm)
    if (!match) match = categories.find((c) => c.slug.toLowerCase() === norm.replace(/\s+/g, '-'))
    if (!match) match = categories.find((c) => norm.includes(c.name.toLowerCase()))
    if (!match) match = categories.find((c) => c.name.toLowerCase().includes(norm))
    if (match) map[type] = match.name  // store name, not slug
  }
  return map
}

// Parse only — no API call. Used to populate the preview step.
async function parseFile(
  file: File,
  categories: Category[],
  onStatus: (msg: string) => void,
): Promise<ParseState> {
  onStatus('Reading file…')
  const text = await file.text()

  const firstLine = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')[0]
  const headers = parseCsvLine(firstLine).map(normalizeHeader)
  const fmt = detectFormat(headers)

  onStatus('Parsing products…')
  let products: ParsedProduct[]
  let detected: ImportSummary['detected']

  if (fmt === 'shopify') {
    products = parseShopify(text)
    detected = 'Shopify'
  } else if (fmt === 'woocommerce') {
    products = parseWoocommerce(text)
    detected = 'WooCommerce'
  } else {
    products = parseGeneric(text)
    detected = 'Generic'
  }

  if (products.length === 0) {
    throw new Error('No products found in the CSV. Check that the file has product data rows.')
  }

  const categoryMap = autoMatchCategories(products, categories)
  return { products, categoryMap, detected }
}

// Import — sends parsed products + unmatched category names to the backend.
// The backend calls Gemini to classify unmatched categories, creates missing
// L1/L2/L3 nodes, then imports products with the resolved category names.
async function importProducts(parseState: ParseState): Promise<ImportResult> {
  const { products, categoryMap } = parseState

  // Collect category names that had no platform match — backend resolves these via Gemini
  const unmatchedCategories = [
    ...new Set(
      products
        .map((p) => p.sourceCategory)
        .filter((sc): sc is string => !!sc && !categoryMap[sc] && sc.toLowerCase() !== 'uncategorized'),
    ),
  ]

  const payload = products.map((p) => ({
    name: p.name,
    sourceCategory: p.sourceCategory || null,
    description: p.description || p.name,
    images: p.images ?? [],
    categories: categoryMap[p.sourceCategory] ? [categoryMap[p.sourceCategory]] : [],
    tags: p.tags,
    wholesalePriceInr: Math.max(0.01, p.minPrice || 0.01),
    moq: 1,
    weightGrams: p.weightGrams || 100,
    leadTime: 'ONE_TO_TWO_WEEKS',
    enabledZones: ['DOMESTIC'],
    availability: p.status === 'active' ? 'ACTIVE' : 'INACTIVE',
    variants: p.variants
      .filter((v) => v.sku)
      .map((v) => ({
        sku: v.sku,
        priceInr: v.price || Math.max(0.01, p.minPrice || 0.01),
        stock: v.stock,
        attributes: v.attributes,
      })),
  }))

  const res = await api.post('/products/import-shopify', { products: payload, unmatchedCategories })
  return res.data.data as ImportResult
}

// ─── Upload Step ──────────────────────────────────────────────────────────────

function UploadStep({
  onFile,
  processing,
  categoriesLoading,
}: {
  onFile: (f: File) => void
  processing: string | null
  categoriesLoading: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const [helpTab, setHelpTab] = useState<'woocommerce' | 'shopify'>('woocommerce')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        toast.error('Please upload a .csv file')
        return
      }
      onFile(file)
    },
    [onFile],
  )

  // Processing overlay
  if (processing) {
    return (
      <div className="max-w-xl">
        <div className="flex flex-col items-center justify-center gap-5 border-2 border-dashed border-border-warm rounded-lg p-16">
          <div className="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-[15px] font-[600] font-public-sans text-primary">{processing}</p>
        </div>
      </div>
    )
  }

  const disabled = categoriesLoading

  return (
    <div className="max-w-xl">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) {
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }
        }}
        onClick={() => { if (!disabled) inputRef.current?.click() }}
        className={`relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-12 transition-colors ${
          disabled
            ? 'border-border-warm opacity-60 cursor-not-allowed'
            : dragging
            ? 'border-accent bg-accent/5 cursor-pointer'
            : 'border-border-warm hover:border-accent hover:bg-muted-bg/50 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          disabled={disabled}
        />
        <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
          <Upload size={22} className="text-muted-text" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-[600] font-public-sans text-primary">
            {disabled ? 'Loading…' : 'Drop your product CSV here'}
          </p>
          <p className="text-[13px] font-public-sans text-muted-text mt-1">
            {disabled ? 'Preparing importer, please wait' : 'or click to browse · WooCommerce, Shopify, or any product CSV · .csv only'}
          </p>
        </div>
      </div>

      {/* Auto-import note */}
      <div className="mt-4 flex items-start gap-2.5 px-3 py-2.5 rounded border border-border-warm bg-muted-bg/30">
        <Info size={14} className="text-muted-text shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[12px] font-public-sans text-muted-text">
          Products are imported automatically with default MOQ 1, Domestic shipping, and 1–2 week lead time.
          Edit individual products afterwards to customize pricing, zones, and images.
        </p>
      </div>

      {/* How-to instructions */}
      <div className="mt-4 border border-border-warm rounded overflow-hidden">
        <div className="flex border-b border-border-warm">
          {(['woocommerce', 'shopify'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setHelpTab(tab)}
              className={`flex-1 py-2.5 text-[13px] font-[600] font-public-sans transition-colors ${
                helpTab === tab
                  ? 'bg-surface text-primary border-b-2 border-accent'
                  : 'bg-muted-bg/30 text-muted-text hover:text-primary'
              }`}
            >
              {tab === 'woocommerce' ? 'WooCommerce / WordPress' : 'Shopify'}
            </button>
          ))}
        </div>
        <div className="p-4">
          {helpTab === 'woocommerce' ? (
            <>
              <p className="text-[13px] font-[600] font-public-sans text-primary mb-2">
                How to export from WooCommerce
              </p>
              <ol className="text-[13px] font-public-sans text-muted-text space-y-1 list-decimal list-inside">
                <li>Go to <span className="font-[500] text-primary">WooCommerce → Products</span> in your WordPress admin</li>
                <li>Click <span className="font-[500] text-primary">Export</span> at the top of the product list</li>
                <li>Leave all options as default (all products, all columns)</li>
                <li>Click <span className="font-[500] text-primary">Generate CSV</span> and download the file</li>
              </ol>
            </>
          ) : (
            <>
              <p className="text-[13px] font-[600] font-public-sans text-primary mb-2">
                How to export from Shopify
              </p>
              <ol className="text-[13px] font-public-sans text-muted-text space-y-1 list-decimal list-inside">
                <li>Go to <span className="font-[500] text-primary">Products</span> in your Shopify admin</li>
                <li>Click <span className="font-[500] text-primary">Export</span> (top-right)</li>
                <li>Choose <span className="font-[500] text-primary">All products</span> and format <span className="font-[500] text-primary">CSV for Excel</span></li>
                <li>Click <span className="font-[500] text-primary">Export products</span> — Shopify emails you the file</li>
              </ol>
            </>
          )}
          <p className="text-[12px] font-public-sans text-muted-text mt-3">
            Any product CSV works — columns are detected automatically.
            Product images are not imported; add them from the edit page.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Preview Step ─────────────────────────────────────────────────────────────

const PREVIEW_ROWS = 5

function PreviewStep({
  parseState,
  categories,
  onBack,
  onImport,
  importing,
}: {
  parseState: ParseState
  categories: Category[]
  onBack: () => void
  onImport: () => void
  importing: boolean
}) {
  const { products, categoryMap, detected } = parseState

  const unmatchedCount = products.filter((p) => p.sourceCategory && !categoryMap[p.sourceCategory]).length
  const withVariants = products.filter((p) => p.variants.length > 0).length

  const formatBadge: Record<string, string> = {
    WooCommerce: 'bg-blue-50 border-blue-200 text-blue-700',
    Shopify: 'bg-green-50 border-green-200 text-green-700',
    Generic: 'bg-muted-bg border-border-warm text-muted-text',
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Detected summary */}
      <div className="flex items-center gap-3 p-4 rounded border border-border-warm bg-muted-bg/30">
        <div className="flex-1">
          <p className="text-[14px] font-[600] font-public-sans text-primary">
            {products.length} product{products.length !== 1 ? 's' : ''} ready to import
          </p>
          <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
            {withVariants > 0 && `${withVariants} with variants · `}
            {unmatchedCount > 0
              ? `${products.length - unmatchedCount} categories matched, ${unmatchedCount} unmatched`
              : 'all categories matched'}
          </p>
        </div>
        <span className={`text-[11px] font-[600] font-public-sans px-2 py-1 rounded border ${formatBadge[detected]}`}>
          {detected}
        </span>
      </div>

      {/* Preview table */}
      <div className="border border-border-warm rounded overflow-hidden">
        <div className="px-4 py-2.5 bg-muted-bg/40 border-b border-border-warm flex items-center justify-between">
          <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.04em]">
            Preview
          </p>
          {products.length > PREVIEW_ROWS && (
            <p className="text-[12px] font-public-sans text-muted-text">
              Showing {PREVIEW_ROWS} of {products.length}
            </p>
          )}
        </div>
        <table className="w-full text-[13px] font-public-sans">
          <thead>
            <tr className="border-b border-border-warm">
              <th className="text-left px-4 py-2.5 font-[600] text-muted-text">Product Name</th>
              <th className="text-left px-4 py-2.5 font-[600] text-muted-text w-28">Price</th>
              <th className="text-left px-4 py-2.5 font-[600] text-muted-text">Category</th>
              <th className="text-left px-4 py-2.5 font-[600] text-muted-text w-14 text-center">Vars</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-warm">
            {products.slice(0, PREVIEW_ROWS).map((p, i) => {
              const catName = categoryMap[p.sourceCategory] || null
              return (
                <tr key={i} className="hover:bg-muted-bg/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-[500] text-primary truncate max-w-[200px]" title={p.name}>
                      {p.name}
                    </p>
                    {p.sourceCategory && !catName && (
                      <p className="text-[11px] text-amber-600 mt-0.5 truncate max-w-[200px]">
                        {p.sourceCategory} → unmatched
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {p.minPrice > 0
                      ? <span className="text-primary">₹{p.minPrice.toLocaleString('en-IN')}</span>
                      : <span className="text-amber-600 text-[12px]">No price</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {catName
                      ? <span className="text-primary">{catName}</span>
                      : <span className="text-muted-text italic text-[12px]">No category</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted-text text-center">
                    {p.variants.length > 0 ? p.variants.length : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {products.length > PREVIEW_ROWS && (
          <div className="px-4 py-2.5 border-t border-border-warm bg-muted-bg/20">
            <p className="text-[12px] font-public-sans text-muted-text">
              + {products.length - PREVIEW_ROWS} more product{products.length - PREVIEW_ROWS !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Unmatched category warning */}
      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2 p-3 rounded border border-amber-200 bg-amber-50/60">
          <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-[12px] font-public-sans text-amber-700">
            {unmatchedCount} product{unmatchedCount !== 1 ? 's have' : ' has'} an unrecognized category. AI will classify and auto-create the missing L1/L2/L3 categories during import.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={importing}>
          <ArrowLeft size={14} className="mr-1.5" aria-hidden="true" />
          Back
        </Button>
        <Button variant="primary" size="sm" onClick={onImport} disabled={importing}>
          {importing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
              Importing…
            </>
          ) : (
            `Import ${products.length} product${products.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Done Step ────────────────────────────────────────────────────────────────

function DoneStep({
  summary,
  onImportMore,
}: {
  summary: ImportSummary
  onImportMore: () => void
}) {
  const router = useRouter()
  const { result, detected } = summary
  const allGood = result.errors.length === 0

  return (
    <div className="max-w-xl space-y-5">
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
          <p>
            <span className="font-[600] text-success">{result.created}</span>{' '}
            <span className="text-primary">product{result.created !== 1 ? 's' : ''} created</span>
          </p>
          {result.skipped > 0 && (
            <p>
              <span className="font-[600] text-muted-text">{result.skipped}</span>{' '}
              <span className="text-muted-text">skipped (already exist or invalid)</span>
            </p>
          )}
          <p className="text-[12px] text-muted-text mt-2">Detected format: {detected}</p>
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

      <div className="p-4 rounded border border-border-warm bg-muted-bg/30">
        <p className="text-[13px] font-[600] font-public-sans text-primary mb-1.5">Defaults applied</p>
        <ul className="text-[12px] font-public-sans text-muted-text space-y-0.5 list-disc list-inside">
          <li>MOQ: 1 unit per order</li>
          <li>Shipping: India (Domestic)</li>
          <li>Lead time: 1–2 weeks</li>
          <li>Product images: not imported</li>
        </ul>
        <p className="text-[12px] font-public-sans text-muted-text mt-2">
          Open any product to edit pricing, zones, and add photos.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => router.push('/portal/products')}>
          View Products
        </Button>
        <Button variant="ghost" size="sm" onClick={onImportMore}>
          Import Another File
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [processing, setProcessing] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [parseState, setParseState] = useState<ParseState | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const categories = categoriesData ?? []

  // Step 1: parse the file client-side, show preview
  const handleFile = useCallback(
    async (file: File) => {
      setProcessing('Reading file…')
      try {
        const state = await parseFile(file, categories, setProcessing)
        setParseState(state)
        setStep('preview')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not parse file')
      } finally {
        setProcessing(null)
      }
    },
    [categories],
  )

  // Step 2: user confirmed preview — call the API
  async function handleImport() {
    if (!parseState) return
    setImporting(true)
    try {
      const result = await importProducts(parseState)
      setSummary({ result, detected: parseState.detected })
      setStep('done')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStep('upload')
    setParseState(null)
    setSummary(null)
  }

  return (
    <div>
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
            Import Products
          </h1>
          <p className="text-[13px] font-public-sans text-muted-text mt-0.5">
            Upload any product CSV — columns are detected automatically
          </p>
        </div>
      </div>

      {step === 'upload' && (
        <UploadStep
          onFile={handleFile}
          processing={processing}
          categoriesLoading={categoriesLoading}
        />
      )}
      {step === 'preview' && parseState && (
        <PreviewStep
          parseState={parseState}
          categories={categories}
          onBack={() => setStep('upload')}
          onImport={handleImport}
          importing={importing}
        />
      )}
      {step === 'done' && summary && (
        <DoneStep summary={summary} onImportMore={reset} />
      )}
    </div>
  )
}
