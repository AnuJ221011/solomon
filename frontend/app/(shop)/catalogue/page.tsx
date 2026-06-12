'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { FilterSidebar, type CatalogueFilters } from '@/components/catalogue/FilterSidebar'
import { ProductGrid } from '@/components/catalogue/ProductGrid'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { useProducts } from '@/hooks/queries/useProducts'
import type { Product as ApiProduct } from '@/hooks/queries/useProducts'
import { useCategories } from '@/hooks/queries/useCategories'
import type { Product } from '@/types'

// â”€â”€â”€ Sort options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

const PAGE_SIZE = 20

// â”€â”€â”€ Map API product to @/types Product â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function toTypedProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    shortDescription: p.shortDescription,
    description: p.description,
    images: p.photos.map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight,
    category: p.category,
    tags: p.tags,
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// â”€â”€â”€ Loading skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CatalogueLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-muted-bg rounded mb-3" />
          <div className="h-3 bg-muted-bg rounded w-1/2 mb-2" />
          <div className="h-4 bg-muted-bg rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted-bg rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

// â”€â”€â”€ Page component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CataloguePage() {
  const searchParams = useSearchParams()
  const categorySlug = searchParams.get('category') // e.g. "textiles"

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('featured')
  const [filters, setFilters] = useState<CatalogueFilters>({
    categories: [],
    shipsTo: 'all',
    priceMin: '',
    priceMax: '',
  })
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { data: categoriesData } = useCategories()
  const categoryNames = (categoriesData ?? []).map((c) => c.name)

  // Resolve URL slug â†’ category name, then seed filters once categories load
  const resolvedCategoryName = useMemo(() => {
    if (!categorySlug || !categoriesData) return null
    const match = categoriesData.find(
      (c) => c.slug === categorySlug || c.name.toLowerCase() === categorySlug.toLowerCase()
    )
    return match?.name ?? null
  }, [categorySlug, categoriesData])

  useEffect(() => {
    if (!resolvedCategoryName) return
    setFilters((f) => ({ ...f, categories: [resolvedCategoryName] }))
    setPage(1)
  }, [resolvedCategoryName])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  // â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Prefer sidebar-driven categories; fall back to the URL-resolved name so the
  // first render already sends the correct filter (before the useEffect fires).
  const activeCategory =
    filters.categories.length > 0
      ? filters.categories.join(',')
      : resolvedCategoryName ?? undefined

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useProducts({
    page,
    limit: PAGE_SIZE,
    category: activeCategory,
    search: debouncedQuery || undefined,
    sort: sort === 'featured' ? undefined : sort,
  })

  const rawProducts = productsData?.products ?? []
  const totalCount = productsData?.total ?? 0
  const products: Product[] = rawProducts.map(toTypedProduct)

  const activeFilterCount =
    filters.categories.length +
    (filters.shipsTo !== 'all' ? 1 : 0) +
    (filters.priceMin !== '' ? 1 : 0) +
    (filters.priceMax !== '' ? 1 : 0)

  const handleFilterChange = useCallback((f: CatalogueFilters) => {
    setFilters(f)
    setPage(1)
  }, [])

  const handleSortChange = useCallback((v: SortKey) => {
    setSort(v)
    setPage(1)
  }, [])

  const handleSearch = useCallback((v: string) => {
    setQuery(v)
  }, [])

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <main className="flex flex-1 min-h-0">
        {/* â”€â”€ Desktop sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <FilterSidebar
          key={resolvedCategoryName ?? 'all'}
          onFilterChange={handleFilterChange}
          categories={categoryNames}
          initialCategories={resolvedCategoryName ? [resolvedCategoryName] : []}
        />

        {/* â”€â”€ Mobile filter sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="bottom" className="w-full max-h-[90vh] p-0 overflow-y-auto rounded-t">
            <SheetHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-[16px] font-[600] font-public-sans text-primary">
                  Filters
                </SheetTitle>
                <SheetClose
                  className="w-8 h-8 inline-flex items-center justify-center rounded hover:bg-muted-bg text-muted-text transition-colors"
                  aria-label="Close filters"
                >
                  <X size={16} />
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="px-5 py-5">
              <MobileFilterSidebar
                key={resolvedCategoryName ?? 'all'}
                onFilterChange={(f) => {
                  handleFilterChange(f)
                  setMobileFiltersOpen(false)
                }}
                categories={categoryNames}
                initialCategories={resolvedCategoryName ? [resolvedCategoryName] : []}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex-1 px-6 lg:px-10 py-8 min-w-0">
          {/* Top bar */}
          <div
            className={cn(
              'flex flex-col gap-3 mb-8',
              'sm:flex-row sm:items-center sm:gap-4'
            )}
          >
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search products, brands, tags..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className={cn(
                  'h-10 w-full rounded border border-border-warm bg-surface',
                  'pl-9 pr-4 text-[14px] font-public-sans text-primary',
                  'placeholder:text-muted-text/60',
                  'outline-none focus:ring-1 focus:ring-accent focus:border-accent',
                  'transition-colors'
                )}
                aria-label="Search products"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Mobile filter trigger */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className={cn(
                  'lg:hidden inline-flex items-center gap-1.5 h-10 px-3 rounded border border-border-warm',
                  'text-[13px] font-[500] font-public-sans text-primary bg-surface hover:bg-muted-bg',
                  'transition-colors relative'
                )}
                aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-[600] inline-flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value as SortKey)}
                  className={cn(
                    'h-10 rounded border border-border-warm bg-surface',
                    'pl-3 pr-8 text-[14px] font-[500] font-public-sans text-primary',
                    'outline-none focus:ring-1 focus:ring-accent focus:border-accent',
                    'appearance-none cursor-pointer transition-colors hover:bg-muted-bg'
                  )}
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-text"
                  aria-hidden="true"
                >
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                    <path d="M0 0l5 6 5-6H0z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Results count */}
          {!productsLoading && !productsError && (
            <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mb-5">
              {totalCount === 0
                ? 'No products match your filters'
                : `${totalCount} product${totalCount !== 1 ? 's' : ''}`}
              {debouncedQuery ? ` for "${debouncedQuery}"` : ''}
            </p>
          )}

          {/* Content */}
          {productsLoading ? (
            <CatalogueLoadingSkeleton />
          ) : productsError ? (
            <EmptyState title="Failed to load" description="Please refresh the page." />
          ) : (
            <ProductGrid
              products={products}
              totalCount={totalCount}
              page={page}
              onPageChange={setPage}
              pageSize={PAGE_SIZE}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// â”€â”€â”€ Mobile filter sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MobileFilterSidebar({
  onFilterChange,
  categories,
  initialCategories = [],
}: {
  onFilterChange: (f: CatalogueFilters) => void
  categories: string[]
  initialCategories?: string[]
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [shipsTo, setShipsTo] = useState('all')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const SHIPS_TO_OPTIONS = [
    { value: 'all', label: 'All regions' },
    { value: 'india', label: 'India' },
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'eu', label: 'European Union' },
    { value: 'uae', label: 'UAE & Middle East' },
  ]

  function apply(overrides: Partial<CatalogueFilters> = {}) {
    onFilterChange({
      categories: selectedCategories,
      shipsTo,
      priceMin,
      priceMax,
      ...overrides,
    })
  }

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat]
    setSelectedCategories(next)
  }

  function handleClearAll() {
    setSelectedCategories([])
    setShipsTo('all')
    setPriceMin('')
    setPriceMax('')
    onFilterChange({ categories: [], shipsTo: 'all', priceMin: '', priceMax: '' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12px] font-[500] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-3">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selectedCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'rounded text-[12px] font-[500] font-public-sans px-3 py-1 cursor-pointer border border-border-warm transition-colors',
                  active
                    ? 'bg-accent text-white border-accent'
                    : 'bg-muted-bg text-muted-text hover:border-primary/30'
                )}
                aria-pressed={active}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border-warm" />

      <div>
        <p className="text-[12px] font-[500] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-3">
          Ships To
        </p>
        <div className="flex flex-col gap-2">
          {SHIPS_TO_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="mobile-ships-to"
                value={opt.value}
                checked={shipsTo === opt.value}
                onChange={() => setShipsTo(opt.value)}
                className="accent-accent w-3.5 h-3.5"
              />
              <span
                className={cn(
                  'text-[14px] font-[500] font-public-sans',
                  shipsTo === opt.value ? 'text-primary' : 'text-muted-text'
                )}
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-border-warm" />

      <div>
        <p className="text-[12px] font-[500] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-3">
          Wholesale Price (INR)
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            min={0}
            className={cn(
              'h-10 w-full rounded border border-border-warm bg-surface px-3',
              'text-[14px] font-public-sans text-primary placeholder:text-muted-text/60',
              'outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors'
            )}
            aria-label="Minimum price"
          />
          <span className="text-[12px] text-muted-text font-public-sans">-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            min={0}
            className={cn(
              'h-10 w-full rounded border border-border-warm bg-surface px-3',
              'text-[14px] font-public-sans text-primary placeholder:text-muted-text/60',
              'outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors'
            )}
            aria-label="Maximum price"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button variant="primary" size="md" onClick={() => apply()} className="w-full">
          Apply filters
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClearAll} className="w-full">
          Clear all
        </Button>
      </div>
    </div>
  )
}
