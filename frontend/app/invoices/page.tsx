'use client'

import { useState } from 'react'
import { FileText, Download, X, Package, Calendar, Hash } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'
import { useMyOrders, type Order, type OrderStatus } from '@/hooks/queries/useOrders'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type InvoiceStatus = 'Paid' | 'Due' | 'Disputed' | 'Void'

function getInvoiceStatus(status: OrderStatus): InvoiceStatus {
  if (status === 'DELIVERED') return 'Paid'
  if (status === 'CANCELLED') return 'Void'
  if (status === 'DISPUTED') return 'Disputed'
  return 'Due'
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  Paid:     'bg-green-50 text-green-700',
  Due:      'bg-amber-50 text-amber-700',
  Disputed: 'bg-red-50 text-red-700',
  Void:     'bg-muted-bg text-muted-text',
}

const ALL_TABS: Array<InvoiceStatus | 'All'> = ['All', 'Paid', 'Due', 'Disputed', 'Void']

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Invoice detail drawer ────────────────────────────────────────────────────

function InvoiceDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const invoiceStatus = getInvoiceStatus(order.status)
  const invoiceNumber = `INV-${order.orderNumber}`

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-primary/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-[480px] bg-white h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-warm sticky top-0 bg-white z-10">
          <div>
            <p className="font-playfair text-[18px] font-[500] text-primary">{invoiceNumber}</p>
            <p className="font-public-sans text-[12px] text-muted-text mt-0.5">Order #{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-border-warm text-[12px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors"
            >
              <Download size={12} aria-hidden="true" /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted-bg transition-colors text-muted-text"
              aria-label="Close"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="px-6 py-8 flex flex-col gap-8 flex-1">
          {/* Status + amount */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-public-sans text-[12px] text-muted-text uppercase tracking-[0.06em] mb-1">Amount</p>
              <p className="font-playfair text-[32px] font-[500] text-primary leading-none">
                {formatAmount(order.amount, order.currency)}
              </p>
            </div>
            <span className={cn('text-[12px] font-[600] font-public-sans px-2.5 py-1 rounded', STATUS_STYLES[invoiceStatus])}>
              {invoiceStatus}
            </span>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Hash, label: 'Invoice #', value: invoiceNumber },
              { icon: Calendar, label: 'Invoice Date', value: formatDate(order.createdAt) },
              { icon: Package, label: 'Order #', value: order.orderNumber },
              { icon: Calendar, label: 'Due Date', value: invoiceStatus === 'Paid' ? 'Paid' : formatDate(order.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={11} className="text-muted-text" aria-hidden="true" />
                  <span className="font-public-sans text-[11px] text-muted-text uppercase tracking-[0.05em]">{label}</span>
                </div>
                <span className="font-public-sans text-[13px] font-[500] text-primary">{value}</span>
              </div>
            ))}
          </div>

          {/* Billed to */}
          <div>
            <p className="font-public-sans text-[11px] text-muted-text uppercase tracking-[0.05em] mb-2">Billed To</p>
            <p className="font-public-sans text-[14px] font-[500] text-primary">{order.buyerName}</p>
          </div>

          {/* Line items */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="font-public-sans text-[11px] text-muted-text uppercase tracking-[0.05em] mb-3">Items</p>
              <div className="border border-border-warm rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted-bg border-b border-border-warm">
                      <th className="px-4 py-2.5 font-public-sans text-[11px] font-[600] text-muted-text">Product</th>
                      <th className="px-4 py-2.5 font-public-sans text-[11px] font-[600] text-muted-text text-right">Qty</th>
                      <th className="px-4 py-2.5 font-public-sans text-[11px] font-[600] text-muted-text text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-warm">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-public-sans text-[13px] text-primary">{item.productName}</td>
                        <td className="px-4 py-3 font-public-sans text-[13px] text-muted-text text-right">{item.quantity}</td>
                        <td className="px-4 py-3 font-public-sans text-[13px] text-primary text-right">
                          {formatAmount(item.totalPrice, order.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border-warm bg-muted-bg">
                      <td colSpan={2} className="px-4 py-3 font-public-sans text-[12px] font-[600] text-primary">Total</td>
                      <td className="px-4 py-3 font-public-sans text-[13px] font-[600] text-primary text-right">
                        {formatAmount(order.amount, order.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Row skeleton ─────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[40, 24, 24, 20, 20, 16].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className={`h-3.5 bg-muted-bg rounded w-${w === 40 ? '2/5' : w === 24 ? '24' : w === 20 ? '20' : '16'}`} />
        </td>
      ))}
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [tab, setTab] = useState<InvoiceStatus | 'All'>('All')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data, isLoading } = useMyOrders({ limit: 100 })
  const orders = data?.orders ?? []

  const filtered = tab === 'All'
    ? orders
    : orders.filter((o) => getInvoiceStatus(o.status) === tab)

  return (
    <AccountPageWrapper title="Invoices" description="Download and manage your order invoices">

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-warm">
        {ALL_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 font-public-sans text-[13px] font-[500] border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-text hover:text-primary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-border-warm rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-muted-bg border-b border-border-warm">
                {['Invoice #', 'Order #', 'Date', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 font-public-sans text-[11px] font-[600] text-muted-text uppercase tracking-[0.05em] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <p className="font-public-sans text-[14px] text-muted-text">No invoices found.</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((order) => {
                    const invoiceStatus = getInvoiceStatus(order.status)
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-muted-bg/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-muted-text flex-shrink-0" aria-hidden="true" />
                            <span className="font-public-sans text-[13px] font-[500] text-primary">
                              INV-{order.orderNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-public-sans text-[13px] text-muted-text">
                          #{order.orderNumber}
                        </td>
                        <td className="px-5 py-4 font-public-sans text-[13px] text-muted-text whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4 font-public-sans text-[13px] font-[500] text-primary whitespace-nowrap">
                          {formatAmount(order.amount, order.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('text-[11px] font-[600] font-public-sans px-2 py-0.5 rounded', STATUS_STYLES[invoiceStatus])}>
                            {invoiceStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                            className="inline-flex items-center gap-1 font-public-sans text-[12px] font-[600] text-accent hover:text-accent-hover transition-colors"
                          >
                            <Download size={12} aria-hidden="true" /> View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedOrder && (
        <InvoiceDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </AccountPageWrapper>
  )
}
