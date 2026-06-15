'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Users, ShoppingBag, CreditCard,
  AlertTriangle, TrendingUp, Clock, IndianRupee,
  Package, RotateCcw, Mail, ShoppingCart,
} from 'lucide-react'
import {
  useAdminStats,
  useAdminRevenueStats,
  useAdminLowStock,
  useAdminCategoryStats,
  useSendDigest,
  type AdminStats,
} from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(n: number | undefined | null) {
  if (n == null || isNaN(n)) return '₹0'
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: string | number; icon: React.ElementType; accent?: boolean; sub?: string
}) {
  return (
    <div className={cn('bg-surface border rounded p-5 flex flex-col gap-3', accent ? 'border-accent/30 bg-accent/[3%]' : 'border-border-warm')}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-[500] font-public-sans text-muted-text">{label}</span>
        <div className={cn('w-8 h-8 rounded flex items-center justify-center', accent ? 'bg-accent/10' : 'bg-muted-bg')}>
          <Icon size={16} className={accent ? 'text-accent' : 'text-muted-text'} aria-hidden="true" />
        </div>
      </div>
      <div>
        <p className="text-[28px] font-[600] font-playfair text-primary leading-none">{value}</p>
        {sub && <p className="text-[12px] font-public-sans text-muted-text mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 space-y-3 animate-pulse">
      <div className="flex justify-between"><div className="h-3 bg-muted-bg rounded w-24" /><div className="w-8 h-8 bg-muted-bg rounded" /></div>
      <div className="h-8 bg-muted-bg rounded w-20" />
    </div>
  )
}

// ─── Revenue chart ────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [{ days: 7, label: '7d' }, { days: 30, label: '30d' }, { days: 90, label: '90d' }]

function RevenueChart() {
  const [days, setDays] = useState(30)
  const { data = [], isLoading } = useAdminRevenueStats(days)

  const max = Math.max(...data.map((d) => d.revenue), 1)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  // Sample every Nth bar to keep X-axis readable
  const step = days <= 7 ? 1 : days <= 30 ? 5 : 10

  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[16px] font-[600] font-public-sans text-primary">Revenue Over Time</h2>
          <p className="text-[12px] font-public-sans text-muted-text mt-0.5">Non-cancelled orders, INR</p>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map(({ days: d, label }) => (
            <button key={d} type="button" onClick={() => setDays(d)}
              className={cn('h-7 px-3 rounded text-[12px] font-[600] font-public-sans transition-colors',
                days === d ? 'bg-primary text-white' : 'border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[140px] bg-muted-bg/30 rounded animate-pulse" />
      ) : (
        <div className="relative">
          {/* Bars */}
          <div className="flex items-end gap-[2px] h-[140px]">
            {data.map((bucket, i) => (
              <div key={bucket.date} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${formatDate(bucket.date)}: ${formatINR(bucket.revenue)}`}>
                <div
                  className="w-full bg-accent/30 group-hover:bg-accent rounded-t transition-colors"
                  style={{ height: `${Math.max(bucket.revenue > 0 ? 4 : 0, (bucket.revenue / max) * 100)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-primary text-white text-[11px] font-public-sans px-2 py-1 rounded whitespace-nowrap">
                    {formatDate(bucket.date)}: {formatINR(bucket.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* X-axis labels */}
          <div className="flex items-end gap-[2px] mt-1">
            {data.map((bucket, i) => (
              <div key={bucket.date} className="flex-1 text-center">
                {i % step === 0 && (
                  <span className="text-[10px] font-public-sans text-muted-text/60">{formatDate(bucket.date)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <p className="text-[12px] font-public-sans text-muted-text mt-3">
          Total: <span className="font-[600] text-primary">{formatINR(data.reduce((s, d) => s + d.revenue, 0))}</span>
        </p>
      )}
    </div>
  )
}

// ─── Low stock widget ─────────────────────────────────────────────────────────

function LowStockWidget() {
  const { data = [], isLoading } = useAdminLowStock(10)

  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[16px] font-[600] font-public-sans text-primary">Low Stock Alerts</h2>
          <p className="text-[12px] font-public-sans text-muted-text mt-0.5">Active variants with ≤10 units</p>
        </div>
        <Link href="/admin/products?availability=ACTIVE"
          className="text-[12px] font-[600] font-public-sans text-accent hover:text-accent/80 transition-colors">
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded bg-muted-bg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted-bg rounded w-36" />
                <div className="h-2.5 bg-muted-bg rounded w-20" />
              </div>
              <div className="h-5 bg-muted-bg rounded w-10" />
            </div>
          ))}
        </div>
      ) : !data.length ? (
        <div className="py-8 text-center">
          <p className="text-[13px] font-public-sans text-muted-text">All active variants are well stocked.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
          {data.map((v) => (
            <div key={v.variantId} className="flex items-center gap-3">
              {v.photoUrl
                ? <img src={v.photoUrl} alt="" className="w-8 h-8 rounded object-cover border border-border-warm flex-shrink-0" />
                : <div className="w-8 h-8 rounded bg-muted-bg border border-border-warm flex items-center justify-center flex-shrink-0"><Package size={12} className="text-muted-text" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-[600] font-public-sans text-primary truncate">{v.productName}</p>
                <p className="text-[11px] font-public-sans text-muted-text truncate">{v.brandName}{v.attributes ? ` · ${v.attributes}` : ''}</p>
              </div>
              <span className={cn(
                'text-[12px] font-[700] font-public-sans px-2 py-0.5 rounded',
                v.stock === 0 ? 'bg-error/10 text-error' : 'bg-amber-50 text-amber-700'
              )}>
                {v.stock === 0 ? 'OOS' : `${v.stock} left`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Category GMV ─────────────────────────────────────────────────────────────

function CategoryGmvWidget() {
  const { data = [], isLoading } = useAdminCategoryStats()
  const top = data.slice(0, 8)
  const maxGmv = top[0]?.gmvInr ?? 1

  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <div className="mb-4">
        <h2 className="text-[16px] font-[600] font-public-sans text-primary">GMV by Category</h2>
        <p className="text-[12px] font-public-sans text-muted-text mt-0.5">Top categories by revenue (non-cancelled orders)</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1 animate-pulse">
              <div className="flex justify-between"><div className="h-3 bg-muted-bg rounded w-28" /><div className="h-3 bg-muted-bg rounded w-14" /></div>
              <div className="h-2 bg-muted-bg rounded w-full" />
            </div>
          ))}
        </div>
      ) : !top.length ? (
        <div className="py-8 text-center">
          <p className="text-[13px] font-public-sans text-muted-text">No order data yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {top.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-[500] font-public-sans text-primary truncate max-w-[180px]">{cat.category || 'Uncategorised'}</span>
                <span className="text-[12px] font-[600] font-public-sans text-primary ml-2 flex-shrink-0">{formatINR(cat.gmvInr)}</span>
              </div>
              <div className="h-1.5 bg-muted-bg rounded overflow-hidden">
                <div className="h-full bg-accent rounded transition-all" style={{ width: `${(cat.gmvInr / maxGmv) * 100}%` }} />
              </div>
              <p className="text-[11px] font-public-sans text-muted-text mt-0.5">{cat.unitsSold.toLocaleString()} units sold</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminStats()
  const sendDigest = useSendDigest()

  const cards = stats ? [
    { label: 'Total Brands', value: stats.totalBrands, icon: Building2 },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, accent: stats.pendingApprovals > 0, sub: stats.pendingApprovals > 0 ? 'Needs review' : 'All clear' },
    { label: 'Total Buyers', value: stats.totalBuyers, icon: Users },
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag },
    { label: 'Platform GMV', value: formatINR(stats.totalGMV), icon: TrendingUp, accent: true, sub: 'All time' },
    { label: 'Open Disputes', value: stats.openDisputes, icon: AlertTriangle, accent: stats.openDisputes > 0, sub: stats.openDisputes > 0 ? 'Needs attention' : 'None open' },
    { label: 'Pending Payouts', value: stats.pendingPayouts, icon: CreditCard },
    { label: 'Payout Value', value: formatINR(stats.pendingPayoutsValue), icon: IndianRupee, accent: stats.pendingPayoutsValue > 0, sub: 'Awaiting disbursement' },
  ] : []

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">Admin Overview</h1>
          <p className="text-[14px] font-public-sans text-muted-text mt-1">Platform health at a glance</p>
        </div>
        <button
          type="button"
          onClick={() => sendDigest.mutate()}
          disabled={sendDigest.isPending}
          className={cn(
            'flex items-center gap-2 h-9 px-4 rounded border text-[13px] font-[600] font-public-sans transition-colors',
            'border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-50'
          )}
        >
          <Mail size={14} aria-hidden="true" />
          {sendDigest.isPending ? 'Sending…' : 'Send Weekly Digest'}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />) : cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Revenue chart — full width */}
      <RevenueChart />

      {/* Two-column: low stock + category GMV */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LowStockWidget />
        <CategoryGmvWidget />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/pending-brands', label: 'Review Brands', icon: Clock },
          { href: '/admin/orders', label: 'All Orders', icon: ShoppingCart },
          { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
          { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2.5 p-4 bg-surface border border-border-warm rounded hover:border-primary/30 hover:bg-muted-bg transition-colors">
            <Icon size={16} className="text-muted-text flex-shrink-0" aria-hidden="true" />
            <span className="text-[13px] font-[600] font-public-sans text-primary">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
