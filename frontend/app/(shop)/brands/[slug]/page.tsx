'use client'

import { use } from 'react'
import Image from 'next/image'
import { MapPin, CalendarDays } from 'lucide-react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { BrandStorefrontClient } from './BrandStorefrontClient'
import { useBrand } from '@/hooks/queries/useBrands'
import { useProducts } from '@/hooks/queries/useProducts'
import type { Product as ApiProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types'

// ─── Map API product to @/types Product ───────────────────────────────────────

function toTypedProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    shortDescription: p.shortDescription,
    description: p.description,
    images: p.photos
      .sort((a, b) => a.position - b.position)
      .map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight,
    category: p.category,
    tags: p.tags,
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function BrandStorefrontSkeleton() {
  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      {/* Hero skeleton */}
      <div className="w-full h-80 bg-muted-bg animate-pulse relative">
        {/* Logo circle */}
        <div className="absolute bottom-0 left-6 lg:left-16 translate-y-1/2 z-10">
          <div className="w-20 h-20 rounded-full bg-border-warm border-4 border-surface animate-pulse" />
        </div>
      </div>

      {/* Brand header skeleton */}
      <div className="bg-surface border-b border-border-warm px-6 lg:px-16 pt-12 pb-6">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-3">
          <div className="h-8 bg-muted-bg rounded w-56 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-4 bg-muted-bg rounded w-24 animate-pulse" />
            <div className="h-4 bg-muted-bg rounded w-20 animate-pulse" />
          </div>
          <div className="h-4 bg-muted-bg rounded w-full max-w-[640px] animate-pulse" />
          <div className="h-4 bg-muted-bg rounded w-4/5 max-w-[512px] animate-pulse" />
        </div>
      </div>

      {/* Product grid skeleton */}
      <section className="bg-bg px-6 lg:px-16 py-8 flex-1">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted-bg rounded mb-3" />
                <div className="h-3 bg-muted-bg rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted-bg rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted-bg rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ─── Inner page (consumes hooks) ──────────────────────────────────────────────

function BrandStorefrontInner({ slug }: { slug: string }) {
  const {
    data: brand,
    isLoading: brandLoading,
    isError: brandError,
  } = useBrand(slug)

  const {
    data: productsData,
    isLoading: productsLoading,
  } = useProducts({ brandSlug: slug, limit: 100 })

  if (brandLoading || productsLoading) {
    return <BrandStorefrontSkeleton />
  }

  if (brandError || !brand) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Brand not found"
            description="This brand may have been removed or the link is incorrect."
            action={{ label: 'Browse Catalogue', onClick: () => { window.location.href = '/catalogue' } }}
          />
        </main>
        <Footer />
      </div>
    )
  }

  const rawProducts = productsData?.products ?? []
  const products: Product[] = rawProducts.map((p) => toTypedProduct(p as unknown as ApiProduct))

  // Build collections: "All Products" + brand's named collections from API
  const apiCollections = brand.collections ?? []
  const collectionNames: string[] = [
    'All Products',
    ...apiCollections.map((c) => c.name),
  ]

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <div className="relative w-full h-80 overflow-hidden">
        {brand.banner ? (
          <Image
            src={brand.banner}
            alt={`${brand.name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted-bg" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />

        {/* Brand logo — overlapping the header below */}
        <div className="absolute bottom-0 left-6 lg:left-16 translate-y-1/2 z-10">
          <div className="w-20 h-20 rounded-full border-4 border-surface overflow-hidden bg-muted-bg shadow-[0_4px_20px_rgba(26,26,26,0.04)]">
            {brand.logo ? (
              <Image
                src={brand.logo}
                alt={`${brand.name} logo`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                <span className="text-[24px] font-[600] font-playfair text-muted-text">
                  {brand.name?.[0] ?? '?'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Brand header ───────────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border-warm px-6 lg:px-16 pt-12 pb-6">
        <div className="max-w-[1280px] mx-auto">
          {/* Brand name */}
          <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary">
            {brand.name}
          </h1>

          {/* Location + year */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {brand.location && (
              <span className="flex items-center gap-1 text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text">
                <MapPin size={11} aria-hidden="true" />
                {brand.location}
              </span>
            )}
            {brand.yearFounded && (
              <span className="flex items-center gap-1 text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text">
                <CalendarDays size={11} aria-hidden="true" />
                Est. {brand.yearFounded}
              </span>
            )}
            <span className="text-[12px] text-muted-text font-public-sans">
              {brand.productCount} products
            </span>
          </div>

          {/* Achievement badge */}
          <div className="mt-2">
            <AchievementBadge level={brand.achievementLevel as 1 | 2 | 3 | 4 | 5} />
          </div>

          {/* Tagline */}
          {brand.tagline && (
            <p className="text-[16px] leading-[1.5] font-[400] font-public-sans text-muted-text italic mt-2">
              &ldquo;{brand.tagline}&rdquo;
            </p>
          )}

          {/* Description */}
          <p className="text-[16px] leading-[1.5] font-[400] font-public-sans text-muted-text mt-3 max-w-[640px]">
            {brand.description}
          </p>
        </div>
      </div>

      {/* ── Client section: collections tab + product grid ──────────────────── */}
      <BrandStorefrontClient
        products={products}
        collections={collectionNames}
      />

      <Footer />
    </div>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function BrandStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <BrandStorefrontInner slug={slug} />
}
