'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Trash2, Upload, ImageIcon, ChevronDown,
  Plus, RefreshCw, Loader2, X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { useCategories } from '@/hooks/queries/useCategories'

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_TIMES = [
  { value: 'ONE_TO_THREE_DAYS', label: '1–3 days' },
  { value: 'ONE_TO_TWO_WEEKS', label: '1–2 weeks' },
  { value: 'TWO_TO_FOUR_WEEKS', label: '2–4 weeks' },
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
  shortDescription: string
  fullDescription: string
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

interface ExistingVariant {
  id: string
  sku: string
  priceInr: number
  stock: number
  status: string
  attributes: { id: string; name: string; value: string }[]
}

interface EditableVariant {
  id: string
  label: string
  editSku: string
  editPrice: string
  editStock: string
  dirty: boolean
  attributes: { id: string; name: string; value: string }[]
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

// ─── Variants management section ──────────────────────────────────────────────

function VariantsSection({ productId, defaultPrice }: { productId: string; defaultPrice: string }) {
  const queryClient = useQueryClient()

  // ── Fetch existing variants ──────────────────────────────────────────────
  const { data: existingRaw = [], isLoading } = useQuery<ExistingVariant[]>({
    queryKey: ['product-variants', productId],
    queryFn: () => api.get(`/products/${productId}/variants`).then((r) => r.data.data ?? []),
  })

  // ── Editable state for existing variants ──────────────────────────────────
  const [editRows, setEditRows] = useState<EditableVariant[]>([])

  useEffect(() => {
    setEditRows(
      existingRaw.map((v) => ({
        id: v.id,
        label: v.attributes.map((a) => a.value).join(' / '),
        editSku: v.sku,
        editPrice: String(v.priceInr),
        editStock: String(v.stock),
        dirty: false,
        attributes: v.attributes,
      }))
    )
  }, [existingRaw])

  function updateEditRow(id: string, field: 'editSku' | 'editPrice' | 'editStock', value: string) {
    setEditRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value, dirty: true } : r))
    )
  }

  function discardChanges() {
    setEditRows(
      existingRaw.map((v) => ({
        id: v.id,
        label: v.attributes.map((a) => a.value).join(' / '),
        editSku: v.sku,
        editPrice: String(v.priceInr),
        editStock: String(v.stock),
        dirty: false,
        attributes: v.attributes,
      }))
    )
  }

  const [savingAll, setSavingAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function saveChanges() {
    const dirty = editRows.filter((r) => r.dirty)
    if (!dirty.length) { toast.info('No changes to save.'); return }
    setSavingAll(true)
    try {
      await Promise.all(
        dirty.map((r) =>
          api.patch(`/products/${productId}/variants/${r.id}`, {
            sku: r.editSku.trim(),
            priceInr: Number(r.editPrice),
            stock: Number(r.editStock),
          })
        )
      )
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast.success(`${dirty.length} variant${dirty.length !== 1 ? 's' : ''} saved.`)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setSavingAll(false)
    }
  }

  async function handleDelete(variantId: string) {
    setDeletingId(variantId)
    try {
      await api.delete(`/products/${productId}/variants/${variantId}`)
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      toast.success('Variant deleted.')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setDeletingId(null)
    }
  }

  // ── Add new variants ────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false)
  const [axes, setAxes] = useState<AttributeAxis[]>([{ id: uid(), name: '', values: [] }])
  const [axisInputs, setAxisInputs] = useState<Record<string, string>>({})
  const [newRows, setNewRows] = useState<VariantRow[]>([])
  const [addingVariants, setAddingVariants] = useState(false)

  function addAxis() {
    setAxes((prev) => [...prev, { id: uid(), name: '', values: [] }])
  }

  function removeAxis(id: string) {
    setAxes((prev) => prev.filter((a) => a.id !== id))
  }

  function updateAxisName(id: string, name: string) {
    setAxes((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
  }

  function addValueToAxis(id: string) {
    const val = (axisInputs[id] ?? '').trim()
    if (!val) return
    setAxes((prev) =>
      prev.map((a) =>
        a.id === id && !a.values.includes(val) ? { ...a, values: [...a.values, val] } : a
      )
    )
    setAxisInputs((prev) => ({ ...prev, [id]: '' }))
  }

  function removeValueFromAxis(id: string, value: string) {
    setAxes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, values: a.values.filter((v) => v !== value) } : a))
    )
  }

  function generateVariants() {
    const complete = axes.filter((a) => a.name.trim() && a.values.length > 0)
    if (!complete.length) {
      toast.error('Add at least one attribute with values before generating.')
      return
    }
    const combos = cartesian(complete.map((a) => a.values.map((v) => ({ name: a.name.trim(), value: v }))))
    const rows: VariantRow[] = combos.map((combo) => {
      const slug = combo.map((a) => a.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()).join('-')
      return {
        id: uid(),
        attributes: combo,
        label: combo.map((a) => a.value).join(' / '),
        sku: `PROD-${slug}`,
        priceInr: defaultPrice || '',
        stock: '0',
      }
    })
    setNewRows(rows)
    toast.success(`${rows.length} variant${rows.length !== 1 ? 's' : ''} generated.`)
  }

  function updateNewRow(id: string, field: 'sku' | 'priceInr' | 'stock', value: string) {
    setNewRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function removeNewRow(id: string) {
    setNewRows((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleAddVariants() {
    if (!newRows.length) return
    const invalid = newRows.find((r) => !r.sku.trim() || !r.priceInr || Number(r.priceInr) <= 0)
    if (invalid) {
      toast.error(`Variant "${invalid.label}" is missing a SKU or valid price.`)
      return
    }
    setAddingVariants(true)
    try {
      await api.post(`/products/${productId}/variants/bulk`, {
        variants: newRows.map((r) => ({
          sku: r.sku.trim(),
          priceInr: Number(r.priceInr),
          stock: Number(r.stock) || 0,
          status: 'ACTIVE',
          attributes: r.attributes,
        })),
      })
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      setNewRows([])
      setAxes([{ id: uid(), name: '', values: [] }])
      setAxisInputs({})
      setShowAddForm(false)
      toast.success(`${newRows.length} variant${newRows.length !== 1 ? 's' : ''} added.`)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setAddingVariants(false)
    }
  }

  const hasDirty = editRows.some((r) => r.dirty)

  return (
    <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
      <div className="pb-3 border-b border-border-warm">
        <h2 className="text-[16px] font-[600] font-public-sans text-primary">Variants</h2>
        <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
          {isLoading ? 'Loading…' : `${editRows.length} variant${editRows.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Existing variants */}
      {isLoading && (
        <div className="flex items-center gap-2 text-[13px] font-public-sans text-muted-text">
          <Loader2 size={14} className="animate-spin" />
          Loading variants…
        </div>
      )}

      {!isLoading && editRows.length === 0 && !showAddForm && (
        <p className="text-[13px] font-public-sans text-muted-text">No variants yet.</p>
      )}

      {!isLoading && editRows.length > 0 && (
        <div className="space-y-3">
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
                {editRows.map((row) => (
                  <tr key={row.id} className={row.dirty ? 'bg-accent/5' : ''}>
                    <td className="py-2.5 px-3 text-primary font-[500]">{row.label}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.editSku}
                        onChange={(e) => updateEditRow(row.id, 'editSku', e.target.value)}
                        className="w-full h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={row.editPrice}
                        min={0}
                        onChange={(e) => updateEditRow(row.id, 'editPrice', e.target.value)}
                        className="w-24 h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={row.editStock}
                        min={0}
                        onChange={(e) => updateEditRow(row.id, 'editStock', e.target.value)}
                        className="w-20 h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="text-muted-text hover:text-error transition-colors disabled:opacity-40"
                        aria-label="Delete variant"
                      >
                        {deletingId === row.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasDirty && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveChanges}
                disabled={savingAll}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-primary bg-primary text-white text-[13px] font-[600] font-public-sans hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {savingAll && <Loader2 size={13} className="animate-spin" />}
                {savingAll ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={discardChanges}
                className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors"
              >
                Discard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add new variants */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors"
        >
          <Plus size={13} />Add variants
        </button>
      ) : (
        <div className="space-y-5 pt-4 border-t border-border-warm">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-[600] font-public-sans text-primary">Add new variants</h3>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewRows([]) }}
              className="text-muted-text hover:text-primary transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

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
                    <button
                      type="button"
                      onClick={() => removeAxis(axis.id)}
                      className="text-muted-text hover:text-error transition-colors p-1.5"
                      aria-label="Remove attribute"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {axis.values.map((val) => (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-warm bg-surface text-[12px] font-public-sans text-primary"
                    >
                      {val}
                      <button
                        type="button"
                        onClick={() => removeValueFromAxis(axis.id, val)}
                        className="text-muted-text hover:text-error transition-colors"
                        aria-label={`Remove ${val}`}
                      >
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
                    <button
                      type="button"
                      onClick={() => addValueToAxis(axis.id)}
                      className="h-7 px-2 rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg text-[12px] transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAxis}
              className="flex items-center gap-1.5 text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors"
            >
              <Plus size={13} />Add attribute
            </button>
          </div>

          {/* Generate button */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[12px] font-public-sans text-muted-text">
              {newRows.length > 0
                ? `${newRows.length} new variant${newRows.length !== 1 ? 's' : ''} ready to add`
                : 'Generate combinations from attributes above'}
            </p>
            <button
              type="button"
              onClick={generateVariants}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded border border-accent text-[13px] font-[600] font-public-sans text-accent hover:bg-accent hover:text-white transition-colors"
            >
              <RefreshCw size={13} />
              {newRows.length > 0 ? 'Regenerate' : 'Generate variants'}
            </button>
          </div>

          {/* New variant rows table */}
          {newRows.length > 0 && (
            <div className="space-y-3">
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
                    {newRows.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5 px-3 text-primary font-[500]">{row.label}</td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.sku}
                            onChange={(e) => updateNewRow(row.id, 'sku', e.target.value)}
                            className="w-full h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={row.priceInr}
                            min={0}
                            onChange={(e) => updateNewRow(row.id, 'priceInr', e.target.value)}
                            className="w-24 h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            value={row.stock}
                            min={0}
                            onChange={(e) => updateNewRow(row.id, 'stock', e.target.value)}
                            className="w-20 h-8 px-2 rounded border border-border-warm bg-transparent text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => removeNewRow(row.id)}
                            className="text-muted-text hover:text-error transition-colors"
                            aria-label="Remove variant"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddVariants}
                disabled={addingVariants}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-primary bg-primary text-white text-[13px] font-[600] font-public-sans hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {addingVariants && <Loader2 size={13} className="animate-spin" />}
                {addingVariants
                  ? 'Adding…'
                  : `Add ${newRows.length} variant${newRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
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

  const { data: categoriesData } = useCategories()
  const categoryList = categoriesData ?? []

  const [form, setForm] = useState<ProductForm>({
    name: '',
    categories: [],
    shortDescription: '',
    fullDescription: '',
    wholesalePriceInr: '',
    moq: '',
    leadTime: 'ONE_TO_TWO_WEEKS',
    weightKg: '',
    tags: '',
    availability: 'ACTIVE',
    enabledZones: [],
  })

  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name ?? '',
      categories: product.categories ?? [],
      shortDescription: product.shortDescription ?? '',
      fullDescription: product.fullDescription ?? '',
      wholesalePriceInr: product.wholesalePriceInr != null ? String(product.wholesalePriceInr) : '',
      moq: product.moq != null ? String(product.moq) : '',
      leadTime: product.leadTime ?? 'ONE_TO_TWO_WEEKS',
      weightKg: product.weightGrams != null ? String(product.weightGrams / 1000) : '',
      tags: (product.tags ?? []).join(', '),
      availability: product.availability ?? 'ACTIVE',
      enabledZones: product.enabledZones ?? ['DOMESTIC'],
    })
  }, [product])

  const set = (key: keyof ProductForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  function toggleCategory(cat: string) {
    setForm((f) => {
      if (f.categories.includes(cat)) return { ...f, categories: f.categories.filter((c) => c !== cat) }
      if (f.categories.length >= 2) { toast.error('Max 2 categories allowed.'); return f }
      return { ...f, categories: [...f.categories, cat] }
    })
  }

  function toggleZone(zone: string) {
    setForm((f) => {
      if (f.enabledZones.includes(zone)) return { ...f, enabledZones: f.enabledZones.filter((z) => z !== zone) }
      return { ...f, enabledZones: [...f.enabledZones, zone] }
    })
  }

  const updateProduct = useMutation({
    mutationFn: () =>
      api.patch(`/products/${product?.id}`, {
        name: form.name.trim(),
        categories: form.categories,
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription.trim() || undefined,
        wholesalePriceInr: Number(form.wholesalePriceInr),
        moq: Number(form.moq),
        leadTime: form.leadTime,
        weightGrams: Math.round(Number(form.weightKg) * 1000),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        availability: form.availability,
        enabledZones: form.enabledZones,
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
    if (form.categories.length === 0) { toast.error('Please select at least one category.'); return }
    if (form.enabledZones.length === 0) { toast.error('Please select at least one shipping zone.'); return }
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

          <Field label="Categories" hint="Select up to 2 categories">
            <div className="flex flex-wrap gap-2">
              {categoryList.length === 0 && (
                <p className="text-[13px] font-public-sans text-muted-text">Loading categories…</p>
              )}
              {categoryList.map((cat: { id: string; name: string; slug: string }) => {
                const selected = form.categories.includes(cat.name)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={`h-8 px-3 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                      selected
                        ? 'border-accent bg-accent text-white'
                        : 'border-border-warm bg-muted-bg/30 text-primary hover:border-accent'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
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

        {/* Variants */}
        {product && (
          <VariantsSection productId={product.id} defaultPrice={form.wholesalePriceInr} />
        )}

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

        {/* Shipping Zones */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Shipping Zones
          </h2>
          <p className="text-[13px] font-public-sans text-muted-text -mt-2">
            Select the regions you ship to. At least one zone is required.
          </p>
          <div className="flex flex-wrap gap-2">
            {SHIPPING_ZONES.map((zone) => {
              const selected = form.enabledZones.includes(zone.value)
              return (
                <button
                  key={zone.value}
                  type="button"
                  onClick={() => toggleZone(zone.value)}
                  className={`h-8 px-3 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
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
