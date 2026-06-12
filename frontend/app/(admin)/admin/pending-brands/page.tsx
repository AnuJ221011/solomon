'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react'
import {
  useAdminPendingBrands,
  useApproveBrand,
  useRejectBrand,
  type PendingBrand,
} from '@/hooks/queries/useAdmin'
import { BrandDetailDrawer } from '@/components/admin/BrandDetailDrawer'
import { cn } from '@/lib/utils'

// â”€â”€â”€ Reject modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RejectModal({ brand, onClose }: { brand: PendingBrand; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const rejectBrand = useRejectBrand()

  function handleConfirm() {
    rejectBrand.mutate(
      { id: brand.id, reason: reason.trim() || undefined },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-surface border border-border-warm rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-[18px] font-[600] font-playfair text-primary">Reject Brand</h2>
        <p className="text-[14px] font-public-sans text-muted-text">
          Rejecting <strong className="text-primary">{brand.name}</strong>. Optionally provide a reason.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)..."
          rows={3}
          className="w-full px-3 py-2 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded border border-border-warm text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={rejectBrand.isPending}
            className="h-9 px-4 rounded bg-error text-white text-[13px] font-[600] font-public-sans hover:bg-error/90 transition-colors disabled:opacity-50"
          >
            {rejectBrand.isPending ? 'Rejectingâ€¦' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BrandRow({ brand, onReject, onSelect }: { brand: PendingBrand; onReject: (b: PendingBrand) => void; onSelect: (id: string) => void }) {
  const approveBrand = useApproveBrand()

  return (
    <tr
      className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors cursor-pointer"
      onClick={() => onSelect(brand.id)}
    >
      <td className="py-4 px-4">
        <div>
          <p className="text-[14px] font-[600] font-public-sans text-primary">{brand.name}</p>
          <p className="text-[12px] font-public-sans text-muted-text">{brand.email}</p>
        </div>
      </td>
      <td className="py-4 px-4 text-[13px] font-public-sans text-muted-text">{brand.category}</td>
      <td className="py-4 px-4 text-[13px] font-public-sans text-muted-text">
        {brand.city}, {brand.state}
      </td>
      <td className="py-4 px-4 text-[13px] font-public-sans text-muted-text">
        {brand.skuCount} SKUs
      </td>
      <td className="py-4 px-4 text-[13px] font-public-sans text-muted-text">
        {new Date(brand.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 justify-end">
          {brand.instagramUrl && (
            <a
              href={brand.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-text hover:text-primary transition-colors"
              aria-label="View Instagram"
            >
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); approveBrand.mutate(brand.id) }}
            disabled={approveBrand.isPending}
            aria-label={`Approve ${brand.name}`}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded border text-[12px] font-[600] font-public-sans transition-colors',
              'border-success/40 text-success bg-success/5 hover:bg-success/10',
              'disabled:opacity-50'
            )}
          >
            <CheckCircle size={13} aria-hidden="true" />
            Approve
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReject(brand) }}
            aria-label={`Reject ${brand.name}`}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded border text-[12px] font-[600] font-public-sans transition-colors',
              'border-error/40 text-error bg-error/5 hover:bg-error/10'
            )}
          >
            <XCircle size={13} aria-hidden="true" />
            Reject
          </button>
        </div>
      </td>
    </tr>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function PendingBrandsPage() {
  const { data: brands, isLoading } = useAdminPendingBrands()
  const [rejectTarget, setRejectTarget] = useState<PendingBrand | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">
          Pending Applications
        </h1>
        <p className="text-[14px] font-public-sans text-muted-text mt-1">
          Review and approve pending brand applications
        </p>
      </div>

      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted-bg rounded w-40" />
                  <div className="h-3 bg-muted-bg rounded w-28" />
                </div>
                <div className="h-8 bg-muted-bg rounded w-24" />
              </div>
            ))}
          </div>
        ) : !brands?.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <Clock size={22} className="text-muted-text" aria-hidden="true" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">No pending applications</p>
            <p className="text-[13px] font-public-sans text-muted-text max-w-[260px]">
              All brand applications have been reviewed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-warm bg-muted-bg/40">
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Brand</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Category</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Location</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Catalogue</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Applied</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <BrandRow key={brand.id} brand={brand} onReject={setRejectTarget} onSelect={setSelectedId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectTarget && (
        <RejectModal brand={rejectTarget} onClose={() => setRejectTarget(null)} />
      )}

      <BrandDetailDrawer brandId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
