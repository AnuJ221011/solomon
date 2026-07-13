'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Plus, Loader2, Trash2, Check, Search, Sparkles, RotateCcw, Video, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { useCategories } from '@/hooks/queries/useCategories'

const LEAD_TIMES: { label: string; value: string }[] = [
  { label: '1–3 days',   value: 'ONE_TO_THREE_DAYS' },
  { label: '1–2 weeks',  value: 'ONE_TO_TWO_WEEKS' },
  { label: '2–4 weeks',  value: 'TWO_TO_FOUR_WEEKS' },
]

const ALL_SHIPPING_ZONES = [
  'DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST',
  'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD',
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

interface MediaFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video'
}

interface ProductAttrs {
  material: string
  lengthCm: string
  breadthCm: string
  heightCm: string
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
  media: MediaFile[],
  attrs: ProductAttrs,
  craft: CraftStory,
): { score: number; maxScore: number; rules: ScoreRule[] } {
  const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length
  const imageCount = media.filter((m) => m.type === 'image').length
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

import type { Category } from '@/hooks/queries/useCategories'

function CategoryPicker({
  categories,
  selected,
  onToggle,
}: {
  categories: Category[]
  selected: string[]
  onToggle: (name: string) => void
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
            className="w-full h-10 pl-9 pr-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors"
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
              {filtered.length === 0 && trimmed && (
                <p className="px-3 py-2.5 text-[13px] font-public-sans text-muted-text">
                  No matching category — select &quot;Other&quot; below if nothing fits.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Persistent "Other" quick-pick — always available, doesn't require search */}
      {canAdd && !selected.includes('Other') && (
        <button
          type="button"
          onClick={() => onToggle('Other')}
          className="flex items-center gap-1.5 px-3 py-2 rounded border border-dashed border-border-warm text-[13px] font-[500] font-public-sans text-muted-text hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={13} />
          Other <span className="font-[400] text-muted-text/70">(if nothing above matches)</span>
        </button>
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

  // ── Product form ───────────────────────────────────────────────────────────
  const [form, setForm] = useState<ProductForm>({
    name: '', categories: [], description: '',
    stepQty: '1', leadTime: 'ONE_TO_TWO_WEEKS',
    weightKg: '', tags: '', availability: 'ACTIVE',
  })
  const [media, setMedia]       = useState<MediaFile[]>([])
  const imageCount = media.filter((m) => m.type === 'image').length
  const videoCount = media.filter((m) => m.type === 'video').length
  const [submitting, setSubmitting] = useState(false)

  // ── Price tiers ────────────────────────────────────────────────────────────
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([
    { id: uid(), moq: '', priceInr: '' },
  ])

  function addTier() {
    setPriceTiers((prev) => [...prev, { id: uid(), moq: '', priceInr: '' }])
  }
  function removeTier(id: string) {
    if (priceTiers.length === 1) return
    setPriceTiers((prev) => prev.filter((t) => t.id !== id))
  }
  function updateTier(id: string, field: 'moq' | 'priceInr', value: string) {
    setPriceTiers((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t))
  }

  // ── Product attributes ─────────────────────────────────────────────────────
  const [attrs, setAttrs] = useState<ProductAttrs>({
    material: '', lengthCm: '', breadthCm: '', heightCm: '', isHandmade: false, placeOfOrigin: '', isGITagged: false,
  })
  const setAttr = (key: keyof ProductAttrs) => (value: string | boolean) =>
    setAttrs((a) => ({ ...a, [key]: value }))

  // ── Craft story ────────────────────────────────────────────────────────────
  const [craft, setCraft] = useState<CraftStory>({ howItIsMade: '', artisanName: '' })
  const setCraftField = (key: keyof CraftStory) => (value: string) =>
    setCraft((c) => ({ ...c, [key]: value }))

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

  // ── Variants (Size / Color / Material / Other, tab-style) ─────────────────
  const [variantsEnabled, setVariantsEnabled]       = useState(false)
  const [activeVariantTab, setActiveVariantTab]     = useState<'size' | 'color' | 'material' | 'other'>('size')
  const [sizeValues, setSizeValues]                 = useState<string[]>([])
  const [colorValues, setColorValues]               = useState<string[]>([])
  const [materialValues, setMaterialValues]         = useState<string[]>([])
  const [customAxisName, setCustomAxisName]         = useState('')
  const [customValues, setCustomValues]             = useState<string[]>([])
  const [sizeInput, setSizeInput]                   = useState('')
  const [colorInput, setColorInput]                 = useState('')
  const [materialInput, setMaterialInput]           = useState('')
  const [customInput, setCustomInput]               = useState('')
  // per-variant: each combo key → { stock, tiers[] }
  const [variantPricing, setVariantPricing] = useState<Record<string, { stock: string; tiers: PriceTier[] }>>({})

  function getVP(key: string) {
    return variantPricing[key] ?? { stock: '0', tiers: [{ id: `t-${key}`, moq: '', priceInr: '' }] }
  }
  function setVPStock(key: string, stock: string) {
    setVariantPricing((p) => ({ ...p, [key]: { ...getVP(key), stock } }))
  }
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
      setSizeValues([]); setColorValues([]); setMaterialValues([]); setCustomValues([]); setCustomAxisName('')
      setActiveVariantTab('size')
      setVariantPricing({})
    }
    setVariantsEnabled((v) => !v)
  }

  // Up to 4 axes can combine at once — any axis with no values is left out
  // of the cartesian product entirely (matches the old Size/Color behavior,
  // just generalized to N axes instead of hardcoded to 2).
  const variantCombos = useMemo(() => {
    const axes = [
      { name: 'Size', values: sizeValues },
      { name: 'Color', values: colorValues },
      { name: 'Material', values: materialValues },
      { name: customAxisName.trim() || 'Other', values: customValues },
    ].filter((a) => a.values.length > 0)

    if (axes.length === 0) return []

    return cartesian(axes.map((a) => a.values)).map((combo) => ({
      key: combo.join('__'),
      label: combo.join(' / '),
      attributes: axes.map((a, i) => ({ name: a.name, value: combo[i] })),
    }))
  }, [sizeValues, colorValues, materialValues, customValues, customAxisName])

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
    () => calcListingScore(form, scoreTiers, media, attrs, craft),
    [form, scoreTiers, media, attrs, craft],
  )
  const canPublish = score >= MIN_SCORE_TO_PUBLISH

  // ── Media (photos + videos) ────────────────────────────────────────────────
  const handleFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const accepted = Array.from(incoming).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (!accepted.length) return
    setMedia((prev) => [
      ...prev,
      ...accepted.map((f) => ({
        id: uid(),
        file: f,
        preview: URL.createObjectURL(f),
        type: (f.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
      })),
    ].slice(0, MAX_MEDIA))
  }, [])

  function removeMedia(id: string) {
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((m) => m.id !== id)
    })
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
      // 1 — Create product
      const res = await api.post('/products', {
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
        enabledZones:      ALL_SHIPPING_ZONES,
        ...(!variantsEnabled && { priceTiers: sortedTiers.map((t) => ({ moq: Number(t.moq), priceInr: Number(t.priceInr) })) }),
        // Attributes
        material:          attrs.material.trim() || undefined,
        lengthCm:          attrs.lengthCm ? Number(attrs.lengthCm) : undefined,
        breadthCm:         attrs.breadthCm ? Number(attrs.breadthCm) : undefined,
        heightCm:          attrs.heightCm ? Number(attrs.heightCm) : undefined,
        isHandmade:        attrs.isHandmade,
        placeOfOrigin:     attrs.placeOfOrigin.trim() || undefined,
        isGITagged:        attrs.isGITagged,
        // Craft story
        howItIsMade:       craft.howItIsMade.trim() || undefined,
        artisanName:       craft.artisanName.trim() || undefined,
      })

      const productId: string = res.data.data?.id

      // 2 — Upload photos/videos
      if (media.length > 0 && productId) {
        const fd = new FormData()
        media.forEach((m) => fd.append('photos', m.file))
        await api.post(`/photos/product/${productId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      // 3 — Bulk-create variants with per-variant pricing
      if (variantCombos.length > 0 && productId) {
        const namePrefix = form.name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toUpperCase().slice(0, 12) || 'PROD'
        await api.post(`/products/${productId}/variants/bulk`, {
          variants: variantCombos.map((combo) => {
            const vp = getVP(combo.key)
            const autoSku = `${namePrefix}-${combo.key.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`
            // Only tiers with both a MOQ and a price are valid — an unfilled
            // default tier can sort ahead of a valid one by MOQ (blank = 0),
            // so filter before picking the cheapest instead of after.
            const sortedVpTiers = vp.tiers
              .filter((t) => Number(t.moq) > 0 && Number(t.priceInr) > 0)
              .sort((a, b) => Number(a.moq) - Number(b.moq))
            return {
              sku:        autoSku,
              priceInr:   Number(sortedVpTiers[0]?.priceInr) || 0,
              moq:        Number(sortedVpTiers[0]?.moq) || 1,
              stock:      Number(vp.stock) || 0,
              status:     'ACTIVE',
              attributes: combo.attributes,
              priceTiers: sortedVpTiers
                .filter((t) => t.moq && t.priceInr)
                .map((t) => ({ moq: Number(t.moq), priceInr: Number(t.priceInr) })),
            }
          }),
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

      <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 items-start">
      <div className="space-y-6">

        {/* ── Photos & Videos ──────────────────────────────────────────────── */}
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
              <Upload size={18} className="text-muted-text" />
            </div>
            <p className="text-[14px] font-[500] font-public-sans text-primary">Click or drag photos / videos here</p>
            <p className="text-[12px] font-public-sans text-muted-text">Up to {MAX_MEDIA} · JPG, PNG, WebP, MP4, MOV · Images max 8 MB · Videos max 100 MB</p>
          </div>
          {media.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {media.map((m, i) => (
                <div key={m.id} className="relative group aspect-square rounded overflow-hidden border border-border-warm bg-muted-bg">
                  {m.type === 'video' ? (
                    <>
                      <video src={m.preview} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                          <Video size={14} className="text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img src={m.preview} alt="" className="w-full h-full object-cover" />
                  )}
                  <button type="button" onClick={() => removeMedia(m.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove">
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] font-[600] font-public-sans bg-black/60 text-white px-1.5 py-0.5 rounded">Cover</span>
                  )}
                </div>
              ))}
              {media.length < MAX_MEDIA && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded border-2 border-dashed border-border-warm flex items-center justify-center text-muted-text hover:border-accent hover:text-accent transition-colors">
                  <Upload size={16} />
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] font-public-sans text-muted-text">
            {media.length}/{MAX_MEDIA} selected
            {videoCount > 0 && <span className="ml-2 text-muted-text">({imageCount} image{imageCount !== 1 ? 's' : ''}, {videoCount} video{videoCount !== 1 ? 's' : ''})</span>}
          </p>
        </div>

        {/* ── Core details ────────────────────────────────────────────────── */}
        <div className="bg-surface border border-border-warm rounded p-6 space-y-5">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary pb-3 border-b border-border-warm">
            Core Details
          </h2>

          <Field label="Product Name" required hint="Max 80 characters"
            action={<PolishButton loading={!!polishing.name} canUndo={!!prevValues.name} onPolish={() => polishField('name')} onUndo={() => undoField('name')} />}>
            <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Hand-Block Printed Cotton Saree" maxLength={80} />
          </Field>

          <Field label="Category" required hint="Select up to 2. Choose &quot;Other&quot; if nothing matches.">
            {catsLoading ? (
              <div className="flex items-center gap-2 text-[13px] font-public-sans text-muted-text">
                <Loader2 size={14} className="animate-spin" />Loading categories…
              </div>
            ) : (
              <CategoryPicker
                categories={categoryList}
                selected={form.categories}
                onToggle={toggleCategory}
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

          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-[600] font-public-sans text-primary">Variants</h2>
              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">Does this product come in different sizes, colors, materials, or other options?</p>
            </div>
            <button type="button" role="switch" aria-checked={variantsEnabled}
              onClick={toggleVariantsMaster}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${variantsEnabled ? 'bg-primary' : 'bg-border-warm'}`}>
              <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${variantsEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {variantsEnabled && (
            <div className="space-y-4 pt-4 border-t border-border-warm">

              {/* Size / Color / Material / Other tab buttons */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setActiveVariantTab('size')}
                  className={`flex items-center gap-2 px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                    activeVariantTab === 'size'
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  }`}>
                  Size
                  {sizeValues.length > 0 && (
                    <span className={`text-[11px] font-[600] px-1.5 py-0.5 rounded-full ${activeVariantTab === 'size' ? 'bg-white/20' : 'bg-muted-bg'}`}>
                      {sizeValues.length}
                    </span>
                  )}
                </button>
                <button type="button" onClick={() => setActiveVariantTab('color')}
                  className={`flex items-center gap-2 px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                    activeVariantTab === 'color'
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  }`}>
                  Color
                  {colorValues.length > 0 && (
                    <span className={`text-[11px] font-[600] px-1.5 py-0.5 rounded-full ${activeVariantTab === 'color' ? 'bg-white/20' : 'bg-muted-bg'}`}>
                      {colorValues.length}
                    </span>
                  )}
                </button>
                <button type="button" onClick={() => setActiveVariantTab('material')}
                  className={`flex items-center gap-2 px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                    activeVariantTab === 'material'
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  }`}>
                  Material
                  {materialValues.length > 0 && (
                    <span className={`text-[11px] font-[600] px-1.5 py-0.5 rounded-full ${activeVariantTab === 'material' ? 'bg-white/20' : 'bg-muted-bg'}`}>
                      {materialValues.length}
                    </span>
                  )}
                </button>
                <button type="button" onClick={() => setActiveVariantTab('other')}
                  className={`flex items-center gap-2 px-4 h-9 rounded border text-[13px] font-[500] font-public-sans transition-colors ${
                    activeVariantTab === 'other'
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  }`}>
                  Other
                  {customValues.length > 0 && (
                    <span className={`text-[11px] font-[600] px-1.5 py-0.5 rounded-full ${activeVariantTab === 'other' ? 'bg-white/20' : 'bg-muted-bg'}`}>
                      {customValues.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Size panel */}
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

              {/* Color panel */}
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

              {/* Material panel */}
              {activeVariantTab === 'material' && (
                <div className="space-y-2">
                  <p className="text-[12px] font-public-sans text-muted-text">e.g. Cotton, Brass, Terracotta — press Enter or click + to add</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {materialValues.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary">
                        {v}
                        <button type="button" onClick={() => setMaterialValues((prev) => prev.filter((x) => x !== v))}
                          className="text-muted-text hover:text-error transition-colors" aria-label={`Remove ${v}`}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input type="text" value={materialInput} onChange={(e) => setMaterialInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(materialValues, setMaterialValues, materialInput, setMaterialInput) } }}
                        placeholder="Add material…"
                        className="h-8 px-2 w-28 rounded border border-dashed border-border-warm bg-transparent text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                      <button type="button" onClick={() => addTag(materialValues, setMaterialValues, materialInput, setMaterialInput)}
                        className="h-8 w-8 flex items-center justify-center rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Other panel — brand types a custom attribute name once, then adds its values */}
              {activeVariantTab === 'other' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-[500] font-public-sans text-primary">Attribute name</label>
                    <input type="text" value={customAxisName} onChange={(e) => setCustomAxisName(e.target.value)}
                      placeholder="e.g. Fragrance, Pattern, Finish"
                      className="h-9 px-3 w-full max-w-xs rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <p className="text-[12px] font-public-sans text-muted-text">e.g. Sandalwood, Rose — press Enter or click + to add</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {customValues.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-warm bg-muted-bg/30 text-[13px] font-public-sans text-primary">
                        {v}
                        <button type="button" onClick={() => setCustomValues((prev) => prev.filter((x) => x !== v))}
                          className="text-muted-text hover:text-error transition-colors" aria-label={`Remove ${v}`}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input type="text" value={customInput} onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(customValues, setCustomValues, customInput, setCustomInput) } }}
                        placeholder="Add value…"
                        className="h-8 px-2 w-28 rounded border border-dashed border-border-warm bg-transparent text-[13px] font-public-sans text-primary placeholder:text-muted-text/40 focus:outline-none focus:border-accent transition-colors" />
                      <button type="button" onClick={() => addTag(customValues, setCustomValues, customInput, setCustomInput)}
                        className="h-8 w-8 flex items-center justify-center rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Per-variant pricing cards */}
              {variantCombos.length > 0 && (
                <div className="space-y-4 pt-1">
                  <p className="text-[12px] font-public-sans text-muted-text">Set MOQ tiers and stock for each variant.</p>
                  {variantCombos.map((combo) => {
                    const vp = getVP(combo.key)
                    return (
                      <div key={combo.key} className="rounded border border-border-warm overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center justify-between bg-muted-bg/40 px-3 py-2 border-b border-border-warm">
                          <span className="text-[13px] font-[600] font-public-sans text-primary">{combo.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-public-sans text-muted-text">Stock</span>
                            <input type="number" value={vp.stock} min="0"
                              onChange={(e) => setVPStock(combo.key, e.target.value)}
                              className="w-20 h-7 px-2 rounded border border-border-warm bg-surface text-[13px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors" />
                          </div>
                        </div>
                        {/* MOQ tier table */}
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
            <Field label="Place of Origin" hint="State or region">
              <TextInput value={attrs.placeOfOrigin} onChange={(v) => setAttr('placeOfOrigin')(v)} placeholder="e.g. Jaipur, Rajasthan" />
            </Field>
            <Field label="Weight per unit (kg)" required hint="e.g. 0.5 for 500 g">
              <TextInput value={form.weightKg} onChange={set('weightKg')} type="number" placeholder="e.g. 0.5" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Length (cm)">
              <TextInput value={attrs.lengthCm} onChange={(v) => setAttr('lengthCm')(v)} type="number" placeholder="e.g. 30" />
            </Field>
            <Field label="Breadth (cm)">
              <TextInput value={attrs.breadthCm} onChange={(v) => setAttr('breadthCm')(v)} type="number" placeholder="e.g. 20" />
            </Field>
            <Field label="Height (cm)">
              <TextInput value={attrs.heightCm} onChange={(v) => setAttr('heightCm')(v)} type="number" placeholder="e.g. 10" />
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
                Create Product
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
              {submitting
                ? (media.length > 0 ? 'Uploading…' : 'Creating…')
                : 'Create Product'}
            </Button>
          )}
          <Button variant="ghost" size="md" asChild>
            <Link href="/portal/products">Cancel</Link>
          </Button>
        </div>

      </div>{/* end left column */}

      {/* ── Score sidebar ─────────────────────────────────────────────────── */}
      <div className="xl:sticky xl:top-24 xl:self-start">
        <ScoreWidget score={score} maxScore={maxScore} rules={rules} canPublish={canPublish} />
      </div>

      </div>{/* end grid */}
      </form>
    </div>
  )
}
