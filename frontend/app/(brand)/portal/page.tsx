'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Clock, Truck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AchievementProgressBar } from '@/components/shared/AchievementProgressBar'
import { useMyBrandDashboard } from '@/hooks/queries/useBrands'
import { useAchievementProgress } from '@/hooks/queries/useAchievements'
import api from '@/lib/api'
import type { OrderStatus, AchievementCriteria } from '@/types'

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  trend: string
  trendUp?: boolean
  trendNeutral?: boolean
}

function StatCard({ label, value, trend, trendUp, trendNeutral }: StatCardProps) {
  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <p className="text-[12px] leading-[1.3] font-public-sans text-muted-text">{label}</p>
      <p className="text-[28px] font-[600] font-public-sans text-primary mt-1 leading-none tabular-nums">
        {value}
      </p>
      <div className={`flex items-center gap-1 mt-2 text-[12px] font-[600] font-public-sans ${
        trendNeutral ? 'text-accent' : trendUp ? 'text-success' : 'text-error'
      }`}>
        {!trendNeutral && (
          trendUp
            ? <TrendingUp size={12} aria-hidden="true" />
            : <TrendingDown size={12} aria-hidden="true" />
        )}
        <span>{trend}</span>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 animate-pulse">
      <div className="h-3 bg-muted-bg rounded w-1/2 mb-2" />
      <div className="h-8 bg-muted-bg rounded w-2/3 mb-2" />
      <div className="h-3 bg-muted-bg rounded w-1/3" />
    </div>
  )
}

// ─── Table columns ────────────────────────────────────────────────────────────

// Brand orders API returns totalInr (not amount) and buyer as a nested object

const ORDER_COLUMNS = [
  {
    key: 'orderNumber',
    label: 'Order ID',
    sortable: true,
    render: (val: unknown) => (
      <span className="font-[500] text-[14px] tabular-nums">{String(val)}</span>
    ),
  },
  {
    key: 'buyer',
    label: 'Buyer',
    render: (val: unknown) => {
      const b = val as { name?: string; buyerProfile?: { businessName?: string } } | null
      return <span className="text-[14px]">{b?.buyerProfile?.businessName ?? b?.name ?? '—'}</span>
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => <StatusBadge status={val as OrderStatus} />,
  },
  {
    key: 'totalInr',
    label: 'Amount',
    sortable: true,
    render: (val: unknown) => (
      <span className="tabular-nums text-[14px]">
        ₹{Number(val).toLocaleString('en-IN')}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Date',
    render: (val: unknown) => (
      <span className="text-muted-text text-[13px]">
        {new Date(String(val)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
]

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyOrders() {
  return (
    <div className="py-12 text-center">
      <p className="text-[15px] font-public-sans text-muted-text">No recent orders yet.</p>
      <p className="text-[13px] font-public-sans text-muted-text mt-1">
        Orders from buyers will appear here.
      </p>
    </div>
  )
}

// ─── Trend helpers ────────────────────────────────────────────────────────────

function momTrend(current: number, prev: number): { label: string; up: boolean; neutral: boolean } {
  if (prev === 0 && current === 0) return { label: 'No data yet', up: false, neutral: true }
  if (prev === 0) return { label: 'New this period', up: true, neutral: false }
  const pct = ((current - prev) / prev) * 100
  const sign = pct >= 0 ? '+' : ''
  return { label: `${sign}${pct.toFixed(0)}% vs last month`, up: pct >= 0, neutral: false }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalOverviewPage() {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useMyBrandDashboard()
  const { data: achievement, isLoading: achieveLoading } = useAchievementProgress()

  const stats = dashboard?.stats
  const recentOrders = dashboard?.recentOrders ?? []

  const gmvTrend    = momTrend(stats?.gmvThisMonth ?? 0, stats?.gmvLastMonth ?? 0)
  const ordersTrend = momTrend(stats?.ordersThisMonth ?? 0, stats?.ordersLastMonth ?? 0)

  const { data: pendingCount = 0 } = useQuery<number>({
    queryKey: ['brand-orders-count', 'PENDING'],
    queryFn: async () => {
      const r = await api.get('/orders/brand', { params: { status: 'PENDING', limit: 1 } })
      const payload = r.data.data
      return r.data.meta?.total ?? payload?.total ?? (payload?.orders ?? payload ?? []).length
    },
    staleTime: 60 * 1000,
  })

  const { data: confirmedCount = 0 } = useQuery<number>({
    queryKey: ['brand-orders-count', 'CONFIRMED'],
    queryFn: async () => {
      const r = await api.get('/orders/brand', { params: { status: 'CONFIRMED', limit: 1 } })
      const payload = r.data.data
      return r.data.meta?.total ?? payload?.total ?? (payload?.orders ?? payload ?? []).length
    },
    staleTime: 60 * 1000,
  })

  const hasActions = pendingCount > 0 || confirmedCount > 0

  return (
    <div>
      {/* Page title */}
      <p className="text-[14px] leading-[1.4] font-[600] font-public-sans text-muted-text mb-6">
        Overview
      </p>

      {/* Stat cards */}
      {dashLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : dashError ? (
        <div className="mb-8 p-4 rounded border border-border-warm bg-surface">
          <p className="text-[14px] font-public-sans text-error">Failed to load dashboard stats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="GMV This Month"
            value={`₹${(stats?.gmvThisMonth ?? 0).toLocaleString('en-IN')}`}
            trend={gmvTrend.label}
            trendUp={gmvTrend.up}
            trendNeutral={gmvTrend.neutral}
          />
          <StatCard
            label="Orders"
            value={String(stats?.ordersThisMonth ?? 0)}
            trend={ordersTrend.label}
            trendUp={ordersTrend.up}
            trendNeutral={ordersTrend.neutral}
          />
          <StatCard
            label="Avg Order Value"
            value={`₹${(stats?.avgOrderValue ?? 0).toLocaleString('en-IN')}`}
            trend="per order"
            trendNeutral
          />
          <StatCard
            label="Pending Payout"
            value={`₹${(stats?.pendingPayoutInr ?? 0).toLocaleString('en-IN')}`}
            trend="awaiting settlement"
            trendNeutral
          />
          <StatCard
            label="Avg Rating"
            value={(stats?.avgRating ?? 0) > 0 ? (stats!.avgRating).toFixed(1) : '—'}
            trend="out of 5.0"
            trendNeutral
          />
        </div>
      )}

      {/* Pending actions */}
      {hasActions && (
        <section className="mb-8">
          <div className="border border-amber-200 bg-amber-50/60 rounded divide-y divide-amber-100">
            {pendingCount > 0 && (
              <div className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-3">
                  <Clock size={15} className="text-amber-500 flex-shrink-0" aria-hidden="true" />
                  <p className="font-public-sans text-[14px] font-[600] text-primary">
                    {pendingCount} order{pendingCount !== 1 ? 's' : ''}{' '}
                    <span className="font-[400] text-muted-text">awaiting your confirmation</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className="flex-shrink-0 text-amber-700 hover:text-amber-800 hover:bg-amber-100">
                  <Link href="/portal/orders">Review →</Link>
                </Button>
              </div>
            )}
            {confirmedCount > 0 && (
              <div className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-3">
                  <Truck size={15} className="text-amber-500 flex-shrink-0" aria-hidden="true" />
                  <p className="font-public-sans text-[14px] font-[600] text-primary">
                    {confirmedCount} order{confirmedCount !== 1 ? 's' : ''}{' '}
                    <span className="font-[400] text-muted-text">confirmed and ready to dispatch</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className="flex-shrink-0 text-amber-700 hover:text-amber-800 hover:bg-amber-100">
                  <Link href="/portal/orders">Dispatch →</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary">
            Recent Orders
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/orders">View all</Link>
          </Button>
        </div>

        {dashLoading ? (
          <div className="bg-surface border border-border-warm rounded animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-border-warm last:border-0">
                <div className="h-4 bg-muted-bg rounded w-1/5" />
                <div className="h-4 bg-muted-bg rounded w-1/4" />
                <div className="h-4 bg-muted-bg rounded w-1/6" />
                <div className="h-4 bg-muted-bg rounded w-1/6" />
                <div className="h-4 bg-muted-bg rounded w-1/8" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <DataTable
            columns={ORDER_COLUMNS}
            data={recentOrders as unknown as Record<string, unknown>[]}
            pageSize={8}
          />
        )}
      </section>

      {/* Achievement progress */}
      <section>
        <h2 className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary mb-4">
          Achievement Progress
        </h2>

        {achieveLoading ? (
          <div className="bg-surface border border-border-warm rounded p-6 animate-pulse">
            <div className="h-5 bg-muted-bg rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted-bg rounded w-1/2 mb-6" />
            <div className="h-2 bg-muted-bg rounded w-full mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted-bg rounded w-3/4 mb-2" />
            ))}
          </div>
        ) : achievement ? (
          <div className="bg-surface border border-border-warm rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[18px] font-[400] font-public-sans text-primary">
                  Level {achievement.level} —{' '}
                  <span className="text-accent font-[600]">{achievement.name}</span>
                </p>
                <p className="text-[13px] font-public-sans text-muted-text mt-0.5">
                  {achievement.nextLevelName
                    ? `Complete criteria below to unlock ${achievement.nextLevelName} status`
                    : 'You have reached the highest level'}
                </p>
              </div>
              {achievement.nextLevelName && (
                <div className="text-right">
                  <p className="text-[12px] font-public-sans text-muted-text">Next level</p>
                  <p className="text-[16px] font-[600] font-public-sans text-primary">
                    {achievement.nextLevelName}
                  </p>
                </div>
              )}
            </div>
            <AchievementProgressBar
              currentLevel={achievement.level as 1 | 2 | 3 | 4 | 5}
              criteria={achievement.criteria as AchievementCriteria[]}
              nextLevelName={achievement.nextLevelName ?? ''}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
