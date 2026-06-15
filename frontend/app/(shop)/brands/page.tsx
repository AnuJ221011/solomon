'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ArrowRight, MapPin, Package } from 'lucide-react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useBrands } from '@/hooks/queries/useBrands'
import { useCategoryTree } from '@/hooks/queries/useCategories'
import { cn } from '@/lib/utils'
import type { Brand } from '@/hooks/queries/useBrands'

const PAGE_SIZE = 24

// ─── Brand card ───────────────────────────────────────────────────────────────

function BrandCard({ brand }: { brand: Brand }) {
  const { name, slug, logo, banner, location, tagline, productCount, achievementLevel } = brand

  return (
    <Link
      href={`/brands/${slug}`}
      className="group flex flex-col bg-surface border border-border-warm rounded overflow-hidden hover:shadow-[0_8px_32px_rgba(26,26,26,0.08)] hover:border-primary/20 transition-all duration-300"
    >
      {/* Banner image */}
      <div className="relative aspect-[3/2] bg-[#F0EBE3] overflow-hidden">
        {banner ? (
          <Image
            src={banner}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5F0E8] to-[#EDE5D8]">
            <span className="font-playfair text-[56px] font-[500] text-[#C8BEAE] select-none leading-none">
              {name.charAt(0)}
            </span>
          </div>
        )}

        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center gap-1.5 bg-white text-primary text-[13px] font-[600] font-public-sans px-4 py-2 rounded shadow-sm">
            View Brand <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>

        {/* Logo — overlapping bottom edge */}
        <div className="absolute bottom-0 left-4 translate-y-1/2 w-12 h-12 rounded border-2 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0">
          {logo ? (
            <Image src={logo} alt={`${name} logo`} fill sizes="48px" className="object-cover" />
          ) : (
            <span className="font-playfair text-[18px] font-[500] text-muted-text/50 select-none leading-none">
              {name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Info — offset for logo overlap */}
      <div className="pt-8 pb-4 px-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-playfair text-[18px] font-[500] text-primary leading-tight line-clamp-1">
            {name}
          </p>
          <AchievementBadge level={achievementLevel} />
        </div>

        {location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={11} className="text-muted-text flex-shrink-0" aria-hidden="true" />
            <span className="text-[12px] font-public-sans text-muted-text truncate">{location}</span>
          </div>
        )}

        {tagline && (
          <p className="text-[13px] font-public-sans text-muted-text mt-2 line-clamp-2 leading-relaxed flex-1">
            {tagline}
          </p>
        )}

        {productCount > 0 && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border-warm/60">
            <Package size={11} className="text-muted-text flex-shrink-0" aria-hidden="true" />
            <span className="text-[12px] font-public-sans text-muted-text">
              {productCount} product{productCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function BrandCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
      <div className="aspect-[3/2] bg-muted-bg" />
      <div className="pt-8 pb-4 px-4 space-y-2">
        <div className="h-5 bg-muted-bg rounded w-2/3" />
        <div className="h-3 bg-muted-bg rounded w-1/2" />
        <div className="h-3 bg-muted-bg rounded w-full mt-1" />
        <div className="h-3 bg-muted-bg rounded w-4/5" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useBrands({
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const { data: tree = [] } = useCategoryTree()

  const brands: Brand[] = data?.brands ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleCategory(slug: string | null) {
    setActiveCategory(slug)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      {/* ── Hero strip ── */}
      <div className="bg-surface border-b border-border-warm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-10">
          <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-2">
            Brand Directory
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="flex-1">
              <h1 className="font-playfair text-[36px] lg:text-[44px] font-[500] text-primary leading-[1.1]">
                Discover India's Finest<br className="hidden sm:block" /> Artisan Brands
              </h1>
              {!isLoading && total > 0 && (
                <p className="font-public-sans text-[14px] text-muted-text mt-2">
                  {total} verified brand{total !== 1 ? 's' : ''} ready to wholesale
                </p>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-[320px] flex-shrink-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search brands…"
                className="w-full h-11 pl-9 pr-4 rounded border border-border-warm bg-bg text-[14px] font-public-sans text-primary placeholder:text-muted-text/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Category filter pills ── */}
      {tree.length > 0 && (
        <div className="bg-surface border-b border-border-warm sticky top-[108px] z-30">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3">
              <button
                type="button"
                onClick={() => handleCategory(null)}
                className={cn(
                  'inline-flex items-center h-8 px-4 rounded-full text-[13px] font-[500] font-public-sans whitespace-nowrap flex-shrink-0 transition-colors border',
                  activeCategory === null
                    ? 'bg-primary text-white border-primary'
                    : 'bg-transparent text-muted-text border-border-warm hover:border-primary/40 hover:text-primary'
                )}
              >
                All Brands
              </button>
              {tree.map((l1) => (
                <button
                  key={l1.slug}
                  type="button"
                  onClick={() => handleCategory(l1.slug)}
                  className={cn(
                    'inline-flex items-center h-8 px-4 rounded-full text-[13px] font-[500] font-public-sans whitespace-nowrap flex-shrink-0 transition-colors border',
                    activeCategory === l1.slug
                      ? 'bg-primary text-white border-primary'
                      : 'bg-transparent text-muted-text border-border-warm hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {l1.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Brand grid ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => <BrandCardSkeleton key={i} />)}
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            title="No brands found"
            description={search ? `No results for "${search}".` : 'No brands available yet.'}
            action={search ? { label: 'Clear search', onClick: () => handleSearch('') } : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {brands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-14">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-[13px] font-public-sans text-muted-text px-3">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
