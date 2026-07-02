'use client'

import Link from 'next/link'
import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { PhotoGallery } from '@/components/pdp/PhotoGallery'
import { ProductInfo } from '@/components/pdp/ProductInfo'
import { ProductCard } from '@/components/shared/ProductCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { useProduct, useProducts } from '@/hooks/queries/useProducts'
import { useBrand } from '@/hooks/queries/useBrands'
import { useAuthStore } from '@/lib/store/useAuthStore'
import type { Product as HookProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

// ─── Map hook product → @/types Product ──────────────────────────────────────

function toTypedProduct(p: HookProduct): Product {
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
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight,
    category: p.category,
    tags: p.tags ?? [],
    achievementLevel: p.brand?.achievementLevel as Product['achievementLevel'],
    inStock: p.inStock,
  }
}

// ─── Map raw API product → @/types Product (for detail page) ─────────────────

interface ApiVariantAttribute { id: string; name: string; value: string }
interface ApiVariant { id: string; sku: string; priceInr: number; stock: number; status: string; attributes: ApiVariantAttribute[] }

interface ApiProduct {
  id: string; name: string; slug: string; brandId: string
  brandName: string; brandSlug: string
  description: string; photos?: Array<{ id: string; url: string; position: number }>
  wholesalePrice: number; moq: number; leadTime: string; weight: number
  category: string; tags: string[]
  brand?: { achievementLevel: number; minimumOrderValue?: number }
  variants?: ApiVariant[]
  inStock: boolean
  countryOfOrigin?: string
  freeShippingAboveInr?: number | null
}

function toTypedFromApi(p: ApiProduct): Product {
  return {
    id: p.id, name: p.name, slug: p.slug,
    brandId: p.brandId, brandName: p.brandName, brandSlug: p.brandSlug,
    description: p.description,
    images: (p.photos ?? []).sort((a, b) => a.position - b.position).map((ph) => ph.url),
    wholesalePrice: p.wholesalePrice, moq: p.moq,
    leadTime: p.leadTime as Product['leadTime'],
    weight: p.weight, category: p.category, tags: p.tags ?? [],
    achievementLevel: (p.brand?.achievementLevel ?? undefined) as Product['achievementLevel'],
    brandMinimumOrderValue: p.brand?.minimumOrderValue,
    inStock: p.inStock,
    countryOfOrigin: p.countryOfOrigin,
    freeShippingAboveInr: p.freeShippingAboveInr,
    variants: (p.variants ?? []).map((v) => ({
      id: v.id, sku: v.sku, priceInr: v.priceInr,
      stock: v.stock, status: v.status, attributes: v.attributes,
    })),
  }
}

// ─── More from brand ──────────────────────────────────────────────────────────

function MoreFromBrand({ brandSlug, brandName, currentSlug }: { brandSlug: string; brandName: string; currentSlug: string }) {
  const { data: brand } = useBrand(brandSlug)
  const { data } = useProducts({ brandSlug, limit: 6 })
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)

  function handleMessageBrand() {
    if (!isAuthenticated) { openAuthModal('login'); return }
    if (!brand?.userId) return
    const params = new URLSearchParams({ partner: brand.userId, name: brandName })
    router.push(`/messages?${params.toString()}`)
  }
  const others = (data?.products ?? [])
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 5)

  if (others.length === 0) return null

  return (
    <section className="border-t border-border-warm">
      <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-16 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-border-warm flex-shrink-0 overflow-hidden bg-muted-bg">
              {brand?.logo ? (
                <img src={brand.logo} alt={brandName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-playfair font-[500] text-primary text-[20px]">
                  {brandName[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-playfair font-[500] text-primary text-[22px] leading-tight">{brandName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {brand?.achievementLevel && (
                  <AchievementBadge level={brand.achievementLevel as 1 | 2 | 3 | 4 | 5} />
                )}
                {brand?.location && (
                  <span className="font-public-sans text-[13px] text-muted-text">{brand.location}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href={`/brands/${brandSlug}`}
              className="inline-flex items-center justify-center h-10 px-4 sm:px-5 rounded bg-primary text-white font-public-sans text-[13px] font-[600] hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Shop all {brand?.productCount ? `${brand.productCount} ` : ''}products
            </Link>
            <button
              type="button"
              onClick={handleMessageBrand}
              className="inline-flex items-center justify-center h-10 px-4 sm:px-5 rounded border border-border-warm font-public-sans text-[13px] font-[600] text-primary hover:border-primary transition-colors gap-2 whitespace-nowrap"
            >
              <MessageCircle size={14} />
              <span className="hidden sm:inline">Message brand</span>
              <span className="sm:hidden">Message</span>
            </button>
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {others.map((p) => (
            <ProductCard key={p.slug} product={toTypedProduct(p)} />
          ))}
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
        {/* Left: gallery skeleton — mosaic layout */}
        <div className="w-full lg:w-[60%] flex flex-col gap-2">
          <div className="h-8 w-40 bg-muted-bg rounded animate-pulse mb-2" />
          <div className="flex gap-2 h-[340px]">
            <div className="flex-[2] bg-muted-bg rounded animate-pulse" />
            <div className="flex-[3] bg-muted-bg rounded animate-pulse" />
          </div>
          <div className="flex gap-2 h-[200px]">
            <div className="flex-1 bg-muted-bg rounded animate-pulse" />
            <div className="flex-1 bg-muted-bg rounded animate-pulse" />
          </div>
        </div>

        {/* Right: info skeleton */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4">
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
  const router = useRouter()
  const { data: rawProduct, isLoading, isError } = useProduct(slug)
  const { track } = useRecentlyViewed()

  useEffect(() => {
    if (!rawProduct) return
    track({
      id: rawProduct.id,
      slug: rawProduct.slug,
      name: rawProduct.name,
      imageUrl: rawProduct.photos?.[0]?.url ?? '',
      price: rawProduct.wholesalePrice,
      brandName: rawProduct.brandName,
      brandSlug: rawProduct.brandSlug,
    })
  }, [rawProduct?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-16 py-6 sm:py-10">

          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-0.5 mb-8 text-[12px] font-public-sans text-muted-text"
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 mr-3 font-playfair font-bold hover:text-primary transition-colors"
            >
              <ArrowLeft size={13} />
              Back
            </button>
            <span aria-hidden="true">/</span>
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
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 lg:items-start">
            {/* Left: Brand + Gallery — sticky; right panel scrolls past it */}
            <div className="w-full lg:w-[60%] lg:sticky lg:top-[88px] lg:self-start">

              {/* Brand row above gallery */}
              <Link
                href={`/brands/${product.brandSlug}`}
                className="inline-flex items-center gap-2.5 mb-4 group"
                aria-label={`Visit ${product.brandName} storefront`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted-bg border border-border-warm flex-shrink-0">
                  <img
                    src={`https://picsum.photos/seed/${product.brandSlug}-logo/64/64`}
                    alt=""
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-public-sans text-[13px] font-[600] text-primary group-hover:text-accent transition-colors">
                  {product.brandName}
                </span>
                {product.achievementLevel && <AchievementBadge level={product.achievementLevel} />}
              </Link>

              <PhotoGallery images={product.images} productName={product.name} />
            </div>

            {/* Right: Info (scrolls while gallery stays fixed) */}
            <div className="w-full lg:w-[40%]">
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
