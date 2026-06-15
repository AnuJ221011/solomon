'use client'

import { useState } from 'react'
import { RotateCcw, CheckCircle, XCircle, RefreshCw, Tag } from 'lucide-react'
import {
  useAdminReturns,
  useApproveReturn,
  useRejectReturn,
  useRefundReturn,
  useIssueReturnLabel,
  type AdminReturn,
} from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<AdminReturn['status'], string> = {
  REQUESTED:   'bg-amber-50 text-amber-700',
  APPROVED:    'bg-success/10 text-success',
  REJECTED:    'bg-error/10 text-error',
  LABEL_ISSUED:'bg-accent/10 text-accent',
  RECEIVED:    'bg-primary/10 text-primary',
  REFUNDED:    'bg-muted-bg text-muted-text',
}

function StatusBadge({ status }: { status: AdminReturn['status'] }) {
  return (
    <span className={cn('inline-flex h-5 px-2 rounded text-[11px] font-[600] font-public-sans', STATUS_STYLES[status])}>
      {status.replace('_', ' ')}
    </span>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ReturnRow({ ret }: { ret: AdminReturn }) {
  const approve = useApproveReturn()
  const reject = useRejectReturn()
  const refund = useRefundReturn()
  const issueLabel = useIssueReturnLabel()

  const isActioned = ret.status === 'REFUNDED' || ret.status === 'REJECTED'

  return (
    <tr className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors">
      <td className="py-3.5 px-4">
        <p className="text-[13px] font-[600] font-public-sans text-primary">#{ret.orderNumber}</p>
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">{ret.buyerName}</td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">{ret.brandName}</td>
      <td className="py-3.5 px-4 max-w-[200px]">
        <p className="text-[13px] font-public-sans text-muted-text truncate" title={ret.reason}>{ret.reason}</p>
      </td>
      <td className="py-3.5 px-4"><StatusBadge status={ret.status} /></td>
      <td className="py-3.5 px-4 text-[12px] font-public-sans text-muted-text">
        {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </td>
      <td className="py-3.5 px-4">
        {!isActioned && (
          <div className="flex items-center gap-1.5 justify-end">
            {ret.status === 'REQUESTED' && (
              <>
                <button type="button" onClick={() => approve.mutate(ret.id)} disabled={approve.isPending}
                  className="flex items-center gap-1 h-7 px-2.5 rounded border border-success/40 text-success bg-success/5 hover:bg-success/10 text-[11px] font-[600] font-public-sans transition-colors disabled:opacity-50">
                  <CheckCircle size={11} aria-hidden="true" /> Approve
                </button>
                <button type="button" onClick={() => reject.mutate({ id: ret.id })} disabled={reject.isPending}
                  className="flex items-center gap-1 h-7 px-2.5 rounded border border-border-warm text-muted-text hover:bg-muted-bg text-[11px] font-[600] font-public-sans transition-colors disabled:opacity-50">
                  <XCircle size={11} aria-hidden="true" /> Reject
                </button>
              </>
            )}
            {ret.status === 'APPROVED' && (
              <>
                <button type="button" onClick={() => issueLabel.mutate({ id: ret.id })} disabled={issueLabel.isPending}
                  className="flex items-center gap-1 h-7 px-2.5 rounded border border-accent/40 text-accent bg-accent/5 hover:bg-accent/10 text-[11px] font-[600] font-public-sans transition-colors disabled:opacity-50">
                  <Tag size={11} aria-hidden="true" /> Issue Label
                </button>
                <button type="button" onClick={() => refund.mutate(ret.id)} disabled={refund.isPending}
                  className="flex items-center gap-1 h-7 px-2.5 rounded border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-[11px] font-[600] font-public-sans transition-colors disabled:opacity-50">
                  <RefreshCw size={11} aria-hidden="true" /> Refund
                </button>
              </>
            )}
            {(ret.status === 'LABEL_ISSUED' || ret.status === 'RECEIVED') && (
              <button type="button" onClick={() => refund.mutate(ret.id)} disabled={refund.isPending}
                className="flex items-center gap-1 h-7 px-2.5 rounded border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-[11px] font-[600] font-public-sans transition-colors disabled:opacity-50">
                <RefreshCw size={11} aria-hidden="true" /> Refund
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'LABEL_ISSUED', label: 'Label Issued' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'REJECTED', label: 'Rejected' },
]

export default function AdminReturnsPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminReturns({ page, status: status || undefined })
  const returns = data?.returns ?? []
  const total = data?.total ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">Returns</h1>
        <p className="text-[14px] font-public-sans text-muted-text mt-1">Review and process buyer return requests</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-warm overflow-x-auto">
        {STATUS_TABS.map(({ value, label }) => (
          <button key={label} type="button" onClick={() => { setStatus(value); setPage(1) }}
            className={cn(
              'px-4 py-2.5 text-[13px] font-[600] font-public-sans border-b-2 -mb-px transition-colors whitespace-nowrap',
              status === value ? 'border-primary text-primary' : 'border-transparent text-muted-text hover:text-primary'
            )}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-muted-bg rounded w-28" />
                  <div className="h-3 bg-muted-bg rounded w-48" />
                </div>
                <div className="h-5 bg-muted-bg rounded w-16" />
              </div>
            ))}
          </div>
        ) : !returns.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <RotateCcw size={22} className="text-muted-text" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">No returns found</p>
            {!status && <p className="text-[13px] font-public-sans text-muted-text">No return requests have been submitted yet.</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['Order', 'Buyer', 'Brand', 'Reason', 'Status', 'Date', ''].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returns.map((r) => <ReturnRow key={r.id} ret={r} />)}
                </tbody>
              </table>
            </div>

            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-warm">
                <p className="text-[12px] font-public-sans text-muted-text">{(page-1)*20+1}–{Math.min(page*20, total)} of {total}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors">Prev</button>
                  <button type="button" onClick={() => setPage((p) => p+1)} disabled={page*20>=total}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
