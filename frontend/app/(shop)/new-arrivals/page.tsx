'use client'

import { useState } from 'react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { ProductGrid } from '@/components/catalogue/ProductGrid'
import { EmptyState } from '@/components/shared/EmptyState'
import { useProducts } from '@/hooks/queries/useProducts'
import type { Product as ApiProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types'

const PAGE_SIZE = 20

function toTypedProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brandId: p.brandId,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    description: p.description,
    images: (p.photos ?? []).sort((a, b) => a.position - b.position).map((ph) => ph.url),
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

function LoadingSkeleton() {
  return (
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
  )
}

export default function NewArrivalsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useProducts({
    sort: 'newest',
    page,
    limit: PAGE_SIZE,
  })

  const rawProducts = data?.products ?? []
  const total = data?.total ?? 0
  const products: Product[] = rawProducts.map(toTypedProduct)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-[36px] leading-[1.15] font-[500] font-playfair text-primary">
            New Arrivals
          </h1>
          <p className="text-[15px] font-public-sans text-muted-text mt-1">
            The latest additions from our artisan brands.
          </p>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <EmptyState title="Something went wrong" description="Could not load products. Please try again." />
        ) : products.length === 0 ? (
          <EmptyState title="Nothing here yet" description="Check back soon — new products are added regularly." />
        ) : (
          <>
            <ProductGrid
              products={products}
              totalCount={total}
              page={page}
              onPageChange={setPage}
              pageSize={PAGE_SIZE}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
