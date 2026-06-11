'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { ProductCard } from '@/components/shared/ProductCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useBuyerDashboard } from '@/hooks/queries/useBuyerDashboard'
import { useProducts } from '@/hooks/queries/useProducts'
import type { Product } from '@/hooks/queries/useProducts'
import type { Product as GlobalProduct } from '@/types'

// ─── Quick stat chip ──────────────────────────────────────────────────────────

function StatChip({ label }: { label: string }) {
  return (
    <div className="bg-muted-bg rounded px-4 py-2 text-[14px] font-[600] font-public-sans text-primary whitespace-nowrap flex-shrink-0">
      {label}
    </div>
  )
}

// ─── Skeleton product card ────────────────────────────────────────────────────

function SkeletonProductCard() {
  return (
    <div className="bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted-bg" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted-bg rounded w-3/4" />
        <div className="h-3 bg-muted-bg rounded w-1/2" />
        <div className="h-4 bg-muted-bg rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}

// ─── Adapt Product from hook to global Product type ───────────────────────────

function adaptProduct(p: Product): GlobalProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    shortDescription: p.shortDescription,
    description: p.description,
    images: p.photos?.map((ph) => ph.url) ?? [],
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: p.leadTime as GlobalProduct['leadTime'],
    weight: p.weight,
    category: p.category,
    tags: p.tags,
    achievementLevel: p.brand?.achievementLevel as GlobalProduct['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyerDiscoverPage() {
  const [alertDismissed, setAlertDismissed] = useState(false)

  const { data: dashboard, isLoading: dashboardLoading } = useBuyerDashboard()
  const { data: productsResult, isLoading: productsLoading } = useProducts({ limit: 16 })

  const stats = dashboard?.stats
  const savedBrandsWithProducts = (dashboard?.savedBrands ?? []).filter(
    // Only show alert if there are brands in the saved list
    (b) => !!b
  )
  const showAlert = !alertDismissed && savedBrandsWithProducts.length > 0

  const products = productsResult?.products ?? []

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Your Discovery Feed
        </h1>
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
          Discover the latest from Indian artisan brands
        </p>
      </div>

      {/* New from saved brands alert */}
      {showAlert && (
        <div className="bg-accent text-white rounded px-4 py-3 mb-6 flex items-center justify-between gap-3">
          <p className="text-[14px] leading-[1.4] font-[600] font-public-sans text-white">
            &#x2756; New products from your saved brands
          </p>
          <button
            type="button"
            onClick={() => setAlertDismissed(true)}
            aria-label="Dismiss notification"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Quick stats row */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {dashboardLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted-bg rounded px-4 py-2 h-9 w-32 animate-pulse flex-shrink-0" />
            ))}
          </>
        ) : (
          <>
            <StatChip label={`${stats?.savedBrands ?? 0} Saved Brands`} />
            <StatChip label={`₹${(stats?.walletBalance ?? 0).toLocaleString('en-IN')} Wallet Balance`} />
            <StatChip label={`${stats?.totalOrders ?? 0} Orders`} />
          </>
        )}
      </div>

      {/* Product grid */}
      {productsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Browse the catalogue to discover brands and their products."
          action={{ label: 'Browse the Catalogue', onClick: () => { window.location.href = '/catalogue' } }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={adaptProduct(product)} />
          ))}
        </div>
      )}
    </div>
  )
}
