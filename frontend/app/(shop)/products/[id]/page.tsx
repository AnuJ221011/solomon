'use client'

import Link from 'next/link'
import { use } from 'react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { PhotoGallery } from '@/components/pdp/PhotoGallery'
import { ProductInfo } from '@/components/pdp/ProductInfo'
import { ProductCard } from '@/components/shared/ProductCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProduct, useProducts } from '@/hooks/queries/useProducts'
import type { Product as HookProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types'

// ─── Map hook product → @/types Product ──────────────────────────────────────

function toTypedProduct(p: HookProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    shortDescription: p.shortDescription,
    description: p.description,
    images: p.photos.map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice,
    moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight,
    category: p.category,
    tags: p.tags ?? [],
    achievementLevel: p.brand?.achievementLevel as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── Map raw API product → @/types Product (for detail page) ─────────────────

interface ApiProduct {
  id: string; name: string; slug: string; brandId: string
  brandName: string; brandSlug: string; shortDescription: string
  description?: string; photos?: Array<{ id: string; url: string; position: number }>
  wholesalePrice: number; moq: number; leadTime: string; weight: number
  category: string; tags: string[]; brand?: { achievementLevel: number }; inStock: boolean
}

function toTypedFromApi(p: ApiProduct): Product {
  return {
    id: p.id, name: p.name, slug: p.slug,
    brandId: p.brandId, brandName: p.brandName, brandSlug: p.brandSlug,
    shortDescription: p.shortDescription, description: p.description,
    images: (p.photos ?? []).sort((a, b) => a.position - b.position).map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice, moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight, category: p.category, tags: p.tags ?? [],
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── More from brand ──────────────────────────────────────────────────────────

function MoreFromBrand({ brandSlug, brandName, currentSlug }: { brandSlug: string; brandName: string; currentSlug: string }) {
  const { data } = useProducts({ brandSlug, limit: 5 })
  const others = (data?.products ?? [])
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 4)

  if (others.length === 0) return null

  return (
    <section className="border-t border-border-warm">
      <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-16 py-12">
        <h2 className="font-playfair font-[500] text-primary text-[22px] mb-6">
          More from {brandName}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {others.map((p) => (
            <ProductCard key={p.slug} product={toTypedProduct(p)} />
          ))}
        </div>
        <div className="mt-6">
          <Link
            href={`/brands/${brandSlug}`}
            className="font-public-sans text-[13px] font-[600] text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
          >
            View all products from {brandName} →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PDPSkeleton() {
  return (
    <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-16 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        {[12, 20, 2, 32, 2, 48].map((w, i) => (
          <div key={i} className={`h-3 bg-muted-bg rounded w-${w} animate-pulse`} />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left: gallery skeleton — thumbnail strip + main image */}
        <div className="w-full lg:w-1/2 flex gap-3">
          <div className="flex flex-col gap-2 flex-shrink-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[68px] aspect-square bg-muted-bg rounded animate-pulse" />
            ))}
          </div>
          <div className="flex-1 aspect-square bg-muted-bg rounded animate-pulse" />
        </div>

        {/* Right: info skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="h-4 bg-muted-bg rounded w-32 animate-pulse" />
          <div className="h-7 bg-muted-bg rounded w-3/4 animate-pulse" />
          <div className="h-10 bg-muted-bg rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-muted-bg rounded w-40 animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-7 bg-muted-bg rounded-full w-20 animate-pulse" />)}
          </div>
          <div className="h-px bg-muted-bg my-1" />
          <div className="h-12 bg-muted-bg rounded animate-pulse" />
          <div className="h-12 bg-muted-bg rounded animate-pulse" />
          <div className="h-4 bg-muted-bg rounded w-56 animate-pulse mt-2" />
        </div>
      </div>
    </main>
  )
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function ProductDetailInner({ slug }: { slug: string }) {
  const { data: rawProduct, isLoading, isError } = useProduct(slug)

  if (isLoading) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
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

  const product = toTypedFromApi(rawProduct as unknown as ApiProduct)

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-16 py-10">

          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 mb-8 text-[12px] font-public-sans text-muted-text"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/catalogue" className="hover:text-primary transition-colors">Catalogue</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/brands/${product.brandSlug}`} className="hover:text-primary transition-colors">
              {product.brandName}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-primary truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
            {/* Left: Gallery — sticky on desktop */}
            <div className="w-full lg:w-[52%] lg:sticky lg:top-20 lg:self-start">
              <PhotoGallery images={product.images} productName={product.name} />
            </div>

            {/* Right: Info */}
            <div className="w-full lg:w-[48%]">
              <ProductInfo product={product} />
            </div>
          </div>
        </div>

        {/* More from brand */}
        <MoreFromBrand
          brandSlug={product.brandSlug}
          brandName={product.brandName}
          currentSlug={product.slug}
        />
      </main>

      <Footer />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ProductDetailInner slug={id} />
}
