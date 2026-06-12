'use client'

import { useState } from 'react'
import { CheckCircle, Download, CreditCard } from 'lucide-react'
import {
  useAdminPayouts,
  useMarkPayoutPaid,
  useBulkMarkPayoutsPaid,
  type AdminPayout,
} from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { toast } from 'sonner'

// â”€â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }: { status: AdminPayout['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans',
        status === 'PAID' && 'bg-success/10 text-success',
        status === 'PROCESSING' && 'bg-accent/10 text-accent',
        status === 'PENDING' && 'bg-warning/10 text-warning'
      )}
    >
      {status}
    </span>
  )
}

// â”€â”€â”€ Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PayoutRow({
  payout,
  selected,
  onToggle,
}: {
  payout: AdminPayout
  selected: boolean
  onToggle: () => void
}) {
  const markPaid = useMarkPayoutPaid()
  const isPaid = payout.status === 'PAID'

  return (
    <tr className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors">
      <td className="py-3.5 pl-4 pr-2 w-10">
        {!isPaid && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select payout ${payout.orderNumber}`}
            className="w-4 h-4 rounded border-border-warm accent-accent cursor-pointer"
          />
        )}
      </td>
      <td className="py-3.5 px-4">
        <div>
          <p className="text-[13px] font-[600] font-public-sans text-primary">
            #{payout.orderNumber}
          </p>
          {payout.isShareLink && (
            <span className="text-[10px] font-public-sans text-accent">via share link</span>
          )}
        </div>
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">
        {payout.brandName}
      </td>
      <td className="py-3.5 px-4 text-right text-[13px] font-public-sans text-muted-text">
        â‚¹{payout.grossAmount.toLocaleString('en-IN')}
      </td>
      <td className="py-3.5 px-4 text-right text-[13px] font-public-sans text-muted-text">
        {(payout.commissionRate * 100).toFixed(0)}% Â· â‚¹{payout.commissionAmount.toLocaleString('en-IN')}
      </td>
      <td className="py-3.5 px-4 text-right text-[13px] font-[600] font-public-sans text-primary">
        â‚¹{payout.netAmount.toLocaleString('en-IN')}
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={payout.status} />
      </td>
      <td className="py-3.5 px-4 text-[12px] font-public-sans text-muted-text">
        {new Date(payout.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </td>
      <td className="py-3.5 px-4 text-right">
        {!isPaid && (
          <button
            type="button"
            onClick={() => markPaid.mutate({ id: payout.id })}
            disabled={markPaid.isPending}
            aria-label={`Mark payout ${payout.orderNumber} as paid`}
            className={cn(
              'flex items-center gap-1.5 h-7 px-2.5 rounded border text-[11px] font-[600] font-public-sans transition-colors ml-auto',
              'border-success/40 text-success bg-success/5 hover:bg-success/10',
              'disabled:opacity-50'
            )}
          >
            <CheckCircle size={12} aria-hidden="true" />
            Mark Paid
          </button>
        )}
      </td>
    </tr>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const isPaid = tab === 'ALL' ? undefined : false
  const { data, isLoading } = useAdminPayouts({ isPaid, page, limit: 20 })
  const bulkPaid = useBulkMarkPayoutsPaid()

  const payouts = data?.payouts ?? []
  const pendingPayouts = payouts.filter((p) => p.status !== 'PAID')

  const allPendingSelected =
    pendingPayouts.length > 0 && pendingPayouts.every((p) => selected.has(p.id))

  function toggleAll() {
    if (allPendingSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingPayouts.map((p) => p.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleExport() {
    try {
      const res = await api.get('/admin/payouts/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed.')
    }
  }

  function handleBulkPaid() {
    bulkPaid.mutate(
      { payoutIds: Array.from(selected) },
      { onSuccess: () => setSelected(new Set()) }
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">
            Payouts
          </h1>
          <p className="text-[14px] font-public-sans text-muted-text mt-1">
            Manage brand disbursements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleBulkPaid}
              disabled={bulkPaid.isPending}
              className={cn(
                'flex items-center gap-2 h-9 px-4 rounded border text-[13px] font-[600] font-public-sans transition-colors',
                'border-success/50 text-success bg-success/5 hover:bg-success/10 disabled:opacity-50'
              )}
            >
              <CheckCircle size={14} aria-hidden="true" />
              Mark {selected.size} Paid
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className={cn(
              'flex items-center gap-2 h-9 px-4 rounded border text-[13px] font-[600] font-public-sans transition-colors',
              'border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg'
            )}
          >
            <Download size={14} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-warm">
        {(['PENDING', 'ALL'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setSelected(new Set()); setPage(1) }}
            className={cn(
              'px-4 py-2.5 text-[13px] font-[600] font-public-sans border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-text hover:text-primary'
            )}
          >
            {t === 'PENDING' ? 'Pending' : 'All Payouts'}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted-bg rounded w-24" />
                  <div className="h-3 bg-muted-bg rounded w-32" />
                </div>
                <div className="h-6 bg-muted-bg rounded w-16" />
              </div>
            ))}
          </div>
        ) : !payouts.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <CreditCard size={22} className="text-muted-text" aria-hidden="true" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">
              No {tab === 'PENDING' ? 'pending ' : ''}payouts
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-warm bg-muted-bg/40">
                  <th className="py-3 pl-4 pr-2 w-10">
                    {pendingPayouts.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={toggleAll}
                        aria-label="Select all pending payouts"
                        className="w-4 h-4 rounded border-border-warm accent-accent cursor-pointer"
                      />
                    )}
                  </th>
                  {['Order', 'Brand', 'Gross', 'Commission', 'Net', 'Status', 'Date', ''].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        'py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]',
                        ['Gross', 'Commission', 'Net'].includes(h) ? 'text-right' : 'text-left'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <PayoutRow
                    key={p.id}
                    payout={p}
                    selected={selected.has(p.id)}
                    onToggle={() => toggleOne(p.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
