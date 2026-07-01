'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Star, Package, ExternalLink, Search, ArrowUpRight } from 'lucide-react'
import { useAdminApprovedBrands } from '@/hooks/queries/useAdmin'

export default function AdminBrandsPage() {
  const router = useRouter()
  const { data: brands, isLoading } = useAdminApprovedBrands()
  const [search, setSearch] = useState('')

  const filtered = (brands ?? []).filter(
    (b) =>
      !search ||
      b.brandName.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.category.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-playfair text-[26px] font-[500] text-[#1A1A1A] leading-tight">
            Approved Brands
          </h1>
          <p className="text-[13px] font-public-sans text-[#9CA3AF] mt-0.5">
            {brands?.length ?? 0} brands live on the platform
          </p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, category..."
            className="h-9 w-[260px] pl-9 pr-4 rounded-md border border-[#E5E1D8] bg-white text-[13px] font-public-sans text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#A68B67] transition-colors"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[#E5E1D8] overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-[#F5F0E8]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-[#F5F0E8] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#F5F0E8] rounded w-36" />
                  <div className="h-3 bg-[#F5F0E8] rounded w-52" />
                </div>
                <div className="h-3 bg-[#F5F0E8] rounded w-24" />
                <div className="h-3 bg-[#F5F0E8] rounded w-16" />
                <div className="h-3 bg-[#F5F0E8] rounded w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F5F0E8] flex items-center justify-center">
              <Building2 size={20} className="text-[#A68B67]" />
            </div>
            <p className="text-[15px] font-[600] font-public-sans text-[#1A1A1A]">
              {search ? 'No brands match your search' : 'No approved brands yet'}
            </p>
            <p className="text-[13px] font-public-sans text-[#9CA3AF]">
              {search ? 'Try a different keyword.' : 'Approved brands will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {/* Col headers */}
            <div className="hidden md:grid grid-cols-[2.5fr_2fr_80px_80px_130px_36px] items-center px-5 py-3 border-b border-[#E5E1D8] bg-[#FAFAF9]">
              {['Brand', 'Category', 'Products', 'Rating', 'Approved', ''].map((h) => (
                <span key={h} className="text-[11px] font-[700] font-public-sans text-[#9CA3AF] uppercase tracking-[0.08em]">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#F5F0E8]">
              {filtered.map((brand) => (
                <div
                  key={brand.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/brands/${brand.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/brands/${brand.id}`)}
                  className="group grid grid-cols-1 md:grid-cols-[2.5fr_2fr_80px_80px_130px_36px] items-center px-5 py-4 hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                >
                  {/* Brand */}
                  <div className="flex items-center gap-3 min-w-0">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.brandName}
                        className="w-10 h-10 rounded-lg object-cover border border-[#E5E1D8] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#F5F0E8] border border-[#E5E1D8] flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-[#A68B67]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[14px] font-[600] font-public-sans text-[#1A1A1A] truncate group-hover:text-[#A68B67] transition-colors">
                        {brand.brandName}
                      </p>
                      <p className="text-[12px] font-public-sans text-[#9CA3AF] truncate">{brand.email}</p>
                    </div>
                  </div>

                  {/* Category */}
                  <p className="hidden md:block text-[13px] font-public-sans text-[#444748] truncate pr-4">
                    {brand.category.slice(0, 2).join(', ')}
                    {brand.category.length > 2 && (
                      <span className="text-[#9CA3AF]"> +{brand.category.length - 2}</span>
                    )}
                  </p>

                  {/* Products */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <Package size={13} className="text-[#9CA3AF]" />
                    <span className="text-[13px] font-public-sans text-[#444748]">{brand.productCount}</span>
                  </div>

                  {/* Rating */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <Star size={13} className="text-[#A68B67]" />
                    <span className="text-[13px] font-public-sans text-[#444748]">
                      {brand.avgRating > 0 ? brand.avgRating.toFixed(1) : '—'}
                    </span>
                  </div>

                  {/* Approved date */}
                  <p className="hidden md:block text-[13px] font-public-sans text-[#9CA3AF]">
                    {brand.approvedAt
                      ? new Date(brand.approvedAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </p>

                  {/* Storefront link */}
                  <a
                    href={`/brands/${brand.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hidden md:flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#F5F0E8] text-[#9CA3AF] hover:text-[#A68B67] transition-colors"
                    aria-label={`View ${brand.brandName} storefront`}
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
