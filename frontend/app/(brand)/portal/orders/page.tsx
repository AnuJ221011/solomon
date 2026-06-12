'use client'

import { useState } from 'react'
import { Truck, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useBrandOrders, useOrder, useUpdateOrderStatus } from '@/hooks/queries/useOrders'
import type { OrderStatus } from '@/hooks/queries/useOrders'

// â”€â”€â”€ Status filter tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type FilterValue = 'All' | OrderStatus

const STATUS_FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Disputed', value: 'DISPUTED' },
]

// â”€â”€â”€ Order detail sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OrderDetailSheet({
  orderId,
  onClose,
}: {
  orderId: string | null
  onClose: () => void
}) {
  const { data: order, isLoading } = useOrder(orderId)
  const updateStatus = useUpdateOrderStatus()
  const [tracking, setTracking] = useState('')

  // Sync tracking field when order loads
  if (order && order.trackingNumber && tracking === '') {
    setTracking(order.trackingNumber)
  }

  const handleDispatch = () => {
    if (!order) return
    updateStatus.mutate(
      { id: order.id, status: 'DISPATCHED', trackingNumber: tracking || undefined },
      { onSuccess: onClose },
    )
  }

  const handleUpdateTracking = () => {
    if (!order) return
    updateStatus.mutate(
      { id: order.id, status: order.status, trackingNumber: tracking || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <Sheet open={!!orderId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{order?.orderNumber ?? 'Order Details'}</SheetTitle>
          <SheetClose />
        </SheetHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-65px)]">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted-bg rounded w-3/4" />
              ))}
            </div>
          ) : !order ? (
            <p className="text-[14px] font-public-sans text-muted-text">Could not load order.</p>
          ) : (
            <>
              {/* Buyer info */}
              <div className="mb-6">
                <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-2">
                  Buyer
                </p>
                <p className="text-[16px] font-[600] font-public-sans text-primary">{order.buyerName}</p>
              </div>

              {/* Status */}
              <div className="mb-6">
                <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-2">
                  Status
                </p>
                <StatusBadge status={order.status} />
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div className="mb-6">
                  <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-3">
                    Items
                  </p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 border-b border-border-warm last:border-0"
                      >
                        <div>
                          <p className="text-[14px] font-[500] font-public-sans text-primary">
                            {item.productName}
                          </p>
                          <p className="text-[12px] font-public-sans text-muted-text">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-[14px] font-[600] font-public-sans text-primary tabular-nums">
                          â‚¹{item.totalPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between py-3 border-t border-border-warm mb-6">
                <p className="text-[14px] font-[600] font-public-sans text-muted-text">Order Total</p>
                <p className="text-[20px] font-[600] font-public-sans text-primary tabular-nums">
                  â‚¹{order.amount.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Dispatch action for PROCESSING orders */}
              {order.status === 'PROCESSING' && (
                <div className="mb-6">
                  <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-2">
                    Tracking Number
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="Enter tracking number"
                      className="flex-1 h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
                    />
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={handleDispatch}
                      disabled={updateStatus.isPending}
                    >
                      <Truck size={12} aria-hidden="true" />
                      Mark Dispatched
                    </Button>
                  </div>
                </div>
              )}

              {/* Update tracking for DISPATCHED orders */}
              {order.status === 'DISPATCHED' && (
                <div className="mb-6">
                  <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-2">
                    Tracking Number
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="Enter tracking number"
                      className="flex-1 h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
                    />
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={handleUpdateTracking}
                      disabled={updateStatus.isPending}
                    >
                      <Truck size={12} aria-hidden="true" />
                      Update
                    </Button>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[13px] font-public-sans text-muted-text">Order date</span>
                  <span className="text-[13px] font-public-sans text-primary">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {order.dispatchedAt && (
                  <div className="flex justify-between">
                    <span className="text-[13px] font-public-sans text-muted-text">Dispatched</span>
                    <span className="text-[13px] font-public-sans text-primary">
                      {new Date(order.dispatchedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// â”€â”€â”€ Loading skeleton rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TableSkeletonRows() {
  return (
    <div className="bg-surface border border-border-warm rounded animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-border-warm last:border-0">
          <div className="h-4 bg-muted-bg rounded w-1/6" />
          <div className="h-4 bg-muted-bg rounded w-1/5" />
          <div className="h-4 bg-muted-bg rounded w-1/8" />
          <div className="h-4 bg-muted-bg rounded w-1/8" />
          <div className="h-4 bg-muted-bg rounded w-1/8" />
          <div className="h-4 bg-muted-bg rounded w-1/12" />
        </div>
      ))}
    </div>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PAGE_LIMIT = 20

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<FilterValue>('All')
  const [page, setPage] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data, isLoading, error } = useBrandOrders({
    status: activeTab === 'All' ? undefined : activeTab,
    page,
    limit: PAGE_LIMIT,
  })

  const orders = data?.orders ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

  const handleTabChange = (tab: FilterValue) => {
    setActiveTab(tab)
    setPage(1)
  }

  return (
    <div>
      {/* Heading */}
      <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mb-6">
        Orders
      </h1>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border-warm overflow-x-auto">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleTabChange(value)}
            className={cn(
              'px-4 py-2.5 text-[14px] font-[600] font-public-sans whitespace-nowrap transition-colors',
              activeTab === value
                ? 'border-b-2 border-accent text-primary -mb-px'
                : 'text-muted-text hover:text-primary',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeletonRows />
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-[14px] font-public-sans text-error">Failed to load orders.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[15px] font-public-sans text-muted-text font-[500]">No orders yet</p>
          <p className="text-[13px] font-public-sans text-muted-text mt-1">
            Orders from buyers will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-surface border border-border-warm rounded overflow-hidden mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-warm">
                  {['Order #', 'Buyer', 'Status', 'Amount', 'Date', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.04em]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-[500] text-[14px] font-public-sans tabular-nums">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-public-sans text-primary">
                        {order.buyerName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="tabular-nums text-[14px] font-public-sans">
                        â‚¹{order.amount.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-text text-[13px] font-public-sans">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="text-[12px] font-[600] font-public-sans text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
                        >
                          View
                        </button>
                        {order.status === 'PROCESSING' && (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(order.id)}
                            className="text-[12px] font-[600] font-public-sans text-muted-text hover:text-primary transition-colors"
                          >
                            Dispatch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-public-sans text-muted-text">
                {total} order{total !== 1 ? 's' : ''} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  Prev
                </Button>
                <span className="text-[13px] font-public-sans text-muted-text px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order detail sheet */}
      <OrderDetailSheet
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  )
}
