'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  Globe,
  CalendarDays,
  Package,
  Star,
  ShoppingCart,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import {
  useAdminBrand,
  useApproveBrand,
  useRejectBrand,
  useOverrideAchievementLevel,
  useSuspendUser,
  useReactivateUser,
} from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Pending Review', className: 'text-[#B25E00] bg-[#FFF4E6] border-[#FFD8A8]' },
  APPROVED:  { label: 'Approved',       className: 'text-[#1E5F1E] bg-[#F0FAF0] border-[#B2DDB2]' },
  REJECTED:  { label: 'Rejected',       className: 'text-[#BA1A1A] bg-[#FFF0F0] border-[#FFB3B3]' },
  SUSPENDED: { label: 'Suspended',      className: 'text-[#444748] bg-[#F5F0E8] border-[#E5E1D8]' },
}

const ACHIEVEMENT_LEVELS = [
  { value: 'L1_SPROUT',  label: 'L1 — Sprout'  },
  { value: 'L2_RISING',  label: 'L2 — Rising'  },
  { value: 'L3_TRUSTED', label: 'L3 — Trusted' },
  { value: 'L4_ELITE',   label: 'L4 — Elite'   },
  { value: 'L5_LEGEND',  label: 'L5 — Legend'  },
]

const SHIPPING_ZONE_LABELS: Record<string, string> = {
  DOMESTIC:       'Domestic (India)',
  SOUTH_ASIA:     'South Asia',
  SOUTHEAST_ASIA: 'Southeast Asia',
  MIDDLE_EAST:    'Middle East',
  EUROPE:         'Europe',
  NORTH_AMERICA:  'North America',
  OCEANIA:        'Oceania',
  REST_OF_WORLD:  'Rest of World',
}

const LEAD_TIME_LABELS: Record<string, string> = {
  ONE_TO_THREE_DAYS: '1–3 days',
  ONE_TO_TWO_WEEKS:  '1–2 weeks',
  TWO_TO_FOUR_WEEKS: '2–4 weeks',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#F5F0E8]">
        <h3 className="text-[11px] font-[700] font-public-sans text-[#A68B67] uppercase tracking-[0.1em]">
          {title}
        </h3>
      </div>
      <div className="px-5 py-4 space-y-3.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-[11px] font-[600] font-public-sans text-[#9CA3AF] uppercase tracking-[0.06em] mb-0.5">
        {label}
      </p>
      <div className="text-[13.5px] font-public-sans text-[#1A1A1A] leading-[1.5]">{value}</div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E1D8] rounded-xl px-5 py-4 text-center">
      <p className="text-[22px] font-[600] font-public-sans text-[#1A1A1A]">{value}</p>
      <p className="text-[12px] font-public-sans text-[#9CA3AF] mt-0.5">{label}</p>
    </div>
  )
}

function DocumentLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-4 py-3 bg-[#FAFAF9] border border-[#E5E1D8] rounded-lg hover:border-[#A68B67] hover:bg-[#F9F7F2] transition-all group"
    >
      <FileText size={15} className="text-[#9CA3AF] group-hover:text-[#A68B67] shrink-0" />
      <span className="text-[13px] font-[500] font-public-sans text-[#444748] group-hover:text-[#1A1A1A] flex-1">
        {label}
      </span>
      <ExternalLink size={12} className="text-[#9CA3AF] group-hover:text-[#A68B67]" />
    </a>
  )
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  brandId,
  brandName,
  onClose,
}: {
  brandId: string
  brandName: string
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const router = useRouter()
  const rejectBrand = useRejectBrand()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white border border-[#E5E1D8] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-[18px] font-[600] font-playfair text-[#1A1A1A]">Reject application</h2>
        <p className="text-[13.5px] font-public-sans text-[#444748]">
          Rejecting <strong className="text-[#1A1A1A]">{brandName}</strong>. You can optionally include a reason.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-[#E5E1D8] bg-[#F9F7F2] text-[13.5px] font-public-sans text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#A68B67] transition-colors resize-none"
        />
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-[#E5E1D8] text-[13px] font-[500] font-public-sans text-[#444748] hover:bg-[#F9F7F2] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              rejectBrand.mutate(
                { id: brandId, reason: reason.trim() || undefined },
                { onSuccess: () => router.push('/admin/pending-brands') }
              )
            }
            disabled={rejectBrand.isPending}
            className="h-9 px-4 rounded-lg bg-[#BA1A1A] text-white text-[13px] font-[600] font-public-sans hover:bg-[#9B1515] transition-colors disabled:opacity-50"
          >
            {rejectBrand.isPending ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBrandDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: brand, isLoading } = useAdminBrand(params.id)
  const approveBrand = useApproveBrand()
  const overrideLevel = useOverrideAchievementLevel()
  const suspendUser = useSuspendUser()
  const reactivateUser = useReactivateUser()
  const [showReject, setShowReject] = useState(false)

  const isPending   = brand?.status === 'PENDING'
  const isApproved  = brand?.status === 'APPROVED'
  const isRejected  = brand?.status === 'REJECTED'
  const isSuspended = brand?.user?.isActive === false
  const status      = isSuspended ? 'SUSPENDED' : (brand?.status ?? 'PENDING')
  const statusStyle = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING

  const hasDocuments = !!(
    brand?.aadharUrl || brand?.panUrl || brand?.gstCertUrl ||
    brand?.incorporateCertUrl || brand?.msmeCertUrl ||
    brand?.isoCertUrl || brand?.iecCertUrl
  )

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="h-5 bg-white rounded w-32" />
        <div className="h-52 bg-white rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-5">
            <div className="h-48 bg-white rounded-xl" />
            <div className="h-32 bg-white rounded-xl" />
          </div>
          <div className="space-y-5">
            <div className="h-48 bg-white rounded-xl" />
            <div className="h-32 bg-white rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="max-w-5xl mx-auto">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-[13px] font-public-sans text-[#9CA3AF] hover:text-[#1A1A1A] mb-6">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="bg-white border border-[#E5E1D8] rounded-xl py-20 flex flex-col items-center gap-3">
          <Building2 size={32} className="text-[#E5E1D8]" />
          <p className="text-[15px] font-[600] font-public-sans text-[#1A1A1A]">Brand not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Back + Top actions */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] font-public-sans text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isApproved && brand.slug && (
            <a
              href={`/brands/${brand.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#E5E1D8] text-[13px] font-[500] font-public-sans text-[#444748] hover:bg-[#F5F0E8] hover:text-[#1A1A1A] transition-colors"
            >
              <ExternalLink size={13} />
              View storefront
            </a>
          )}

          {isPending && (
            <>
              <button
                type="button"
                onClick={() => approveBrand.mutate(brand.id, { onSuccess: () => router.push('/admin/pending-brands') })}
                disabled={approveBrand.isPending}
                className={cn(
                  'flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-[600] font-public-sans transition-colors',
                  'bg-[#F0FAF0] border border-[#B2DDB2] text-[#1E5F1E] hover:bg-[#E0F4E0] disabled:opacity-50'
                )}
              >
                <CheckCircle size={14} />
                {approveBrand.isPending ? 'Approving…' : 'Approve Brand'}
              </button>
              <button
                type="button"
                onClick={() => setShowReject(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#FFF0F0] border border-[#FFB3B3] text-[#BA1A1A] text-[13px] font-[600] font-public-sans hover:bg-[#FFE0E0] transition-colors"
              >
                <XCircle size={14} />
                Reject
              </button>
            </>
          )}

          {isApproved && (
            isSuspended ? (
              <button
                type="button"
                onClick={() => reactivateUser.mutate(brand.userId)}
                disabled={reactivateUser.isPending}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#F0FAF0] border border-[#B2DDB2] text-[#1E5F1E] text-[13px] font-[600] font-public-sans hover:bg-[#E0F4E0] transition-colors disabled:opacity-50"
              >
                <RotateCcw size={13} />
                {reactivateUser.isPending ? 'Reactivating…' : 'Reactivate'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => suspendUser.mutate(brand.userId)}
                disabled={suspendUser.isPending}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#FFF0F0] border border-[#FFB3B3] text-[#BA1A1A] text-[13px] font-[600] font-public-sans hover:bg-[#FFE0E0] transition-colors disabled:opacity-50"
              >
                <AlertTriangle size={13} />
                {suspendUser.isPending ? 'Suspending…' : 'Suspend Brand'}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl overflow-hidden mb-5">
        {/* Banner */}
        {brand.bannerUrl ? (
          <div className="h-48 w-full overflow-hidden">
            <img src={brand.bannerUrl} alt="Brand banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-[#F5F0E8] to-[#EDE8DC]" />
        )}

        {/* Logo + identity */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-8 mb-4">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.brandName}
                className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[#F5F0E8] border-4 border-white shadow-md flex items-center justify-center shrink-0">
                <Building2 size={28} className="text-[#A68B67]" />
              </div>
            )}
            <div className="mb-1 flex items-center gap-3 flex-wrap">
              <span
                className={cn(
                  'text-[11px] font-[700] font-public-sans px-2.5 py-1 rounded-full border',
                  statusStyle.className
                )}
              >
                {statusStyle.label}
              </span>
              {brand.yearFounded && (
                <span className="text-[12px] font-public-sans text-[#9CA3AF]">Est. {brand.yearFounded}</span>
              )}
            </div>
          </div>

          <h1 className="font-playfair text-[28px] font-[500] text-[#1A1A1A] leading-tight mb-1">
            {brand.brandName}
          </h1>
          {brand.description && (
            <p className="text-[14px] font-public-sans text-[#444748] mb-3">{brand.description}</p>
          )}

          {/* Quick meta */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] font-public-sans text-[#9CA3AF]">
            {brand.user?.email && <span>{brand.user.email}</span>}
            {(brand.city || brand.state) && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {[brand.city, brand.state].filter(Boolean).join(', ')}
              </span>
            )}
            {brand.websiteUrl && (
              <a
                href={brand.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#A68B67] hover:underline"
              >
                <Globe size={12} />
                {brand.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays size={12} />
              Applied {new Date(brand.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {brand.approvedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle size={12} />
                Approved {new Date(brand.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats (approved only) ─────────────────────────────────────────── */}
      {isApproved && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Products" value={brand._count?.products ?? 0} />
          <StatCard label="Orders" value={brand._count?.orders ?? 0} />
          <StatCard
            label="Avg Rating"
            value={
              <span className="flex items-center justify-center gap-1">
                <Star size={16} className="text-[#A68B67]" />
                {brand.avgRating > 0 ? brand.avgRating.toFixed(1) : '—'}
              </span>
            }
          />
          <StatCard label="Country" value={brand.countryOfOrigin ?? 'IN'} />
        </div>
      )}

      {/* ── Content grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 mb-5">

        {/* Left column */}
        <div className="space-y-5 min-w-0">

          {/* Brand story */}
          {brand.brandStory && (
            <InfoCard title="Brand Story">
              <p className="text-[13.5px] font-public-sans text-[#444748] leading-[1.8] whitespace-pre-wrap break-words">
                {brand.brandStory}
              </p>
            </InfoCard>
          )}

          {/* Categories */}
          <InfoCard title="Categories">
            {brand.category?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {brand.category.map((cat: string) => (
                  <span
                    key={cat}
                    className="text-[12.5px] font-public-sans font-[500] text-[#444748] bg-[#F5F0E8] border border-[#E5E1D8] px-3 py-1.5 rounded-lg"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] font-public-sans text-[#9CA3AF]">No categories specified</p>
            )}
          </InfoCard>

          {/* Shipping zones */}
          {brand.enabledZones?.length > 0 && (
            <InfoCard title="Shipping Zones">
              <div className="flex flex-wrap gap-2">
                {brand.enabledZones.map((z: string) => (
                  <span
                    key={z}
                    className="text-[12.5px] font-public-sans font-[500] text-[#444748] bg-[#F5F0E8] border border-[#E5E1D8] px-3 py-1.5 rounded-lg"
                  >
                    {SHIPPING_ZONE_LABELS[z] ?? z}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Business details */}
          <InfoCard title="Business Details">
            <InfoRow label="Registration type" value={brand.registrationType === 'business' ? 'Business' : 'Individual'} />
            <InfoRow label="Country of origin" value={brand.countryOfOrigin} />
            <InfoRow label="GST number" value={brand.gstNumber} />
            <InfoRow label="Business reg. number" value={brand.businessRegNumber} />
            <InfoRow label="Retail partners" value={brand.existingRetailPartners} />
          </InfoCard>

          {/* Wholesale terms */}
          <InfoCard title="Wholesale Terms">
            <InfoRow
              label="Wholesale products"
              value={brand.wholesaleProductCount ? `${brand.wholesaleProductCount} SKUs` : undefined}
            />
            <InfoRow
              label="Min. order value"
              value={brand.minimumOrderValue ? `₹${brand.minimumOrderValue.toLocaleString('en-IN')}` : undefined}
            />
            <InfoRow
              label="Lead time"
              value={brand.defaultLeadTime ? LEAD_TIME_LABELS[brand.defaultLeadTime] ?? brand.defaultLeadTime : undefined}
            />
          </InfoCard>

          {/* Achievement level override (approved only) */}
          {isApproved && (
            <InfoCard title="Achievement Level">
              <div className="flex items-center gap-3">
                <select
                  defaultValue={brand.achievementLevel}
                  onChange={(e) => overrideLevel.mutate({ id: brand.id, level: e.target.value })}
                  disabled={overrideLevel.isPending}
                  className="flex-1 h-9 px-3 rounded-lg border border-[#E5E1D8] bg-[#F9F7F2] text-[13px] font-[500] font-public-sans text-[#1A1A1A] focus:outline-none focus:border-[#A68B67] transition-colors disabled:opacity-50 appearance-none"
                >
                  {ACHIEVEMENT_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                {overrideLevel.isPending && (
                  <span className="text-[12px] font-public-sans text-[#9CA3AF]">Saving…</span>
                )}
              </div>
              {brand.isAdminOverride && (
                <p className="text-[12px] font-public-sans text-[#9CA3AF] mt-2">Admin override is active</p>
              )}
            </InfoCard>
          )}
        </div>
      </div>

      {/* ── Documents ────────────────────────────────────────────────────── */}
      {hasDocuments && (
        <div className="bg-white border border-[#E5E1D8] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F5F0E8]">
            <h3 className="text-[11px] font-[700] font-public-sans text-[#A68B67] uppercase tracking-[0.1em]">
              Submitted Documents
            </h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DocumentLink label="Aadhar Card" url={brand.aadharUrl} />
            <DocumentLink label="PAN Card" url={brand.panUrl} />
            <DocumentLink label="GST Certificate" url={brand.gstCertUrl} />
            <DocumentLink label="Incorporation Certificate" url={brand.incorporateCertUrl} />
            <DocumentLink label="MSME Certificate" url={brand.msmeCertUrl} />
            <DocumentLink label="ISO Certificate" url={brand.isoCertUrl} />
            <DocumentLink label="IEC Certificate" url={brand.iecCertUrl} />
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showReject && (
        <RejectModal
          brandId={brand.id}
          brandName={brand.brandName}
          onClose={() => setShowReject(false)}
        />
      )}
    </div>
  )
}
