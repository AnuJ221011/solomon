'use client'

import { useState } from 'react'
import { Building2, Star, Package, ExternalLink } from 'lucide-react'
import { useAdminApprovedBrands, type ApprovedBrand } from '@/hooks/queries/useAdmin'
import { BrandDetailDrawer } from '@/components/admin/BrandDetailDrawer'

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LEVEL_LABELS: Record<string, string> = {
  L1_SPROUT: 'Sprout',
  L2_RISING: 'Rising',
  L3_TRUSTED: 'Trusted',
  L4_ELITE: 'Elite',
  L5_LEGEND: 'Legend',
}

const LEVEL_COLORS: Record<string, string> = {
  L1_SPROUT: 'text-muted-text bg-muted-bg border-border-warm',
  L2_RISING: 'text-blue-600 bg-blue-50 border-blue-200',
  L3_TRUSTED: 'text-green-700 bg-green-50 border-green-200',
  L4_ELITE: 'text-purple-700 bg-purple-50 border-purple-200',
  L5_LEGEND: 'text-amber-700 bg-amber-50 border-amber-200',
}

// â”€â”€â”€ Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BrandRow({ brand, onSelect }: { brand: ApprovedBrand; onSelect: (id: string) => void }) {
  const levelLabel = LEVEL_LABELS[brand.achievementLevel] ?? brand.achievementLevel
  const levelColor = LEVEL_COLORS[brand.achievementLevel] ?? LEVEL_COLORS.L1_SPROUT

  return (
    <tr
      className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors cursor-pointer"
      onClick={() => onSelect(brand.id)}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.brandName}
              className="w-8 h-8 rounded object-cover border border-border-warm"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-muted-bg border border-border-warm flex items-center justify-center">
              <Building2 size={14} className="text-muted-text" />
            </div>
          )}
          <div>
            <p className="text-[14px] font-[600] font-public-sans text-primary">{brand.brandName}</p>
            <p className="text-[12px] font-public-sans text-muted-text">{brand.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-[13px] font-public-sans text-muted-text">
        {brand.category.join(', ') || 'â€”'}
      </td>
      <td className="py-4 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-[600] font-public-sans ${levelColor}`}>
          {levelLabel}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-[13px] font-public-sans text-muted-text">
          <Package size={13} aria-hidden="true" />
          {brand.productCount}
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1 text-[13px] font-public-sans text-muted-text">
          <Star size={13} aria-hidden="true" className="text-amber-400" />
          {brand.avgRating > 0 ? brand.avgRating.toFixed(1) : 'â€”'}
        </div>
      </td>
      <td className="py-4 px-4 text-[13px] font-public-sans text-muted-text">
        {brand.approvedAt
          ? new Date(brand.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'â€”'}
      </td>
      <td className="py-4 px-4">
        <a
          href={`/brands/${brand.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-text hover:text-primary transition-colors"
          aria-label={`View ${brand.brandName} storefront`}
        >
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </td>
    </tr>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminBrandsPage() {
  const { data: brands, isLoading } = useAdminApprovedBrands()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] leading-[1.3] font-[500] font-playfair text-primary">
          Approved Brands
        </h1>
        <p className="text-[14px] font-public-sans text-muted-text mt-1">
          All live brands on the platform
        </p>
      </div>

      <div className="bg-surface border border-border-warm rounded overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border-warm">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="w-8 h-8 bg-muted-bg rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted-bg rounded w-40" />
                  <div className="h-3 bg-muted-bg rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : !brands?.length ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <Building2 size={22} className="text-muted-text" aria-hidden="true" />
            </div>
            <p className="text-[16px] font-[600] font-public-sans text-primary">No approved brands yet</p>
            <p className="text-[13px] font-public-sans text-muted-text max-w-[260px]">
              Approved brands will appear here once applications are reviewed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-warm bg-muted-bg/40">
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Brand</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Category</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Level</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Products</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Rating</th>
                  <th className="text-left py-3 px-4 text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em]">Approved</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <BrandRow key={brand.id} brand={brand} onSelect={setSelectedId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BrandDetailDrawer brandId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
