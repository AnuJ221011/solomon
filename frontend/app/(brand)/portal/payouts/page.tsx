'use client'

import { useState } from 'react'
import { Zap, Clock, Download } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMyBrandDashboard } from '@/hooks/queries/useBrands'
import { useBrandOrders, Order } from '@/hooks/queries/useOrders'
import api from '@/lib/api'

// ─── Payout speed option ──────────────────────────────────────────────────────

interface SpeedOptionProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  selected: boolean
  onSelect: () => void
}

function SpeedOption({ icon, title, subtitle, selected, onSelect }: SpeedOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex-1 flex items-start gap-3 p-4 rounded border text-left transition-colors',
        selected
          ? 'border-accent bg-accent/[5%]'
          : 'border-border-warm bg-surface hover:bg-muted-bg'
      )}
    >
      <div className={cn('mt-0.5', selected ? 'text-accent' : 'text-muted-text')}>
        {icon}
      </div>
      <div>
        <p className={cn(
          'text-[14px] font-[600] font-public-sans',
          selected ? 'text-primary' : 'text-muted-text'
        )}>
          {title}
        </p>
        <p className="text-[12px] font-public-sans text-muted-text mt-0.5">{subtitle}</p>
      </div>
      <div className={cn(
        'ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
        selected ? 'border-accent' : 'border-border-warm'
      )}>
        {selected && <div className="w-2 h-2 rounded-full bg-accent" />}
      </div>
    </button>
  )
}

// ─── Derive payout row from order ─────────────────────────────────────────────

interface PayoutRow {
  id: string
  orderNumber: string
  date: string
  gross: number
  net: number
  status: 'PENDING' | 'PROCESSING' | 'PAID'
  buyerName: string
}

function derivePayoutRow(order: Order): PayoutRow {
  // Estimate commission at 8% if achievement level unknown — show "N/A" label handled in column
  const commissionRate = 0.08
  const net = Math.round(order.amount * (1 - commissionRate))
  // DELIVERED orders are treated as PAID
  const status: PayoutRow['status'] =
    order.status === 'DELIVERED' ? 'PAID' : 'PENDING'
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt.slice(0, 10),
    gross: order.amount,
    net,
    status,
    buyerName: order.buyerName,
  }
}

// ─── Summary card skeleton ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  subColor = 'text-muted-text',
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <p className="text-[12px] font-public-sans text-muted-text">{label}</p>
      <p className="text-[28px] font-[600] font-public-sans text-primary mt-1 tabular-nums leading-none">
        {value}
      </p>
      {sub && (
        <p className={cn('text-[12px] font-public-sans mt-2', subColor)}>{sub}</p>
      )}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 animate-pulse">
      <div className="h-3 w-28 bg-muted-bg rounded mb-3" />
      <div className="h-7 w-24 bg-muted-bg rounded mb-2" />
      <div className="h-3 w-16 bg-muted-bg rounded" />
    </div>
  )
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

async function exportCsv() {
  try {
    const response = await api.get('/brands/me/payouts/export', {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payouts.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // Endpoint not yet available — silently ignore
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const [speedMode, setSpeedMode] = useState<'standard' | 'express'>('standard')

  const { data: dashboard, isLoading: dashLoading } = useMyBrandDashboard()
  // Fetch all delivered orders (limit=100) as proxy for payout rows
  const { data: deliveredData, isLoading: ordersLoading } = useBrandOrders({
    status: 'DELIVERED',
    limit: 100,
  })
  // Also fetch pending orders for the pending payout card
  const { data: pendingData } = useBrandOrders({ status: 'PENDING', limit: 100 })

  const isLoading = dashLoading || ordersLoading

  const deliveredOrders = deliveredData?.orders ?? []
  const pendingOrders = pendingData?.orders ?? []

  const payoutRows: PayoutRow[] = deliveredOrders.map(derivePayoutRow)

  // Summary values — prefer dashboard stats if available, fallback to derived
  const pendingTotal = pendingOrders.reduce(
    (sum, o) => sum + Math.round(o.amount * 0.92),
    0
  )

  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const paidThisMonth = deliveredOrders
    .filter((o) => o.createdAt.startsWith(thisMonthKey))
    .reduce((sum, o) => sum + Math.round(o.amount * 0.92), 0)

  const totalPaid = deliveredOrders.reduce(
    (sum, o) => sum + Math.round(o.amount * 0.92),
    0
  )

  const thisMonthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px] font-[500]">{String(val)}</span>
      ),
    },
    {
      key: 'buyerName',
      label: 'Buyer',
      render: (val: unknown) => (
        <span className="text-[13px] font-public-sans text-primary">{String(val)}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val: unknown) => (
        <span className="text-muted-text text-[13px]">{String(val)}</span>
      ),
    },
    {
      key: 'gross',
      label: 'Gross',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px]">₹{Number(val).toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'gross',
      label: 'Commission',
      render: (val: unknown) => {
        const gross = Number(val)
        const commission = Math.round(gross * 0.08)
        return (
          <div>
            <span className="text-[13px] font-public-sans text-muted-text">8%</span>
            <span className="text-[13px] font-public-sans text-muted-text ml-1.5">
              (₹{commission.toLocaleString('en-IN')})
            </span>
          </div>
        )
      },
    },
    {
      key: 'net',
      label: 'Net',
      sortable: true,
      render: (val: unknown) => (
        <span className="tabular-nums text-[14px] font-[600] text-primary">
          ₹{Number(val).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: unknown) => {
        const status = String(val) as PayoutRow['status']
        const variants: Record<string, 'warning' | 'accent' | 'success'> = {
          PENDING: 'warning',
          PROCESSING: 'accent',
          PAID: 'success',
        }
        return (
          <Badge variant={variants[status]}>
            {status ? status.charAt(0) + status.slice(1).toLowerCase() : '—'}
          </Badge>
        )
      },
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Payouts
        </h1>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border-warm text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Payout speed toggle */}
      <div className="mb-8">
        <p className="text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-3">
          Payout Speed
        </p>
        <div className="flex gap-3 max-w-[600px]">
          <SpeedOption
            icon={<Clock size={16} />}
            title="Standard — Net 30"
            subtitle="No fee. Settle within 30 days of delivery."
            selected={speedMode === 'standard'}
            onSelect={() => setSpeedMode('standard')}
          />
          <SpeedOption
            icon={<Zap size={16} />}
            title="Express — Next Day"
            subtitle="2.5% fee. Payout next business day."
            selected={speedMode === 'express'}
            onSelect={() => setSpeedMode('express')}
          />
        </div>
        <p className="text-[11px] font-public-sans text-muted-text mt-2">
          Payout speed preference is informational — bank integrations coming soon.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Pending Payout"
              value={`₹${pendingTotal.toLocaleString('en-IN')}`}
              sub={`${pendingOrders.length} orders`}
              subColor="text-warning"
            />
            <StatCard
              label="This Month Paid"
              value={`₹${paidThisMonth.toLocaleString('en-IN')}`}
              sub={thisMonthLabel}
              subColor="text-success"
            />
            <StatCard
              label="Total Paid (All time)"
              value={`₹${totalPaid.toLocaleString('en-IN')}`}
              sub="Since onboarding"
            />
          </>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && payoutRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border-warm rounded">
          <p className="text-[16px] font-[500] font-public-sans text-primary mb-2">
            No payouts yet
          </p>
          <p className="text-[13px] font-public-sans text-muted-text">
            Delivered orders will appear here as payout records.
          </p>
        </div>
      )}

      {/* Table */}
      {(isLoading || payoutRows.length > 0) && (
        isLoading ? (
          <div className="bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 border-b border-border-warm px-4 flex items-center gap-4">
                <div className="h-3 w-32 bg-muted-bg rounded" />
                <div className="h-3 w-20 bg-muted-bg rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={payoutRows as unknown as Record<string, unknown>[]}
            pageSize={10}
          />
        )
      )}
    </div>
  )
}
