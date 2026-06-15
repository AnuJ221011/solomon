'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Plus, Check, Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { Price, useFormatPrice } from '@/components/ui/Price'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  className?: string
}

// Shield icon — Faire-style verified brand indicator
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M6 1L1 3.5V6.5C1 9.26 3.24 11.85 6 12.5C8.76 11.85 11 9.26 11 6.5V3.5L6 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Derived star rating from achievementLevel (1→4.1 … 5→4.9)
const LEVEL_RATING: Record<number, string> = {
  1: '4.1', 2: '4.4', 3: '4.6', 4: '4.8', 5: '4.9',
}

// Extract color-type variant swatches from product
function colorSwatches(product: Product): string[] {
  if (!product.variants?.length) return []
  const seen = new Set<string>()
  const colors: string[] = []
  for (const v of product.variants) {
    for (const a of v.attributes ?? []) {
      if (/colou?r/i.test(a.name) && !seen.has(a.value)) {
        seen.add(a.value)
        colors.push(a.value)
      }
    }
  }
  return colors.slice(0, 5)
}

export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  const {
    id, name, slug, brandId, brandName, brandSlug,
    images, wholesalePrice, moq,
    achievementLevel, brandMinimumOrderValue,
    leadTime, inStock,
  } = product

  const imageSrc = images?.[0] ?? null
  const rating = achievementLevel ? LEVEL_RATING[achievementLevel] : null
  const minOrder = brandMinimumOrderValue ?? (moq > 1 ? moq * wholesalePrice : null)
  const isTrending = (achievementLevel ?? 0) >= 4
  const swatches = colorSwatches(product)

  const fmt = useFormatPrice()
  const addItem = useCartStore((s) => s.addItem)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const [added, setAdded] = useState(false)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }
    if (onAddToCart) {
      onAddToCart(product)
    } else {
      addItem({
        productId: id,
        productName: name,
        brandId,
        brandName,
        brandSlug,
        image: imageSrc ?? '',
        quantity: moq,
        wholesalePrice,
        moq,
        leadTime,
      })
    }
    toast.success(`${name} added to cart`, {
      description: `Qty: ${moq} · ${brandName}`,
      duration: 3000,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className={cn('group flex flex-col', !inStock && 'opacity-60', className)}>

      {/* ── Image ─────────────────────────────────────────────────────── */}
      <Link href={`/products/${slug}`} className="relative block aspect-square overflow-hidden rounded-sm bg-[#F0EBE3]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-[#F0EBE3] flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="text-[#C8BEAE]">
              <rect x="6" y="10" width="28" height="22" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="15" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 26L13 20L19 25L26 18L34 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Trending badge — top left */}
        {isTrending && (
          <div className="absolute top-2 left-2 bg-white text-primary text-[11px] font-[600] font-public-sans px-2 py-0.5 rounded leading-5">
            Trending
          </div>
        )}

        {/* Heart — top right */}
        <button
          type="button"
          aria-label="Save"
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        >
          <Heart size={13} className="text-muted-text" />
        </button>

        {/* Quick-add — bottom right */}
        <button
          type="button"
          aria-label={added ? 'Added to cart' : 'Add to cart'}
          onClick={handleAddToCart}
          className={cn(
            'absolute bottom-2 right-2 w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-colors duration-200',
            added ? 'bg-green-500' : 'bg-white'
          )}
        >
          {added
            ? <Check size={13} className="text-white" strokeWidth={2.5} />
            : <Plus size={14} className="text-primary" strokeWidth={2.5} />
          }
        </button>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[11px] font-[600] font-public-sans text-muted-text bg-white px-2 py-0.5 rounded border border-[#D0C8BE]">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* ── Color swatches ────────────────────────────────────────────── */}
      {swatches.length > 0 && (
        <div className="flex gap-1 mt-2">
          {swatches.map((color) => (
            <span
              key={color}
              title={color}
              className="w-[14px] h-[14px] rounded-full border border-white shadow-[0_0_0_1px_#D0C8BE]"
              style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
            />
          ))}
        </div>
      )}

      {/* ── Info ──────────────────────────────────────────────────────── */}
      <div className="mt-2 flex flex-col gap-0.5">

        {/* Price */}
        <div className="text-[16px] font-[700] font-public-sans text-primary leading-none">
          <Price amountInr={wholesalePrice} size="md" className="!text-[16px] !font-[700]" />
        </div>

        {/* Product name */}
        <Link
          href={`/products/${slug}`}
          className="text-[14px] font-[500] font-public-sans text-primary leading-snug line-clamp-2 hover:underline"
        >
          {name}
        </Link>

        {/* Brand — shield + underlined name */}
        <Link
          href={`/brands/${brandSlug}`}
          className="inline-flex items-center gap-1 mt-0.5 group/brand w-fit"
        >
          <ShieldIcon className="text-muted-text flex-shrink-0" />
          <span className="text-[12px] font-public-sans text-muted-text underline underline-offset-2 group-hover/brand:text-primary transition-colors">
            {brandName}
          </span>
        </Link>

        {/* Star rating + min order */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {rating && (
            <>
              <Star size={11} className="text-[#F5A623] fill-[#F5A623] flex-shrink-0" />
              <span className="text-[12px] font-public-sans text-muted-text">{rating}</span>
            </>
          )}
          {minOrder !== null && (
            <span className="text-[12px] font-public-sans text-muted-text">
              {rating ? '·' : ''} {fmt(Number(minOrder))} min
            </span>
          )}
        </div>

        {/* Lead time / shipping */}
        {leadTime && (
          <div className="flex items-center gap-1 mt-0.5">
            {/* chain link icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="flex-shrink-0 text-[#3B9E8C]">
              <path d="M4.5 7.5L7.5 4.5M5 3.5L5.707 2.793A2.5 2.5 0 1 1 9.207 6.293L8.5 7M3.5 5L2.793 5.707A2.5 2.5 0 1 0 6.293 9.207L7 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-[12px] font-public-sans text-[#3B9E8C]">
              Ships in {leadTime}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
