'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Form state ───────────────────────────────────────────────────────────────

interface ProductForm {
  name: string
  category: string
  shortDescription: string
  description: string
  wholesalePrice: string
  moq: string
  leadTime: '1-3 days' | '1-2 weeks' | '2-4 weeks'
  weight: string
  tags: string
  availability: 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'
}

const CATEGORIES = [
  'Textiles', 'Jewellery', 'Pottery & Ceramics', 'Home Decor',
  'Apparel', 'Accessories', 'Art & Prints', 'Stationery',
  'Food & Wellness', 'Toys & Games', 'Leather Goods', 'Other',
]

const LEAD_TIMES = ['1-3 days', '1-2 weeks', '2-4 weeks'] as const

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-[600] font-public-sans text-primary">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] font-public-sans text-muted-text">{hint}</p>}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  maxLength?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter()

  const [form, setForm] = useState<ProductForm>({
    name: '',
    category: '',
    shortDescription: '',
    description: '',
    wholesalePrice: '',
    moq: '',
    leadTime: '1-2 weeks',
    weight: '',
    tags: '',
    availability: 'ACTIVE',
  })

  const set = (key: keyof ProductForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const createProduct = useMutation({
    mutationFn: () =>
      api.post('/products', {
        name: form.name.trim(),
        category: form.category,
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim() || undefined,
        wholesalePrice: Number(form.wholesalePrice),
        moq: Number(form.moq),
        leadTime: form.leadTime,
        weight: Number(form.weight),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        availability: form.availability,
      }),
    onSuccess: () => {
      toast.success('Product created successfully.')
      router.push('/portal/products')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Product name is required.'); return }
    if (!form.category) { toast.error('Category is required.'); return }
    if (!form.shortDescription.trim()) { toast.error('Short description is required.'); return }
    if (!form.wholesalePrice || Number(form.wholesalePrice) <= 0) { toast.error('Wholesale price must be a positive number.'); return }
    if (!form.moq || Number(form.moq) < 1) { toast.error('MOQ must be at least 1.'); return }
    if (!form.weight || Number(form.weight) <= 0) { toast.error('Weight must be a positive number.'); return }
    createProduct.mutate()
  }

  return (
    <div>
      {/* Header */}
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
        {/* Photo upload placeholder */}
        <div className="border-2 border-dashed border-border-warm rounded p-8 flex flex-col items-center justify-center gap-3 text-center bg-muted-bg/20">
          <div className="w-10 h-10 rounded-full bg-muted-bg flex items-center justify-center">
            <Upload size={18} className="text-muted-text" aria-hidden="true" />
          </div>
          <p className="text-[14px] font-[500] font-public-sans text-primary">Upload product photos</p>
          <p className="text-[12px] font-public-sans text-muted-text">
            1–8 photos · JPG or PNG · At least 800×800px
          </p>
          <p className="text-[11px] font-public-sans text-muted-text/60">
            Photo upload via Cloudinary coming soon — product can be created without photos.
          </p>
        </div>

        {/* Core details */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Core Details
          </h2>

          <Field label="Product Name" required hint="Max 80 characters">
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Hand-Block Printed Cotton Saree" maxLength={80} />
          </Field>

          <Field label="Category" required>
            <select
              value={form.category}
              onChange={(e) => set('category')(e.target.value)}
              className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Short Description" required hint="Max 160 characters — shown on product cards">
            <textarea
              value={form.shortDescription}
              onChange={(e) => set('shortDescription')(e.target.value)}
              placeholder="A concise one-liner about this product..."
              maxLength={160}
              rows={2}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <p className="text-[11px] font-public-sans text-muted-text text-right">
              {form.shortDescription.length}/160
            </p>
          </Field>

          <Field label="Full Description" hint="Shown on product detail page">
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              placeholder="Detailed product description, materials, craftsmanship notes..."
              rows={5}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </Field>

          <Field label="Tags" hint="Comma-separated, up to 10 — e.g. handmade, cotton, natural dye">
            <Input value={form.tags} onChange={set('tags')} placeholder="handmade, cotton, block print" />
          </Field>
        </div>

        {/* Pricing & wholesale terms */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Pricing & Wholesale Terms
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Wholesale Price (₹)" required>
              <Input value={form.wholesalePrice} onChange={set('wholesalePrice')} type="number" placeholder="e.g. 1200" />
            </Field>
            <Field label="MOQ (units)" required hint="Minimum order quantity per SKU">
              <Input value={form.moq} onChange={set('moq')} type="number" placeholder="e.g. 5" />
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
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>
            </Field>
            <Field label="Weight (kg per unit)" required hint="Used to calculate shipping costs">
              <Input value={form.weight} onChange={set('weight')} type="number" placeholder="e.g. 0.5" />
            </Field>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Availability
          </h2>
          <div className="flex gap-3">
            {(['ACTIVE', 'INACTIVE', 'COMING_SOON'] as const).map((status) => (
              <button
                key={status}
                type="button"
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

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? 'Creating…' : 'Create Product'}
          </Button>
          <Button variant="ghost" size="md" asChild>
            <Link href="/portal/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
