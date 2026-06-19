'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/shared/ProductCard'
import { useProducts } from '@/hooks/queries/useProducts'
import type { Product as ApiProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured',   label: 'Featured' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest',     label: 'Newest' },
]

const PAGE_SIZE = 20

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toTypedProduct(p: ApiProduct): Product {
  return {
    id: p.id, name: p.name, slug: p.slug,
    brandId: p.brandId, brandName: p.brandName, brandSlug: p.brandSlug,
    description: p.description,
    images: p.photos.sort((a, b) => a.position - b.position).map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice, moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight, category: p.category, tags: p.tags,
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── Collection filter (client-side, on accumulated products) ─────────────────

function filterByCollection(products: Product[], collection: string): Product[] {
  if (collection === 'All Products') return products
  const kw = collection.toLowerCase()
  return products.filter(
    (p) =>
      p.name?.toLowerCase().includes(kw) ||
      p.category?.toLowerCase().includes(kw) ||
      p.tags?.some((t) => t.toLowerCase().includes(kw)) ||
      (p.description?.toLowerCase().includes(kw) ?? false)
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
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

// ─── Component ────────────────────────────────────────────────────────────────

interface BrandStorefrontClientProps {
  brandSlug: string
  collections: string[]
}

export function BrandStorefrontClient({ brandSlug, collections }: BrandStorefrontClientProps) {
  const [activeCollection, setActiveCollection] = useState(collections[0] ?? 'All Products')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('featured')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [page, setPage] = useState(1)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(t)
  }, [query])

  // Reset accumulated list when server-side filters change
  useEffect(() => {
    setPage(1)
    setAllProducts([])
  }, [debouncedQuery, sort, priceMin, priceMax])

  const { data, isLoading, isFetching } = useProducts({
    brandSlug,
    search: debouncedQuery || undefined,
    sort: sort !== 'featured' ? sort : undefined,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    page,
    limit: PAGE_SIZE,
  })

  // Accumulate products across pages
  useEffect(() => {
    if (!data?.products) return
    const batch = data.products.map(toTypedProduct)
    setAllProducts((prev) => (page === 1 ? batch : [...prev, ...batch]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const totalCount = data?.total ?? 0
  const hasMore = allProducts.length < totalCount

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetching) setPage((p) => p + 1)
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isFetching])

  // Client-side collection filter on accumulated products
  const displayed = useMemo(
    () => filterByCollection(allProducts, activeCollection),
    [allProducts, activeCollection]
  )

  const isInitialLoading = isLoading && page === 1 && allProducts.length === 0

  return (
    <>
      {/* ── Collection tabs ─────────────────────────────────────────────────── */}
      {collections.length > 1 && (
        <nav
          className="bg-bg border-b border-border-warm px-6 lg:px-16 py-4 overflow-x-auto"
          aria-label="Product collections"
        >
          <div className="max-w-[1280px] mx-auto flex items-center gap-2">
            {collections.map((col) => {
              const active = col === activeCollection
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => setActiveCollection(col)}
                  className={cn(
                    'flex-shrink-0 rounded px-4 py-2 text-[13px] font-[500] font-public-sans border transition-colors',
                    active
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg text-muted-text border-border-warm hover:border-primary/30 hover:text-primary'
                  )}
                  aria-pressed={active}
                >
                  {col}
                </button>
              )
            })}
          </div>
        </nav>
      )}

      {/* ── Products section ────────────────────────────────────────────────── */}
      <section className="bg-bg px-6 lg:px-16 py-8 flex-1">
        <div className="max-w-[1280px] mx-auto">

          {/* Search + Price + Sort bar */}
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:gap-4">

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search products…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn(
                  'h-10 w-full rounded border border-border-warm bg-surface',
                  'pl-9 pr-4 text-[14px] font-public-sans text-primary',
                  'placeholder:text-muted-text/60',
                  'outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors'
                )}
              />
            </div>

            {/* Price range */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                placeholder="Min ₹"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                min={0}
                className={cn(
                  'h-10 w-24 rounded border border-border-warm bg-surface px-3',
                  'text-[13px] font-public-sans text-primary placeholder:text-muted-text/60',
                  'outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors'
                )}
                aria-label="Minimum price"
              />
              <span className="text-[12px] text-muted-text font-public-sans">–</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                min={0}
                className={cn(
                  'h-10 w-24 rounded border border-border-warm bg-surface px-3',
                  'text-[13px] font-public-sans text-primary placeholder:text-muted-text/60',
                  'outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors'
                )}
                aria-label="Maximum price"
              />
            </div>

            {/* Sort */}
            <div className="relative ml-auto flex-shrink-0">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={cn(
                  'h-10 rounded border border-border-warm bg-surface',
                  'pl-3 pr-8 text-[14px] font-[500] font-public-sans text-primary',
                  'outline-none focus:ring-1 focus:ring-accent focus:border-accent',
                  'appearance-none cursor-pointer transition-colors hover:bg-muted-bg'
                )}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-text" aria-hidden="true">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
                  <path d="M0 0l5 6 5-6H0z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Result count */}
          {!isInitialLoading && (
            <p className="text-[12px] font-public-sans text-muted-text mb-5">
              {totalCount === 0
                ? 'No products match your filters'
                : `${totalCount} product${totalCount !== 1 ? 's' : ''}${debouncedQuery ? ` for "${debouncedQuery}"` : ''}`}
            </p>
          )}

          {/* Grid */}
          {isInitialLoading ? (
            <GridSkeleton />
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[16px] font-[500] font-public-sans text-primary">No products found</p>
              <p className="text-[14px] font-public-sans text-muted-text mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayed.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4 mt-8" aria-hidden="true" />

          {/* Loading spinner for next-page fetch */}
          {isFetching && !isInitialLoading && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-border-warm border-t-accent animate-spin" aria-label="Loading more products" />
            </div>
          )}

          {/* End of results */}
          {!hasMore && allProducts.length > 0 && !isFetching && (
            <p className="text-center text-[12px] font-public-sans text-muted-text py-6">
              All {totalCount} product{totalCount !== 1 ? 's' : ''} loaded
            </p>
          )}

        </div>
      </section>
    </>
  )
}
