'use client'

import {
  Building2,
  Users,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
  IndianRupee,
} from 'lucide-react'
import { useAdminStats, type AdminStats } from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: boolean
  sub?: string
}) {
  return (
    <div
      className={cn(
        'bg-surface border rounded p-5 flex flex-col gap-3',
        accent ? 'border-accent/30 bg-accent/[3%]' : 'border-border-warm'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-[500] font-public-sans text-muted-text">{label}</span>
        <div
          className={cn(
            'w-8 h-8 rounded flex items-center justify-center',
            accent ? 'bg-accent/10' : 'bg-muted-bg'
          )}
        >
          <Icon size={16} className={accent ? 'text-accent' : 'text-muted-text'} aria-hidden="true" />
        </div>
      </div>
      <div>
        <p className="text-[28px] font-[700] font-playfair text-primary leading-none">{value}</p>
        {sub && <p className="text-[12px] font-public-sans text-muted-text mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 bg-muted-bg rounded w-24" />
        <div className="w-8 h-8 bg-muted-bg rounded" />
      </div>
      <div className="h-8 bg-muted-bg rounded w-20" />
    </div>
  )
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatINR(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminStats()

  const cards = stats
    ? [
        {
          label: 'Total Brands',
          value: stats.totalBrands,
          icon: Building2,
        },
        {
          label: 'Pending Approvals',
          value: stats.pendingApprovals,
          icon: Clock,
          accent: stats.pendingApprovals > 0,
          sub: stats.pendingApprovals > 0 ? 'Needs review' : 'All clear',
        },
        {
          label: 'Total Buyers',
          value: stats.totalBuyers,
          icon: Users,
        },
        {
          label: 'Total Orders',
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingBag,
        },
        {
          label: 'Platform GMV',
          value: formatINR(stats.totalGMV),
          icon: TrendingUp,
          accent: true,
          sub: 'All time',
        },
        {
          label: 'Open Disputes',
          value: stats.openDisputes,
          icon: AlertTriangle,
          accent: stats.openDisputes > 0,
          sub: stats.openDisputes > 0 ? 'Needs attention' : 'None open',
        },
        {
          label: 'Pending Payouts',
          value: stats.pendingPayouts,
          icon: CreditCard,
        },
        {
          label: 'Payout Value',
          value: formatINR(stats.pendingPayoutsValue),
          icon: IndianRupee,
          accent: stats.pendingPayoutsValue > 0,
          sub: 'Awaiting disbursement',
        },
      ]
    : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">
          Admin Overview
        </h1>
        <p className="text-[14px] font-public-sans text-muted-text mt-1">
          Platform health at a glance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  )
}
