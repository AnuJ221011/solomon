'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { BrandCard } from '@/components/shared/BrandCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useBrands } from '@/hooks/queries/useBrands'
import type { Brand } from '@/types'

const PAGE_SIZE = 24

export default function BrandsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useBrands({
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const brands: Brand[] = (data?.brands ?? []) as Brand[]
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[36px] leading-[1.15] font-[500] font-playfair text-primary">
            Featured Brands
          </h1>
          <p className="text-[15px] font-public-sans text-muted-text mt-1">
            Discover India's finest artisan and wholesale brands.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-[480px] mb-10">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search brands..."
            className="w-full h-10 pl-9 pr-4 rounded border border-border-warm bg-surface text-[14px] font-public-sans text-primary placeholder:text-muted-text/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-[260px] rounded bg-muted-bg animate-pulse" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            title="No brands found"
            description={search ? `No results for "${search}".` : 'No brands available yet.'}
          />
        ) : (
          <>
            <p className="text-[13px] font-public-sans text-muted-text mb-4">
              {total} brand{total !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {brands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} className="w-full" />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-[13px] font-public-sans text-muted-text px-2">
                  Page {page} of {totalPages}
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
