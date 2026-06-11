'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useProducts, type Product } from '@/hooks/queries/useProducts'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'

// ─── Price formatter ──────────────────────────────────────────────────────────

function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductMiniCard({ product }: { product: Product }) {
  const currency = useCurrencyStore((s) => s.currency)
  const convertFromINR = useCurrencyStore((s) => s.convertFromINR)
  const imageSrc = product.photos?.[0]?.url ?? null
  const price = convertFromINR(product.wholesalePrice)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col bg-surface border border-border-warm rounded overflow-hidden hover:border-primary/25 hover:shadow-[0_4px_20px_rgba(26,26,26,0.04)] transition-all duration-200"
    >
      {/* 1:1 square image */}
      <div className="aspect-square overflow-hidden bg-muted-bg relative">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted-bg flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="3" y="7" width="26" height="20" rx="1" stroke="#E5E1D8" strokeWidth="1.5" />
              <circle cx="12" cy="14" r="3" stroke="#E5E1D8" strokeWidth="1.5" />
              <path d="M3 22 L10 16 L16 21 L22 14 L29 22" stroke="#E5E1D8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {/* MOQ badge — 4px radius */}
        <div className="absolute bottom-2 left-2">
          <span className="rounded bg-primary/75 text-white text-[11px] font-[600] font-public-sans px-2 py-0.5">
            MOQ {product.moq}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* label-sm: 12px / 500 */}
        <p className="font-public-sans text-[12px] font-[500] text-muted-text mb-1 truncate">{product.brandName}</p>
        {/* label-md: 14px / 600 */}
        <p className="font-public-sans text-[14px] font-[600] text-primary leading-snug line-clamp-2 mb-3 flex-1">
          {product.name}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-public-sans text-[14px] font-[600] text-primary">
            {formatPrice(price, currency)}
          </span>
          <span className="font-public-sans text-[12px] text-muted-text">/unit</span>
        </div>
      </div>
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductMiniSkeleton() {
  return (
    <div className="flex flex-col bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted-bg" />
      <div className="p-3.5 flex flex-col gap-2">
        <div className="h-3 bg-muted-bg rounded w-1/2" />
        <div className="h-4 bg-muted-bg rounded w-3/4" />
        <div className="h-4 bg-muted-bg rounded w-1/3 mt-1" />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrendingProductsSection() {
  const { data, isLoading } = useProducts({ limit: 8 })
  const products = data?.products ?? []

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">

        {/* Header */}
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

        {/* 4×2 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductMiniSkeleton key={i} />)
            : products.map((product) => <ProductMiniCard key={product.id} product={product} />)}
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
