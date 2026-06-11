'use client'

import Link from 'next/link'
import { use } from 'react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { PhotoGallery } from '@/components/pdp/PhotoGallery'
import { ProductInfo } from '@/components/pdp/ProductInfo'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types'

// ─── Map API product to @/types Product ───────────────────────────────────────

interface ApiProduct {
  id: string
  name: string
  slug: string
  brandId: string
  brandName: string
  brandSlug: string
  shortDescription: string
  description?: string
  photos?: Array<{ id: string; url: string; position: number }>
  wholesalePrice: number
  moq: number
  leadTime: string
  weight: number
  category: string
  tags: string[]
  brand?: { achievementLevel: number }
  inStock: boolean
  availability?: string
}

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
    images: (p.photos ?? [])
      .sort((a, b) => a.position - b.position)
      .map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight,
    category: p.category,
    tags: p.tags ?? [],
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PDPSkeleton() {
  return (
    <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-16 py-12">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-3 bg-muted-bg rounded w-12 animate-pulse" />
        <div className="h-3 bg-muted-bg rounded w-2 animate-pulse" />
        <div className="h-3 bg-muted-bg rounded w-20 animate-pulse" />
        <div className="h-3 bg-muted-bg rounded w-2 animate-pulse" />
        <div className="h-3 bg-muted-bg rounded w-32 animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left: image skeleton */}
        <div className="w-full lg:w-1/2">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted-bg rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Right: content skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="h-8 bg-muted-bg rounded w-3/4 animate-pulse" />
          <div className="h-14 bg-muted-bg rounded w-1/2 animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted-bg rounded-full w-16 animate-pulse" />
            ))}
          </div>
          <div className="h-4 bg-muted-bg rounded w-full animate-pulse" />
          <div className="h-4 bg-muted-bg rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-muted-bg rounded w-4/6 animate-pulse" />
          <div className="h-10 bg-muted-bg rounded w-40 animate-pulse mt-4" />
          <div className="h-12 bg-muted-bg rounded w-full animate-pulse mt-2" />
        </div>
      </div>
    </main>
  )
}

// ─── Inner page (consumes the hook) ──────────────────────────────────────────

function ProductDetailInner({ slug }: { slug: string }) {
  const { data: rawProduct, isLoading, isError } = useProduct(slug)

  if (isLoading) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        {/* Brand bar skeleton */}
        <div className="w-full bg-surface border-b border-border-warm py-3 px-6 lg:px-16">
          <div className="max-w-[1280px] mx-auto flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted-bg animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <div className="h-4 bg-muted-bg rounded w-32 animate-pulse" />
              <div className="h-3 bg-muted-bg rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>
        <PDPSkeleton />
        <Footer />
      </div>
    )
  }

  if (isError || !rawProduct) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Product not found"
            description="This product may have been removed or the link is incorrect."
            action={{ label: 'Browse Catalogue', onClick: () => { window.location.href = '/catalogue' } }}
          />
        </main>
        <Footer />
      </div>
    )
  }

  const product = toTypedProduct(rawProduct as unknown as ApiProduct)

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      {/* ── Brand bar ──────────────────────────────────────────────────────── */}
      <div className="w-full bg-surface border-b border-border-warm py-3 px-6 lg:px-16">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
          {/* Left: brand identity */}
          <Link
            href={`/brands/${product.brandSlug}`}
            className="flex items-center gap-3 group"
            aria-label={`View ${product.brandName} storefront`}
          >
            {/* Brand logo circle */}
            <div className="w-12 h-12 rounded-full bg-muted-bg border border-border-warm overflow-hidden flex-shrink-0">
              <img
                src={`https://picsum.photos/seed/${product.brandSlug}-logo/96/96`}
                alt={`${product.brandName} logo`}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary group-hover:text-accent transition-colors">
                {product.brandName}
              </span>
              {product.achievementLevel && (
                <div className="mt-0.5">
                  <AchievementBadge level={product.achievementLevel} />
                </div>
              )}
            </div>
          </Link>

          {/* Right: MOQ pill */}
          <div className="flex items-center gap-2">
            <span className="bg-muted-bg text-muted-text rounded px-3 py-1 text-[12px] font-[500] font-public-sans border border-border-warm">
              MOQ: {product.moq} units
            </span>
            <span className="bg-muted-bg text-muted-text rounded px-3 py-1 text-[12px] font-[500] font-public-sans border border-border-warm hidden sm:inline-block">
              {product.leadTime}
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-16 py-12">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 mb-8 text-[12px] font-public-sans text-muted-text"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalogue" className="hover:text-primary transition-colors">
            Catalogue
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/brands/${product.brandSlug}`}
            className="hover:text-primary transition-colors"
          >
            {product.brandName}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-primary truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left: Gallery */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-20 lg:self-start">
            <PhotoGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-1/2">
            <ProductInfo product={product} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <ProductDetailInner slug={id} />
}
