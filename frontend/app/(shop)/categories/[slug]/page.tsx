'use client'

import { use, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X } from 'lucide-react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { ProductCard } from '@/components/shared/ProductCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProducts } from '@/hooks/queries/useProducts'
import type { Product as ApiProduct } from '@/hooks/queries/useProducts'
import { useCategoryTree } from '@/hooks/queries/useCategories'
import type { CategoryL1, CategoryL2, CategoryAttribute } from '@/hooks/queries/useCategories'
import type { Product } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 24

// ─── Price / brand-min config ─────────────────────────────────────────────────

const PRICE_RANGES = [
  { key: '0-500',    label: '₹0 – ₹500',       min: 0,    max: 500 },
  { key: '500-2000', label: '₹500 – ₹2,000',    min: 500,  max: 2000 },
  { key: '2000-5000',label: '₹2,000 – ₹5,000',  min: 2000, max: 5000 },
  { key: '5000+',    label: '₹5,000+',           min: 5000, max: undefined },
]

const BRAND_MIN_OPTIONS = [
  { label: 'No minimum',       value: null },
  { label: '₹5,000 or less',   value: 5000 },
  { label: '₹10,000 or less',  value: 10000 },
  { label: '₹25,000 or less',  value: 25000 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTypedProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    description: p.description,
    images: (p.photos ?? []).sort((a, b) => a.position - b.position).map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight,
    category: p.category,
    tags: p.tags ?? [],
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

interface FilterValues {
  [attrName: string]: Set<string>
}

// ─── Subcategory card grid (Faire-style 2×4) ──────────────────────────────────

function SubcategoryGrid({
  l1Cat,
  activeL2Slug,
  onL2Select,
}: {
  l1Cat: CategoryL1
  activeL2Slug: string | null
  onL2Select: (slug: string | null) => void
}) {
  const children = l1Cat.children ?? []
  if (children.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
      {children.slice(0, 8).map((l2) => (
        <button
          key={l2.id}
          type="button"
          onClick={() => onL2Select(activeL2Slug === l2.slug ? null : l2.slug ?? null)}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl text-left transition-colors group',
            activeL2Slug === l2.slug
              ? 'bg-primary/8 ring-1 ring-primary/20'
              : 'bg-[#F7F4EF] hover:bg-[#EDE8DF]'
          )}
        >
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#E2DAD0]">
            {l2.imageUrl && (
              <img src={l2.imageUrl} alt={l2.name} className="w-full h-full object-cover" />
            )}
          </div>
          <span
            className={cn(
              'text-[13px] font-public-sans leading-snug',
              activeL2Slug === l2.slug
                ? 'font-[600] text-primary'
                : 'font-[500] text-primary/80 group-hover:text-primary'
            )}
          >
            {l2.name}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Attribute filter section (compact) ──────────────────────────────────────

function AttributeFilterSection({
  attr,
  values,
  onChange,
}: {
  attr: CategoryAttribute
  values: Set<string>
  onChange: (attrName: string, value: string, checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const SHOW = 6

  if (attr.inputType === 'BOOLEAN') {
    return (
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[#D0C8BE] accent-primary"
            checked={values.has('true')}
            onChange={(e) => onChange(attr.name, 'true', e.target.checked)}
          />
          <span className="text-[13px] font-[500] font-public-sans text-primary">{attr.name}</span>
        </label>
      </div>
    )
  }

  if (!attr.options?.length) return null

  const visible = showAll ? attr.options : attr.options.slice(0, SHOW)

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left mb-2"
      >
        <span className="text-[11px] font-[700] font-public-sans uppercase tracking-[0.08em] text-muted-text">
          {attr.name}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {visible.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#D0C8BE] accent-primary flex-shrink-0"
                checked={values.has(opt)}
                onChange={(e) => onChange(attr.name, opt, e.target.checked)}
              />
              <span className="text-[13px] font-public-sans text-muted-text group-hover:text-primary transition-colors leading-tight">
                {opt}
              </span>
            </label>
          ))}
          {attr.options.length > SHOW && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-[12px] font-[500] font-public-sans text-accent hover:underline"
            >
              {showAll ? 'Show less' : `+${attr.options.length - SHOW} more`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Brand minimum filter ─────────────────────────────────────────────────────

function BrandMinFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="mb-5">
      <p className="text-[13px] font-[700] font-public-sans text-primary mb-3">Brand minimum</p>
      <div className="space-y-2.5">
        {BRAND_MIN_OPTIONS.map((opt) => (
          <label key={String(opt.value)} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="brand-min"
              className="w-4 h-4 border-[#D0C8BE] accent-primary"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="text-[13px] font-public-sans text-muted-text group-hover:text-primary transition-colors">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Wholesale price filter ───────────────────────────────────────────────────

function PriceRangeFilter({
  selected,
  onChange,
}: {
  selected: Set<string>
  onChange: (key: string, checked: boolean) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const SHOW = 3
  const visible = showAll ? PRICE_RANGES : PRICE_RANGES.slice(0, SHOW)

  return (
    <div className="mb-5">
      <p className="text-[13px] font-[700] font-public-sans text-primary mb-3">Wholesale price</p>
      <div className="space-y-2.5">
        {visible.map((r) => (
          <label key={r.key} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[#D0C8BE] accent-primary flex-shrink-0"
              checked={selected.has(r.key)}
              onChange={(e) => onChange(r.key, e.target.checked)}
            />
            <span className="text-[13px] font-public-sans text-muted-text group-hover:text-primary transition-colors">
              {r.label}
            </span>
          </label>
        ))}
      </div>
      {PRICE_RANGES.length > SHOW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-[12px] font-[500] font-public-sans text-primary underline underline-offset-2 hover:opacity-70"
        >
          {showAll ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  l1Cat,
  l2Cat,
  activeL2Slug,
  onL2Change,
  filterValues,
  onFilterChange,
  selectedPriceRanges,
  onPriceRangeChange,
  brandMaxMin,
  onBrandMaxMinChange,
  onClear,
  activeFilterCount,
}: {
  l1Cat: CategoryL1 | null
  l2Cat: CategoryL2 | null
  activeL2Slug: string | null
  onL2Change: (slug: string | null) => void
  filterValues: FilterValues
  onFilterChange: (attrName: string, value: string, checked: boolean) => void
  selectedPriceRanges: Set<string>
  onPriceRangeChange: (key: string, checked: boolean) => void
  brandMaxMin: number | null
  onBrandMaxMinChange: (v: number | null) => void
  onClear: () => void
  activeFilterCount: number
}) {
  const attributes: CategoryAttribute[] = l2Cat?.attributes ?? l1Cat?.attributes ?? []

  return (
    <aside className="w-[200px] flex-shrink-0">
      <div className="sticky top-[120px]">
        {l1Cat && (
          <>
            {/* L1 header — bold, Faire-style */}
            <button
              type="button"
              onClick={() => onL2Change(null)}
              className={cn(
                'block w-full text-left text-[14px] font-[700] font-public-sans mb-3 pb-2 border-b border-[#E0D8CE]',
                !activeL2Slug ? 'text-primary underline underline-offset-4' : 'text-primary/70 hover:text-primary'
              )}
            >
              {l1Cat.name}
            </button>

            {/* L2 links — plain text, no arrows */}
            <div className="space-y-0.5 mb-6">
              {(l1Cat.children ?? []).map((l2) => (
                <button
                  key={l2.id}
                  type="button"
                  onClick={() => onL2Change(l2.slug ?? null)}
                  className={cn(
                    'block w-full text-left text-[13px] font-public-sans py-1 px-1 rounded transition-colors',
                    activeL2Slug === l2.slug
                      ? 'font-[600] text-primary'
                      : 'text-muted-text hover:text-primary'
                  )}
                >
                  {l2.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Price + brand minimum filters — always shown */}
        <div className="border-t border-[#E0D8CE] pt-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-[700] font-public-sans uppercase tracking-[0.08em] text-muted-text">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors flex items-center gap-1"
              >
                <X size={10} />
                Clear
              </button>
            )}
          </div>

          <BrandMinFilter value={brandMaxMin} onChange={onBrandMaxMinChange} />

          <div className="border-t border-[#E0D8CE] pt-4 mb-1">
            <PriceRangeFilter selected={selectedPriceRanges} onChange={onPriceRangeChange} />
          </div>

          {/* Category attribute filters */}
          {attributes.length > 0 && (
            <div className="border-t border-[#E0D8CE] pt-4">
              {attributes.map((attr) => (
                <AttributeFilterSection
                  key={attr.id}
                  attr={attr}
                  values={filterValues[attr.name] ?? new Set()}
                  onChange={onFilterChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ─── Sort / filter bar ────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

function FilterBar({
  sort,
  onSort,
  total,
  sidebarVisible,
  onToggleSidebar,
  onMobileFilter,
  activeFilterCount,
}: {
  sort: string
  onSort: (v: string) => void
  total: number
  sidebarVisible: boolean
  onToggleSidebar: () => void
  onMobileFilter: () => void
  activeFilterCount: number
}) {
  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      {/* Hide/show filters — dark pill */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className={cn(
          'hidden md:inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-[500] font-public-sans transition-colors',
          sidebarVisible
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'border border-[#D0C8BE] text-muted-text hover:text-primary hover:border-primary'
        )}
      >
        <SlidersHorizontal size={14} />
        {sidebarVisible ? 'Hide filters' : 'Show filters'}
      </button>

      {/* Mobile filter button */}
      <button
        type="button"
        onClick={onMobileFilter}
        className="md:hidden inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#D0C8BE] text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary hover:border-primary transition-colors"
      >
        <SlidersHorizontal size={14} />
        Filters
        {activeFilterCount > 0 && (
          <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-[700] inline-flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      <span className="text-[13px] font-public-sans text-muted-text">
        {total > 0 ? `${total.toLocaleString()} product${total !== 1 ? 's' : ''}` : ''}
      </span>

      <select
        value={sort}
        onChange={(e) => onSort(e.target.value)}
        className="ml-auto h-9 px-3 rounded-full border border-[#D0C8BE] text-[13px] font-public-sans text-primary bg-surface outline-none focus:ring-1 focus:ring-primary focus:border-primary"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sort by {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Active filter chips ──────────────────────────────────────────────────────

function ActiveFilterChips({
  filterValues,
  onRemove,
  priceRangeChips,
  brandMinChip,
}: {
  filterValues: FilterValues
  onRemove: (attrName: string, value: string) => void
  priceRangeChips: { key: string; label: string; onRemove: () => void }[]
  brandMinChip: { label: string; onRemove: () => void } | null
}) {
  const attrChips: { attrName: string; value: string }[] = []
  for (const [attrName, values] of Object.entries(filterValues)) {
    for (const value of values) attrChips.push({ attrName, value })
  }
  const hasAny = attrChips.length > 0 || priceRangeChips.length > 0 || brandMinChip !== null
  if (!hasAny) return null

  function Chip({ label, onRemove: remove }: { label: string; onRemove: () => void }) {
    return (
      <button
        type="button"
        onClick={remove}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D0C8BE] bg-surface text-[12px] font-[500] font-public-sans text-muted-text hover:border-primary hover:text-primary transition-colors"
      >
        {label}
        <X size={10} />
      </button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {brandMinChip && <Chip label={brandMinChip.label} onRemove={brandMinChip.onRemove} />}
      {priceRangeChips.map((c) => <Chip key={c.key} label={c.label} onRemove={c.onRemove} />)}
      {attrChips.map(({ attrName, value }) => (
        <Chip key={`${attrName}:${value}`} label={value} onRemove={() => onRemove(attrName, value)} />
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-[#F0EBE3] rounded-lg mb-3" />
          <div className="h-3 bg-[#F0EBE3] rounded w-1/2 mb-2" />
          <div className="h-4 bg-[#F0EBE3] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[#F0EBE3] rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    const around = [page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages)
    const set = new Set([1, ...around, totalPages])
    pages.push(...Array.from(set).sort((a, b) => a - b))
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="h-9 px-3 border border-[#D0C8BE] rounded text-[13px] font-public-sans text-muted-text hover:text-primary hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>
      {pages.map((p, idx) => (
        <span key={p}>
          {idx > 0 && pages[idx - 1] !== p - 1 && (
            <span className="h-9 w-6 inline-flex items-center justify-center text-muted-text text-[13px]">…</span>
          )}
          <button
            type="button"
            onClick={() => onPage(p)}
            className={cn(
              'h-9 w-9 border rounded text-[13px] font-[500] font-public-sans transition-colors',
              p === page
                ? 'border-primary bg-primary text-white'
                : 'border-[#D0C8BE] text-muted-text hover:text-primary hover:border-primary'
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="h-9 px-3 border border-[#D0C8BE] rounded text-[13px] font-public-sans text-muted-text hover:text-primary hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('newest')
  const [activeL2Slug, setActiveL2Slug] = useState<string | null>(null)
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<string>>(new Set())
  const [brandMaxMin, setBrandMaxMin] = useState<number | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { data: tree = [] } = useCategoryTree()

  const l1Cat = useMemo<CategoryL1 | null>(() => {
    for (const l1 of tree as CategoryL1[]) {
      if (l1.slug === slug) return l1
      if ((l1.children ?? []).some((l2) => l2.slug === slug)) return l1
    }
    return null
  }, [tree, slug])

  const l2Cat = useMemo<CategoryL2 | null>(() => {
    if (!l1Cat) return null
    if (activeL2Slug) return (l1Cat.children ?? []).find((l2) => l2.slug === activeL2Slug) ?? null
    return (l1Cat.children ?? []).find((l2) => l2.slug === slug) ?? null
  }, [l1Cat, activeL2Slug, slug])

  const effectiveSlug = activeL2Slug ?? slug

  const attrsParam = useMemo<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {}
    for (const [name, set] of Object.entries(filterValues)) {
      if (set.size > 0) out[name] = [...set]
    }
    return out
  }, [filterValues])

  // Compute effective price range from multi-checkbox selection
  const { effectivePriceMin, effectivePriceMax } = useMemo(() => {
    if (selectedPriceRanges.size === 0) return { effectivePriceMin: undefined, effectivePriceMax: undefined }
    const selected = PRICE_RANGES.filter((r) => selectedPriceRanges.has(r.key))
    const mins = selected.map((r) => r.min)
    const maxes = selected.map((r) => r.max).filter((v): v is number => v !== undefined)
    return {
      effectivePriceMin: Math.min(...mins),
      // Only set a ceiling if every selected range has a max (open-ended "5000+" means no ceiling)
      effectivePriceMax: maxes.length === selected.length ? Math.max(...maxes) : undefined,
    }
  }, [selectedPriceRanges])

  const { data, isLoading, error } = useProducts({
    category: effectiveSlug,
    page,
    limit: PAGE_SIZE,
    sort,
    attrs: attrsParam,
    priceMin: effectivePriceMin,
    priceMax: effectivePriceMax,
    brandMaxMin: brandMaxMin ?? undefined,
  })

  const rawProducts = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const products: Product[] = rawProducts.map(toTypedProduct)

  const categoryName = l2Cat?.name ?? l1Cat?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const activeFilterCount =
    Object.values(filterValues).reduce((sum, s) => sum + s.size, 0) +
    selectedPriceRanges.size +
    (brandMaxMin !== null ? 1 : 0)

  const handleFilterChange = useCallback((attrName: string, value: string, checked: boolean) => {
    setFilterValues((prev) => {
      const next = { ...prev }
      const set = new Set(next[attrName] ?? [])
      if (checked) set.add(value)
      else set.delete(value)
      if (set.size === 0) delete next[attrName]
      else next[attrName] = set
      return next
    })
    setPage(1)
  }, [])

  const handleL2Change = useCallback((newSlug: string | null) => {
    setActiveL2Slug(newSlug)
    setFilterValues({})
    setSelectedPriceRanges(new Set())
    setBrandMaxMin(null)
    setPage(1)
  }, [])

  const handlePriceRangeChange = useCallback((key: string, checked: boolean) => {
    setSelectedPriceRanges((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
    setPage(1)
  }, [])

  const handleClearAll = useCallback(() => {
    setFilterValues({})
    setSelectedPriceRanges(new Set())
    setBrandMaxMin(null)
    setPage(1)
  }, [])

  // Show subcategory grid only on L1 landing (not when an L2 is active and not when we've already navigated into an L2 slug)
  const isOnL1 = l1Cat !== null && l1Cat.slug === slug && activeL2Slug === null
  const showSubcategoryGrid = isOnL1 && (l1Cat?.children?.length ?? 0) > 0

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto w-full px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] font-public-sans text-muted-text mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            {l1Cat && l1Cat.slug !== slug && (
              <>
                <Link href={`/categories/${l1Cat.slug}`} className="hover:text-primary transition-colors">
                  {l1Cat.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-primary font-[500]">{categoryName}</span>
          </nav>

          {/* Category title */}
          <h1 className="text-[30px] md:text-[36px] font-[600] font-public-sans text-primary leading-tight mb-6">
            {categoryName}
          </h1>

          {/* Subcategory grid — shown on L1 landing only */}
          {showSubcategoryGrid && l1Cat && (
            <SubcategoryGrid
              l1Cat={l1Cat}
              activeL2Slug={activeL2Slug}
              onL2Select={handleL2Change}
            />
          )}

          {/* Content: sidebar + products */}
          <div className="flex gap-8">
            {/* Sidebar — desktop */}
            {sidebarVisible && (
              <div className="hidden md:block">
                <Sidebar
                  l1Cat={l1Cat}
                  l2Cat={l2Cat}
                  activeL2Slug={activeL2Slug}
                  onL2Change={handleL2Change}
                  filterValues={filterValues}
                  onFilterChange={handleFilterChange}
                  selectedPriceRanges={selectedPriceRanges}
                  onPriceRangeChange={handlePriceRangeChange}
                  brandMaxMin={brandMaxMin}
                  onBrandMaxMinChange={(v) => { setBrandMaxMin(v); setPage(1) }}
                  onClear={handleClearAll}
                  activeFilterCount={activeFilterCount}
                />
              </div>
            )}

            {/* Main column */}
            <div className="flex-1 min-w-0">
              <FilterBar
                sort={sort}
                onSort={(v) => { setSort(v); setPage(1) }}
                total={total}
                sidebarVisible={sidebarVisible}
                onToggleSidebar={() => setSidebarVisible((v) => !v)}
                onMobileFilter={() => setMobileFiltersOpen(true)}
                activeFilterCount={activeFilterCount}
              />

              <ActiveFilterChips
                filterValues={filterValues}
                onRemove={(attrName, value) => handleFilterChange(attrName, value, false)}
                priceRangeChips={PRICE_RANGES.filter((r) => selectedPriceRanges.has(r.key)).map((r) => ({
                  key: r.key,
                  label: r.label,
                  onRemove: () => handlePriceRangeChange(r.key, false),
                }))}
                brandMinChip={
                  brandMaxMin !== null
                    ? {
                        label: BRAND_MIN_OPTIONS.find((o) => o.value === brandMaxMin)?.label ?? `≤ ₹${brandMaxMin}`,
                        onRemove: () => { setBrandMaxMin(null); setPage(1) },
                      }
                    : null
                }
              />

              {isLoading ? (
                <LoadingSkeleton />
              ) : error ? (
                <EmptyState title="Something went wrong" description="Could not load products. Please try again." />
              ) : products.length === 0 ? (
                <EmptyState
                  title="No products found"
                  description={activeFilterCount > 0 ? 'Try clearing some filters.' : `No products in ${categoryName} yet.`}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              <Pagination
                page={page}
                totalPages={totalPages}
                onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-surface overflow-y-auto p-5 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[15px] font-[600] font-public-sans text-primary">Filters</span>
              <button type="button" onClick={() => setMobileFiltersOpen(false)}>
                <X size={18} className="text-muted-text" />
              </button>
            </div>
            <Sidebar
              l1Cat={l1Cat}
              l2Cat={l2Cat}
              activeL2Slug={activeL2Slug}
              onL2Change={(s) => { handleL2Change(s); setMobileFiltersOpen(false) }}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              selectedPriceRanges={selectedPriceRanges}
              onPriceRangeChange={handlePriceRangeChange}
              brandMaxMin={brandMaxMin}
              onBrandMaxMinChange={(v) => { setBrandMaxMin(v); setPage(1) }}
              onClear={handleClearAll}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
