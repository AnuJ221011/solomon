'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useAdminOrders, type AdminOrder } from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<AdminOrder['status'], string> = {
  PENDING:          'bg-muted-bg text-muted-text',
  CONFIRMED:        'bg-accent/10 text-accent',
  PROCESSING:       'bg-amber-50 text-amber-700',
  SHIPPED:          'bg-primary/10 text-primary',
  DELIVERED:        'bg-success/10 text-success',
  CANCELLED:        'bg-error/10 text-error',
  DISPUTED:         'bg-red-100 text-red-700',
  RETURN_REQUESTED: 'bg-orange-50 text-orange-700',
}

function StatusBadge({ status }: { status: AdminOrder['status'] }) {
  return (
    <span className={cn('inline-flex h-5 px-2 rounded text-[11px] font-[600] font-public-sans whitespace-nowrap', STATUS_STYLES[status])}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: AdminOrder }) {
  return (
    <tr className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors">
      <td className="py-3.5 px-4">
        <p className="text-[13px] font-[600] font-public-sans text-primary">#{order.orderNumber}</p>
        <p className="text-[11px] font-public-sans text-muted-text mt-0.5">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</p>
      </td>
      <td className="py-3.5 px-4">
        <p className="text-[13px] font-public-sans text-primary">{order.buyerName}</p>
        <p className="text-[11px] font-public-sans text-muted-text mt-0.5">{order.buyerEmail}</p>
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">{order.brandName}</td>
      <td className="py-3.5 px-4 text-right">
        <p className="text-[13px] font-[600] font-public-sans text-primary">₹{order.totalInr.toLocaleString('en-IN')}</p>
      </td>
      <td className="py-3.5 px-4"><StatusBadge status={order.status} /></td>
      <td className="py-3.5 px-4 text-[12px] font-public-sans text-muted-text whitespace-nowrap">
        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </td>
      {order.disputeReason && (
        <td className="py-3.5 px-4 max-w-[180px]">
          <p className="text-[11px] font-public-sans text-error truncate" title={order.disputeReason}>
            {order.disputeReason}
          </p>
        </td>
      )}
    </tr>
  )
}

// ─── Status filter tabs ───────────────────────────────────────────────────────

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'DISPUTED', label: 'Disputed' },
  { value: 'RETURN_REQUESTED', label: 'Return Req.' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminOrders({
    page,
    status: status || undefined,
    search: search || undefined,
  })

  const orders = data?.orders ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">Orders</h1>
          <p className="text-[14px] font-public-sans text-muted-text mt-1">All orders across the platform</p>
        </div>
        {total > 0 && (
          <p className="text-[13px] font-public-sans text-muted-text self-end">
            {total.toLocaleString()} order{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by buyer or brand name…"
          className={cn(
            'flex-1 h-9 px-3 rounded border border-border-warm bg-surface',
            'text-[14px] font-public-sans text-primary placeholder:text-muted-text',
            'focus:outline-none focus:border-primary/40 transition-colors'
          )}
        />
        <button type="submit"
          className="h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors">
          Search
        </button>
        {search && (
          <button type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
            className="h-9 px-3 rounded border border-border-warm text-[13px] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors">
            Clear
          </button>
        )}
      </form>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-warm overflow-x-auto">
        {STATUS_TABS.map(({ value, label }) => (
          <button key={label} type="button"
            onClick={() => { setStatus(value); setPage(1) }}
            className={cn(
              'px-4 py-2.5 text-[13px] font-[600] font-public-sans border-b-2 -mb-px transition-colors whitespace-nowrap',
              status === value ? 'border-primary text-primary' : 'border-transparent text-muted-text hover:text-primary'
            )}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted-bg rounded w-24" />
                  <div className="h-3 bg-muted-bg rounded w-40" />
                </div>
                <div className="h-5 bg-muted-bg rounded w-20" />
              </div>
            ))}
          </div>
        ) : !orders.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <ShoppingCart size={22} className="text-muted-text" aria-hidden="true" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">No orders found</p>
            {(search || status) && (
              <p className="text-[13px] font-public-sans text-muted-text">Try adjusting your filters.</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['Order', 'Buyer', 'Brand', 'Total', 'Status', 'Date'].map((h) => (
                      <th key={h}
                        className={cn(
                          'py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]',
                          h === 'Total' ? 'text-right' : 'text-left'
                        )}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => <OrderRow key={o.id} order={o} />)}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-warm">
                <p className="text-[12px] font-public-sans text-muted-text">
                  {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors">
                    Prev
                  </button>
                  <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
