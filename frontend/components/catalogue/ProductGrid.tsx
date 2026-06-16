'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/shared/ProductCard'
import type { Product } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductGridProps {
  products: Product[]
  totalCount: number
  page: number
  onPageChange: (page: number) => void
  pageSize?: number
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function NoResults() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded bg-muted-bg flex items-center justify-center mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-muted-text"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 20L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="0" />
        </svg>
      </div>
      <p className="text-[16px] font-[500] font-public-sans text-primary">No products found</p>
      <p className="text-[14px] font-public-sans text-muted-text mt-1">
        Try adjusting your filters or search query.
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductGrid({
  products,
  totalCount,
  page,
  onPageChange,
  pageSize = 20,
}: ProductGridProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex flex-col gap-6">
      {/* Grid */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
        aria-label="Product results"
      >
        {products.length === 0 ? (
          <NoResults />
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-between pt-4 border-t border-border-warm',
            'flex-col gap-3 sm:flex-row sm:gap-0'
          )}
        >
          {/* Result count */}
          <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text">
            Showing {start}–{end} of {totalCount} products
          </p>

          {/* Prev / Next */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                &larr; Prev
              </Button>

              {/* Page numbers — show window of 5 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('ellipsis')
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="text-[12px] text-muted-text font-public-sans px-1"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => onPageChange(item as number)}
                        aria-label={`Go to page ${item}`}
                        aria-current={item === page ? 'page' : undefined}
                        className={cn(
                          'w-8 h-8 rounded border text-[12px] font-[500] font-public-sans transition-colors',
                          item === page
                            ? 'bg-primary text-white border-primary'
                            : 'border-border-warm text-muted-text hover:border-primary/40 hover:text-primary'
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next &rarr;
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
