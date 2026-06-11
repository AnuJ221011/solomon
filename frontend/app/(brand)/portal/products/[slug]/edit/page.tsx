'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
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
  leadTime: string
  weight: string
  tags: string
  availability: 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'
}

const CATEGORIES = [
  'Textiles', 'Jewellery', 'Pottery & Ceramics', 'Home Decor',
  'Apparel', 'Accessories', 'Art & Prints', 'Stationery',
  'Food & Wellness', 'Toys & Games', 'Leather Goods', 'Other',
]

const LEAD_TIMES = ['1-3 days', '1-2 weeks', '2-4 weeks']

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-[600] font-public-sans text-primary">{label}</label>
      {children}
      {hint && <p className="text-[12px] font-public-sans text-muted-text">{hint}</p>}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data.data),
  })

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

  // Populate form once product loads
  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name ?? '',
      category: product.category ?? '',
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      wholesalePrice: String(product.wholesalePrice ?? ''),
      moq: String(product.moq ?? ''),
      leadTime: product.leadTime ?? '1-2 weeks',
      weight: String(product.weight ?? ''),
      tags: (product.tags ?? []).join(', '),
      availability: product.availability ?? 'ACTIVE',
    })
  }, [product])

  const set = (key: keyof ProductForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const updateProduct = useMutation({
    mutationFn: () =>
      api.patch(`/products/${product?.id}`, {
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
      toast.success('Product updated.')
      router.push('/portal/products')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Product name is required.'); return }
    updateProduct.mutate()
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded bg-muted-bg animate-pulse" />
          <div className="h-7 bg-muted-bg rounded w-40 animate-pulse" />
        </div>
        <div className="max-w-2xl space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted-bg rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
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
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Edit Product
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6" noValidate>
        {/* Core details */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Core Details
          </h2>

          <Field label="Product Name">
            <TextInput value={form.name} onChange={set('name')} placeholder="Product name" />
          </Field>

          <Field label="Category">
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

          <Field label="Short Description">
            <textarea
              value={form.shortDescription}
              onChange={(e) => set('shortDescription')(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </Field>

          <Field label="Full Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </Field>

          <Field label="Tags" hint="Comma-separated">
            <TextInput value={form.tags} onChange={set('tags')} placeholder="handmade, cotton, block print" />
          </Field>
        </div>

        {/* Pricing */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Pricing & Terms
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Wholesale Price (₹)">
              <TextInput value={form.wholesalePrice} onChange={set('wholesalePrice')} type="number" />
            </Field>
            <Field label="MOQ (units)">
              <TextInput value={form.moq} onChange={set('moq')} type="number" />
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
            <Field label="Weight (kg)">
              <TextInput value={form.weight} onChange={set('weight')} type="number" />
            </Field>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Availability
          </h2>
          <div className="flex gap-3 flex-wrap">
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

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button variant="ghost" size="md" asChild>
            <Link href="/portal/products">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
