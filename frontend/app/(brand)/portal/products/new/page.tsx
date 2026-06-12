'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Plus, Loader2 } from 'lucide-react'
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

// ─── Form state ───────────────────────────────────────────────────────────────

interface ProductForm {
  name: string
  categories: string[]
  shortDescription: string
  fullDescription: string
  wholesalePriceInr: string
  moq: string
  leadTime: string
  weightKg: string       // user enters kg; we convert to grams on submit
  tags: string
  availability: 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'
  enabledZones: string[]
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router      = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categoryList = [], isLoading: catsLoading } = useCategories()

  // ── Inline category creation ────────────────────────────────────────────────
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const newCatRef = useRef<HTMLInputElement>(null)

  const createCategory = useMutation({
    mutationFn: (name: string) => api.post('/categories', { name }),
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setForm((f) => {
        if (f.categories.includes(name) || f.categories.length >= 2) return f
        return { ...f, categories: [...f.categories, name] }
      })
      setNewCatName('')
      setShowNewCat(false)
      toast.success(`Category "${name}" created and selected.`)
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  function submitNewCategory() {
    const name = newCatName.trim()
    if (!name) return
    createCategory.mutate(name)
  }

  const [form, setForm] = useState<ProductForm>({
    name: '', categories: [], shortDescription: '', fullDescription: '',
    wholesalePriceInr: '', moq: '', leadTime: 'ONE_TO_TWO_WEEKS',
    weightKg: '', tags: '', availability: 'ACTIVE',
    enabledZones: ['DOMESTIC'],
  })

  const [files, setFiles]     = useState<File[]>([])
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

  // ── File picking ────────────────────────────────────────────────────────────

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

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim())                                         { toast.error('Product name is required.'); return }
    if (form.categories.length === 0)                              { toast.error('Select at least one category.'); return }
    if (!form.shortDescription.trim())                             { toast.error('Short description is required.'); return }
    if (!form.wholesalePriceInr || Number(form.wholesalePriceInr) <= 0) { toast.error('Wholesale price must be a positive number.'); return }
    if (!form.moq || Number(form.moq) < 1)                         { toast.error('MOQ must be at least 1.'); return }
    if (!form.weightKg || Number(form.weightKg) <= 0)              { toast.error('Weight must be a positive number.'); return }
    if (form.enabledZones.length === 0)                            { toast.error('Select at least one shipping zone.'); return }

    setSubmitting(true)
    try {
      const res = await api.post('/products', {
        name:             form.name.trim(),
        categories:       form.categories,
        shortDescription: form.shortDescription.trim(),
        fullDescription:  form.fullDescription.trim() || undefined,
        wholesalePriceInr: Number(form.wholesalePriceInr),
        moq:              Number(form.moq),
        leadTime:         form.leadTime,
        weightGrams:      Math.round(Number(form.weightKg) * 1000),
        tags:             form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        availability:     form.availability,
        enabledZones:     form.enabledZones,
      })

      const productId: string = res.data.data?.id
      const productMsg: string = res.data.message

      if (files.length > 0 && productId) {
        const fd = new FormData()
        files.forEach((f) => fd.append('photos', f))
        const photoRes = await api.post(`/photos/product/${productId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success(photoRes.data.message ?? 'Photos uploaded.')
      }

      // Invalidate so the products list shows fresh data (with photos) immediately
      queryClient.invalidateQueries({ queryKey: ['my-products'] })

      toast.success(productMsg ?? 'Product created successfully.')
      router.push('/portal/products')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Add Product
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6" noValidate>

        {/* ── Photos ────────────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Product Photos
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div
            role="button" tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border-warm rounded p-6 flex flex-col items-center gap-2 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-muted-bg flex items-center justify-center">
              <Upload size={18} className="text-muted-text" aria-hidden="true" />
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
                    <X size={12} aria-hidden="true" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] font-[600] font-public-sans bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                  )}
                </div>
              ))}
              {previews.length < 8 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded border-2 border-dashed border-border-warm flex items-center justify-center text-muted-text hover:border-accent hover:text-accent transition-colors"
                  aria-label="Add more photos">
                  <Upload size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          <p className="text-[11px] font-public-sans text-muted-text">
            {files.length}/8 selected · Uploaded to Cloudinary when you save.
          </p>
        </div>

        {/* ── Core details ──────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Core Details
          </h2>

          <Field label="Product Name" required hint="Max 80 characters">
            <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Hand-Block Printed Cotton Saree" maxLength={80} />
          </Field>

          <Field label="Category" required hint="Select up to 2 · Can't find yours? Create a new one.">
            {catsLoading ? (
              <div className="flex items-center gap-2 text-[13px] font-public-sans text-muted-text">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Loading categories…
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categoryList.map((c) => {
                  const active = form.categories.includes(c.name)
                  return (
                    <button
                      key={c.id} type="button" onClick={() => toggleCategory(c.name)}
                      className={`px-3 h-8 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                      }`}
                    >
                      {c.name}
                    </button>
                  )
                })}

                {/* Inline new category */}
                {showNewCat ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={newCatRef}
                      autoFocus
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); submitNewCategory() }
                        if (e.key === 'Escape') { setShowNewCat(false); setNewCatName('') }
                      }}
                      placeholder="Category name"
                      className="h-8 px-2.5 w-36 rounded border border-accent bg-muted-bg/30 text-[13px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={submitNewCategory}
                      disabled={createCategory.isPending || !newCatName.trim()}
                      className="h-8 px-3 rounded border border-accent bg-accent text-white text-[13px] font-[500] font-public-sans disabled:opacity-50 flex items-center gap-1"
                    >
                      {createCategory.isPending
                        ? <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                        : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewCat(false); setNewCatName('') }}
                      className="h-8 w-8 flex items-center justify-center rounded border border-border-warm text-muted-text hover:text-primary"
                      aria-label="Cancel"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setShowNewCat(true); setTimeout(() => newCatRef.current?.focus(), 50) }}
                    className="h-8 px-3 rounded border border-dashed border-border-warm text-[13px] font-[500] font-public-sans text-muted-text hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={13} aria-hidden="true" />
                    New category
                  </button>
                )}
              </div>
            )}
          </Field>

          <Field label="Short Description" required hint="Max 160 characters — shown on product cards">
            <textarea
              value={form.shortDescription}
              onChange={(e) => set('shortDescription')(e.target.value)}
              placeholder="A concise one-liner about this product..."
              maxLength={160} rows={2}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <p className="text-[11px] font-public-sans text-muted-text text-right">{form.shortDescription.length}/160</p>
          </Field>

          <Field label="Full Description" hint="Shown on product detail page">
            <textarea
              value={form.fullDescription}
              onChange={(e) => set('fullDescription')(e.target.value)}
              placeholder="Materials, craftsmanship, care instructions..."
              rows={5}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </Field>

          <Field label="Tags" hint="Comma-separated, up to 10">
            <TextInput value={form.tags} onChange={set('tags')} placeholder="handmade, cotton, block print" />
          </Field>
        </div>

        {/* ── Pricing & wholesale terms ──────────────────────────────────────── */}
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
              <select
                value={form.leadTime}
                onChange={(e) => set('leadTime')(e.target.value)}
                className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
              >
                {LEAD_TIMES.map((lt) => (
                  <option key={lt.value} value={lt.value}>{lt.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Weight per unit (kg)" required hint="e.g. 0.5 for 500 g">
              <TextInput value={form.weightKg} onChange={set('weightKg')} type="number" placeholder="e.g. 0.5" />
            </Field>
          </div>
        </div>

        {/* ── Shipping zones ─────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Shipping Zones <span className="text-error ml-0.5">*</span>
          </h2>
          <p className="text-[12px] font-public-sans text-muted-text -mt-2">
            Select every region you can ship to.
          </p>
          <div className="flex flex-wrap gap-2">
            {SHIPPING_ZONES.map(({ label, value }) => {
              const active = form.enabledZones.includes(value)
              return (
                <button
                  key={value} type="button" onClick={() => toggleZone(value)}
                  className={`px-3 h-8 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Availability ───────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Availability
          </h2>
          <div className="flex gap-3">
            {(['ACTIVE', 'INACTIVE', 'COMING_SOON'] as const).map((status) => (
              <button
                key={status} type="button"
                onClick={() => setForm((f) => ({ ...f, availability: status }))}
                className={`px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                  form.availability === status
                    ? 'border-primary bg-primary text-white'
                    : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                }`}
              >
                {status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Inactive' : 'Coming Soon'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? (files.length > 0 ? 'Uploading photos…' : 'Creating…') : 'Create Product'}
          </Button>
          <Button variant="ghost" size="md" asChild>
            <Link href="/portal/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
