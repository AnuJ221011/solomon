'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Plus, Loader2, Trash2, Check, Search, Sparkles, RotateCcw, Video, AlertCircle, ExternalLink, Pencil, Package } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { useCategories } from '@/hooks/queries/useCategories'
import type { Category } from '@/hooks/queries/useCategories'
import { useAdminProduct } from '@/hooks/queries/useAdmin'

const LEAD_TIMES: { label: string; value: string }[] = [
  { label: '1–3 days',   value: 'ONE_TO_THREE_DAYS' },
  { label: '1–2 weeks',  value: 'ONE_TO_TWO_WEEKS' },
  { label: '2–4 weeks',  value: 'TWO_TO_FOUR_WEEKS' },
]

const MAX_MEDIA = 20
const MIN_SCORE_TO_PUBLISH = 60

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductForm {
  name: string
  categories: string[]
  description: string
  stepQty: string
  leadTime: string
  weightKg: string
  tags: string
  availability: 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'
}

interface PriceTier {
  id: string
  moq: string
  priceInr: string
}

interface Media {
  id: string
  url: string
  position: number
  mediaType: string
}

interface ProductAttrs {
  material: string
  dimensions: string
  isHandmade: boolean
  placeOfOrigin: string
  isGITagged: boolean
}

interface CraftStory {
  howItIsMade: string
  artisanName: string
}

interface ScoreRule {
  label: string
  points: number
  earned: number
  passing: boolean
}

function calcListingScore(
  form: ProductForm,
  priceTiers: PriceTier[],
  media: Media[],
  attrs: ProductAttrs,
  craft: CraftStory,
): { score: number; maxScore: number; rules: ScoreRule[] } {
  const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length
  const imageCount = media.filter((m) => m.mediaType !== 'video').length
  const tagCount = form.tags.split(',').map((t) => t.trim()).filter(Boolean).length
  const hasTiers = priceTiers.some((t) => t.moq && t.priceInr)

  const rules: ScoreRule[] = [
    { label: 'Product name (5+ chars)',   points: 10, earned: form.name.trim().length >= 5 ? 10 : 0,              passing: form.name.trim().length >= 5 },
    { label: 'Category selected',          points: 10, earned: form.categories.length > 0 ? 10 : 0,               passing: form.categories.length > 0 },
    { label: 'Description (50+ words)',    points: 10, earned: wordCount >= 100 ? 10 : wordCount >= 50 ? 5 : 0,    passing: wordCount >= 50 },
    { label: 'Description detail (100+)',  points: 10, earned: wordCount >= 100 ? 10 : 0,                          passing: wordCount >= 100 },
    { label: 'At least 3 product images',  points: 15, earned: imageCount >= 5 ? 15 : imageCount >= 3 ? 10 : imageCount >= 1 ? 5 : 0, passing: imageCount >= 3 },
    { label: '3+ tags added',              points: 5,  earned: tagCount >= 3 ? 5 : tagCount >= 1 ? 2 : 0,          passing: tagCount >= 3 },
    { label: 'Price tier(s) set',          points: 10, earned: hasTiers ? 10 : 0,                                  passing: hasTiers },
    { label: 'Weight filled',              points: 5,  earned: Number(form.weightKg) > 0 ? 5 : 0,                  passing: Number(form.weightKg) > 0 },
    { label: 'Material filled',            points: 5,  earned: attrs.material.trim().length > 0 ? 5 : 0,           passing: attrs.material.trim().length > 0 },
    { label: 'Place of origin filled',     points: 5,  earned: attrs.placeOfOrigin.trim().length > 0 ? 5 : 0,      passing: attrs.placeOfOrigin.trim().length > 0 },
    { label: 'How it is made (story)',      points: 10, earned: craft.howItIsMade.trim().split(/\s+/).filter(Boolean).length >= 20 ? 10 : craft.howItIsMade.trim().length > 0 ? 5 : 0, passing: craft.howItIsMade.trim().length > 0 },
    { label: 'Artisan name provided',      points: 5,  earned: craft.artisanName.trim().length > 0 ? 5 : 0,        passing: craft.artisanName.trim().length > 0 },
  ]

  const score = rules.reduce((s, r) => s + r.earned, 0)
  const maxScore = rules.reduce((s, r) => s + r.points, 0)
  return { score, maxScore, rules }
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

type PolishableField = 'name' | 'description' | 'tags'

function Field({ label, required, hint, action, children }: {
  label: string; required?: boolean; hint?: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[14px] font-[600] font-public-sans text-primary">
          {label}{required && <span className="text-error ml-0.5">*</span>}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="text-[12px] font-public-sans text-muted-text">{hint}</p>}
    </div>
  )
}

function PolishButton({ loading, canUndo, onPolish, onUndo }: {
  loading: boolean; canUndo: boolean; onPolish: () => void; onUndo: () => void
}) {
  if (canUndo) {
    return (
      <button type="button" onClick={onUndo}
        className="inline-flex items-center gap-1 text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors shrink-0">
        <RotateCcw size={11} />Undo
      </button>
    )
  }
  return (
    <button type="button" onClick={onPolish} disabled={loading}
      className="inline-flex items-center gap-1 text-[12px] font-[500] font-public-sans text-accent hover:opacity-70 transition-opacity disabled:opacity-40 shrink-0">
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
      {loading ? 'Polishing…' : 'Polish'}
    </button>
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
      className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors"
    />
  )
}

// ─── Score widget ─────────────────────────────────────────────────────────────

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? score / maxScore : 0
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const color = pct >= 0.7 ? '#22c55e' : pct >= 0.5 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f0ebe3" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-playfair text-[28px] font-[600] text-primary leading-none">{score}</span>
        <span className="font-public-sans text-[11px] text-muted-text mt-0.5">/ {maxScore}</span>
      </div>
    </div>
  )
}

function ScoreWidget({ score, maxScore, rules, canPublish }: {
  score: number; maxScore: number; rules: ScoreRule[]; canPublish: boolean
}) {
  const failing = rules.filter((r) => !r.passing)
  return (
    <div className="bg-surface border border-border-warm rounded p-5 space-y-4">
      <h3 className="text-[14px] font-[600] font-public-sans text-primary">Listing Score</h3>
      <div className="flex items-center gap-4">
        <ScoreRing score={score} maxScore={maxScore} />
        <div className="flex-1">
          {canPublish
            ? <p className="text-[12px] font-[600] font-public-sans text-[#22c55e]">Ready to publish</p>
            : <p className="text-[12px] font-[600] font-public-sans text-error">Need {MIN_SCORE_TO_PUBLISH - score} more pts to publish</p>
          }
          <p className="text-[11px] font-public-sans text-muted-text mt-1">Min {MIN_SCORE_TO_PUBLISH}/{maxScore} to go Active</p>
        </div>
      </div>
      {failing.length > 0 && (
        <div className="space-y-1.5 border-t border-border-warm pt-3">
          <p className="text-[11px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Improve to boost score</p>
          {failing.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              <AlertCircle size={12} className="text-error flex-shrink-0 mt-0.5" />
              <span className="text-[12px] font-public-sans text-primary leading-snug flex-1">{r.label}</span>
              <span className="text-[11px] font-[600] font-public-sans text-muted-text flex-shrink-0">+{r.points}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1.5 border-t border-border-warm pt-3">
        {rules.filter((r) => r.passing).map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <Check size={12} className="text-[#22c55e] flex-shrink-0" />
            <span className="text-[12px] font-public-sans text-muted-text leading-snug flex-1">{r.label}</span>
            <span className="text-[11px] font-[600] font-public-sans text-[#22c55e] flex-shrink-0">+{r.earned}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Category picker ──────────────────────────────────────────────────────────

function CategoryPicker({ categories, selected, onToggle, onCreateNew, creating }: {
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
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 10)
  const exactMatch = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  const canAdd = selected.length < 2

  return (
    <div ref={containerRef} className="space-y-2">
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

      {canAdd && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" />
          <input
            type="text" value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
            placeholder="Search categories…"
            className="w-full h-10 pl-9 pr-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors"
          />
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-surface border border-border-warm rounded shadow-lg overflow-hidden max-h-52 overflow-y-auto">
              {filtered.length === 0 && !trimmed && (
                <p className="px-3 py-2.5 text-[13px] font-public-sans text-muted-text">Type to search categories…</p>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id} type="button"
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
                  Create &quot;{trimmed}&quot;
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

// ─── Media (photos & videos) — uploads/deletes immediately since the product
// already exists (unlike the create form, which stages files until submit) ────

function MediaSection({ productId, initialMedia }: { productId: string; initialMedia: Media[] }) {
  const [media, setMedia] = useState<Media[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    if (media.length + files.length > MAX_MEDIA) {
      toast.error(`You can upload at most ${MAX_MEDIA - media.length} more file(s).`)
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((f) => formData.append('photos', f))
      const res = await api.post(`/admin/products/${productId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded: Media[] = res.data.data
      setMedia((prev) => [...prev, ...uploaded].sort((a, b) => a.position - b.position))
      toast.success(`${uploaded.length} file${uploaded.length !== 1 ? 's' : ''} uploaded.`)
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
      await api.delete(`/admin/products/${productId}/photos/${photoId}`)
      setMedia((prev) => prev.filter((p) => p.id !== photoId))
      toast.success('Removed from gallery.')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setDeletingId(null)
    }
  }

  const imageCount = media.filter((m) => m.mediaType !== 'video').length
  const videoCount = media.filter((m) => m.mediaType === 'video').length

  return (
    <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
      <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
        Photos &amp; Videos
      </h2>
      <input ref={fileInputRef} type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <div role="button" tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border-warm rounded p-6 flex flex-col items-center gap-2 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
        <div className="w-10 h-10 rounded-full bg-muted-bg flex items-center justify-center">
          {uploading ? <Loader2 size={18} className="text-muted-text animate-spin" /> : <Upload size={18} className="text-muted-text" />}
        </div>
        <p className="text-[14px] font-[500] font-public-sans text-primary">
          {uploading ? 'Uploading…' : 'Click or drag photos / videos here'}
        </p>
        <p className="text-[12px] font-public-sans text-muted-text">Up to {MAX_MEDIA} · JPG, PNG, WebP, MP4, MOV · Images max 8 MB · Videos max 100 MB</p>
      </div>
      {media.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {media.map((m, i) => (
            <div key={m.id} className="relative group aspect-square rounded overflow-hidden border border-border-warm bg-muted-bg">
              {m.mediaType === 'video' ? (
                <>
                  <video src={m.url} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                      <Video size={14} className="text-white" />
                    </div>
                  </div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
              <button type="button" onClick={() => handleDelete(m.id)} disabled={deletingId === m.id}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                aria-label="Remove">
                {deletingId === m.id ? <Loader2 size={11} className="animate-spin" /> : <X size={12} />}
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] font-[600] font-public-sans bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] font-public-sans text-muted-text">
        {media.length}/{MAX_MEDIA} selected
        {videoCount > 0 && <span className="ml-2 text-muted-text">({imageCount} image{imageCount !== 1 ? 's' : ''}, {videoCount} video{videoCount !== 1 ? 's' : ''})</span>}
      </p>
    </div>
  )
}

// ─── Read-only view ─────────────────────────────────────────────────────────

const LEAD_TIME_LABELS: Record<string, string> = {
  ONE_TO_THREE_DAYS: '1–3 days',
  ONE_TO_TWO_WEEKS: '1–2 weeks',
  TWO_TO_FOUR_WEEKS: '2–4 weeks',
}

const AVAILABILITY_STYLE: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success',
  INACTIVE: 'bg-muted-bg text-muted-text',
  COMING_SOON: 'bg-accent/10 text-accent',
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border-warm rounded p-6 space-y-4">
      <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">{title}</h2>
      {children}
    </div>
  )
}

function ViewRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <p className="text-[11px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-1">{label}</p>
      <div className="text-[14px] font-public-sans text-primary leading-[1.5]">{value}</div>
    </div>
  )
}

function ProductView({ product }: { product: any }) {
  const photos = product.photos ?? []
  const variants = product.variants ?? []
  const tiers = product.priceTiers ?? []
  const hasVariants = variants.length > 0
  const totalStock = variants.reduce((s: number, v: any) => s + v.stock, 0)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Photos & Videos */}
      <ViewSection title="Photos & Videos">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 rounded border border-dashed border-border-warm text-muted-text">
            <Package size={24} className="opacity-40" />
            <p className="text-[13px] font-public-sans">No photos or videos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {photos.map((m: any, i: number) => (
              <div key={m.id} className="relative aspect-square rounded overflow-hidden border border-border-warm bg-muted-bg">
                {m.mediaType === 'video' ? (
                  <>
                    <video src={m.url} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                        <Video size={14} className="text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] font-[600] font-public-sans bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                )}
              </div>
            ))}
          </div>
        )}
      </ViewSection>

      {/* Core Details */}
      <ViewSection title="Core Details">
        <ViewRow label="Categories" value={
          (product.categories ?? []).length > 0
            ? <div className="flex flex-wrap gap-1.5">{product.categories.map((c: string) => (
                <span key={c} className="inline-block px-2.5 py-1 rounded bg-primary text-white text-[12px] font-[500] font-public-sans">{c}</span>
              ))}</div>
            : '—'
        } />
        <ViewRow label="Description" value={<span className="whitespace-pre-wrap">{product.description}</span>} />
        <ViewRow label="Tags" value={
          (product.tags ?? []).length > 0
            ? <div className="flex flex-wrap gap-1.5">{product.tags.map((t: string) => (
                <span key={t} className="inline-block px-2 py-0.5 rounded border border-border-warm text-[12px] font-public-sans text-muted-text">{t}</span>
              ))}</div>
            : '—'
        } />
      </ViewSection>

      {/* Variants or flat pricing */}
      {hasVariants ? (
        <ViewSection title={`Variants (${variants.length})`}>
          <div className="rounded border border-border-warm overflow-hidden">
            <table className="w-full text-[13px] font-public-sans">
              <thead>
                <tr className="bg-muted-bg/40 border-b border-border-warm">
                  <th className="text-left py-2.5 px-3 font-[600] text-muted-text">Variant</th>
                  <th className="text-left py-2.5 px-3 font-[600] text-muted-text">SKU</th>
                  <th className="text-right py-2.5 px-3 font-[600] text-muted-text">Price (₹)</th>
                  <th className="text-center py-2.5 px-3 font-[600] text-muted-text">Stock</th>
                  <th className="text-center py-2.5 px-3 font-[600] text-muted-text">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {variants.map((v: any) => (
                  <tr key={v.id}>
                    <td className="py-2.5 px-3 text-primary font-[500]">
                      {(v.attributes ?? []).map((a: any) => a.value).join(' / ') || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-text">{v.sku}</td>
                    <td className="py-2.5 px-3 text-right text-primary tabular-nums">₹{Number(v.priceInr).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums">{v.stock}</td>
                    <td className="py-2.5 px-3 text-center text-muted-text">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] font-public-sans text-muted-text">Total stock across variants: {totalStock}</p>
        </ViewSection>
      ) : (
        <ViewSection title="Pricing & Wholesale Terms">
          {tiers.length > 0 ? (
            <div className="rounded border border-border-warm overflow-hidden">
              <table className="w-full text-[13px] font-public-sans">
                <thead>
                  <tr className="bg-muted-bg/40 border-b border-border-warm">
                    <th className="text-left py-2.5 px-3 font-[600] text-muted-text">Min Order Qty</th>
                    <th className="text-right py-2.5 px-3 font-[600] text-muted-text">Price per unit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {tiers.map((t: any) => (
                    <tr key={t.id}>
                      <td className="py-2 px-3 text-primary tabular-nums">{t.moq}</td>
                      <td className="py-2 px-3 text-right text-primary tabular-nums">₹{Number(t.priceInr).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ViewRow label="Wholesale Price" value={`₹${Number(product.wholesalePriceInr).toLocaleString('en-IN')} · MOQ ${product.moq}`} />
          )}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <ViewRow label="Order Step" value={`${product.stepQty ?? 1} unit${(product.stepQty ?? 1) !== 1 ? 's' : ''}`} />
            <ViewRow label="Lead Time" value={LEAD_TIME_LABELS[product.leadTime] ?? product.leadTime} />
          </div>
        </ViewSection>
      )}

      {hasVariants && (
        <ViewSection title="Order Terms">
          <div className="grid grid-cols-2 gap-4">
            <ViewRow label="Order Step" value={`${product.stepQty ?? 1} unit${(product.stepQty ?? 1) !== 1 ? 's' : ''}`} />
            <ViewRow label="Lead Time" value={LEAD_TIME_LABELS[product.leadTime] ?? product.leadTime} />
          </div>
        </ViewSection>
      )}

      {/* Product Attributes */}
      <ViewSection title="Product Attributes">
        <div className="grid grid-cols-2 gap-4">
          <ViewRow label="Material" value={product.material} />
          <ViewRow label="Dimensions" value={product.dimensions} />
          <ViewRow label="Place of Origin" value={product.placeOfOrigin} />
          <ViewRow label="Weight" value={product.weightGrams != null ? `${(product.weightGrams / 1000).toString().replace(/\.?0+$/, '')} kg` : undefined} />
        </div>
        <div className="flex gap-2 pt-1">
          {product.isHandmade && (
            <span className="inline-block px-2.5 py-1 rounded bg-primary/10 text-primary text-[12px] font-[500] font-public-sans">Handmade</span>
          )}
          {product.isGITagged && (
            <span className="inline-block px-2.5 py-1 rounded bg-primary/10 text-primary text-[12px] font-[500] font-public-sans">GI Tagged</span>
          )}
          {!product.isHandmade && !product.isGITagged && (
            <span className="text-[12px] font-public-sans text-muted-text">—</span>
          )}
        </div>
      </ViewSection>

      {/* How It's Made */}
      {(product.howItIsMade || product.artisanName) && (
        <ViewSection title="How It's Made">
          <ViewRow label="Craft Process" value={<span className="whitespace-pre-wrap">{product.howItIsMade}</span>} />
          <ViewRow label="Artisan Name" value={product.artisanName} />
        </ViewSection>
      )}

      {/* Availability */}
      <ViewSection title="Availability">
        <span className={`inline-flex items-center h-6 px-3 rounded text-[12px] font-[600] font-public-sans ${AVAILABILITY_STYLE[product.availability] ?? ''}`}>
          {product.availability === 'COMING_SOON' ? 'Coming Soon' : product.availability.charAt(0) + product.availability.slice(1).toLowerCase()}
        </span>
      </ViewSection>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: product, isLoading } = useAdminProduct(id)
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

  // ── Product form ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<ProductForm>({
    name: '', categories: [], description: '', stepQty: '1', leadTime: 'ONE_TO_TWO_WEEKS',
    weightKg: '', tags: '', availability: 'ACTIVE',
  })
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([{ id: uid(), moq: '', priceInr: '' }])
  const [attrs, setAttrs] = useState<ProductAttrs>({ material: '', dimensions: '', isHandmade: false, placeOfOrigin: '', isGITagged: false })
  const [craft, setCraft] = useState<CraftStory>({ howItIsMade: '', artisanName: '' })
  const [submitting, setSubmitting] = useState(false)

  // ── Variants (Size + Color, tab-style — mirrors the create form) ───────────
  const [variantsEnabled, setVariantsEnabled] = useState(false)
  const [activeVariantTab, setActiveVariantTab] = useState<'size' | 'color'>('size')
  const [sizeValues, setSizeValues] = useState<string[]>([])
  const [colorValues, setColorValues] = useState<string[]>([])
  const [sizeInput, setSizeInput] = useState('')
  const [colorInput, setColorInput] = useState('')
  const [variantPricing, setVariantPricing] = useState<Record<string, { stock: string; tiers: PriceTier[] }>>({})
  // Maps a combo key (e.g. "M__Red") to the existing variant it came from, so
  // Save can update in place instead of creating a duplicate.
  const [existingVariantByKey, setExistingVariantByKey] = useState<Record<string, { id: string; sku: string }>>({})

  // ── View / edit toggle ──────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false)

  // ── Prefill everything from the loaded product ─────────────────────────────
  function hydrateFromProduct(product: any) {
    setForm({
      name: product.name ?? '',
      categories: product.categories ?? [],
      description: product.description ?? '',
      stepQty: product.stepQty != null ? String(product.stepQty) : '1',
      leadTime: product.leadTime ?? 'ONE_TO_TWO_WEEKS',
      weightKg: product.weightGrams != null ? String(product.weightGrams / 1000) : '',
      tags: (product.tags ?? []).join(', '),
      availability: product.availability ?? 'ACTIVE',
    })

    const tiers = product.priceTiers ?? []
    setPriceTiers(
      tiers.length > 0
        ? tiers.map((t: any) => ({ id: uid(), moq: String(t.moq), priceInr: String(t.priceInr) }))
        : [{ id: uid(), moq: product.moq != null ? String(product.moq) : '', priceInr: product.wholesalePriceInr != null ? String(product.wholesalePriceInr) : '' }]
    )

    setAttrs({
      material: product.material ?? '',
      dimensions: product.dimensions ?? '',
      isHandmade: !!product.isHandmade,
      placeOfOrigin: product.placeOfOrigin ?? '',
      isGITagged: !!product.isGITagged,
    })

    setCraft({ howItIsMade: product.howItIsMade ?? '', artisanName: product.artisanName ?? '' })

    // Parse existing variants into the Size/Color tab model. Only variants whose
    // attributes are exactly "Size" and/or "Color" fit this UI — anything else
    // (e.g. custom attributes from a CSV import) is left alone and untouched.
    const variants = product.variants ?? []
    const sizes = new Set<string>()
    const colors = new Set<string>()
    const byKey: Record<string, { id: string; sku: string }> = {}
    const pricing: Record<string, { stock: string; tiers: PriceTier[] }> = {}

    for (const v of variants) {
      const sizeAttr = v.attributes?.find((a: any) => a.name.toLowerCase() === 'size')
      const colorAttr = v.attributes?.find((a: any) => a.name.toLowerCase() === 'color' || a.name.toLowerCase() === 'colour')
      const otherAttrs = (v.attributes ?? []).filter((a: any) => a !== sizeAttr && a !== colorAttr)
      if (otherAttrs.length > 0 || (!sizeAttr && !colorAttr)) continue

      const key = sizeAttr && colorAttr ? `${sizeAttr.value}__${colorAttr.value}` : (sizeAttr?.value ?? colorAttr?.value)
      if (!key) continue
      if (sizeAttr) sizes.add(sizeAttr.value)
      if (colorAttr) colors.add(colorAttr.value)
      byKey[key] = { id: v.id, sku: v.sku }
      pricing[key] = { stock: String(v.stock), tiers: [{ id: uid(), moq: product.moq != null ? String(product.moq) : '', priceInr: String(v.priceInr) }] }
    }

    setVariantsEnabled(Object.keys(byKey).length > 0)
    setSizeValues([...sizes])
    setColorValues([...colors])
    setExistingVariantByKey(byKey)
    setVariantPricing(pricing)
  }

  useEffect(() => {
    if (product) hydrateFromProduct(product)
  }, [product])

  function handleStartEdit() { setEditing(true) }
  function handleCancelEdit() {
    if (product) hydrateFromProduct(product)
    setEditing(false)
  }

  function addTier() { setPriceTiers((prev) => [...prev, { id: uid(), moq: '', priceInr: '' }]) }
  function removeTier(id: string) { if (priceTiers.length > 1) setPriceTiers((prev) => prev.filter((t) => t.id !== id)) }
  function updateTier(id: string, field: 'moq' | 'priceInr', value: string) {
    setPriceTiers((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t))
  }

  const setAttr = (key: keyof ProductAttrs) => (value: string | boolean) => setAttrs((a) => ({ ...a, [key]: value }))
  const setCraftField = (key: keyof CraftStory) => (value: string) => setCraft((c) => ({ ...c, [key]: value }))

  const [polishing, setPolishing] = useState<Partial<Record<PolishableField, boolean>>>({})
  const [prevValues, setPrevValues] = useState<Partial<Record<PolishableField, string>>>({})

  async function polishField(field: PolishableField) {
    const value = form[field]
    if (!value.trim()) return
    setPolishing((p) => ({ ...p, [field]: true }))
    try {
      const res = await api.post('/products/ai/polish', { field, value })
      setPrevValues((p) => ({ ...p, [field]: value }))
      setForm((f) => ({ ...f, [field]: res.data.data.cleaned }))
      toast.success('Content polished.')
    } catch {
      toast.error('AI polish failed — try again.')
    } finally {
      setPolishing((p) => ({ ...p, [field]: false }))
    }
  }

  function undoField(field: PolishableField) {
    const prev = prevValues[field]
    if (!prev) return
    setForm((f) => ({ ...f, [field]: prev }))
    setPrevValues((p) => { const n = { ...p }; delete n[field]; return n })
  }

  const set = (key: keyof ProductForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  function toggleCategory(cat: string) {
    setForm((f) => {
      const has = f.categories.includes(cat)
      if (has) return { ...f, categories: f.categories.filter((c) => c !== cat) }
      if (f.categories.length >= 2) { toast.error('Max 2 categories allowed.'); return f }
      return { ...f, categories: [...f.categories, cat] }
    })
  }

  function getVP(key: string) {
    return variantPricing[key] ?? { stock: '0', tiers: [{ id: `t-${key}`, moq: '', priceInr: '' }] }
  }
  function setVPStock(key: string, stock: string) { setVariantPricing((p) => ({ ...p, [key]: { ...getVP(key), stock } })) }
  function addVPTier(key: string) {
    const vp = getVP(key)
    setVariantPricing((p) => ({ ...p, [key]: { ...vp, tiers: [...vp.tiers, { id: uid(), moq: '', priceInr: '' }] } }))
  }
  function removeVPTier(key: string, tierId: string) {
    const vp = getVP(key)
    if (vp.tiers.length === 1) return
    setVariantPricing((p) => ({ ...p, [key]: { ...vp, tiers: vp.tiers.filter((t) => t.id !== tierId) } }))
  }
  function updateVPTier(key: string, tierId: string, field: 'moq' | 'priceInr', value: string) {
    const vp = getVP(key)
    setVariantPricing((p) => ({ ...p, [key]: { ...vp, tiers: vp.tiers.map((t) => t.id === tierId ? { ...t, [field]: value } : t) } }))
  }

  function addTag(list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) {
    const v = input.trim()
    if (!v || list.includes(v)) return
    setList([...list, v])
    setInput('')
  }

  function toggleVariantsMaster() {
    if (variantsEnabled) {
      setSizeValues([]); setColorValues([])
      setActiveVariantTab('size')
      setVariantPricing({})
    }
    setVariantsEnabled((v) => !v)
  }

  const variantCombos = useMemo(() => {
    if (!sizeValues.length && !colorValues.length) return []
    if (sizeValues.length && colorValues.length) {
      return cartesian([sizeValues, colorValues]).map(([s, c]: string[]) => ({
        key: `${s}__${c}`, label: `${s} / ${c}`,
        attributes: [{ name: 'Size', value: s }, { name: 'Color', value: c }],
      }))
    }
    if (sizeValues.length) return sizeValues.map((s) => ({ key: s, label: s, attributes: [{ name: 'Size', value: s }] }))
    return colorValues.map((c) => ({ key: c, label: c, attributes: [{ name: 'Color', value: c }] }))
  }, [sizeValues, colorValues])

  // ── Score ──────────────────────────────────────────────────────────────────
  // When variants are on, the flat price-tier table above is hidden — score
  // the listing on each variant's cheapest valid tier instead, so "price set"
  // reflects what the brand actually filled in rather than an untouched field.
  const scoreTiers = useMemo(() => {
    if (!variantsEnabled) return priceTiers
    return variantCombos.map((combo) => {
      const vp = getVP(combo.key)
      return vp.tiers.find((t) => Number(t.moq) > 0 && Number(t.priceInr) > 0) ?? { id: combo.key, moq: '', priceInr: '' }
    })
  }, [variantsEnabled, priceTiers, variantCombos, variantPricing])

  const { score, maxScore, rules } = useMemo(
    () => calcListingScore(form, scoreTiers, product?.photos ?? [], attrs, craft),
    [form, scoreTiers, product, attrs, craft],
  )
  const canPublish = score >= MIN_SCORE_TO_PUBLISH

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return

    if (!form.name.trim())        { toast.error('Product name is required.'); return }
    if (!form.categories.length)  { toast.error('Select at least one category.'); return }
    if (!form.description.trim()) { toast.error('Description is required.'); return }
    if (!form.weightKg || Number(form.weightKg) <= 0) { toast.error('Weight must be a positive number.'); return }

    if (variantsEnabled && variantCombos.length === 0) {
      toast.error('Add at least one size or color value, or turn off variants.')
      return
    }

    // Pricing comes from the flat tier table when there are no variants, or
    // from each variant's own MOQ/price tiers when variants are enabled — the
    // flat table is hidden in that case, so it must not be required too.
    let sortedTiers: PriceTier[] = []
    let basePriceInr: number
    let baseMoq: number

    if (variantsEnabled) {
      const uncosted = variantCombos.find((combo) => {
        const vp = getVP(combo.key)
        return !vp.tiers.some((t) => Number(t.moq) > 0 && Number(t.priceInr) > 0)
      })
      if (uncosted) { toast.error(`Set a price and MOQ for "${uncosted.label}".`); return }

      const cheapestPerCombo = variantCombos.map((combo) => {
        const vp = getVP(combo.key)
        return [...vp.tiers]
          .filter((t) => Number(t.moq) > 0 && Number(t.priceInr) > 0)
          .sort((a, b) => Number(a.priceInr) - Number(b.priceInr))[0]
      })
      const cheapest = cheapestPerCombo.reduce((min, t) => (!min || Number(t.priceInr) < Number(min.priceInr) ? t : min))
      basePriceInr = Number(cheapest.priceInr)
      baseMoq = Number(cheapest.moq)
    } else {
      const validTiers = priceTiers.filter((t) => t.moq && t.priceInr && Number(t.moq) > 0 && Number(t.priceInr) > 0)
      if (!validTiers.length) { toast.error('Add at least one price tier with MOQ and price.'); return }
      sortedTiers = [...validTiers].sort((a, b) => Number(a.moq) - Number(b.moq))
      basePriceInr = Number(sortedTiers[0].priceInr)
      baseMoq = Number(sortedTiers[0].moq)
    }

    if (form.availability === 'ACTIVE' && !canPublish) {
      toast.error(`Score is ${score}/${maxScore}. Need at least ${MIN_SCORE_TO_PUBLISH} to publish as Active. Save as Inactive or improve your listing.`)
      return
    }

    setSubmitting(true)
    try {
      // 1 — Update the product record
      await api.patch(`/admin/products/${product.id}`, {
        name:              form.name.trim(),
        categories:        form.categories,
        description:       form.description.trim(),
        wholesalePriceInr: basePriceInr,
        moq:               baseMoq,
        stepQty:           Number(form.stepQty) || 1,
        leadTime:          form.leadTime,
        weightGrams:       Math.round(Number(form.weightKg) * 1000),
        tags:              form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        availability:      form.availability,
        ...(!variantsEnabled && { priceTiers: sortedTiers.map((t) => ({ moq: Number(t.moq), priceInr: Number(t.priceInr) })) }),
        material:          attrs.material.trim() || undefined,
        dimensions:        attrs.dimensions.trim() || undefined,
        isHandmade:        attrs.isHandmade,
        placeOfOrigin:     attrs.placeOfOrigin.trim() || undefined,
        isGITagged:        attrs.isGITagged,
        howItIsMade:       craft.howItIsMade.trim() || undefined,
        artisanName:       craft.artisanName.trim() || undefined,
      })

      // 2 — Reconcile Size/Color variants: update existing, create new combos,
      // remove combos the admin took away — applied as a single atomic
      // request so a mid-way failure can't leave the product with only some
      // of the variant changes applied.
      const remainingKeys = new Set(Object.keys(existingVariantByKey))
      const updates: any[] = []
      const creates: any[] = []

      if (variantsEnabled) {
        const namePrefix = form.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toUpperCase().slice(0, 12) || 'PROD'

        for (const combo of variantCombos) {
          const vp = getVP(combo.key)
          // Only tiers with both a MOQ and a price are valid — an unfilled
          // default tier can sort ahead of a valid one by MOQ (blank = 0),
          // so filter before picking the cheapest instead of after.
          const sortedVpTiers = vp.tiers
            .filter((t) => Number(t.moq) > 0 && Number(t.priceInr) > 0)
            .sort((a, b) => Number(a.moq) - Number(b.moq))
          const priceInr = Number(sortedVpTiers[0]?.priceInr) || 0
          const stock = Number(vp.stock) || 0
          const existing = existingVariantByKey[combo.key]

          if (existing) {
            remainingKeys.delete(combo.key)
            updates.push({ id: existing.id, priceInr, stock, attributes: combo.attributes })
          } else {
            const autoSku = `${namePrefix}-${combo.key.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`
            creates.push({ sku: autoSku, priceInr, stock, status: 'ACTIVE', attributes: combo.attributes })
          }
        }
      } else {
        // Variants turned off entirely — remove every Size/Color variant.
        Object.keys(existingVariantByKey).forEach((k) => remainingKeys.add(k))
      }

      const deleteIds = [...remainingKeys]
        .map((key) => existingVariantByKey[key]?.id)
        .filter((id): id is string => !!id)

      if (updates.length > 0 || creates.length > 0 || deleteIds.length > 0) {
        try {
          await api.put(`/admin/products/${product.id}/variants/reconcile`, { updates, creates, deleteIds })
        } catch (err) {
          toast.error(`Could not save variant changes: ${getApiError(err)}`)
          return
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-product', product.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })

      toast.success('Product updated.')
      setEditing(false)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !product) {
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/admin/products')}
            className="inline-flex items-center justify-center w-8 h-8 rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
            aria-label="Back to products">
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
              {editing ? 'Edit Product' : product.name}
            </h1>
            <p className="text-[13px] font-public-sans text-muted-text mt-0.5 flex items-center gap-1.5">
              Sold by{' '}
              <Link href={`/admin/brands/${product.brandProfile.id}`} className="text-accent hover:underline inline-flex items-center gap-1">
                {product.brandProfile.brandName}
                <ExternalLink size={11} />
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-4 text-[12px] font-public-sans text-muted-text">
            <span>{product._count?.orderItems ?? 0} orders</span>
            <span>{product.viewCount ?? 0} views</span>
          </div>
          {!editing && (
            <Button type="button" variant="ghost" size="sm" onClick={handleStartEdit}>
              <Pencil size={13} className="mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {!editing ? (
        <ProductView product={product} />
      ) : (
      <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
      <div className="space-y-6">

        {/* ── Photos & Videos ──────────────────────────────────────────────── */}
        <MediaSection productId={product.id} initialMedia={product.photos ?? []} />

        {/* ── Core details ────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Core Details
          </h2>

          <Field label="Product Name" required hint="Max 80 characters"
            action={<PolishButton loading={!!polishing.name} canUndo={!!prevValues.name} onPolish={() => polishField('name')} onUndo={() => undoField('name')} />}>
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

          <Field label="Description" required
            action={<PolishButton loading={!!polishing.description} canUndo={!!prevValues.description} onPolish={() => polishField('description')} onUndo={() => undoField('description')} />}>
            <textarea value={form.description} onChange={(e) => set('description')(e.target.value)}
              placeholder="Describe the product — materials, craftsmanship, dimensions, care instructions…" rows={5}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors resize-none" />
          </Field>

          <Field label="Tags" hint="Comma-separated, up to 10"
            action={<PolishButton loading={!!polishing.tags} canUndo={!!prevValues.tags} onPolish={() => polishField('tags')} onUndo={() => undoField('tags')} />}>
            <TextInput value={form.tags} onChange={set('tags')} placeholder="handmade, cotton, block print" />
          </Field>
        </div>

        {/* ── Variants ────────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-[600] font-public-sans text-primary">Variants</h2>
              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">Does this product come in different sizes or colors?</p>
            </div>
            <button type="button" role="switch" aria-checked={variantsEnabled}
              onClick={toggleVariantsMaster}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${variantsEnabled ? 'bg-primary' : 'bg-border-warm'}`}>
              <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${variantsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {variantsEnabled && (
            <div className="space-y-4 pt-4 border-t border-border-warm">

              <div className="flex gap-2">
                <button type="button" onClick={() => setActiveVariantTab('size')}
                  className={`flex items-center gap-2 px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                    activeVariantTab === 'size' ? 'border-primary bg-primary text-white' : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  }`}>
                  Size
                  {sizeValues.length > 0 && (
                    <span className={`text-[11px] font-[600] px-1.5 py-0.5 rounded-full ${activeVariantTab === 'size' ? 'bg-white/20' : 'bg-muted-bg'}`}>{sizeValues.length}</span>
                  )}
                </button>
                <button type="button" onClick={() => setActiveVariantTab('color')}
                  className={`flex items-center gap-2 px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                    activeVariantTab === 'color' ? 'border-primary bg-primary text-white' : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  }`}>
                  Color
                  {colorValues.length > 0 && (
                    <span className={`text-[11px] font-[600] px-1.5 py-0.5 rounded-full ${activeVariantTab === 'color' ? 'bg-white/20' : 'bg-muted-bg'}`}>{colorValues.length}</span>
                  )}
                </button>
              </div>

              {activeVariantTab === 'size' && (
                <div className="space-y-2">
                  <p className="text-[12px] font-public-sans text-muted-text">e.g. S, M, L, XL, Free Size — press Enter or click + to add</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {sizeValues.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary">
                        {v}
                        <button type="button" onClick={() => setSizeValues((prev) => prev.filter((x) => x !== v))}
                          className="text-muted-text hover:text-error transition-colors" aria-label={`Remove ${v}`}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input type="text" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(sizeValues, setSizeValues, sizeInput, setSizeInput) } }}
                        placeholder="Add size…"
                        className="h-8 px-2 w-28 rounded border border-dashed border-border-warm bg-transparent text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                      <button type="button" onClick={() => addTag(sizeValues, setSizeValues, sizeInput, setSizeInput)}
                        className="h-8 w-8 flex items-center justify-center rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeVariantTab === 'color' && (
                <div className="space-y-2">
                  <p className="text-[12px] font-public-sans text-muted-text">e.g. Red, Navy Blue, Ivory — press Enter or click + to add</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {colorValues.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary">
                        {v}
                        <button type="button" onClick={() => setColorValues((prev) => prev.filter((x) => x !== v))}
                          className="text-muted-text hover:text-error transition-colors" aria-label={`Remove ${v}`}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input type="text" value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(colorValues, setColorValues, colorInput, setColorInput) } }}
                        placeholder="Add color…"
                        className="h-8 px-2 w-28 rounded border border-dashed border-border-warm bg-transparent text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                      <button type="button" onClick={() => addTag(colorValues, setColorValues, colorInput, setColorInput)}
                        className="h-8 w-8 flex items-center justify-center rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {variantCombos.length > 0 && (
                <div className="space-y-4 pt-1">
                  <p className="text-[12px] font-public-sans text-muted-text">Set MOQ tiers and stock for each variant.</p>
                  {variantCombos.map((combo) => {
                    const vp = getVP(combo.key)
                    const isNew = !existingVariantByKey[combo.key]
                    return (
                      <div key={combo.key} className="rounded border border-border-warm overflow-hidden">
                        <div className="flex items-center justify-between bg-muted-bg/40 px-3 py-2 border-b border-border-warm">
                          <span className="text-[13px] font-[600] font-public-sans text-primary flex items-center gap-1.5">
                            {combo.label}
                            {isNew && <span className="text-[10px] font-[600] px-1.5 py-0.5 rounded bg-accent/10 text-accent">New</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-public-sans text-muted-text">Stock</span>
                            <input type="number" value={vp.stock} min="0"
                              onChange={(e) => setVPStock(combo.key, e.target.value)}
                              className="w-20 h-7 px-2 rounded border border-border-warm bg-surface text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors" />
                          </div>
                        </div>
                        <table className="w-full text-[13px] font-public-sans">
                          <thead>
                            <tr className="border-b border-border-warm">
                              <th className="text-left py-2 px-3 font-[600] text-muted-text">Min Order Qty</th>
                              <th className="text-left py-2 px-3 font-[600] text-muted-text">Price per unit (₹)</th>
                              <th className="py-2 px-2 w-8" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-warm">
                            {vp.tiers.map((tier) => (
                              <tr key={tier.id}>
                                <td className="px-3 py-1.5">
                                  <input type="number" value={tier.moq} min="1"
                                    onChange={(e) => updateVPTier(combo.key, tier.id, 'moq', e.target.value)}
                                    placeholder="e.g. 10"
                                    className="w-full h-8 px-2 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                                </td>
                                <td className="px-3 py-1.5">
                                  <input type="number" value={tier.priceInr} min="1"
                                    onChange={(e) => updateVPTier(combo.key, tier.id, 'priceInr', e.target.value)}
                                    placeholder="e.g. 1200"
                                    className="w-full h-8 px-2 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  <button type="button" onClick={() => removeVPTier(combo.key, tier.id)} disabled={vp.tiers.length === 1}
                                    className="text-muted-text hover:text-error disabled:opacity-30 transition-colors" aria-label="Remove tier">
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-3 py-2 border-t border-border-warm">
                          <button type="button" onClick={() => addVPTier(combo.key)}
                            className="flex items-center gap-1 text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors">
                            <Plus size={12} />Add tier
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pricing & wholesale ──────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <div className="pb-3 border-b border-border-warm">
            <h2 className="text-[16px] font-[600] font-public-sans text-primary">Pricing &amp; Wholesale Terms</h2>
            <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
              {variantsEnabled
                ? 'Per-variant pricing is set above. Configure order step and lead time here.'
                : 'Volume tiers — buyers who order more see a lower per-unit price'}
            </p>
          </div>

          {!variantsEnabled && (
            <>
              <div className="rounded border border-border-warm overflow-hidden">
                <table className="w-full text-[13px] font-public-sans">
                  <thead>
                    <tr className="bg-muted-bg/40 border-b border-border-warm">
                      <th className="text-left py-2.5 px-3 font-[600] text-muted-text">Min Order Qty</th>
                      <th className="text-left py-2.5 px-3 font-[600] text-muted-text">Price per unit (₹)</th>
                      <th className="py-2.5 px-2 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-warm">
                    {priceTiers.map((tier, i) => (
                      <tr key={tier.id}>
                        <td className="px-3 py-2">
                          <input type="number" value={tier.moq} min="1"
                            onChange={(e) => updateTier(tier.id, 'moq', e.target.value)}
                            placeholder={i === 0 ? 'e.g. 10' : 'e.g. 50'}
                            className="w-full h-9 px-2 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={tier.priceInr} min="1"
                            onChange={(e) => updateTier(tier.id, 'priceInr', e.target.value)}
                            placeholder="e.g. 1200"
                            className="w-full h-9 px-2 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button type="button" onClick={() => removeTier(tier.id)} disabled={priceTiers.length === 1}
                            className="text-muted-text hover:text-error disabled:opacity-30 transition-colors" aria-label="Remove tier">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addTier}
                className="flex items-center gap-1.5 text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors">
                <Plus size={13} />Add tier
              </button>
            </>
          )}

          <div className={`grid grid-cols-2 gap-4 ${!variantsEnabled ? 'pt-2 border-t border-border-warm' : ''}`}>
            <Field label="Order Step (units)" hint="Buyers order in multiples of this">
              <TextInput value={form.stepQty} onChange={set('stepQty')} type="number" placeholder="e.g. 1" />
            </Field>
            <Field label="Lead Time">
              <select value={form.leadTime} onChange={(e) => set('leadTime')(e.target.value)}
                className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none">
                {LEAD_TIMES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Product Attributes ────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Product Attributes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Material" hint="e.g. 100% cotton, brass, terracotta">
              <TextInput value={attrs.material} onChange={(v) => setAttr('material')(v)} placeholder="e.g. Handwoven cotton" />
            </Field>
            <Field label="Dimensions" hint="e.g. 30×20×10 cm or 5.5 ft">
              <TextInput value={attrs.dimensions} onChange={(v) => setAttr('dimensions')(v)} placeholder="e.g. 45 × 35 cm" />
            </Field>
            <Field label="Place of Origin" hint="State or region">
              <TextInput value={attrs.placeOfOrigin} onChange={(v) => setAttr('placeOfOrigin')(v)} placeholder="e.g. Jaipur, Rajasthan" />
            </Field>
            <Field label="Weight per unit (kg)" required hint="e.g. 0.5 for 500 g">
              <TextInput value={form.weightKg} onChange={set('weightKg')} type="number" placeholder="e.g. 0.5" />
            </Field>
          </div>
          <div className="flex flex-col gap-4 pt-1">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-[14px] font-[500] font-public-sans text-primary">Handmade</p>
                <p className="text-[12px] font-public-sans text-muted-text">Crafted by hand, not machine-made</p>
              </div>
              <button type="button" role="switch" aria-checked={attrs.isHandmade}
                onClick={() => setAttr('isHandmade')(!attrs.isHandmade)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${attrs.isHandmade ? 'bg-primary' : 'bg-border-warm'}`}>
                <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${attrs.isHandmade ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-[14px] font-[500] font-public-sans text-primary">GI Tagged</p>
                <p className="text-[12px] font-public-sans text-muted-text">Has a Geographical Indication tag</p>
              </div>
              <button type="button" role="switch" aria-checked={attrs.isGITagged}
                onClick={() => setAttr('isGITagged')(!attrs.isGITagged)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${attrs.isGITagged ? 'bg-primary' : 'bg-border-warm'}`}>
                <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${attrs.isGITagged ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>

        {/* ── How It's Made ─────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            How It&apos;s Made
          </h2>
          <Field label="Craft Process" hint="Describe the making process — materials, techniques, time taken. Aim for 20+ words.">
            <textarea value={craft.howItIsMade} onChange={(e) => setCraftField('howItIsMade')(e.target.value)}
              placeholder="e.g. This saree is hand-woven on a traditional pit loom using organic cotton yarn. The block printing uses natural indigo dyes prepared from locally-sourced plants…"
              rows={4}
              className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors resize-none" />
            <p className="text-[11px] font-public-sans text-muted-text">
              {craft.howItIsMade.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </Field>
          <Field label="Artisan Name" hint="Name of the maker or lead artisan">
            <TextInput value={craft.artisanName} onChange={setCraftField('artisanName')} placeholder="e.g. Ramesh Kumar" />
          </Field>
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
          {form.availability === 'ACTIVE' && !canPublish && (
            <div className="flex items-start gap-2 p-3 rounded bg-error/5 border border-error/20">
              <AlertCircle size={14} className="text-error flex-shrink-0 mt-0.5" />
              <p className="text-[13px] font-public-sans text-error">
                Listing score ({score}/{maxScore}) is below {MIN_SCORE_TO_PUBLISH}. Improve your listing or save as <strong>Inactive</strong> for now.
              </p>
            </div>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2 pb-10">
          {form.availability === 'ACTIVE' && !canPublish ? (
            <div className="relative group">
              <Button type="button" variant="primary" size="md" disabled>
                Save Changes
              </Button>
              <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-64 rounded border border-border-warm bg-surface shadow-md px-3 py-2
                opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                <p className="text-[12px] font-[500] font-public-sans text-primary leading-[1.5]">
                  Your listing score is {score}/{maxScore}. Fill in more details to reach {MIN_SCORE_TO_PUBLISH} and publish as Active.
                </p>
              </div>
            </div>
          ) : (
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </Button>
          )}
          <Button type="button" variant="ghost" size="md" onClick={handleCancelEdit} disabled={submitting}>
            Cancel
          </Button>
        </div>

      </div>{/* end left column */}

      <div className="xl:sticky xl:top-24 xl:self-start">
        <ScoreWidget score={score} maxScore={maxScore} rules={rules} canPublish={canPublish} />
      </div>

      </div>{/* end grid */}
      </form>
      )}
    </div>
  )
}
