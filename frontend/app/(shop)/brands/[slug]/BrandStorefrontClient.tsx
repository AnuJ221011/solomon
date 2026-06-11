'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ProductGrid } from '@/components/catalogue/ProductGrid'
import type { Product } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandStorefrontClientProps {
  products: Product[]
  collections: string[]
}

// ─── Collection filter logic ──────────────────────────────────────────────────
// "All Products" shows everything; other tabs filter by a loose keyword match
// against product tags, name, or category.

function filterByCollection(products: Product[], collection: string): Product[] {
  if (collection === 'All Products') return products

  const keyword = collection.toLowerCase()
  return products.filter(
    (p) =>
      p.name?.toLowerCase().includes(keyword) ||
      p.category?.toLowerCase().includes(keyword) ||
      p.tags?.some((t) => t.toLowerCase().includes(keyword)) ||
      (p.shortDescription?.toLowerCase().includes(keyword) ?? false)
  )
}

const PAGE_SIZE = 12

// ─── Component ────────────────────────────────────────────────────────────────

export function BrandStorefrontClient({
  products,
  collections,
}: BrandStorefrontClientProps) {
  const [activeCollection, setActiveCollection] = useState(collections[0] ?? 'All Products')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => filterByCollection(products, activeCollection),
    [products, activeCollection]
  )

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  function handleCollectionChange(col: string) {
    setActiveCollection(col)
    setPage(1)
  }

  return (
    <>
      {/* ── Collections tab bar ────────────────────────────────────────────── */}
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
                  onClick={() => handleCollectionChange(col)}
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

      {/* ── Product grid ───────────────────────────────────────────────────── */}
      <section className="bg-bg px-6 lg:px-16 py-8 flex-1">
        <div className="max-w-[1280px] mx-auto">
          {/* Result line */}
          <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mb-6">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {activeCollection !== 'All Products' ? ` in ${activeCollection}` : ''}
          </p>

          <ProductGrid
            products={paginated}
            totalCount={filtered.length}
            page={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
          />
        </div>
      </section>
    </>
  )
}
