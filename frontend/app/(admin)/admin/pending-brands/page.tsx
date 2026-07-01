'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ExternalLink, CheckCircle, XCircle, Search, MapPin, Globe, CalendarDays } from 'lucide-react'
import {
  useAdminPendingBrands,
  useApproveBrand,
  useRejectBrand,
  type PendingBrand,
} from '@/hooks/queries/useAdmin'
import { cn } from '@/lib/utils'

// ─── Reject modal ─────────────────────────────────────────────────────────────

function RejectModal({ brand, onClose }: { brand: PendingBrand; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const rejectBrand = useRejectBrand()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white border border-[#E5E1D8] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-[18px] font-[600] font-playfair text-[#1A1A1A]">Reject application</h2>
        <p className="text-[13.5px] font-public-sans text-[#444748]">
          Rejecting <strong className="text-[#1A1A1A]">{brand.name}</strong>. You can optionally include a reason — it will be shared with the applicant.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-[#E5E1D8] bg-[#F9F7F2] text-[13.5px] font-public-sans text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#A68B67] transition-colors resize-none"
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-[#E5E1D8] text-[13px] font-[500] font-public-sans text-[#444748] hover:bg-[#F9F7F2] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => rejectBrand.mutate({ id: brand.id, reason: reason.trim() || undefined }, { onSuccess: onClose })}
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

// ─── Brand card ───────────────────────────────────────────────────────────────

function BrandCard({
  brand,
  onReject,
  onSelect,
}: {
  brand: PendingBrand
  onReject: (b: PendingBrand) => void
  onSelect: (id: string) => void
}) {
  const approveBrand = useApproveBrand()

  return (
    <div
      className="group bg-white border border-[#E5E1D8] rounded-xl p-5 hover:border-[#A68B67]/40 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onSelect(brand.id)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Brand info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[15px] font-[600] font-public-sans text-[#1A1A1A] group-hover:text-[#A68B67] transition-colors">
              {brand.name}
            </p>
            <span className="text-[11px] font-[600] font-public-sans text-[#B25E00] bg-[#FFF4E6] border border-[#FFD8A8] px-2 py-0.5 rounded-full">
              Pending
            </span>
          </div>
          <p className="text-[12.5px] font-public-sans text-[#9CA3AF] mb-3">{brand.email}</p>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2">
            {brand.category && (
              <span className="text-[12px] font-public-sans text-[#444748] bg-[#F5F0E8] px-2.5 py-1 rounded-md">
                {brand.category}
              </span>
            )}
            {(brand.city || brand.state) && (
              <span className="flex items-center gap-1 text-[12px] font-public-sans text-[#9CA3AF]">
                <MapPin size={11} />
                {[brand.city, brand.state].filter(Boolean).join(', ')}
              </span>
            )}
            {brand.websiteUrl && (
              <a
                href={brand.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[12px] font-public-sans text-[#A68B67] hover:underline"
              >
                <Globe size={11} />
                Website
              </a>
            )}
            <span className="flex items-center gap-1 text-[12px] font-public-sans text-[#9CA3AF]">
              <CalendarDays size={11} />
              {new Date(brand.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div
          className="flex flex-col gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => approveBrand.mutate(brand.id)}
            disabled={approveBrand.isPending}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-[600] font-public-sans transition-colors',
              'bg-[#F0FAF0] border border-[#B2DDB2] text-[#1E5F1E] hover:bg-[#E0F4E0]',
              'disabled:opacity-50'
            )}
          >
            <CheckCircle size={13} aria-hidden="true" />
            {approveBrand.isPending ? 'Approving…' : 'Approve'}
          </button>
          <button
            type="button"
            onClick={() => onReject(brand)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-[600] font-public-sans transition-colors',
              'bg-[#FFF0F0] border border-[#FFB3B3] text-[#BA1A1A] hover:bg-[#FFE0E0]'
            )}
          >
            <XCircle size={13} aria-hidden="true" />
            Reject
          </button>
        </div>
      </div>

      {/* Footer: view full details link */}
      <div className="mt-4 pt-3.5 border-t border-[#F5F0E8] flex items-center justify-between">
        <span className="text-[12px] font-public-sans text-[#9CA3AF]">
          {brand.skuCount > 0 ? `${brand.skuCount} SKUs declared` : 'No SKUs declared'}
        </span>
        <span className="text-[12px] font-[600] font-public-sans text-[#A68B67] group-hover:underline">
          View full application →
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PendingBrandsPage() {
  const router = useRouter()
  const { data: brands, isLoading } = useAdminPendingBrands()
  const [rejectTarget, setRejectTarget] = useState<PendingBrand | null>(null)
  const [search, setSearch] = useState('')

  const filtered = (brands ?? []).filter(
    (b) =>
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-playfair text-[26px] font-[500] text-[#1A1A1A] leading-tight">
            Pending Applications
          </h1>
          <p className="text-[13px] font-public-sans text-[#9CA3AF] mt-0.5">
            {brands?.length ?? 0} applications awaiting review
          </p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicants..."
            className="h-9 w-[220px] pl-9 pr-4 rounded-md border border-[#E5E1D8] bg-white text-[13px] font-public-sans text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#A68B67] transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E5E1D8] rounded-xl p-5 animate-pulse">
              <div className="flex justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-[#F5F0E8] rounded w-40" />
                  <div className="h-3 bg-[#F5F0E8] rounded w-56" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-[#F5F0E8] rounded w-20" />
                    <div className="h-6 bg-[#F5F0E8] rounded w-28" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-[#F5F0E8] rounded w-24" />
                  <div className="h-8 bg-[#F5F0E8] rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E1D8] rounded-xl py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F5F0E8] flex items-center justify-center">
            <Clock size={20} className="text-[#A68B67]" />
          </div>
          <p className="text-[15px] font-[600] font-public-sans text-[#1A1A1A]">
            {search ? 'No matching applications' : 'No pending applications'}
          </p>
          <p className="text-[13px] font-public-sans text-[#9CA3AF]">
            {search ? 'Try a different search term.' : 'All brand applications have been reviewed.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onReject={setRejectTarget}
              onSelect={(id) => router.push(`/admin/brands/${id}`)}
            />
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal brand={rejectTarget} onClose={() => setRejectTarget(null)} />
      )}
    </div>
  )
}
