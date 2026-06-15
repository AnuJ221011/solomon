'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Download, AlertTriangle } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useMyOrders, useOrder } from '@/hooks/queries/useOrders'
import { useFormatPrice } from '@/components/ui/Price'
import type { Order, OrderStatus } from '@/hooks/queries/useOrders'

type FilterTab = 'All' | 'PENDING' | 'DISPATCHED' | 'DELIVERED' | 'DISPUTED'

const FILTER_TABS: FilterTab[] = ['All', 'PENDING', 'DISPATCHED', 'DELIVERED', 'DISPUTED']

const TAB_LABELS: Record<FilterTab, string> = {
  All: 'All',
  PENDING: 'Pending',
  DISPATCHED: 'In Transit',
  DELIVERED: 'Delivered',
  DISPUTED: 'Disputed',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const TIMELINE_STEPS: OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED']

function getStepIndex(status: OrderStatus): number {
  return TIMELINE_STEPS.indexOf(status)
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border-warm">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted-bg rounded animate-pulse w-20" />
        </td>
      ))}
    </tr>
  )
}

function OrderDetailSheet({
  orderId,
  open,
  onClose,
}: {
  orderId: string | null
  open: boolean
  onClose: () => void
}) {
  const fmt = useFormatPrice()
  const { data: order, isLoading } = useOrder(orderId)

  const reachedIndex = order ? getStepIndex(order.status) : -1
  const isCancelledOrDisputed =
    order?.status === 'CANCELLED' || order?.status === 'DISPUTED'

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" className="overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {order ? `Order ${order.orderNumber}` : 'Order Details'}
          </SheetTitle>
          <SheetClose />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded bg-muted-bg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted-bg rounded w-3/4" />
                    <div className="h-3 bg-muted-bg rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {order && (
            <>
              <section>
                <h3 className="text-[14px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-4">
                  Items
                </h3>
                <div className="space-y-3">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded border border-border-warm bg-muted-bg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-public-sans text-muted-text">IMG</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-[600] font-public-sans text-primary leading-tight truncate">
                            {item.productName}
                          </p>
                          <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                            Qty {item.quantity}
                          </p>
                        </div>
                        <p className="text-[14px] font-[600] font-public-sans text-primary flex-shrink-0">
                          {fmt(item.totalPrice ?? item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded border border-border-warm bg-muted-bg flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-[14px] font-[600] font-public-sans text-primary">
                          Wholesale Order
                        </p>
                      </div>
                      <p className="text-[14px] font-[600] font-public-sans text-primary">
                        {fmt(order.amount)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border-warm flex justify-between">
                  <span className="text-[14px] font-[600] font-public-sans text-muted-text">Total</span>
                  <span className="text-[16px] font-[600] font-public-sans text-primary">
                    {fmt(order.amount)}
                  </span>
                </div>
              </section>

              {!isCancelledOrDisputed && (
                <section>
                  <h3 className="text-[14px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-4">
                    Status Timeline
                  </h3>
                  <ol className="space-y-4">
                    {TIMELINE_STEPS.map((step, i) => {
                      const reached = reachedIndex >= i
                      const isCurrent = reachedIndex === i
                      return (
                        <li key={step} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {reached ? (
                              <CheckCircle
                                size={18}
                                aria-hidden="true"
                                className={isCurrent ? 'text-accent' : 'text-success'}
                              />
                            ) : (
                              <Circle size={18} aria-hidden="true" className="text-border-warm" />
                            )}
                          </div>
                          <div>
                            <p
                              className={cn(
                                'text-[14px] font-[600] font-public-sans',
                                reached
                                  ? isCurrent
                                    ? 'text-accent'
                                    : 'text-primary'
                                  : 'text-muted-text'
                              )}
                            >
                              {step ? step.charAt(0) + step.slice(1).toLowerCase() : '—'}
                            </p>
                            {step === 'CONFIRMED' && order.createdAt && (
                              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                                {formatDate(order.createdAt)}
                              </p>
                            )}
                            {step === 'DISPATCHED' && order.dispatchedAt && (
                              <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                                {formatDate(order.dispatchedAt)}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )}

              {isCancelledOrDisputed && (
                <div className="flex items-start gap-3 bg-error/[6%] border border-error/20 rounded p-4">
                  <AlertTriangle size={16} className="text-error flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-[14px] font-[600] font-public-sans text-error">
                      Order {order.status === 'CANCELLED' ? 'Cancelled' : 'Disputed'}
                    </p>
                    <p className="text-[12px] font-public-sans text-muted-text mt-0.5">
                      {order.status === 'DISPUTED'
                        ? 'A dispute has been raised for this order. Our support team will reach out within 24 hours.'
                        : 'This order was cancelled. Any payment will be refunded within 5-7 business days.'}
                    </p>
                  </div>
                </div>
              )}

              {order.trackingNumber && (
                <section>
                  <h3 className="text-[14px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-2">
                    Tracking
                  </h3>
                  <p className="text-[13px] font-[500] font-public-sans text-primary bg-muted-bg border border-border-warm rounded px-3 py-2 inline-block">
                    {order.trackingNumber}
                  </p>
                </section>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" size="sm" className="gap-1.5" disabled title="Coming soon">
                  <Download size={13} aria-hidden="true" />
                  Invoice
                </Button>
                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                  <Button variant="destructive" size="sm">
                    Report Issue
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function OrdersPage() {
  const fmt = useFormatPrice()
  const [activeTab, setActiveTab] = useState<FilterTab>('All')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const statusParam = activeTab === 'All' ? undefined : activeTab

  const { data, isLoading } = useMyOrders({ status: statusParam, limit: 20 })

  const orders = data?.orders ?? []
  const total = data?.total ?? 0

  function openOrder(id: string) {
    setSelectedOrderId(id)
    setSheetOpen(true)
  }

  return (
    <AccountPageWrapper>
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Order History
        </h1>
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
          {isLoading ? 'Loading...' : `${total} order${total === 1 ? '' : 's'} to date`}
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border-warm overflow-x-auto pb-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-[14px] font-[600] font-public-sans whitespace-nowrap',
              'border-b-[2px] transition-colors duration-150 -mb-px',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-text hover:text-primary'
            )}
            aria-selected={activeTab === tab}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="border border-border-warm rounded bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-warm bg-muted-bg/40">
                {['Order #', 'Brand', 'Status', 'Items', 'Amount', 'Date', 'Tracking', 'Invoice'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-0 text-center">
                    <EmptyState
                      title="No orders yet"
                      description="Place your first wholesale order with an Indian artisan brand."
                      action={{
                        label: 'Browse the Catalogue',
                        onClick: () => { window.location.href = '/catalogue' },
                      }}
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order: Order) => {
                  const brandName =
                    order.items && order.items.length > 0
                      ? order.items[0].productName
                      : 'Solomon Bharat'
                  const itemCount =
                    order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0

                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrder(order.id)}
                      className="border-b border-border-warm last:border-0 cursor-pointer hover:bg-muted-bg/30 transition-colors duration-100"
                    >
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-[600] font-public-sans text-primary">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-public-sans text-primary">{brandName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-public-sans text-muted-text">
                          {itemCount > 0 ? `${itemCount} items` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-[600] font-public-sans text-primary">
                          {fmt(order.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-public-sans text-muted-text whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-public-sans text-muted-text">
                          {order.trackingNumber ?? 'Awaiting dispatch'}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="gap-1" disabled title="Coming soon">
                          <Download size={12} aria-hidden="true" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDetailSheet
        orderId={selectedOrderId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </AccountPageWrapper>
  )
}
