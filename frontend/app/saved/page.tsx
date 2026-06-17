'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'
import { ProductCard } from '@/components/shared/ProductCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import {
  useSaved,
  useUnsaveBrand,
  type SavedBrand,
  type SavedProduct,
} from '@/hooks/queries/useBuyerDashboard'
import type { Product as GlobalProduct } from '@/types'

type SavedTab = 'brands' | 'products'

function adaptSavedProduct(p: SavedProduct): GlobalProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: '',
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    shortDescription: '',
    images: p.image ? [p.image] : [],
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: '1-2 weeks',
    weight: 0,
    category: '',
    tags: [],
    inStock: p.inStock,
  }
}

function SkeletonBrandCard() {
  return (
    <div className="bg-surface border border-border-warm rounded p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-14 h-14 rounded bg-muted-bg" />
        <div className="w-6 h-6 rounded bg-muted-bg" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted-bg rounded w-3/4" />
        <div className="h-3 bg-muted-bg rounded w-1/2" />
        <div className="h-3 bg-muted-bg rounded w-full mt-2" />
      </div>
    </div>
  )
}

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

function SavedBrandCard({
  brand,
  onUnsave,
  isPending,
}: {
  brand: SavedBrand
  onUnsave: (id: string) => void
  isPending: boolean
}) {
  return (
    <div className="bg-surface border border-border-warm rounded p-4 flex flex-col hover:shadow-[0_4px_20px_rgba(26,26,26,0.04)] transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-14 h-14 rounded border border-border-warm bg-muted-bg flex-shrink-0 flex items-center justify-center overflow-hidden">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[22px] font-[600] font-playfair text-muted-text/40 select-none">
              {brand.name?.charAt(0) ?? '?'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onUnsave(brand.id)}
          disabled={isPending}
          aria-label={`Remove ${brand.name} from saved`}
          className="text-accent hover:text-error transition-colors p-1 -mr-1 -mt-1 disabled:opacity-50"
        >
          <Heart size={16} fill="currentColor" aria-hidden="true" />
        </button>
      </div>

      <p className="text-[18px] font-[500] font-playfair text-primary leading-tight line-clamp-1">
        {brand.name}
      </p>
      {brand.location && (
        <p className="text-[12px] font-public-sans text-muted-text mt-0.5">{brand.location}</p>
      )}

      <div className="mt-3 pt-3 border-t border-border-warm flex gap-2 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-[12px]"
          onClick={() => window.open(`/brands/${brand.slug}`, '_blank')}
        >
          View Brand
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-[12px]">
          Quick Reorder
        </Button>
      </div>
    </div>
  )
}

function SavedProductCard({ product }: { product: SavedProduct }) {
  return <ProductCard product={adaptSavedProduct(product)} />
}

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<SavedTab>('products')

  const { data: saved, isLoading } = useSaved()
  const unsaveBrandMutation = useUnsaveBrand()

  const savedBrands = saved?.brands ?? []
  const savedProducts = saved?.products ?? []

  return (
    <AccountPageWrapper title="Saved" description="Your curated shortlist of brands and products">

      <div className="flex gap-1 mb-6 border-b border-border-warm">
        {[
          { key: 'products' as SavedTab, label: `Saved Products${!isLoading ? ` (${savedProducts.length})` : ''}` },
          { key: 'brands' as SavedTab, label: `Saved Brands${!isLoading ? ` (${savedBrands.length})` : ''}` },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-2.5 text-[14px] font-[600] font-public-sans',
              'border-b-[2px] transition-colors duration-150 -mb-px',
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-text hover:text-primary'
            )}
            aria-selected={activeTab === key}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'brands' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonBrandCard key={i} />)}
            </div>
          ) : savedBrands.length === 0 ? (
            <EmptyState
              title="No saved brands yet"
              description="Browse the catalogue and save brands you love."
              action={{ label: 'Browse brands', onClick: () => { window.location.href = '/brands' } }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {savedBrands.map((brand) => (
                <SavedBrandCard
                  key={brand.id}
                  brand={brand}
                  onUnsave={(id) => unsaveBrandMutation.mutate(id)}
                  isPending={unsaveBrandMutation.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'products' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)}
            </div>
          ) : savedProducts.length === 0 ? (
            <EmptyState
              title="No saved products yet"
              description="While browsing, click the save icon on any product to build your shortlist."
              action={{ label: 'Explore products', onClick: () => { window.location.href = '/catalogue' } }}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedProducts.map((product) => (
                <SavedProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </AccountPageWrapper>
  )
}
