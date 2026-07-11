'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { useWhatsappBroadcast } from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Status helpers ───────────────────────────────────────────────────────────

const BROADCAST_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pending',  cls: 'bg-muted-bg text-accent' },
  RUNNING: { label: 'Running',  cls: 'bg-amber-50 text-amber-700' },
  DONE:    { label: 'Done',     cls: 'bg-success/10 text-success' },
}

const RECIPIENT_STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock size={13} className="text-[#9CA3AF]" />,
  SENT:    <CheckCircle2 size={13} className="text-success" />,
  FAILED:  <XCircle size={13} className="text-[#C0392B]" />,
}

function ProgressBar({ sent, failed, total }: { sent: number; failed: number; total: number }) {
  const sentPct   = total > 0 ? (sent   / total) * 100 : 0
  const failedPct = total > 0 ? (failed / total) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#F0EBE3]">
        <div className="h-full bg-accent transition-all" style={{ width: `${sentPct}%` }} />
        <div className="h-full bg-[#C0392B]/30 transition-all" style={{ width: `${failedPct}%` }} />
      </div>
      <div className="flex gap-4 text-[11.5px] font-public-sans text-[#9CA3AF]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-accent" />
          {sent} sent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#C0392B]/30" />
          {failed} failed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[#F0EBE3]" />
          {total - sent - failed} pending
        </span>
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-border-warm rounded-lg px-5 py-4">
      <p className="text-[11px] font-[700] font-public-sans text-[#9CA3AF] uppercase tracking-[0.07em] mb-1.5">{label}</p>
      <p className="text-[24px] font-playfair font-[600] text-primary leading-none tabular-nums">{value}</p>
      {sub && <p className="text-[12px] font-public-sans text-[#9CA3AF] mt-1">{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: broadcast, isLoading } = useWhatsappBroadcast(id)

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl space-y-6">
        {/* back */}
        <div className="h-5 w-32 bg-[#F0EBE3] rounded animate-pulse" />
        {/* title */}
        <div className="h-8 w-64 bg-[#F0EBE3] rounded animate-pulse" />
        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-border-warm rounded-lg px-5 py-4">
              <div className="h-3 w-16 bg-[#F0EBE3] rounded animate-pulse mb-3" />
              <div className="h-7 w-12 bg-[#F0EBE3] rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* table skeleton */}
        <div className="bg-white border border-border-warm rounded-lg overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 border-b border-muted-bg flex gap-6">
              <div className="h-3.5 w-28 bg-[#F0EBE3] rounded animate-pulse" />
              <div className="h-3.5 w-20 bg-[#F0EBE3] rounded animate-pulse" />
              <div className="h-3.5 w-14 bg-[#F0EBE3] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!broadcast) {
    return (
      <div className="p-8 max-w-5xl">
        <Link href="/admin/whatsapp" className="flex items-center gap-1.5 text-[13px] font-public-sans text-[#9CA3AF] hover:text-muted-text mb-6">
          <ArrowLeft size={14} /> Back to broadcasts
        </Link>
        <p className="text-[14px] font-public-sans text-[#9CA3AF]">Broadcast not found.</p>
      </div>
    )
  }

  const bStatus = BROADCAST_STATUS[broadcast.status] ?? BROADCAST_STATUS.PENDING

  return (
    <div className="p-8 max-w-5xl space-y-6">

      {/* Back */}
      <Link href="/admin/whatsapp" className="inline-flex items-center gap-1.5 text-[13px] font-public-sans text-[#9CA3AF] hover:text-muted-text transition-colors">
        <ArrowLeft size={14} /> Back to broadcasts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-9 h-9 rounded-lg bg-muted-bg flex items-center justify-center shrink-0">
            <MessageSquare size={17} className="text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-playfair text-[22px] font-[600] text-primary leading-tight">
                {broadcast.name}
              </h1>
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-[600] font-public-sans', bStatus.cls)}>
                {broadcast.status === 'RUNNING' && <Loader2 size={10} className="animate-spin" />}
                {bStatus.label}
              </span>
            </div>
            <p className="text-[13px] font-public-sans text-[#9CA3AF] mt-0.5">
              Template: <code className="text-[12px] bg-muted-bg text-accent px-1.5 py-0.5 rounded">{broadcast.templateName}</code>
              <span className="ml-2 text-[#D0C8BE]">·</span>
              <span className="ml-2">{broadcast.languageCode}</span>
              <span className="ml-2 text-[#D0C8BE]">·</span>
              <span className="ml-2">{new Date(broadcast.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total"  value={broadcast.totalCount.toLocaleString()} />
        <StatCard label="Sent"   value={broadcast.sentCount.toLocaleString()} sub={broadcast.totalCount > 0 ? `${Math.round((broadcast.sentCount / broadcast.totalCount) * 100)}%` : undefined} />
        <StatCard label="Failed" value={broadcast.failedCount.toLocaleString()} />
        <StatCard label="Pending" value={Math.max(0, broadcast.totalCount - broadcast.sentCount - broadcast.failedCount).toLocaleString()} />
      </div>

      {/* Progress */}
      <div className="bg-white border border-border-warm rounded-lg px-6 py-5">
        <p className="text-[12px] font-[700] font-public-sans text-[#9CA3AF] uppercase tracking-[0.07em] mb-3">Delivery progress</p>
        <ProgressBar sent={broadcast.sentCount} failed={broadcast.failedCount} total={broadcast.totalCount} />
      </div>

      {/* Recipients table */}
      <div className="bg-white border border-border-warm rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-warm bg-surface flex items-center justify-between">
          <h2 className="text-[13px] font-[600] font-public-sans text-primary">Recipients</h2>
          {broadcast.status === 'RUNNING' && (
            <span className="flex items-center gap-1.5 text-[11.5px] font-public-sans text-amber-600">
              <Loader2 size={11} className="animate-spin" />
              Auto-refreshing
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-warm">
                {['', 'Phone', 'Name', 'Status', 'Message ID', 'Error'].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-[700] font-public-sans text-[#9CA3AF] uppercase tracking-[0.07em] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!broadcast.recipients?.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[13px] font-public-sans text-[#9CA3AF]">
                    No recipients found.
                  </td>
                </tr>
              ) : (
                broadcast.recipients.map((r) => (
                  <tr key={r.id} className="border-b border-muted-bg hover:bg-surface transition-colors">
                    <td className="pl-5 pr-2 py-3">
                      {RECIPIENT_STATUS_ICON[r.status] ?? RECIPIENT_STATUS_ICON.PENDING}
                    </td>
                    <td className="px-2 py-3">
                      <span className="text-[13px] font-mono text-muted-text">{r.phone}</span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="text-[13px] font-public-sans text-muted-text">{r.name ?? '—'}</span>
                    </td>
                    <td className="px-2 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-[600] font-public-sans',
                        r.status === 'SENT'    ? 'bg-success/10 text-success' :
                        r.status === 'FAILED'  ? 'bg-[#C0392B]/10 text-[#C0392B]' :
                                                 'bg-muted-bg text-accent'
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      {r.messageId
                        ? <code className="text-[11.5px] text-[#9CA3AF] font-mono">{r.messageId}</code>
                        : <span className="text-[#D0C8BE]">—</span>}
                    </td>
                    <td className="px-2 pr-5 py-3 max-w-[220px]">
                      {r.error
                        ? <span className="text-[12px] font-public-sans text-[#C0392B] truncate block">{r.error}</span>
                        : <span className="text-[#D0C8BE]">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
