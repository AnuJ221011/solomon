'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Minus, Plus, Bookmark, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { NavBar } from '@/components/shared/NavBar'
import type { CartItem } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n)
}

function formatLeadTime(lt?: string): string {
  if (!lt) return '1–2 weeks'
  const u = lt.toUpperCase()
  if (u.includes('THREE_DAYS') || u.includes('1-3')) return '1–3 days'
  if (u.includes('FOUR_WEEKS'))                       return '2–4 weeks'
  return '1–2 weeks'
}

function getDeliveryRange(leadTime?: string): string {
  let minDays = 9, maxDays = 16
  if (leadTime) {
    const lt = leadTime.toUpperCase()
    if (lt.includes('THREE_DAYS') || lt.includes('1-3')) { minDays = 4;  maxDays = 8  }
    else if (lt.includes('FOUR_WEEKS'))                   { minDays = 18; maxDays = 32 }
  }
  const min = new Date(Date.now() + minDays * 86_400_000)
  const max = new Date(Date.now() + maxDays * 86_400_000)
  if (min.getMonth() === max.getMonth()) {
    return `${min.toLocaleDateString('en-US', { month: 'short' })} ${min.getDate()}–${max.getDate()}`
  }
  return `${min.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${max.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

// ─── Left sidebar brand mini-card ─────────────────────────────────────────────

function BrandMiniCard({
  brandId, items, isCurrent,
}: {
  brandId: string
  items: CartItem[]
  isCurrent: boolean
}) {
  const router     = useRouter()
  const brandName  = items[0]?.brandName ?? ''
  const brandSlug  = items[0]?.brandSlug
  const thumbs     = items.slice(0, 3).map((i) => i.image)

  return (
    <button
      type="button"
      onClick={() => router.push(`/cart/${brandId}`)}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        isCurrent
          ? 'border-primary/30 bg-primary/[0.04] shadow-sm'
          : 'border-border-warm bg-surface hover:border-primary/20 hover:bg-muted-bg/40'
      )}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-full overflow-hidden bg-muted-bg border border-border-warm flex-shrink-0">
          {brandSlug
            ? <img src={`https://picsum.photos/seed/${brandSlug}-logo/56/56`} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[10px] font-[700] font-public-sans text-muted-text">{brandName.slice(0, 2).toUpperCase()}</div>
          }
        </div>
        <span className="font-public-sans text-[13px] font-[600] text-primary truncate">{brandName}</span>
      </div>
      <div className="flex gap-1.5">
        {thumbs.map((img, i) => (
          <div key={i} className="w-[52px] h-[52px] rounded-md overflow-hidden bg-muted-bg border border-border-warm flex-shrink-0">
            {img && <img src={img} alt="" className="w-full h-full object-cover" />}
          </div>
        ))}
      </div>
    </button>
  )
}

// ─── Product item row ─────────────────────────────────────────────────────────

function CartItemRow({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  return (
    <div className="flex gap-5 py-6 border-b border-border-warm last:border-b-0">
      {/* Thumbnail */}
      <div className="w-[110px] h-[110px] flex-shrink-0 rounded-xl overflow-hidden bg-muted-bg border border-border-warm">
        {item.image
          ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-muted-bg" />
        }
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-public-sans text-[15px] font-[700] text-primary leading-snug mb-0.5">
            {item.productName}
          </p>
          <p className="font-public-sans text-[13px] text-muted-text">
            Min. {item.moq} units per order
          </p>
        </div>

        {/* Bottom row: stepper + remove + price */}
        <div className="flex items-center gap-4 flex-wrap mt-3.5">
          <div className="inline-flex items-center border border-border-warm rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= item.moq}
              aria-label="Decrease quantity"
              className="w-9 h-9 flex items-center justify-center text-muted-text hover:text-primary hover:bg-muted-bg transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Minus size={13} aria-hidden="true" />
            </button>
            <span className="w-12 h-9 flex items-center justify-center text-[14px] font-[700] font-public-sans text-primary border-x border-border-warm select-none tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              aria-label="Increase quantity"
              className="w-9 h-9 flex items-center justify-center text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
            >
              <Plus size={13} aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="font-public-sans text-[13px] text-muted-text hover:text-error underline underline-offset-2 transition-colors"
          >
            Remove
          </button>

          {/* Price inline at bottom-right */}
          <div className="ml-auto text-right">
            <p className="font-public-sans text-[15px] font-[700] text-primary tabular-nums">
              {fmt(item.wholesalePrice * item.quantity)}
            </p>
            <p className="font-public-sans text-[11px] text-muted-text mt-0.5 tabular-nums">
              {fmt(item.wholesalePrice)} / unit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandCartPage({
  params,
}: {
  params: Promise<{ brandId: string }>
}) {
  const { brandId }     = use(params)
  const router           = useRouter()
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated      = useAuthStore((s) => s._hasHydrated)
  const openAuthModal    = useAuthStore((s) => s.openAuthModal)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/')
      openAuthModal('signup')
    }
  }, [hasHydrated, isAuthenticated, router, openAuthModal])

  const allItems   = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)

  // Derive from allItems so the page re-renders on every quantity change
  const items   = allItems.filter((i) => i.brandId === brandId)
  const byBrand = allItems.reduce<Record<string, CartItem[]>>((acc, i) => {
    if (!acc[i.brandId]) acc[i.brandId] = []
    acc[i.brandId].push(i)
    return acc
  }, {})

  useEffect(() => {
    if (isAuthenticated && Object.keys(byBrand).length > 0 && items.length === 0) {
      router.replace('/cart')
    }
  }, [isAuthenticated, items.length, byBrand, router])

  if (!hasHydrated || !isAuthenticated) return null

  if (items.length === 0) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <ShoppingBag size={44} className="text-muted-text/30" aria-hidden="true" />
          <p className="font-playfair font-[500] text-primary text-[22px]">Your cart is empty</p>
          <p className="font-public-sans text-muted-text text-[14px]">
            Looks like you removed everything from this cart.
          </p>
          <Link
            href="/catalogue"
            className="mt-2 px-7 py-3 bg-primary text-white rounded font-[600] font-public-sans text-[14px] hover:bg-[#2a2a2a] transition-colors"
          >
            Shop now
          </Link>
        </div>
      </div>
    )
  }

  const firstItem    = items[0]
  const brandName    = firstItem?.brandName ?? ''
  const brandSlug    = firstItem?.brandSlug
  const leadTime     = firstItem?.leadTime

  const currentValue = items.reduce((s, i) => s + i.wholesalePrice * i.quantity, 0)
  const targetValue  = firstItem?.brandMinimumOrderValue ?? 0
  const met          = currentValue >= targetValue
  const toGo         = Math.max(targetValue - currentValue, 0)
  const progress     = targetValue > 0 ? Math.min(currentValue / targetValue, 1) : 1

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <div className="flex-1 flex">
        <div className="flex max-w-[1280px] mx-auto w-full px-4 lg:px-8 py-8 gap-6 items-start">

          {/* ── LEFT SIDEBAR: brand switcher ── */}
          <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 sticky top-[88px]">
            <Link
              href="/cart"
              className="inline-flex items-center gap-1 font-public-sans text-[13px] font-[600] text-muted-text hover:text-primary transition-colors mb-5"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Carts
            </Link>

            <div className="flex flex-col gap-2">
              {Object.entries(byBrand).map(([bId, bItems]) => (
                <BrandMiniCard
                  key={bId}
                  brandId={bId}
                  items={bItems}
                  isCurrent={bId === brandId}
                />
              ))}
            </div>
          </aside>

          {/* Vertical divider */}
          <div className="hidden lg:block w-px bg-border-warm self-stretch flex-shrink-0" aria-hidden="true" />

          {/* ── CONTENT WRAPPER: spans main + order summary ── */}
          <div className="flex-1 min-w-0 flex flex-col">

            {/* Brand header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted-bg border border-border-warm flex-shrink-0">
                  {brandSlug
                    ? <img src={`https://picsum.photos/seed/${brandSlug}-logo/96/96`} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[13px] font-[700] font-public-sans text-muted-text">{brandName.slice(0, 2).toUpperCase()}</div>
                  }
                </div>
                <div>
                  <h1 className="font-public-sans text-[18px] font-[700] text-primary leading-tight">
                    {brandName}
                  </h1>
                  <p className="font-public-sans text-[12px] text-accent">
                    Free shipping on orders over ₹15,000
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Save brand"
                className="w-9 h-9 rounded-full border border-border-warm flex items-center justify-center text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
              >
                <Bookmark size={15} aria-hidden="true" />
              </button>
            </div>

            {/* MOQ progress bar */}
            <div className="mb-5">
              <p className="font-public-sans text-[14px] text-muted-text mb-2">
                <span className="font-[600] text-primary">{fmt(targetValue)} minimum</span>
                {met
                  ? <span className="text-success font-[600]"> · Minimum met!</span>
                  : <span> · {fmt(toGo)} to go</span>
                }
              </p>
              <div className="h-2 bg-muted-bg rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    met ? 'bg-success' : 'bg-accent'
                  )}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {/* Divider — spans full width including order summary column */}
            <div className="border-b border-border-warm mb-4" />

            {/* Ships + delivery line */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="font-public-sans text-[13px] font-[700] text-primary">
                Ships in {formatLeadTime(leadTime)}
              </span>
              <span className="text-border-warm" aria-hidden="true">|</span>
              <span className="font-public-sans text-[13px] text-muted-text">
                Estimated delivery {getDeliveryRange(leadTime)}
              </span>
            </div>

            {/* ── Two-column: items + order summary ── */}
            <div className="flex gap-6 lg:gap-8 items-start">

              {/* Item list */}
              <main className="flex-1 min-w-0">
                {items.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    onRemove={() => removeItem(item.productId)}
                  />
                ))}
              </main>

              {/* Order summary */}
              <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-[88px]">
                <div className="bg-surface border border-border-warm rounded-xl p-5">
                  <h2 className="font-public-sans text-[18px] font-[700] text-primary mb-4">
                    Order summary
                  </h2>

                  <div className="flex flex-col gap-2.5 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-public-sans text-[14px] text-muted-text">Item total</span>
                      <span className="font-public-sans text-[14px] font-[700] text-primary tabular-nums">
                        {fmt(currentValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-public-sans text-[14px] text-muted-text">Est. shipping</span>
                      <span className="font-public-sans text-[14px] text-muted-text">TBD</span>
                    </div>
                  </div>

                  <div className="border-t border-border-warm pt-3 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="font-public-sans text-[16px] font-[700] text-primary">Total</span>
                      <span className="font-playfair text-[20px] font-[600] text-primary tabular-nums">
                        {fmt(currentValue)}
                      </span>
                    </div>
                  </div>

                  {/* Upsell / MOQ nudge */}
                  {!met && (
                    <div className="mb-4 p-3 bg-muted-bg rounded-lg">
                      <p className="font-public-sans text-[12px] text-muted-text leading-snug">
                        Add {fmt(toGo)} more from{' '}
                        <span className="font-[600] text-primary">{brandName}</span>{' '}
                        to meet the minimum order.{' '}
                        {brandSlug && (
                          <Link
                            href={`/brands/${brandSlug}`}
                            className="text-accent underline underline-offset-2"
                          >
                            Shop more
                          </Link>
                        )}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!met}
                    onClick={() => router.push('/checkout')}
                    className={cn(
                      'w-full h-11 rounded-lg text-[14px] font-[700] font-public-sans transition-colors',
                      met
                        ? 'bg-primary text-white hover:bg-[#2a2a2a]'
                        : 'bg-muted-bg text-muted-text cursor-not-allowed'
                    )}
                  >
                    Proceed to checkout
                  </button>
                </div>
              </aside>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
