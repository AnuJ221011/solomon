'use client'

import { useState } from 'react'
import { Clipboard, CheckCheck, MessageCircle, Mail, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import {
  useReferralLink,
  useLeaderboard,
  type ReferralEntry,
  type LeaderboardEntry,
} from '@/hooks/queries/useReferrals'

// â”€â”€â”€ Stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string
  value?: string | number
  sub?: string
  loading?: boolean
}) {
  return (
    <div className="bg-surface border border-border-warm rounded p-5 flex flex-col">
      <p className="text-[12px] font-[500] font-public-sans text-muted-text uppercase tracking-[0.06em]">
        {label}
      </p>
      {loading ? (
        <div className="h-8 bg-muted-bg rounded animate-pulse w-16 mt-2" />
      ) : (
        <p className="text-[28px] font-[600] font-public-sans text-primary leading-none mt-2">
          {value ?? 'â€”'}
        </p>
      )}
      {sub && (
        <p className="text-[12px] font-public-sans text-muted-text mt-1.5">{sub}</p>
      )}
    </div>
  )
}

// â”€â”€â”€ Referral status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ReferralStatusBadge({ status }: { status: ReferralEntry['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5',
        'text-[12px] font-[500] font-public-sans',
        status === 'CONVERTED'
          ? 'bg-success/10 text-success'
          : 'bg-warning/[12%] text-warning'
      )}
    >
      {status === 'CONVERTED' ? 'Rewarded' : 'Pending'}
    </span>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)

  const { data: referralData, isLoading: referralLoading } = useReferralLink()
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard()

  const referralLink = referralData?.referralLink ?? ''
  const referrals: ReferralEntry[] = referralData?.referrals ?? []
  const leaderboard: LeaderboardEntry[] = leaderboardData?.leaderboard ?? []

  function copyLink() {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Join Solomon Bharat â€” India's finest B2B wholesale marketplace. Use my referral link: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function shareEmail() {
    const subject = encodeURIComponent('Join me on Solomon Bharat')
    const body = encodeURIComponent(
      `Hi,\n\nI've been sourcing beautiful Indian artisan products on Solomon Bharat. You should check it out!\n\nUse my referral link to register: ${referralLink}\n\nBest`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  // Current month name for leaderboard heading
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Referral Hub
        </h1>
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
          Invite brands to join Solomon Bharat and earn store credit.
        </p>
      </div>

      {/* Referral link card */}
      <div className="bg-surface border border-border-warm rounded p-6 mb-6">
        <p className="text-[16px] font-[400] font-public-sans text-primary leading-relaxed mb-4">
          Share this link to earn{' '}
          <span className="font-[600] text-accent">&#x20B9;500 store credit</span>{' '}
          when a brand you refer makes their first sale.
        </p>

        {/* Link input with copy */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 min-w-0 bg-muted-bg border border-border-warm rounded px-3 py-2.5 overflow-hidden">
            {referralLoading ? (
              <div className="h-4 bg-border-warm rounded animate-pulse w-3/4" />
            ) : (
              <p className="text-[13px] font-mono text-muted-text truncate select-all">
                {referralLink || 'Loading your referral link...'}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={copyLink}
            disabled={!referralLink}
            className="flex-shrink-0 gap-1.5"
            aria-label="Copy referral link"
          >
            {copied ? (
              <CheckCheck size={14} aria-hidden="true" className="text-success" />
            ) : (
              <Clipboard size={14} aria-hidden="true" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {/* Share actions */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="accent"
            size="md"
            onClick={shareWhatsApp}
            disabled={!referralLink}
            className="gap-2"
          >
            <MessageCircle size={15} aria-hidden="true" />
            Share on WhatsApp
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={shareEmail}
            disabled={!referralLink}
            className="gap-2"
          >
            <Mail size={15} aria-hidden="true" />
            Share via Email
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Brands Referred"
          value={referralData?.totalReferrals}
          loading={referralLoading}
        />
        <StatCard
          label="Pending Rewards"
          value={referralData?.pendingCount}
          sub={referralData?.pendingCount ? "Brand hasn't made first sale yet" : undefined}
          loading={referralLoading}
        />
        {leaderboardData && (
          <StatCard
            label="Leaderboard Rank"
            value={leaderboardData.rank ? `#${leaderboardData.rank}` : 'â€”'}
            sub={leaderboardData.total ? `of ${leaderboardData.total} referrers` : undefined}
            loading={leaderboardLoading}
          />
        )}
      </div>

      {/* Two-column: history + leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Referral history */}
        <div className="lg:col-span-3">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary mb-3">
            Referral History
          </h2>

          {referralLoading ? (
            <div className="border border-border-warm rounded bg-surface overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 border-b border-border-warm last:border-0 animate-pulse">
                  <div className="h-4 bg-muted-bg rounded w-1/3" />
                  <div className="h-4 bg-muted-bg rounded w-16" />
                  <div className="h-4 bg-muted-bg rounded w-20" />
                  <div className="h-4 bg-muted-bg rounded w-16" />
                </div>
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <EmptyState
              title="No referrals yet"
              description="Share your link with brands to start earning store credit."
            />
          ) : (
            <div className="border border-border-warm rounded bg-surface overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-warm bg-muted-bg/40">
                    {['Email', 'Status', 'Referred', 'Reward'].map((col) => (
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
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-border-warm last:border-0">
                      <td className="px-4 py-3">
                        <span className="text-[14px] font-[600] font-public-sans text-primary">
                          {ref.referredEmail ?? 'â€”'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ReferralStatusBadge status={ref.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-public-sans text-muted-text">
                          {new Date(ref.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-[13px] font-[600] font-public-sans',
                            ref.status === 'CONVERTED' ? 'text-success' : 'text-muted-text'
                          )}
                        >
                          {ref.status === 'CONVERTED' ? '&#x20B9;500' : '&#x20B9;500 (pending)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <h2 className="text-[16px] font-[600] font-public-sans text-primary mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-accent" aria-hidden="true" />
            Top Referrers &mdash; {currentMonth}
          </h2>

          {leaderboardLoading ? (
            <div className="border border-border-warm rounded bg-surface overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-border-warm last:border-0 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-muted-bg" />
                    <div className="h-4 bg-muted-bg rounded w-20" />
                  </div>
                  <div className="h-4 bg-muted-bg rounded w-16" />
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <EmptyState
              title="Leaderboard is empty"
              description="Be the first to refer a brand this month."
            />
          ) : (
            <div className="border border-border-warm rounded bg-surface overflow-hidden">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    'flex items-center justify-between px-4 py-3',
                    'border-b border-border-warm last:border-0',
                    entry.isCurrentUser && 'bg-accent/[5%]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded',
                        'text-[12px] font-[600] font-public-sans',
                        entry.rank === 1
                          ? 'bg-accent text-white'
                          : 'bg-muted-bg text-muted-text'
                      )}
                    >
                      {entry.rank}
                    </span>
                    <span
                      className={cn(
                        'text-[14px] font-public-sans',
                        entry.isCurrentUser ? 'font-[600] text-accent' : 'font-[400] text-primary'
                      )}
                    >
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="ml-1.5 text-[11px] font-[500] text-accent/70">(you)</span>
                      )}
                    </span>
                  </div>
                  <span className="text-[13px] font-[600] font-public-sans text-muted-text">
                    {entry.count} {entry.count === 1 ? 'referral' : 'referrals'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
