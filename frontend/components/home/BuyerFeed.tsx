'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useCategoryTree } from '@/hooks/queries/useCategories'
import { useProducts } from '@/hooks/queries/useProducts'
import { ProductCard } from '@/components/shared/ProductCard'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import type { CategoryL1 } from '@/hooks/queries/useCategories'
import type { Product as ApiProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types'

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toTyped(p: ApiProduct): Product {
  return {
    id: p.id, name: p.name, slug: p.slug,
    brandId: p.brandId, brandName: p.brandName, brandSlug: p.brandSlug,
    shortDescription: p.shortDescription, description: p.description,
    images: (p.photos ?? []).sort((a, b) => a.position - b.position).map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice, moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight, category: p.category, tags: p.tags ?? [],
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── Discovery card grid (Faire-style 2×4) ────────────────────────────────────

function DiscoveryGrid() {
  const { data: tree = [] } = useCategoryTree()
  const l1s = (tree as CategoryL1[]).slice(0, 8)

  if (l1s.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[#F7F4EF] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
      {l1s.map((l1) => (
        <Link
          key={l1.id}
          href={`/categories/${l1.slug}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F4EF] hover:bg-[#EDE8DF] transition-colors group"
        >
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#E2DAD0]">
            {l1.imageUrl && (
              <img src={l1.imageUrl} alt={l1.name} className="w-full h-full object-cover" />
            )}
          </div>
          <span className="text-[13px] font-[500] font-public-sans text-primary leading-snug">
            {l1.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ─── Scroll arrow pair ────────────────────────────────────────────────────────

function ScrollArrows({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onLeft}
        className="w-8 h-8 rounded-full border border-[#E0D8CE] flex items-center justify-center text-muted-text hover:text-primary hover:border-primary transition-colors"
      >
        <ChevronLeft size={15} />
      </button>
      <button
        type="button"
        onClick={onRight}
        className="w-8 h-8 rounded-full border border-[#E0D8CE] flex items-center justify-center text-muted-text hover:text-primary hover:border-primary transition-colors"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

// ─── Recently viewed ──────────────────────────────────────────────────────────

function RecentlyViewed() {
  const { products } = useRecentlyViewed()
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[20px] font-[600] font-public-sans text-primary">Recently viewed</h2>
        <ScrollArrows onLeft={() => scroll('left')} onRight={() => scroll('right')} />
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
        {products.map((p) => (
          <div key={p.id} className="w-[210px] flex-shrink-0">
            <ProductCard
              product={{
                id: p.id,
                slug: p.slug,
                name: p.name,
                images: [p.imageUrl],
                wholesalePrice: p.price,
                brandId: '',
                brandName: p.brandName,
                brandSlug: p.brandSlug,
                shortDescription: '',
                moq: 1,
                inStock: true,
                leadTime: '1-2 weeks',
                tags: [],
                category: '',
                weight: 0,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Ideas for you — infinite scroll grid ────────────────────────────────────

const IDEAS_PAGE_SIZE = 20

function IdeasForYou() {
  const [maxPage, setMaxPage] = useState(1)
  const [accumulated, setAccumulated] = useState<Product[]>([])
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadedPages = useRef(new Set<number>())

  const { data, isFetching } = useProducts({ page: maxPage, limit: IDEAS_PAGE_SIZE, sort: 'popular' })

  useEffect(() => {
    if (!data || loadedPages.current.has(maxPage)) return
    loadedPages.current.add(maxPage)
    const incoming = (data.products ?? []).map(toTyped)
    setAccumulated((prev) => [...prev, ...incoming])
    if (incoming.length < IDEAS_PAGE_SIZE) setHasMore(false)
  }, [data, maxPage])

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching) setMaxPage((p) => p + 1)
  }, [hasMore, isFetching])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <section>
      <h2 className="text-[20px] font-[600] font-public-sans text-primary mb-6">
        Ideas for you
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {accumulated.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}

        {/* Skeleton tiles while loading next page */}
        {isFetching &&
          Array.from({ length: IDEAS_PAGE_SIZE }).map((_, i) => (
            <div key={`sk-${i}`} className="animate-pulse">
              <div className="aspect-[3/4] bg-[#F0EBE3] rounded-lg mb-3" />
              <div className="h-3 bg-[#F0EBE3] rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-[#F0EBE3] rounded w-1/2" />
            </div>
          ))}
      </div>

      {/* Intersection sentinel */}
      <div ref={sentinelRef} className="h-4 mt-4" />

      {!hasMore && accumulated.length > 0 && (
        <p className="text-center text-[13px] font-public-sans text-muted-text py-8">
          You&apos;ve seen all products
        </p>
      )}
    </section>
  )
}

// ─── BuyerFeed ────────────────────────────────────────────────────────────────

export function BuyerFeed() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Greeting */}
        <h1 className="text-[28px] md:text-[32px] font-[600] font-public-sans text-primary mb-8">
          Welcome back, {firstName}
        </h1>

        {/* L1 category discovery grid */}
        <DiscoveryGrid />

        {/* Recently viewed (only when items exist) */}
        <RecentlyViewed />

        {/* Infinite scroll product grid */}
        <IdeasForYou />
      </div>
    </div>
  )
}
