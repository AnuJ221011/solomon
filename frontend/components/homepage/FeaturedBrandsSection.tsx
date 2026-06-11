'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { useBrands, type Brand } from '@/hooks/queries/useBrands'

// ─── Brand card — 4px radius, 1px border, diffuse hover shadow ────────────────

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className="group flex flex-col bg-surface border border-border-warm rounded overflow-hidden hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(26,26,26,0.04)] transition-all duration-200">
      {/* Logo strip */}
      <div className="px-5 pt-5 pb-4 border-b border-border-warm flex items-center gap-4">
        <div className="w-12 h-12 rounded bg-muted-bg border border-border-warm overflow-hidden flex items-center justify-center flex-shrink-0">
          {brand.logo ? (
            <Image
              src={brand.logo}
              alt={brand.name}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="font-playfair text-[16px] font-[600] text-muted-text select-none">
              {brand.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-playfair font-[500] text-[16px] text-primary leading-snug truncate">{brand.name}</h3>
          {brand.location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-muted-text flex-shrink-0" aria-hidden="true" />
              <span className="font-public-sans text-[12px] text-muted-text truncate">{brand.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex-1 flex flex-col">
        <p className="font-public-sans text-[13px] leading-[1.6] text-muted-text line-clamp-2 flex-1">
          {brand.tagline ?? brand.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-warm">
          <div className="flex gap-3 font-public-sans text-[12px] text-muted-text">
            <span>{brand.productCount} products</span>
            {brand.yearFounded && <span>Est. {brand.yearFounded}</span>}
          </div>
          <Link
            href={`/brands/${brand.slug}`}
            className="inline-flex items-center gap-1 font-public-sans text-[12px] font-[600] text-accent hover:text-accent-hover transition-colors"
          >
            View <ArrowRight size={10} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BrandCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
      <div className="px-5 pt-5 pb-4 border-b border-border-warm flex items-center gap-4">
        <div className="w-12 h-12 rounded bg-muted-bg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-muted-bg rounded w-3/4" />
          <div className="h-3 bg-muted-bg rounded w-1/2 mt-2" />
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="h-3 bg-muted-bg rounded w-full mb-1.5" />
        <div className="h-3 bg-muted-bg rounded w-5/6" />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeaturedBrandsSection() {
  const { data, isLoading } = useBrands({ limit: 6 })
  const brands = data?.brands ?? []

  return (
    <section className="py-24 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">

        {/* Header */}
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-3">
              Featured Brands
            </p>
            <h2 className="font-playfair font-[500] text-primary leading-[1.2] text-[28px] lg:text-[32px]">
              Meet India's Finest Artisan Brands
            </h2>
          </div>
          <Link
            href="/brands"
            className="hidden sm:inline-flex items-center gap-1 font-public-sans text-[13px] font-[600] text-muted-text hover:text-primary transition-colors flex-shrink-0 ml-6"
          >
            View all <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>

        {/* 3×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <BrandCardSkeleton key={i} />)
            : brands.map((brand) => <BrandCard key={brand.id} brand={brand} />)}
        </div>
      </div>
    </section>
  )
}
