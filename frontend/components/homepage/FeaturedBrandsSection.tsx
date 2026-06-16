'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, Package } from 'lucide-react'
import { useBrands, type Brand } from '@/hooks/queries/useBrands'
import { AchievementBadge } from '@/components/shared/AchievementBadge'

function BrandCard({ brand }: { brand: Brand }) {
  const { name, slug, logo, banner, location, tagline, productCount, achievementLevel } = brand

  return (
    <Link
      href={`/brands/${slug}`}
      className="group flex flex-col bg-surface border border-border-warm rounded overflow-hidden hover:shadow-[0_8px_32px_rgba(26,26,26,0.08)] hover:border-primary/20 transition-all duration-300"
    >
      {/* Banner */}
      <div className="relative aspect-[16/9] bg-[#F0EBE3] overflow-hidden">
        {banner ? (
          <Image
            src={banner}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5F0E8] to-[#EDE5D8]">
            <span className="font-playfair text-[40px] font-[500] text-[#C8BEAE] select-none leading-none">
              {name.charAt(0)}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center gap-1.5 bg-white text-primary text-[12px] font-[600] font-public-sans px-3 py-1.5 rounded shadow-sm">
            View Brand <ArrowRight size={11} aria-hidden="true" />
          </span>
        </div>

        {/* Logo overlap */}
        <div className="absolute bottom-0 left-3 translate-y-1/2 w-9 h-9 rounded border-2 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0">
          {logo ? (
            <Image src={logo} alt={`${name} logo`} fill sizes="36px" className="object-cover" />
          ) : (
            <span className="font-playfair text-[13px] font-[500] text-muted-text/50 select-none leading-none">
              {name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-6 pb-3 px-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-playfair text-[15px] font-[500] text-primary leading-tight line-clamp-1">{name}</p>
          <AchievementBadge level={(Math.min(Math.max(achievementLevel, 1), 5) as 1 | 2 | 3 | 4 | 5)} />
        </div>

        {location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-muted-text flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-public-sans text-muted-text truncate">{location}</span>
          </div>
        )}

        {tagline && (
          <p className="text-[12px] font-public-sans text-muted-text mt-1.5 line-clamp-2 leading-relaxed flex-1">
            {tagline}
          </p>
        )}

        {productCount > 0 && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border-warm/60">
            <Package size={10} className="text-muted-text flex-shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-public-sans text-muted-text">
              {productCount} product{productCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

function BrandCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-muted-bg" />
      <div className="pt-6 pb-3 px-3 space-y-2">
        <div className="h-4 bg-muted-bg rounded w-2/3" />
        <div className="h-3 bg-muted-bg rounded w-1/2" />
        <div className="h-3 bg-muted-bg rounded w-full mt-1" />
      </div>
    </div>
  )
}

export function FeaturedBrandsSection() {
  const { data, isLoading } = useBrands({ limit: 8 })
  const brands = data?.brands ?? []

  return (
    <section className="py-12 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <BrandCardSkeleton key={i} />)
            : brands.map((brand) => <BrandCard key={brand.id} brand={brand} />)}
        </div>
      </div>
    </section>
  )
}
