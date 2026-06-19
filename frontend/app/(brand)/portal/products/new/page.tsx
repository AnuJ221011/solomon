'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Plus, Loader2, Trash2, RefreshCw, Check, Search } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { useCategories } from '@/hooks/queries/useCategories'

const LEAD_TIMES: { label: string; value: string }[] = [
  { label: '1–3 days',   value: 'ONE_TO_THREE_DAYS' },
  { label: '1–2 weeks',  value: 'ONE_TO_TWO_WEEKS' },
  { label: '2–4 weeks',  value: 'TWO_TO_FOUR_WEEKS' },
]

const SHIPPING_ZONES: { label: string; value: string }[] = [
  { label: 'India (Domestic)',  value: 'DOMESTIC' },
  { label: 'South Asia',        value: 'SOUTH_ASIA' },
  { label: 'Southeast Asia',    value: 'SOUTHEAST_ASIA' },
  { label: 'Middle East',       value: 'MIDDLE_EAST' },
  { label: 'Europe',            value: 'EUROPE' },
  { label: 'North America',     value: 'NORTH_AMERICA' },
  { label: 'Oceania',           value: 'OCEANIA' },
  { label: 'Rest of World',     value: 'REST_OF_WORLD' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string
  categories: string[]
  description: string
  wholesalePriceInr: string
  moq: string
  leadTime: string
  weightKg: string
  tags: string
  availability: 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'
  enabledZones: string[]
}

interface AttributeAxis {
  id: string
  name: string
  values: string[]
}

interface VariantRow {
  id: string
  attributes: { name: string; value: string }[]
  label: string
  sku: string
  priceInr: string
  stock: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cartesian<T>(arrays: T[][]): T[][] {
  if (!arrays.length) return []
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((val) => [...combo, val])),
    [[]]
  )
}

let _id = 0
function uid() { return String(++_id) }

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-[600] font-public-sans text-primary">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] font-public-sans text-muted-text">{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', maxLength }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; maxLength?: number
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength}
      className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
    />
  )
}

// ─── Category picker ──────────────────────────────────────────────────────────

import type { Category } from '@/hooks/queries/useCategories'

function CategoryPicker({
  categories,
  selected,
  onToggle,
  onCreateNew,
  creating,
}: {
  categories: Category[]
  selected: string[]
  onToggle: (name: string) => void
  onCreateNew: (name: string) => void
  creating: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const trimmed = query.trim()
  const filtered = categories
    .filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 10)
  const exactMatch = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  const canAdd = selected.length < 2

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary text-white text-[12px] font-[500] font-public-sans">
              {name}
              <button type="button" onClick={() => onToggle(name)} className="hover:opacity-70 transition-opacity" aria-label={`Remove ${name}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input — hidden once 2 selected */}
      {canAdd && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search categories…"
            className="w-full h-10 pl-9 pr-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
          />

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-surface border border-border-warm rounded shadow-lg overflow-hidden max-h-52 overflow-y-auto">
              {filtered.length === 0 && !trimmed && (
                <p className="px-3 py-2.5 text-[13px] font-public-sans text-muted-text">Type to search categories…</p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onToggle(c.name); setQuery(''); setOpen(false) }}
                  disabled={selected.includes(c.name)}
                  className="w-full text-left px-3 py-2.5 text-[13px] font-public-sans text-primary hover:bg-muted-bg transition-colors flex items-center justify-between disabled:opacity-40"
                >
                  <span>{c.name}</span>
                  {selected.includes(c.name) && <Check size={13} className="text-accent shrink-0" />}
                </button>
              ))}
              {trimmed && !exactMatch && (
                <button
                  type="button"
                  onClick={() => { onCreateNew(trimmed); setQuery(''); setOpen(false) }}
                  disabled={creating}
                  className="w-full text-left px-3 py-2.5 text-[13px] font-public-sans text-accent hover:bg-muted-bg transition-colors border-t border-border-warm flex items-center gap-1.5"
                >
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Create "{trimmed}"
                </button>
              )}
              {filtered.length === 0 && trimmed && exactMatch && (
                <p className="px-3 py-2.5 text-[13px] font-public-sans text-muted-text">No other matches</p>
              )}
            </div>
          )}
        </div>
      )}

      {!canAdd && (
        <p className="text-[12px] font-public-sans text-muted-text">Max 2 categories selected. Remove one to change.</p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router      = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categoryList = [], isLoading: catsLoading } = useCategories()

  // ── Category creation ──────────────────────────────────────────────────────
  const createCategory = useMutation({
    mutationFn: (name: string) => api.post('/categories', { name }),
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setForm((f) => {
        if (f.categories.includes(name) || f.categories.length >= 2) return f
        return { ...f, categories: [...f.categories, name] }
      })
      toast.success(`Category "${name}" created and selected.`)
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  // ── Product form ───────────────────────────────────────────────────────────
  const [form, setForm] = useState<ProductForm>({
    name: '', categories: [], description: '',
    wholesalePriceInr: '', moq: '', leadTime: 'ONE_TO_TWO_WEEKS',
    weightKg: '', tags: '', availability: 'ACTIVE',
    enabledZones: ['DOMESTIC'],
  })
  const [files, setFiles]       = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof ProductForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  function toggleCategory(cat: string) {
    setForm((f) => {
      const has = f.categories.includes(cat)
      if (has) return { ...f, categories: f.categories.filter((c) => c !== cat) }
      if (f.categories.length >= 2) { toast.error('Max 2 categories allowed.'); return f }
      return { ...f, categories: [...f.categories, cat] }
    })
  }

  function toggleZone(zone: string) {
    setForm((f) => {
      const has = f.enabledZones.includes(zone)
      if (has) return { ...f, enabledZones: f.enabledZones.filter((z) => z !== zone) }
      return { ...f, enabledZones: [...f.enabledZones, zone] }
    })
  }

  // ── Variants ───────────────────────────────────────────────────────────────
  const [hasVariants, setHasVariants] = useState(false)
  const [axes, setAxes] = useState<AttributeAxis[]>([
    { id: uid(), name: '', values: [] },
  ])
  const [axisInputs, setAxisInputs] = useState<Record<string, string>>({})
  const [variantRows, setVariantRows] = useState<VariantRow[]>([])

  function addAxis() {
    setAxes((prev) => [...prev, { id: uid(), name: '', values: [] }])
  }

  function removeAxis(id: string) {
    setAxes((prev) => prev.filter((a) => a.id !== id))
  }

  function updateAxisName(id: string, name: string) {
    setAxes((prev) => prev.map((a) => a.id === id ? { ...a, name } : a))
  }

  function addValueToAxis(id: string) {
    const val = (axisInputs[id] ?? '').trim()
    if (!val) return
    setAxes((prev) => prev.map((a) =>
      a.id === id && !a.values.includes(val)
        ? { ...a, values: [...a.values, val] }
        : a
    ))
    setAxisInputs((prev) => ({ ...prev, [id]: '' }))
  }

  function removeValueFromAxis(id: string, value: string) {
    setAxes((prev) => prev.map((a) =>
      a.id === id ? { ...a, values: a.values.filter((v) => v !== value) } : a
    ))
  }

  function generateVariants() {
    const complete = axes.filter((a) => a.name.trim() && a.values.length > 0)
    if (!complete.length) {
      toast.error('Add at least one attribute with values before generating.')
      return
    }
    const prefix = (form.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toUpperCase().slice(0, 15) || 'PROD')
    const combos = cartesian(complete.map((a) => a.values.map((v) => ({ name: a.name.trim(), value: v }))))
    const rows: VariantRow[] = combos.map((combo) => {
      const slug = combo.map((a) => a.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()).join('-')
      return {
        id: uid(),
        attributes: combo,
        label: combo.map((a) => a.value).join(' / '),
        sku: `${prefix}-${slug}`,
        priceInr: form.wholesalePriceInr || '',
        stock: '0',
      }
    })
    setVariantRows(rows)
    toast.success(`${rows.length} variant${rows.length !== 1 ? 's' : ''} generated.`)
  }

  function updateVariantRow(id: string, field: 'sku' | 'priceInr' | 'stock', value: string) {
    setVariantRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  function removeVariantRow(id: string) {
    setVariantRows((prev) => prev.filter((r) => r.id !== id))
  }

  // ── Photos ─────────────────────────────────────────────────────────────────
  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const accepted = Array.from(incoming).filter((f) => f.type.startsWith('image/'))
    if (!accepted.length) return
    setFiles((prev) => {
      const combined = [...prev, ...accepted].slice(0, 8)
      setPreviews(combined.map((f, i) =>
        i < prev.length ? previews[i] : URL.createObjectURL(f)
      ))
      return combined
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews])

  function removeFile(i: number) {
    URL.revokeObjectURL(previews[i])
    setFiles((p) => p.filter((_, j) => j !== i))
    setPreviews((p) => p.filter((_, j) => j !== i))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim())                                              { toast.error('Product name is required.'); return }
    if (form.categories.length === 0)                                   { toast.error('Select at least one category.'); return }
    if (!form.description.trim())                                       { toast.error('Description is required.'); return }
    if (!form.wholesalePriceInr || Number(form.wholesalePriceInr) <= 0) { toast.error('Wholesale price must be a positive number.'); return }
    if (!form.moq || Number(form.moq) < 1)                              { toast.error('MOQ must be at least 1.'); return }
    if (!form.weightKg || Number(form.weightKg) <= 0)                   { toast.error('Weight must be a positive number.'); return }
    if (form.enabledZones.length === 0)                                 { toast.error('Select at least one shipping zone.'); return }

    if (hasVariants) {
      if (variantRows.length === 0) { toast.error('Generate variants or turn off the variants toggle.'); return }
      const invalid = variantRows.find((r) => !r.sku.trim() || !r.priceInr || Number(r.priceInr) <= 0)
      if (invalid) { toast.error(`Variant "${invalid.label}" is missing a SKU or valid price.`); return }
    }

    setSubmitting(true)
    try {
      // 1 — Create product
      const res = await api.post('/products', {
        name:             form.name.trim(),
        categories:       form.categories,
        description:      form.description.trim(),
        wholesalePriceInr: Number(form.wholesalePriceInr),
        moq:              Number(form.moq),
        leadTime:         form.leadTime,
        weightGrams:      Math.round(Number(form.weightKg) * 1000),
        tags:             form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        availability:     form.availability,
        enabledZones:     form.enabledZones,
      })

      const productId: string = res.data.data?.id

      // 2 — Upload photos
      if (files.length > 0 && productId) {
        const fd = new FormData()
        files.forEach((f) => fd.append('photos', f))
        await api.post(`/photos/product/${productId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      // 3 — Bulk-create variants
      if (hasVariants && variantRows.length > 0 && productId) {
        await api.post(`/products/${productId}/variants/bulk`, {
          variants: variantRows.map((r) => ({
            sku:        r.sku.trim(),
            priceInr:   Number(r.priceInr),
            stock:      Number(r.stock) || 0,
            status:     'ACTIVE',
            attributes: r.attributes,
          })),
        })
      }

      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      toast.success('Product created successfully.')
      router.push('/portal/products')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/portal/products"
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
          aria-label="Back to products">
          <ArrowLeft size={15} />
        </Link>
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">Add Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6" noValidate>

        {/* ── Photos ──────────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Product Photos
          </h2>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
            className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div role="button" tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border-warm rounded p-6 flex flex-col items-center gap-2 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
            <div className="w-10 h-10 rounded-full bg-muted-bg flex items-center justify-center">
              <Upload size={18} className="text-muted-text" />
            </div>
            <p className="text-[14px] font-[500] font-public-sans text-primary">Click or drag photos here</p>
            <p className="text-[12px] font-public-sans text-muted-text">Up to 8 · JPG, PNG or WebP · Max 8 MB each</p>
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group aspect-square rounded overflow-hidden border border-border-warm bg-muted-bg">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo">
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] font-[600] font-public-sans bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                  )}
                </div>
              ))}
              {previews.length < 8 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded border-2 border-dashed border-border-warm flex items-center justify-center text-muted-text hover:border-accent hover:text-accent transition-colors">
                  <Upload size={16} />
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] font-public-sans text-muted-text">{files.length}/8 selected</p>
        </div>

        {/* ── Core details ────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Core Details
          </h2>

          <Field label="Product Name" required hint="Max 80 characters">
            <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Hand-Block Printed Cotton Saree" maxLength={80} />
          </Field>

          <Field label="Category" required hint="Select up to 2. Type a new name to create it.">
            {catsLoading ? (
              <div className="flex items-center gap-2 text-[13px] font-public-sans text-muted-text">
                <Loader2 size={14} className="animate-spin" />Loading categories…
              </div>
            ) : (
              <CategoryPicker
                categories={categoryList}
                selected={form.categories}
                onToggle={toggleCategory}
                onCreateNew={(name) => createCategory.mutate(name)}
                creating={createCategory.isPending}
              />
            )}
          </Field>

          <Field label="Description" required>
            <textarea value={form.description} onChange={(e) => set('description')(e.target.value)}
              placeholder="Describe the product — materials, craftsmanship, dimensions, care instructions…" rows={5}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none" />
          </Field>

          <Field label="Tags" hint="Comma-separated, up to 10">
            <TextInput value={form.tags} onChange={set('tags')} placeholder="handmade, cotton, block print" />
          </Field>
        </div>

        {/* ── Pricing & wholesale ──────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Pricing & Wholesale Terms
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Wholesale Price (₹)" required>
              <TextInput value={form.wholesalePriceInr} onChange={set('wholesalePriceInr')} type="number" placeholder="e.g. 1200" />
            </Field>
            <Field label="MOQ (units)" required hint="Minimum order quantity">
              <TextInput value={form.moq} onChange={set('moq')} type="number" placeholder="e.g. 5" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lead Time">
              <select value={form.leadTime} onChange={(e) => set('leadTime')(e.target.value)}
                className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none">
                {LEAD_TIMES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select>
            </Field>
            <Field label="Weight per unit (kg)" required hint="e.g. 0.5 for 500 g">
              <TextInput value={form.weightKg} onChange={set('weightKg')} type="number" placeholder="e.g. 0.5" />
            </Field>
          </div>
        </div>

        {/* ── Variants ────────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border-warm">
            <div>
              <h2 className="text-[16px] font-[600] font-public-sans text-primary">Variants</h2>
              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                e.g. Size, Color, Material
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasVariants((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${hasVariants ? 'bg-primary' : 'bg-border-warm'}`}
              aria-checked={hasVariants}
              role="switch"
            >
              <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${hasVariants ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {hasVariants && (
            <div className="space-y-5">
              {/* Attribute axes */}
              <div className="space-y-3">
                {axes.map((axis) => (
                  <div key={axis.id} className="flex flex-col gap-2 p-4 rounded border border-border-warm bg-muted-bg/20">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={axis.name}
                        onChange={(e) => updateAxisName(axis.id, e.target.value)}
                        placeholder="Attribute name (e.g. Size, Color)"
                        className="flex-1 h-9 px-3 rounded border border-border-warm bg-surface text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
                      />
                      {axes.length > 1 && (
                        <button type="button" onClick={() => removeAxis(axis.id)}
                          className="text-muted-text hover:text-error transition-colors p-1.5" aria-label="Remove attribute">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Values */}
                    <div className="flex flex-wrap items-center gap-2">
                      {axis.values.map((val) => (
                        <span key={val} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-warm bg-surface text-[12px] font-public-sans text-primary">
                          {val}
                          <button type="button" onClick={() => removeValueFromAxis(axis.id, val)}
                            className="text-muted-text hover:text-error transition-colors" aria-label={`Remove ${val}`}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={axisInputs[axis.id] ?? ''}
                          onChange={(e) => setAxisInputs((prev) => ({ ...prev, [axis.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addValueToAxis(axis.id) }
                          }}
                          placeholder="Add value…"
                          className="h-7 px-2 w-28 rounded border border-dashed border-border-warm bg-transparent text-[12px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
                        />
                        <button type="button" onClick={() => addValueToAxis(axis.id)}
                          className="h-7 px-2 rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg text-[12px] transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addAxis}
                  className="flex items-center gap-1.5 text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors">
                  <Plus size={13} />Add attribute
                </button>
              </div>

              {/* Generate button */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[12px] font-public-sans text-muted-text">
                  {variantRows.length > 0 ? `${variantRows.length} variants generated` : 'Generate combinations from attributes above'}
                </p>
                <button type="button" onClick={generateVariants}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded border border-accent text-[13px] font-[600] font-public-sans text-accent hover:bg-accent hover:text-white transition-colors">
                  <RefreshCw size={13} />
                  {variantRows.length > 0 ? 'Regenerate' : 'Generate variants'}
                </button>
              </div>

              {/* Variant rows table */}
              {variantRows.length > 0 && (
                <div className="rounded border border-border-warm overflow-hidden">
                  <table className="w-full text-[13px] font-public-sans">
                    <thead>
                      <tr className="bg-muted-bg/40 border-b border-border-warm">
                        <th className="text-left py-2.5 px-3 font-[600] text-muted-text">Variant</th>
                        <th className="text-left py-2.5 px-3 font-[600] text-muted-text">SKU</th>
                        <th className="text-left py-2.5 px-3 font-[600] text-muted-text">Price (₹)</th>
                        <th className="text-left py-2.5 px-3 font-[600] text-muted-text">Stock</th>
                        <th className="py-2.5 px-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-warm">
                      {variantRows.map((row) => (
                        <tr key={row.id}>
                          <td className="py-2.5 px-3 text-primary font-[500]">{row.label}</td>
                          <td className="py-2.5 px-3">
                            <input type="text" value={row.sku}
                              onChange={(e) => updateVariantRow(row.id, 'sku', e.target.value)}
                              className="w-full h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors" />
                          </td>
                          <td className="py-2.5 px-3">
                            <input type="number" value={row.priceInr} min={0}
                              onChange={(e) => updateVariantRow(row.id, 'priceInr', e.target.value)}
                              className="w-24 h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors" />
                          </td>
                          <td className="py-2.5 px-3">
                            <input type="number" value={row.stock} min={0}
                              onChange={(e) => updateVariantRow(row.id, 'stock', e.target.value)}
                              className="w-20 h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors" />
                          </td>
                          <td className="py-2.5 px-3">
                            <button type="button" onClick={() => removeVariantRow(row.id)}
                              className="text-muted-text hover:text-error transition-colors" aria-label="Remove variant">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Shipping zones ───────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Shipping Zones <span className="text-error ml-0.5">*</span>
          </h2>
          <p className="text-[12px] font-public-sans text-muted-text -mt-2">Select every region you can ship to.</p>
          <div className="flex flex-wrap gap-2">
            {SHIPPING_ZONES.map(({ label, value }) => {
              const active = form.enabledZones.includes(value)
              return (
                <button key={value} type="button" onClick={() => toggleZone(value)}
                  className={`px-3 h-8 rounded border text-[13px] font-[500] font-public-sans transition-colors ${active ? 'border-primary bg-primary text-white' : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'}`}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Availability ─────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Availability
          </h2>
          <div className="flex gap-3">
            {(['ACTIVE', 'INACTIVE', 'COMING_SOON'] as const).map((status) => (
              <button key={status} type="button" onClick={() => setForm((f) => ({ ...f, availability: status }))}
                className={`px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${form.availability === status ? 'border-primary bg-primary text-white' : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'}`}>
                {status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Inactive' : 'Coming Soon'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting
              ? (files.length > 0 ? 'Uploading…' : 'Creating…')
              : 'Create Product'}
          </Button>
          <Button variant="ghost" size="md" asChild>
            <Link href="/portal/products">Cancel</Link>
          </Button>
        </div>

      </form>
    </div>
  )
}
