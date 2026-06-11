'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  className?: string
}

// ─── Price formatter ──────────────────────────────────────────────────────────

function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  const {
    name,
    slug,
    brandName,
    brandSlug,
    images,
    wholesalePrice,
    moq,
    achievementLevel,
    inStock,
  } = product

  const currency = useCurrencyStore((s) => s.currency)
  const convertFromINR = useCurrencyStore((s) => s.convertFromINR)

  const imageSrc = images?.[0] ?? null
  const priceAmount = convertFromINR(wholesalePrice)
  const priceCurrency = currency

  return (
    <Link
      href={`/products/${slug}`}
      className={cn(
        'group relative flex flex-col bg-surface border border-border-warm rounded overflow-hidden cursor-pointer',
        'hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(26,26,26,0.04)]',
        'transition-all duration-200',
        !inStock && 'opacity-60',
        className
      )}
    >
      {/* Image container */}
      <div className="aspect-square overflow-hidden bg-muted-bg relative">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted-bg flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
              className="text-border-warm"
            >
              <rect x="6" y="10" width="28" height="22" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="15" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 26 L13 20 L19 25 L26 18 L34 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Achievement badge overlay */}
        {achievementLevel && (
          <div className="absolute top-2 left-2">
            <AchievementBadge level={achievementLevel} />
          </div>
        )}

        {/* MOQ badge */}
        <div className="absolute bottom-2 right-2 bg-primary/80 text-white text-[11px] px-2 py-0.5 rounded font-public-sans font-[500]">
          MOQ {moq}
        </div>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-surface/50 flex items-center justify-center">
            <span className="text-[11px] font-[600] font-public-sans text-muted-text bg-surface px-2 py-0.5 rounded border border-border-warm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {/* Brand name */}
        <Link
          href={`/brands/${brandSlug}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[12px] text-muted-text font-public-sans mb-0.5 hover:text-primary transition-colors"
        >
          {brandName}
        </Link>

        {/* Product name */}
        <p className="text-[14px] font-[600] text-primary font-public-sans leading-snug mb-1 line-clamp-2">
          {name}
        </p>

        {/* Price row */}
        <div className="mt-auto flex items-baseline gap-1">
          <span className="text-[16px] font-[700] text-primary font-public-sans">
            {formatPrice(priceAmount, priceCurrency)}
          </span>
          <span className="text-[12px] text-muted-text font-public-sans">/ unit</span>
        </div>

        {/* Add to cart button — appears on hover */}
        {onAddToCart && inStock && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddToCart(product)
            }}
            className={cn(
              'mt-2 w-full h-8 rounded border border-border-warm',
              'text-[12px] font-[600] font-public-sans text-primary bg-transparent',
              'hover:bg-muted-bg transition-colors',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
            )}
          >
            Add to cart
          </button>
        )}
      </div>
    </Link>
  )
}
