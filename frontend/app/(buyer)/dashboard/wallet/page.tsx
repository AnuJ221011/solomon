'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { useWallet, type WalletCredit, type WalletCreditStatus } from '@/hooks/queries/useReferrals'

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ status }: { status: WalletCreditStatus }) {
  const config: Record<WalletCreditStatus, { label: string; className: string }> = {
    ACTIVE: { label: 'Earned', className: 'bg-success/10 text-success' },
    USED: { label: 'Used', className: 'bg-muted-bg text-muted-text' },
    EXPIRED: { label: 'Expired', className: 'bg-warning/[12%] text-warning' },
  }
  const { label, className } = config[status] ?? { label: status, className: 'bg-muted-bg text-muted-text' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5',
        'text-[12px] font-[500] font-public-sans',
        className
      )}
    >
      {label}
    </span>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded border',
        'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
        checked
          ? 'bg-white/20 border-white/30'
          : 'bg-white/10 border-white/20'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded bg-white shadow-sm',
          'transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border-warm">
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted-bg rounded animate-pulse w-24" />
        </td>
      ))}
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [autoApply, setAutoApply] = useState(true)

  const { data: wallet, isLoading } = useWallet()

  const balance = wallet?.balance ?? 0
  const credits: WalletCredit[] = wallet?.credits ?? []

  // Count pending credits (ACTIVE credits that haven't been used yet)
  const pendingCount = credits.filter((c) => c.status === 'ACTIVE').length
  const pendingAmount = credits
    .filter((c) => c.status === 'ACTIVE')
    .reduce((s, c) => s + c.amount, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Wallet &amp; Credits
        </h1>
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
          Store credits earned through referrals and promotions
        </p>
      </div>

      {/* Balance card */}
      <div className="bg-primary text-white rounded p-8 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-white/60 uppercase tracking-[0.07em]">
              Available Store Credit
            </p>
            {isLoading ? (
              <div className="h-12 bg-white/10 rounded animate-pulse w-32 mt-2" />
            ) : (
              <p className="text-[48px] leading-none font-[700] font-public-sans text-white mt-2">
                &#x20B9;{balance.toLocaleString('en-IN')}
              </p>
            )}
            <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-white/50 mt-2">
              Applied automatically at checkout
            </p>
          </div>

          {/* Pending credits */}
          {(isLoading || pendingCount > 0) && (
            <div className="bg-white/10 rounded p-4 border border-white/15">
              <p className="text-[12px] font-[500] font-public-sans text-white/60 uppercase tracking-[0.06em]">
                Pending Credits
              </p>
              {isLoading ? (
                <div className="h-8 bg-white/10 rounded animate-pulse w-20 mt-1" />
              ) : (
                <>
                  <p className="text-[24px] font-[700] font-public-sans text-white leading-none mt-1">
                    &#x20B9;{pendingAmount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] font-public-sans text-white/50 mt-1">
                    {pendingCount} referral{pendingCount === 1 ? '' : 's'} awaiting first sale
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Auto-apply toggle */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
          <Toggle
            checked={autoApply}
            onChange={setAutoApply}
            id="auto-apply-toggle"
          />
          <label
            htmlFor="auto-apply-toggle"
            className="text-[14px] font-[600] font-public-sans text-white cursor-pointer"
          >
            Auto-apply at checkout
          </label>
          <span className="text-[12px] font-public-sans text-white/50">
            ({autoApply ? 'On' : 'Off'})
          </span>
        </div>
      </div>

      {/* Credit history */}
      <div>
        <h2 className="text-[16px] font-[600] font-public-sans text-primary mb-3">
          Credit History
        </h2>

        {isLoading ? (
          <div className="border border-border-warm rounded bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['Description', 'Type', 'Amount', 'Date', 'Expiry'].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : credits.length === 0 ? (
          <EmptyState
            title="No credits yet"
            description="Refer a brand to earn store credit."
            action={{
              label: 'Go to Referral Hub',
              onClick: () => { window.location.href = '/dashboard/referrals' },
            }}
          />
        ) : (
          <div className="border border-border-warm rounded bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['Description', 'Type', 'Amount', 'Date', 'Expiry'].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.05em] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {credits.map((entry) => {
                    const isPositive = entry.status === 'ACTIVE'
                    const isUsed = entry.status === 'USED'
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-border-warm last:border-0 hover:bg-muted-bg/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-[14px] font-[400] font-public-sans text-primary">
                            {entry.description}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge status={entry.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-[14px] font-[700] font-public-sans tabular-nums',
                              isPositive ? 'text-success' : isUsed ? 'text-error' : 'text-warning'
                            )}
                          >
                            {isUsed ? '-' : '+'}&#x20B9;{Math.abs(entry.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-public-sans text-muted-text whitespace-nowrap">
                            {formatDate(entry.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-public-sans text-muted-text">
                            {entry.expiresAt ? formatDate(entry.expiresAt) : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pending note */}
            <div className="px-4 py-3 border-t border-border-warm bg-muted-bg/30">
              <p className="text-[12px] font-public-sans text-muted-text">
                Active credits are applied automatically at checkout. Credits expire one year from issue.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
