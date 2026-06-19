'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useProducts } from '@/hooks/queries/useProducts'
import type { Product as HookProduct } from '@/hooks/queries/useProducts'
import { ProductCard } from '@/components/shared/ProductCard'
import type { Product as GlobalProduct } from '@/types'

function adaptProduct(p: HookProduct): GlobalProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    description: p.description,
    images: p.photos.map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: (p.leadTime as GlobalProduct['leadTime']) || '1-2 weeks',
    weight: p.weight,
    category: p.category,
    tags: p.tags,
    achievementLevel: p.brand?.achievementLevel as GlobalProduct['achievementLevel'],
    brandMinimumOrderValue: p.brand?.minimumOrderValue,
    variants: p.variants,
    inStock: p.inStock,
  }
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="aspect-square rounded-sm bg-muted-bg" />
      <div className="mt-2 space-y-1.5">
        <div className="h-4 bg-muted-bg rounded w-1/3" />
        <div className="h-4 bg-muted-bg rounded w-3/4" />
        <div className="h-3 bg-muted-bg rounded w-1/2" />
        <div className="h-3 bg-muted-bg rounded w-1/4" />
      </div>
    </div>
  )
}

export function TrendingProductsSection() {
  const { data, isLoading } = useProducts({ limit: 8 })
  const products = data?.products ?? []

  return (
    <section className="py-12 bg-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">

        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-3">
              Trending Now
            </p>
            <h2 className="font-playfair font-[500] text-primary leading-[1.2] text-[28px] lg:text-[32px]">
              Products Buyers Love
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="hidden sm:inline-flex items-center gap-1 font-public-sans text-[13px] font-[600] text-muted-text hover:text-primary transition-colors flex-shrink-0 ml-6"
          >
            View all <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => (
                <ProductCard key={product.id} product={adaptProduct(product)} />
              ))}
        </div>

        {!isLoading && products.length === 0 && (
          <p className="text-center font-public-sans text-[14px] text-muted-text py-16">
            Products coming soon.{' '}
            <Link href="/catalogue" className="text-accent hover:underline underline-offset-2">
              Browse catalogue
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
