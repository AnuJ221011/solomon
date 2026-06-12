'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Upload, ImageIcon, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Textiles', 'Jewellery', 'Pottery & Ceramics', 'Home Decor',
  'Apparel', 'Accessories', 'Art & Prints', 'Stationery',
  'Food & Wellness', 'Toys & Games', 'Leather Goods', 'Other',
]

const LEAD_TIMES = [
  { value: 'ONE_TO_THREE_DAYS', label: '1–3 days' },
  { value: 'ONE_TO_TWO_WEEKS', label: '1–2 weeks' },
  { value: 'TWO_TO_FOUR_WEEKS', label: '2–4 weeks' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string
  category: string
  shortDescription: string
  fullDescription: string
  wholesalePriceInr: string
  moq: string
  leadTime: string
  weightKg: string
  tags: string
  availability: 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
    />
  )
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-text"
      />
    </div>
  )
}

// ─── Photo management section ─────────────────────────────────────────────────

interface Photo {
  id: string
  url: string
  position: number
}

function PhotosSection({ productId, photos: initialPhotos }: { productId: string; photos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    if (photos.length + files.length > 8) {
      toast.error(`You can upload at most ${8 - photos.length} more photo(s).`)
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((f) => formData.append('photos', f))
      const res = await api.post(`/photos/product/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded: Photo[] = res.data.data
      setPhotos((prev) => [...prev, ...uploaded].sort((a, b) => a.position - b.position))
      toast.success(`${uploaded.length} photo${uploaded.length !== 1 ? 's' : ''} uploaded.`)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(photoId: string) {
    setDeletingId(photoId)
    try {
      await api.delete(`/photos/product/${productId}/photo/${photoId}`)
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      toast.success('Photo removed.')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border-warm">
        <h2 className="text-[16px] font-[600] font-public-sans text-primary">Photos</h2>
        <span className="text-[12px] font-public-sans text-muted-text">{photos.length} / 8</span>
      </div>

      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 rounded border border-dashed border-border-warm text-muted-text">
          <ImageIcon size={28} className="opacity-40" />
          <p className="text-[13px] font-public-sans">No photos yet</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative group aspect-square rounded overflow-hidden border border-border-warm bg-muted-bg">
              <Image
                src={photo.url}
                alt={`Product photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="150px"
              />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-[600] font-public-sans px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                aria-label="Delete photo"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < 8 && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload size={14} aria-hidden="true" />
            {uploading ? 'Uploading…' : 'Upload photos'}
          </Button>
          <p className="text-[11px] font-public-sans text-muted-text">
            Up to 8 photos, max 8 MB each. First photo is the main image.
          </p>
        </>
      )}
    </div>
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
    fullDescription: '',
    wholesalePriceInr: '',
    moq: '',
    leadTime: 'ONE_TO_TWO_WEEKS',
    weightKg: '',
    tags: '',
    availability: 'ACTIVE',
  })

  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name ?? '',
      // backend stores as array `categories`; take first for the single-select
      category: (product.categories ?? [])[0] ?? '',
      shortDescription: product.shortDescription ?? '',
      fullDescription: product.fullDescription ?? '',
      wholesalePriceInr: product.wholesalePriceInr != null ? String(product.wholesalePriceInr) : '',
      moq: product.moq != null ? String(product.moq) : '',
      leadTime: product.leadTime ?? 'ONE_TO_TWO_WEEKS',
      // backend stores grams; show as kg with up to 3 decimal places
      weightKg: product.weightGrams != null ? String(product.weightGrams / 1000) : '',
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
        categories: [form.category].filter(Boolean),
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription.trim() || undefined,
        wholesalePriceInr: Number(form.wholesalePriceInr),
        moq: Number(form.moq),
        leadTime: form.leadTime,
        weightGrams: Math.round(Number(form.weightKg) * 1000),
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
    if (!form.category) { toast.error('Please select a category.'); return }
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

        {/* Photos */}
        {product && (
          <PhotosSection productId={product.id} photos={product.photos ?? []} />
        )}

        {/* Core details */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Core Details
          </h2>

          <Field label="Product Name">
            <TextInput value={form.name} onChange={set('name')} placeholder="Product name" />
          </Field>

          <Field label="Category">
            <SelectWrapper>
              <select
                value={form.category}
                onChange={(e) => set('category')(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </SelectWrapper>
          </Field>

          <Field label="Short Description" hint="Max 160 characters — shown on product cards">
            <textarea
              value={form.shortDescription}
              onChange={(e) => set('shortDescription')(e.target.value)}
              maxLength={160}
              rows={2}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </Field>

          <Field label="Full Description">
            <textarea
              value={form.fullDescription}
              onChange={(e) => set('fullDescription')(e.target.value)}
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
              <TextInput value={form.wholesalePriceInr} onChange={set('wholesalePriceInr')} type="number" placeholder="e.g. 1200" />
            </Field>
            <Field label="MOQ (units)">
              <TextInput value={form.moq} onChange={set('moq')} type="number" placeholder="e.g. 10" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lead Time">
              <SelectWrapper>
                <select
                  value={form.leadTime}
                  onChange={(e) => set('leadTime')(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none"
                >
                  {LEAD_TIMES.map((lt) => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </SelectWrapper>
            </Field>
            <Field label="Weight (kg)">
              <TextInput value={form.weightKg} onChange={set('weightKg')} type="number" placeholder="e.g. 0.5" />
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
