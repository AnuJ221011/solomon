'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AchievementProgressBar } from '@/components/shared/AchievementProgressBar'
import { useMyBrandDashboard } from '@/hooks/queries/useBrands'
import { useAchievementProgress } from '@/hooks/queries/useAchievements'
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

type OrderRow = {
  id: string
  orderNumber: string
  buyerName: string
  status: OrderStatus
  amount: number
  createdAt: string
}

const ORDER_COLUMNS = [
  {
    key: 'orderNumber',
    label: 'Order ID',
    sortable: true,
    render: (val: unknown) => (
      <span className="font-[500] text-[14px] tabular-nums">{String(val)}</span>
    ),
  },
  { key: 'buyerName', label: 'Buyer', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => <StatusBadge status={val as OrderStatus} />,
  },
  {
    key: 'amount',
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalOverviewPage() {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useMyBrandDashboard()
  const { data: achievement, isLoading: achieveLoading } = useAchievementProgress()

  const stats = dashboard?.stats
  const recentOrders = dashboard?.recentOrders ?? []

  return (
    <div>
      {/* Page title */}
      <p className="text-[14px] leading-[1.4] font-[600] font-public-sans text-muted-text mb-6">
        Overview
      </p>

      {/* Stat cards */}
      {dashLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : dashError ? (
        <div className="mb-8 p-4 rounded border border-border-warm bg-surface">
          <p className="text-[14px] font-public-sans text-error">Failed to load dashboard stats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="GMV This Month"
            value={`₹${(stats?.gmvThisMonth ?? 0).toLocaleString('en-IN')}`}
            trend="this month"
            trendNeutral
          />
          <StatCard
            label="Orders"
            value={String(stats?.ordersThisMonth ?? 0)}
            trend="this month"
            trendNeutral
          />
          <StatCard
            label="Avg Order Value"
            value={`₹${(stats?.avgOrderValue ?? 0).toLocaleString('en-IN')}`}
            trend="per order"
            trendNeutral
          />
          <StatCard
            label="Commission Saved"
            value={`₹${(stats?.commissionSaved ?? 0).toLocaleString('en-IN')}`}
            trend="via Share Links"
            trendNeutral
          />
        </div>
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
