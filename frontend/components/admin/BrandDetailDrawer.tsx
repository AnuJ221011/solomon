'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Building2, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAdminBrand,
  useApproveBrand,
  useRejectBrand,
  useOverrideAchievementLevel,
  useSuspendUser,
  useReactivateUser,
} from '@/hooks/queries/useAdmin'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACHIEVEMENT_LEVELS = [
  { value: 'L1_SPROUT', label: 'L1 — Sprout' },
  { value: 'L2_RISING', label: 'L2 — Rising' },
  { value: 'L3_TRUSTED', label: 'L3 — Trusted' },
  { value: 'L4_ELITE', label: 'L4 — Elite' },
  { value: 'L5_LEGEND', label: 'L5 — Legend' },
]

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
  APPROVED: 'text-green-700 bg-green-50 border-green-200',
  REJECTED: 'text-error bg-error/5 border-error/20',
  SUSPENDED: 'text-muted-text bg-muted-bg border-border-warm',
}

const SHIPPING_ZONE_LABELS: Record<string, string> = {
  DOMESTIC: 'Domestic (India)',
  SOUTH_ASIA: 'South Asia',
  SOUTHEAST_ASIA: 'Southeast Asia',
  MIDDLE_EAST: 'Middle East',
  EUROPE: 'Europe',
  NORTH_AMERICA: 'North America',
  OCEANIA: 'Oceania',
  REST_OF_WORLD: 'Rest of World',
}

const LEAD_TIME_LABELS: Record<string, string> = {
  ONE_TO_THREE_DAYS: '1–3 days',
  ONE_TO_TWO_WEEKS: '1–2 weeks',
  TWO_TO_FOUR_WEEKS: '2–4 weeks',
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-border-warm last:border-0">
      <span className="text-[11px] font-[600] uppercase tracking-[0.06em] text-muted-text font-public-sans">
        {label}
      </span>
      <span className="text-[14px] font-public-sans text-primary leading-[1.5]">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-[600] uppercase tracking-[0.08em] text-muted-text font-public-sans mb-1 px-5">
        {title}
      </p>
      <div className="px-5 bg-surface border-y border-border-warm">
        {children}
      </div>
    </div>
  )
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectConfirm({ brandId, brandName, onDone }: { brandId: string; brandName: string; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const rejectBrand = useRejectBrand()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onDone} aria-hidden="true" />
      <div className="relative bg-surface border border-border-warm rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-[18px] font-[600] font-playfair text-primary">Reject Brand</h2>
        <p className="text-[14px] font-public-sans text-muted-text">
          Rejecting <strong className="text-primary">{brandName}</strong>. Optionally provide a reason.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          rows={3}
          className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onDone}
            className="h-9 px-4 rounded border border-border-warm text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => rejectBrand.mutate({ id: brandId, reason: reason.trim() || undefined }, { onSuccess: onDone })}
            disabled={rejectBrand.isPending}
            className="h-9 px-4 rounded bg-error text-white text-[13px] font-[600] font-public-sans hover:bg-error/90 transition-colors disabled:opacity-50"
          >
            {rejectBrand.isPending ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface Props {
  brandId: string | null
  onClose: () => void
}

export function BrandDetailDrawer({ brandId, onClose }: Props) {
  const { data: brand, isLoading } = useAdminBrand(brandId)
  const approveBrand = useApproveBrand()
  const overrideLevel = useOverrideAchievementLevel()
  const suspendUser = useSuspendUser()
  const reactivateUser = useReactivateUser()
  const [showReject, setShowReject] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    if (brandId) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [brandId])

  if (!brandId) return null

  const isPending = brand?.status === 'PENDING'
  const isApproved = brand?.status === 'APPROVED'
  const isSuspended = brand?.user?.isActive === false

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-[500px] bg-bg shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm bg-surface shrink-0">
          <h2 className="text-[17px] font-[600] font-playfair text-primary">
            {isLoading ? 'Loading…' : brand?.brandName ?? 'Brand Details'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="w-8 h-8 flex items-center justify-center rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-5">
          {isLoading ? (
            <div className="px-5 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted-bg rounded animate-pulse" />
              ))}
            </div>
          ) : !brand ? (
            <div className="px-5 py-12 text-center text-muted-text font-public-sans text-[14px]">
              Brand not found.
            </div>
          ) : (
            <>
              {/* Hero */}
              <div className="px-5 mb-5 flex items-center gap-4">
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.brandName}
                    className="w-16 h-16 rounded object-cover border border-border-warm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-muted-bg border border-border-warm flex items-center justify-center">
                    <Building2 size={24} className="text-muted-text" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[18px] font-[600] font-playfair text-primary">{brand.brandName}</h3>
                    <span className={cn(
                      'text-[11px] font-[600] font-public-sans px-2 py-0.5 rounded border',
                      STATUS_COLORS[brand.status] ?? STATUS_COLORS.PENDING
                    )}>
                      {brand.status}
                    </span>
                  </div>
                  <p className="text-[13px] font-public-sans text-muted-text mt-0.5">{brand.user?.email}</p>
                  {brand.yearFounded && (
                    <p className="text-[12px] font-public-sans text-muted-text">Est. {brand.yearFounded}</p>
                  )}
                </div>
              </div>

              {/* Stats row (approved only) */}
              {isApproved && (
                <div className="mx-5 mb-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Products', value: brand._count?.products ?? 0 },
                    { label: 'Orders', value: brand._count?.orders ?? 0 },
                    { label: 'Avg Rating', value: brand.avgRating > 0 ? brand.avgRating.toFixed(1) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded border border-border-warm bg-surface p-3 text-center">
                      <p className="text-[18px] font-[600] font-public-sans text-primary">{value}</p>
                      <p className="text-[11px] font-public-sans text-muted-text">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Brand info */}
              <Section title="Brand">
                <DetailRow label="Tagline" value={brand.description} />
                <DetailRow label="Categories" value={brand.category?.join(', ')} />
                <DetailRow label="Country of origin" value={brand.countryOfOrigin} />
                <DetailRow
                  label="Applied"
                  value={new Date(brand.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                {brand.approvedAt && (
                  <DetailRow
                    label="Approved"
                    value={new Date(brand.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />
                )}
                {(brand.websiteUrl || brand.instagramHandle) && (
                  <DetailRow
                    label="Online presence"
                    value={
                      <div className="flex items-center gap-3 flex-wrap">
                        {brand.websiteUrl && (
                          <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-accent underline underline-offset-2 text-[13px]">
                            Website <ExternalLink size={11} />
                          </a>
                        )}
                        {brand.instagramHandle && (
                          <a href={`https://instagram.com/${brand.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-accent underline underline-offset-2 text-[13px]">
                            @{brand.instagramHandle} <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    }
                  />
                )}
              </Section>

              {/* Brand story */}
              {brand.brandStory && (
                <Section title="Brand Story">
                  <p className="py-3 text-[14px] font-public-sans text-primary leading-[1.7] whitespace-pre-wrap">
                    {brand.brandStory}
                  </p>
                </Section>
              )}

              {/* Business credentials */}
              <Section title="Business">
                <DetailRow label="GST number" value={brand.gstNumber} />
                <DetailRow label="Business reg. number" value={brand.businessRegNumber} />
                {brand.existingRetailPartners && (
                  <DetailRow label="Retail partners" value={brand.existingRetailPartners} />
                )}
              </Section>

              {/* Shipping zones */}
              {brand.shippingRates?.length > 0 || brand.enabledZones?.length > 0 ? (
                <Section title="Shipping Zones">
                  <div className="py-3 flex flex-wrap gap-1.5">
                    {(brand.enabledZones ?? []).map((z: string) => (
                      <span key={z} className="px-2.5 py-1 rounded border border-border-warm bg-muted-bg text-[12px] font-[500] font-public-sans text-muted-text">
                        {SHIPPING_ZONE_LABELS[z] ?? z}
                      </span>
                    ))}
                  </div>
                </Section>
              ) : null}

              {/* Achievement level (approved only) */}
              {isApproved && (
                <Section title="Achievement Level">
                  <div className="py-3 flex items-center gap-3">
                    <select
                      defaultValue={brand.achievementLevel}
                      onChange={(e) => overrideLevel.mutate({ id: brand.id, level: e.target.value })}
                      disabled={overrideLevel.isPending}
                      className="h-9 px-3 pr-8 rounded border border-border-warm bg-surface text-[13px] font-[500] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none disabled:opacity-50"
                    >
                      {ACHIEVEMENT_LEVELS.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    {brand.isAdminOverride && (
                      <span className="text-[11px] font-public-sans text-muted-text">Admin override active</span>
                    )}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {brand && (
          <div className="shrink-0 border-t border-border-warm bg-surface px-5 py-4 flex items-center gap-3 flex-wrap">
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => approveBrand.mutate(brand.id, { onSuccess: onClose })}
                  disabled={approveBrand.isPending}
                  className={cn(
                    'flex items-center gap-1.5 h-9 px-4 rounded border text-[13px] font-[600] font-public-sans transition-colors',
                    'border-success/40 text-success bg-success/5 hover:bg-success/10 disabled:opacity-50'
                  )}
                >
                  <CheckCircle size={14} aria-hidden="true" />
                  {approveBrand.isPending ? 'Approving…' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReject(true)}
                  className={cn(
                    'flex items-center gap-1.5 h-9 px-4 rounded border text-[13px] font-[600] font-public-sans transition-colors',
                    'border-error/40 text-error bg-error/5 hover:bg-error/10'
                  )}
                >
                  <XCircle size={14} aria-hidden="true" />
                  Reject
                </button>
              </>
            )}

            {isApproved && (
              isSuspended ? (
                <button
                  type="button"
                  onClick={() => reactivateUser.mutate(brand.userId, { onSuccess: onClose })}
                  disabled={reactivateUser.isPending}
                  className="h-9 px-4 rounded border border-success/40 text-success bg-success/5 hover:bg-success/10 text-[13px] font-[600] font-public-sans transition-colors disabled:opacity-50"
                >
                  {reactivateUser.isPending ? 'Reactivating…' : 'Reactivate Brand'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => suspendUser.mutate(brand.userId, { onSuccess: onClose })}
                  disabled={suspendUser.isPending}
                  className="h-9 px-4 rounded border border-error/40 text-error bg-error/5 hover:bg-error/10 text-[13px] font-[600] font-public-sans transition-colors disabled:opacity-50"
                >
                  {suspendUser.isPending ? 'Suspending…' : 'Suspend Brand'}
                </button>
              )
            )}

            {isApproved && brand.slug && (
              <a
                href={`/brands/${brand.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 h-9 px-3 rounded border border-border-warm text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
              >
                <ExternalLink size={13} aria-hidden="true" />
                View storefront
              </a>
            )}
          </div>
        )}
      </div>

      {showReject && brand && (
        <RejectConfirm
          brandId={brand.id}
          brandName={brand.brandName}
          onDone={() => { setShowReject(false); onClose() }}
        />
      )}
    </>
  )
}
