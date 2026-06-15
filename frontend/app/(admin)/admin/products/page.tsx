'use client'

import { useState } from 'react'
import { Package, Search, AlertTriangle } from 'lucide-react'
import { useAdminProducts, type AdminProduct } from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Availability badge ───────────────────────────────────────────────────────

function AvailBadge({ status }: { status: AdminProduct['availability'] }) {
  return (
    <span className={cn(
      'inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans',
      status === 'ACTIVE' && 'bg-success/10 text-success',
      status === 'INACTIVE' && 'bg-muted-bg text-muted-text',
      status === 'COMING_SOON' && 'bg-accent/10 text-accent',
    )}>
      {status === 'COMING_SOON' ? 'Soon' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

// ─── Stock indicator ──────────────────────────────────────────────────────────

function StockCell({ total, outOfStock }: { total: number; outOfStock: boolean }) {
  if (outOfStock) return (
    <span className="flex items-center gap-1 text-error text-[12px] font-[600] font-public-sans">
      <AlertTriangle size={11} aria-hidden="true" /> Out of stock
    </span>
  )
  return <span className={cn('text-[13px] font-public-sans', total <= 10 ? 'text-amber-600 font-[600]' : 'text-primary')}>{total}</span>
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ProductRow({ product }: { product: AdminProduct }) {
  return (
    <tr className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {product.photoUrl
            ? <img src={product.photoUrl} alt="" className="w-9 h-9 rounded object-cover border border-border-warm flex-shrink-0" />
            : <div className="w-9 h-9 rounded bg-muted-bg border border-border-warm flex items-center justify-center flex-shrink-0"><Package size={14} className="text-muted-text" /></div>
          }
          <div className="min-w-0">
            <p className="text-[13px] font-[600] font-public-sans text-primary truncate max-w-[200px]">{product.name}</p>
            <p className="text-[11px] font-public-sans text-muted-text">{product.categories.join(', ') || '—'}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-[13px] font-public-sans text-muted-text">{product.brandName}</td>
      <td className="py-3 px-4"><AvailBadge status={product.availability} /></td>
      <td className="py-3 px-4 text-right text-[13px] font-[600] font-public-sans text-primary">
        ₹{product.wholesalePriceInr.toLocaleString('en-IN')}
      </td>
      <td className="py-3 px-4 text-[13px] font-public-sans text-muted-text text-center">{product.moq}</td>
      <td className="py-3 px-4 text-center">
        <StockCell total={product.totalStock} outOfStock={product.outOfStock} />
      </td>
      <td className="py-3 px-4 text-[13px] font-public-sans text-muted-text text-center">{product.variantCount}</td>
      <td className="py-3 px-4 text-[13px] font-public-sans text-muted-text text-center">{product.orderCount}</td>
      <td className="py-3 px-4 text-[12px] font-public-sans text-muted-text">
        {new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AVAIL_FILTERS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'COMING_SOON', label: 'Coming Soon' },
]

export default function AdminProductsPage() {
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminProducts({
    page,
    search: search || undefined,
    availability: availability || undefined,
  })

  const products = data?.products ?? []
  const total = data?.total ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">Products</h1>
        <p className="text-[14px] font-public-sans text-muted-text mt-1">
          All products across every brand — {total.toLocaleString()} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search products or brands…"
            className="w-full h-9 pl-9 pr-4 rounded border border-border-warm bg-surface text-[13px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {AVAIL_FILTERS.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => { setAvailability(value); setPage(1) }}
              className={cn(
                'h-9 px-3 rounded border text-[12px] font-[600] font-public-sans transition-colors',
                availability === value
                  ? 'border-primary bg-primary text-white'
                  : 'border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="w-9 h-9 bg-muted-bg rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted-bg rounded w-40" />
                  <div className="h-3 bg-muted-bg rounded w-24" />
                </div>
                <div className="h-5 bg-muted-bg rounded w-14" />
              </div>
            ))}
          </div>
        ) : !products.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <Package size={22} className="text-muted-text" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">No products found</p>
            <p className="text-[13px] font-public-sans text-muted-text">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {[
                      { label: 'Product', align: 'left' },
                      { label: 'Brand', align: 'left' },
                      { label: 'Status', align: 'left' },
                      { label: 'Price', align: 'right' },
                      { label: 'MOQ', align: 'center' },
                      { label: 'Stock', align: 'center' },
                      { label: 'Variants', align: 'center' },
                      { label: 'Orders', align: 'center' },
                      { label: 'Added', align: 'left' },
                    ].map(({ label, align }) => (
                      <th key={label} className={cn(
                        'py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]',
                        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
                      )}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => <ProductRow key={p.id} product={p} />)}
                </tbody>
              </table>
            </div>

            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-warm">
                <p className="text-[12px] font-public-sans text-muted-text">
                  {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors">Prev</button>
                  <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
