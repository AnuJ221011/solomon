'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { DataTable } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMyBrandDashboard } from '@/hooks/queries/useBrands'
import { useBrandOrders, Order } from '@/hooks/queries/useOrders'
import { useShareLinks, ShareLink } from '@/hooks/queries/useShareLinks'

// ─── Types ────────────────────────────────────────────────────────────────────

const TIME_RANGES = ['30d', '90d', '12m'] as const
type TimeRange = typeof TIME_RANGES[number]

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '30d': '30 days',
  '90d': '90 days',
  '12m': '12 months',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cutoffDate(range: TimeRange): Date {
  const now = new Date()
  if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  if (range === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  // 12m
  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
}

function filterOrdersByRange(orders: Order[], range: TimeRange): Order[] {
  const cutoff = cutoffDate(range)
  return orders.filter((o) => new Date(o.createdAt) >= cutoff)
}

/** Build GMV-by-day for 30d or GMV-by-month for 90d/12m */
function buildGmvSeries(
  orders: Order[],
  range: TimeRange
): { month: string; gmv: number }[] {
  if (range === '30d') {
    const byDay: Record<string, number> = {}
    orders.forEach((o) => {
      const day = o.createdAt.slice(0, 10)
      byDay[day] = (byDay[day] ?? 0) + o.amount
    })
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, gmv]) => ({
        month: new Date(day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        gmv,
      }))
  }

  // 90d / 12m — group by YYYY-MM
  const byMonth: Record<string, number> = {}
  orders.forEach((o) => {
    const ym = o.createdAt.slice(0, 7) // "2024-11"
    byMonth[ym] = (byMonth[ym] ?? 0) + o.amount
  })
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, gmv]) => {
      const [year, month] = ym.split('-')
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-US', {
        month: 'short',
        year: range === '12m' ? '2-digit' : undefined,
      })
      return { month: label, gmv }
    })
}

/** Group order items by productName, sum quantity */
function buildTopProducts(
  orders: Order[]
): { name: string; orders: number }[] {
  const byProduct: Record<string, number> = {}
  orders.forEach((o) => {
    if (!o.items) return
    o.items.forEach((item) => {
      byProduct[item.productName] = (byProduct[item.productName] ?? 0) + item.quantity
    })
  })
  return Object.entries(byProduct)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, qty]) => ({ name, orders: qty }))
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function GmvTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#FCFAFA',
        border: '1px solid #E5E1D8',
        borderRadius: 4,
      }}
      className="p-3 shadow-[0_4px_20px_rgba(26,26,26,0.04)]"
    >
      <p className="text-[12px] font-public-sans text-muted-text">{label}</p>
      <p className="text-[16px] font-[700] font-public-sans text-primary tabular-nums mt-0.5">
        ₹{payload?.[0]?.value?.toLocaleString('en-IN') ?? '0'}
      </p>
    </div>
  )
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="w-full bg-muted-bg rounded animate-pulse"
      style={{ height }}
    />
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center bg-muted-bg rounded" style={{ height: 280 }}>
      <p className="text-[13px] font-public-sans text-muted-text">{message}</p>
    </div>
  )
}

// ─── Share link table columns ─────────────────────────────────────────────────

const SL_COLUMNS = [
  { key: 'name', label: 'Link Name', sortable: true },
  { key: 'target', label: 'Target' },
  {
    key: 'views',
    label: 'Views',
    sortable: true,
    render: (val: unknown) => (
      <span className="tabular-nums">{Number(val).toLocaleString()}</span>
    ),
  },
  {
    key: 'orders',
    label: 'Orders',
    sortable: true,
    render: (val: unknown) => <span className="tabular-nums">{String(val)}</span>,
  },
  {
    key: 'revenue',
    label: 'Revenue',
    sortable: true,
    render: (val: unknown) => (
      <span className="tabular-nums">₹{Number(val).toLocaleString('en-IN')}</span>
    ),
  },
  {
    key: 'views',
    label: 'Conv. Rate',
    render: (val: unknown, row: unknown) => {
      const l = row as ShareLink
      const rate =
        l.views > 0 ? ((l.orders / l.views) * 100).toFixed(1) + '%' : '—'
      return <span className="text-accent font-[600]">{rate}</span>
    },
  },
  {
    key: 'active',
    label: 'Status',
    render: (val: unknown) => (
      <Badge variant={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Badge>
    ),
  },
]

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border-warm rounded p-5">
      <p className="text-[12px] font-public-sans text-muted-text">{label}</p>
      <p className="text-[24px] font-[700] font-public-sans text-primary mt-1 tabular-nums leading-none">
        {value}
      </p>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 animate-pulse">
      <div className="h-3 w-24 bg-muted-bg rounded mb-3" />
      <div className="h-6 w-20 bg-muted-bg rounded" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  const { data: dashboard, isLoading: dashLoading } = useMyBrandDashboard()
  const { data: ordersData, isLoading: ordersLoading } = useBrandOrders({ limit: 100 })
  const { data: shareLinks, isLoading: slLoading } = useShareLinks()

  const allOrders = ordersData?.orders ?? []

  const filteredOrders = useMemo(
    () => filterOrdersByRange(allOrders, timeRange),
    [allOrders, timeRange]
  )

  const gmvSeries = useMemo(
    () => buildGmvSeries(filteredOrders, timeRange),
    [filteredOrders, timeRange]
  )

  const topProducts = useMemo(
    () => buildTopProducts(filteredOrders),
    [filteredOrders]
  )

  const stats = dashboard?.stats

  return (
    <div>
      {/* Header + time range */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Analytics
        </h1>
        <div className="flex items-center gap-1 bg-muted-bg rounded p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={cn(
                'px-3 py-1.5 rounded text-[12px] font-[600] font-public-sans transition-colors',
                timeRange === r
                  ? 'bg-accent text-white'
                  : 'text-muted-text hover:text-primary'
              )}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {dashLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="GMV This Month"
              value={`₹${(stats?.gmvThisMonth ?? 0).toLocaleString('en-IN')}`}
            />
            <StatCard
              label="Orders This Month"
              value={String(stats?.ordersThisMonth ?? 0)}
            />
            <StatCard
              label="Avg Order Value"
              value={`₹${(stats?.avgOrderValue ?? 0).toLocaleString('en-IN')}`}
            />
            <StatCard
              label="Commission Saved"
              value={`₹${(stats?.commissionSaved ?? 0).toLocaleString('en-IN')}`}
            />
          </>
        )}
      </div>

      {/* Row 1 — GMV trend */}
      <section className="mb-8">
        <div className="bg-surface border border-border-warm rounded p-6">
          <h2 className="text-[14px] font-[600] font-public-sans text-primary mb-6">
            GMV Over Time
          </h2>
          {ordersLoading ? (
            <ChartSkeleton />
          ) : gmvSeries.length < 2 ? (
            <EmptyChartState message="Not enough data for the selected period." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={gmvSeries} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#E5E1D8" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#444748', fontFamily: 'var(--font-public-sans)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#444748', fontFamily: 'var(--font-public-sans)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<GmvTooltip />} />
                <Area
                  type="monotone"
                  dataKey="gmv"
                  stroke="#A68B67"
                  strokeWidth={2}
                  fill="#A68B67"
                  fillOpacity={0.1}
                  dot={false}
                  activeDot={{ r: 4, fill: '#A68B67', stroke: '#FCFAFA', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Row 2 — top products + orders by country */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top products bar chart */}
        <div className="bg-surface border border-border-warm rounded p-6">
          <h2 className="text-[14px] font-[600] font-public-sans text-primary mb-6">
            Top Products by Orders
          </h2>
          {ordersLoading ? (
            <ChartSkeleton />
          ) : topProducts.length === 0 ? (
            <EmptyChartState message="No product order data available." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke="#E5E1D8" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#444748', fontFamily: 'var(--font-public-sans)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={160}
                  tick={{ fontSize: 11, fill: '#444748', fontFamily: 'var(--font-public-sans)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(166,139,103,0.06)' }}
                  contentStyle={{
                    background: '#FCFAFA',
                    border: '1px solid #E5E1D8',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-public-sans)',
                  }}
                />
                <Bar dataKey="orders" fill="#A68B67" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by country — only if buyerCountry field present */}
        <div className="bg-surface border border-border-warm rounded p-6">
          <h2 className="text-[14px] font-[600] font-public-sans text-primary mb-6">
            Orders by Country
          </h2>
          {ordersLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-40 bg-muted-bg rounded mb-2" />
                  <div className="h-1.5 w-full bg-muted-bg rounded" />
                </div>
              ))}
            </div>
          ) : (() => {
            // Group by buyerCountry if available
            const byCountry: Record<string, number> = {}
            filteredOrders.forEach((o) => {
              const c = (o as Order & { buyerCountry?: string }).buyerCountry
              if (c) byCountry[c] = (byCountry[c] ?? 0) + 1
            })
            const entries = Object.entries(byCountry)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
            const maxCount = entries[0]?.[1] ?? 1

            return entries.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-[13px] font-public-sans text-muted-text">
                  Country data not available.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map(([country, count]) => (
                  <div key={country}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[14px] font-public-sans text-primary">
                        {country}
                      </span>
                      <span className="text-[14px] font-[600] font-public-sans text-primary tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-border-warm rounded overflow-hidden">
                      <div
                        className="h-full bg-accent rounded transition-all duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </section>

      {/* Row 3 — Share link performance */}
      <section>
        <h2 className="text-[14px] font-[600] font-public-sans text-primary mb-4">
          Share Link Performance
        </h2>
        {slLoading ? (
          <div className="bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 border-b border-border-warm px-4 flex items-center gap-4">
                <div className="h-3 w-40 bg-muted-bg rounded" />
                <div className="h-3 w-16 bg-muted-bg rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : !shareLinks?.length ? (
          <div className="flex items-center justify-center py-12 bg-surface border border-border-warm rounded">
            <p className="text-[13px] font-public-sans text-muted-text">
              No share links created yet.
            </p>
          </div>
        ) : (
          <DataTable
            columns={SL_COLUMNS}
            data={
              shareLinks.map((l) => ({
                ...l,
                name: l.name ?? l.slug,
              })) as unknown as Record<string, unknown>[]
            }
            pageSize={8}
          />
        )}
      </section>
    </div>
  )
}
