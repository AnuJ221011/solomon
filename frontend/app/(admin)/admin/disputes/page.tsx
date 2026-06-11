'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import {
  useAdminDisputes,
  type AdminDispute,
} from '@/hooks/queries/useAdmin'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AdminDispute['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded text-[11px] font-[600] font-public-sans',
        status === 'OPEN' && 'bg-error/10 text-error',
        status === 'RESOLVED' && 'bg-success/10 text-success',
        status === 'CLOSED' && 'bg-muted-bg text-muted-text'
      )}
    >
      {status}
    </span>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function DisputeRow({ dispute }: { dispute: AdminDispute }) {
  const qc = useQueryClient()

  const resolve = useMutation({
    mutationFn: () => api.post(`/admin/disputes/${dispute.id}/resolve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] })
      toast.success('Dispute resolved.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const close = useMutation({
    mutationFn: () => api.post(`/admin/disputes/${dispute.id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] })
      toast.success('Dispute closed.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  return (
    <tr className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors">
      <td className="py-3.5 px-4">
        <p className="text-[13px] font-[600] font-public-sans text-primary">
          #{dispute.orderNumber}
        </p>
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">
        {dispute.buyerName}
      </td>
      <td className="py-3.5 px-4 text-[13px] font-public-sans text-muted-text">
        {dispute.brandName}
      </td>
      <td className="py-3.5 px-4 text-right text-[13px] font-[600] font-public-sans text-primary">
        ₹{dispute.amount.toLocaleString('en-IN')}
      </td>
      <td className="py-3.5 px-4 max-w-[220px]">
        <p className="text-[13px] font-public-sans text-muted-text truncate" title={dispute.reason}>
          {dispute.reason}
        </p>
      </td>
      <td className="py-3.5 px-4">
        <StatusBadge status={dispute.status} />
      </td>
      <td className="py-3.5 px-4 text-[12px] font-public-sans text-muted-text">
        {new Date(dispute.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </td>
      <td className="py-3.5 px-4 text-right">
        {dispute.status === 'OPEN' && (
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => resolve.mutate()}
              disabled={resolve.isPending}
              aria-label={`Resolve dispute ${dispute.orderNumber}`}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2.5 rounded border text-[11px] font-[600] font-public-sans transition-colors',
                'border-success/40 text-success bg-success/5 hover:bg-success/10 disabled:opacity-50'
              )}
            >
              <CheckCircle size={12} aria-hidden="true" />
              Resolve
            </button>
            <button
              type="button"
              onClick={() => close.mutate()}
              disabled={close.isPending}
              aria-label={`Close dispute ${dispute.orderNumber}`}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2.5 rounded border text-[11px] font-[600] font-public-sans transition-colors',
                'border-border-warm text-muted-text bg-transparent hover:bg-muted-bg disabled:opacity-50'
              )}
            >
              <XCircle size={12} aria-hidden="true" />
              Close
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDisputesPage() {
  const [status, setStatus] = useState<'OPEN' | 'RESOLVED' | 'CLOSED' | ''>('OPEN')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminDisputes({
    page,
    status: status || undefined,
  })

  const disputes = data?.disputes ?? []
  const total = data?.total ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">
          Disputes
        </h1>
        <p className="text-[14px] font-public-sans text-muted-text mt-1">
          Review and resolve order disputes
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 border-b border-border-warm">
        {([
          { value: 'OPEN', label: 'Open' },
          { value: 'RESOLVED', label: 'Resolved' },
          { value: 'CLOSED', label: 'Closed' },
          { value: '', label: 'All' },
        ] as const).map(({ value, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => { setStatus(value); setPage(1) }}
            className={cn(
              'px-4 py-2.5 text-[13px] font-[600] font-public-sans border-b-2 -mb-px transition-colors',
              status === value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-text hover:text-primary'
            )}
          >
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
                <div className="h-5 bg-muted-bg rounded w-14" />
              </div>
            ))}
          </div>
        ) : !disputes.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <AlertTriangle size={22} className="text-muted-text" aria-hidden="true" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">
              No {status.toLowerCase() || ''} disputes
            </p>
            {status === 'OPEN' && (
              <p className="text-[13px] font-public-sans text-muted-text max-w-[260px]">
                All disputes are resolved. Great!
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['Order', 'Buyer', 'Brand', 'Amount', 'Reason', 'Status', 'Date', ''].map((h) => (
                      <th
                        key={h}
                        className={cn(
                          'py-3 px-4 text-[12px] font-[700] font-public-sans text-muted-text uppercase tracking-[0.06em]',
                          h === 'Amount' ? 'text-right' : 'text-left'
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <DisputeRow key={d.id} dispute={d} />
                  ))}
                </tbody>
              </table>
            </div>

            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-warm">
                <p className="text-[12px] font-public-sans text-muted-text">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * 20 >= total}
                    className="h-8 px-3 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
