'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bookmark, Trash2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useBrandMinimums } from '@/hooks/queries/useBrands'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { useFormatPrice } from '@/components/ui/Price'
import type { CartItem } from '@/types'

// ─── Brand cart card ──────────────────────────────────────────────────────────

function BrandCartCard({
  brandId, items, selected, onToggle, minimumOrderValue,
}: {
  brandId: string
  items: CartItem[]
  selected: boolean
  onToggle: () => void
  minimumOrderValue: number
}) {
  const fmt = useFormatPrice()
  const router = useRouter()
  const brandName = items[0]?.brandName ?? ''
  const brandSlug = items[0]?.brandSlug

  const currentValue = items.reduce((s, i) => s + i.wholesalePrice * i.quantity, 0)
  const targetValue  = minimumOrderValue
  const met          = currentValue >= targetValue
  const toGo         = Math.max(targetValue - currentValue, 0)
  const progress     = targetValue > 0 ? Math.min(currentValue / targetValue, 1) : 1

  const thumbs = items.slice(0, 3).map((i) => i.image)

  return (
    <div className="bg-surface border border-border-warm rounded-xl overflow-hidden">
      <div className="flex gap-4 p-5">

        {/* Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select ${brandName}`}
          onClick={onToggle}
          className={cn(
            'w-5 h-5 mt-1 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            selected ? 'border-primary bg-primary' : 'border-border-warm hover:border-primary/40'
          )}
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Brand row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted-bg border border-border-warm flex-shrink-0">
                {brandSlug
                  ? <img src={`https://picsum.photos/seed/${brandSlug}-logo/80/80`} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[11px] font-[600] font-public-sans text-muted-text">{brandName.slice(0, 2).toUpperCase()}</div>
                }
              </div>
              <div>
                <p className="font-public-sans text-[15px] font-[600] text-primary leading-tight">{brandName}</p>
                <p className="font-public-sans text-[12px] text-muted-text">Free shipping on orders over ₹15,000</p>
              </div>
            </div>
            <p className="font-playfair text-[17px] font-[600] text-primary tabular-nums ml-4 flex-shrink-0">
              {fmt(currentValue)}
            </p>
          </div>

          {/* MOQ progress */}
          <p className="font-public-sans text-[13px] text-muted-text mb-1.5">
            <span className="font-[600] text-primary">{fmt(targetValue)} minimum</span>
            {met
              ? <span className="text-success"> · Minimum met!</span>
              : <span> · {fmt(toGo)} to go</span>
            }
          </p>
          <div className="h-1.5 bg-muted-bg rounded-full overflow-hidden mb-4">
            <div
              className={cn('h-full rounded-full transition-all duration-300', met ? 'bg-success' : 'bg-accent')}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5">
            {brandSlug && (
              <Link
                href={`/brands/${brandSlug}`}
                className="px-5 py-2 border border-border-warm rounded text-[13px] font-[600] font-public-sans text-primary hover:bg-muted-bg transition-colors"
              >
                Shop brand
              </Link>
            )}
            <button
              type="button"
              onClick={() => router.push(`/cart/${brandId}`)}
              className="px-5 py-2 bg-primary text-white rounded text-[13px] font-[600] font-public-sans hover:bg-[#2a2a2a] transition-colors"
            >
              View cart
            </button>
          </div>
        </div>

        {/* Product thumbnails */}
        {thumbs.length > 0 && (
          <div className="hidden sm:flex flex-col justify-center gap-2 flex-shrink-0">
            <div className="flex gap-2">
              {thumbs.map((img, i) => (
                <div
                  key={i}
                  className="w-[88px] h-[88px] rounded-lg overflow-hidden bg-muted-bg border border-border-warm"
                >
                  {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sticky bottom bar ────────────────────────────────────────────────────────

function BottomBar({
  selectedIds,
  brandSummaries,
  onCheckout,
  onDelete,
}: {
  selectedIds: Set<string>
  brandSummaries: { brandId: string; subtotal: number; met: boolean }[]
  onCheckout: () => void
  onDelete: () => void
}) {
  const fmt = useFormatPrice()
  const selected     = brandSummaries.filter((b) => selectedIds.has(b.brandId))
  const underMin     = selected.filter((b) => !b.met).length
  const itemTotal    = selected.reduce((s, b) => s + b.subtotal, 0)
  const canCheckout  = selected.length > 0 && underMin === 0

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border-warm">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-public-sans text-[13px] font-[600] text-primary">
            {selected.length} selected
          </p>
          {underMin > 0 && (
            <p className="font-public-sans text-[12px] text-muted-text">{underMin} under minimum</p>
          )}
          <p className="font-public-sans text-[12px] text-muted-text">
            Item total: {fmt(itemTotal)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-border-warm flex items-center justify-center text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
            aria-label="Save for later"
          >
            <Bookmark size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={selected.length === 0}
            aria-label="Remove selected"
            className="w-10 h-10 rounded-full border border-border-warm flex items-center justify-center text-muted-text hover:text-error hover:border-error/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onCheckout}
            disabled={!canCheckout}
            className={cn(
              'px-7 py-2.5 rounded text-[14px] font-[600] font-public-sans transition-colors',
              canCheckout
                ? 'bg-primary text-white hover:bg-[#2a2a2a]'
                : 'bg-muted-bg text-muted-text cursor-not-allowed'
            )}
          >
            Check out
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router          = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated     = useAuthStore((s) => s._hasHydrated)
  const openAuthModal   = useAuthStore((s) => s.openAuthModal)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/')
      openAuthModal('signup')
    }
  }, [hasHydrated, isAuthenticated, router, openAuthModal])

  const items          = useCartStore((s) => s.items)
  const getItemsByBrand = useCartStore((s) => s.getItemsByBrand)
  const removeItem     = useCartStore((s) => s.removeItem)

  const byBrand = getItemsByBrand()
  const isEmpty = items.length === 0

  const brandSlugs   = [...new Set(items.map((i) => i.brandSlug).filter((s): s is string => !!s))]
  const minimumMap   = useBrandMinimums(brandSlugs)

  const brandSummaries = Object.entries(byBrand).map(([brandId, brandItems]) => {
    const subtotal    = brandItems.reduce((s, i) => s + i.wholesalePrice * i.quantity, 0)
    const brandSlug   = brandItems[0]?.brandSlug ?? ''
    const targetValue = minimumMap[brandSlug] ?? brandItems[0]?.brandMinimumOrderValue ?? 0
    return { brandId, brandName: brandItems[0]?.brandName ?? '', subtotal, met: subtotal >= targetValue }
  })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(Object.keys(byBrand))
  )

  // Keep selection in sync when brands are removed
  useEffect(() => {
    const current = new Set(Object.keys(byBrand))
    setSelectedIds((prev) => new Set([...prev].filter((id) => current.has(id))))
  }, [items.length])

  function toggleBrand(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleDelete() {
    Array.from(selectedIds).forEach((id) => {
      byBrand[id]?.forEach((item) => removeItem(item.productId))
    })
  }

  if (!hasHydrated || !isAuthenticated) return null

  return (
    <div className="bg-bg min-h-screen flex flex-col pb-20">
      <NavBar />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-16 py-6 sm:py-10">
        {/* Heading row */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>

          <h1 className="font-playfair font-[500] text-primary text-[24px] sm:text-[36px] leading-[1.1] flex-shrink-0">
            Carts
          </h1>

          <div className="relative flex-1 max-w-[420px] hidden sm:block">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search for products or brands"
              className="w-full h-10 pl-10 pr-4 border border-border-warm rounded-full text-[13px] font-public-sans placeholder:text-muted-text/50 bg-bg focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {isEmpty ? (
          <div className="py-20 flex flex-col items-center text-center">
            <p className="font-playfair font-[500] text-primary text-[22px] mb-3">Your cart is empty</p>
            <p className="font-public-sans text-muted-text text-[14px] mb-7 max-w-[300px]">
              Browse our curated selection of Indian artisan brands.
            </p>
            <Link
              href="/catalogue"
              className="px-6 py-3 bg-primary text-white rounded font-[600] font-public-sans text-[14px] hover:bg-[#2a2a2a] transition-colors"
            >
              Browse catalogue
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(byBrand).map(([brandId, brandItems]) => (
              <BrandCartCard
                key={brandId}
                brandId={brandId}
                items={brandItems}
                selected={selectedIds.has(brandId)}
                onToggle={() => toggleBrand(brandId)}
                minimumOrderValue={
                  minimumMap[brandItems[0]?.brandSlug ?? ''] ??
                  brandItems[0]?.brandMinimumOrderValue ??
                  0
                }
              />
            ))}
          </div>
        )}
      </main>

      {!isEmpty && (
        <>
          <BottomBar
            selectedIds={selectedIds}
            brandSummaries={brandSummaries}
            onCheckout={() => router.push('/checkout')}
            onDelete={handleDelete}
          />
          <Footer />
        </>
      )}
    </div>
  )
}
