'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Minus, Plus, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────

interface QuantityStepperProps {
  productId: string
  quantity: number
  moq: number
}

function QuantityStepper({ productId, quantity, moq }: QuantityStepperProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  function decrement() {
    const next = quantity - 1
    // If decrement goes below moq, remove (handled by store)
    updateQuantity(productId, next)
  }

  function increment() {
    updateQuantity(productId, quantity + 1)
  }

  return (
    <div className="inline-flex items-center border border-border-warm rounded overflow-hidden">
      <button
        type="button"
        onClick={decrement}
        aria-label="Decrease quantity"
        className={cn(
          'w-8 h-8 flex items-center justify-center',
          'text-muted-text hover:text-primary hover:bg-muted-bg transition-colors',
          'disabled:opacity-40 disabled:pointer-events-none'
        )}
        disabled={quantity <= moq}
      >
        <Minus size={13} aria-hidden="true" />
      </button>
      <span className="w-10 h-8 flex items-center justify-center text-[14px] font-[600] font-public-sans text-primary border-x border-border-warm select-none">
        {quantity}
      </span>
      <button
        type="button"
        onClick={increment}
        aria-label="Increase quantity"
        className="w-8 h-8 flex items-center justify-center text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
      >
        <Plus size={13} aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── Cart item row ────────────────────────────────────────────────────────────

import type { CartItem } from '@/types'

interface CartItemRowProps {
  item: CartItem
}

function CartItemRow({ item }: CartItemRowProps) {
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <div className="px-6 py-4 flex gap-4 items-start">
      {/* Product image */}
      <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-muted-bg border border-border-warm">
        {item.image ? (
          <img
            src={item.image}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted-bg" aria-hidden="true" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary truncate">
          {item.productName}
        </p>
        <p className="mt-0.5 text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text">
          MOQ: {item.moq} units
        </p>
        <p className="mt-1.5 text-[16px] leading-[1.5] font-[700] font-public-sans text-primary">
          {formatINR(item.wholesalePrice * item.quantity)}
        </p>
        <p className="text-[12px] font-public-sans text-muted-text">
          {formatINR(item.wholesalePrice)} / unit
        </p>
      </div>

      {/* Right controls */}
      <div className="flex flex-col items-end gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => removeItem(item.productId)}
          aria-label={`Remove ${item.productName} from cart`}
          className="text-muted-text hover:text-error transition-colors"
        >
          <X size={16} aria-hidden="true" />
        </button>
        <QuantityStepper
          productId={item.productId}
          quantity={item.quantity}
          moq={item.moq}
        />
      </div>
    </div>
  )
}

// ─── Brand group ──────────────────────────────────────────────────────────────

interface BrandGroupProps {
  brandId: string
  brandName: string
  items: CartItem[]
}

function BrandGroup({ brandName, items }: BrandGroupProps) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="bg-surface border border-border-warm rounded mb-6 overflow-hidden">
      {/* Brand header */}
      <div className="px-6 py-4 border-b border-border-warm flex items-center justify-between">
        <span className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary">
          {brandName}
        </span>
        <span className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text">
          {itemCount} {itemCount === 1 ? 'unit' : 'units'}
        </span>
      </div>

      {/* Item rows */}
      <div className="divide-y divide-border-warm">
        {items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </div>
    </div>
  )
}

// ─── MOQ warning ──────────────────────────────────────────────────────────────

interface MoqWarningProps {
  brandName: string
  needed: number
}

function MoqWarning({ brandName, needed }: MoqWarningProps) {
  return (
    <div className="flex gap-2 items-start p-3 rounded border border-warning bg-warning/[6%] mt-3">
      <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-[12px] font-public-sans text-muted-text leading-[1.4]">
        <span className="font-[600] text-primary">{brandName}</span> requires a minimum of {needed} more units to qualify for checkout.
      </p>
    </div>
  )
}

// ─── Order summary ────────────────────────────────────────────────────────────

interface BrandSubtotals {
  brandId: string
  brandName: string
  subtotal: number
  meetsMinOrder: boolean
  needed: number
}

interface OrderSummaryProps {
  brandSubtotals: BrandSubtotals[]
  total: number
  onCheckout: () => void
}

function OrderSummary({ brandSubtotals, total, onCheckout }: OrderSummaryProps) {
  const hasUnmetMoq = brandSubtotals.some((b) => !b.meetsMinOrder)

  return (
    <aside className="sticky top-24">
      <div className="bg-surface border border-border-warm rounded p-6">
        <h2 className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary mb-4">
          Order Summary
        </h2>

        {/* Per-brand subtotals */}
        <div className="flex flex-col gap-2 mb-4">
          {brandSubtotals.map((b) => (
            <div key={b.brandId} className="flex items-center justify-between">
              <span className="text-[13px] font-public-sans text-muted-text truncate max-w-[160px]">
                {b.brandName}
              </span>
              <span className="text-[13px] font-[600] font-public-sans text-primary flex-shrink-0 ml-2">
                {formatINR(b.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border-warm mb-4" />

        {/* Shipping estimate */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-public-sans text-muted-text">Estimated shipping</span>
          <span className="text-[13px] font-public-sans text-muted-text">Calculated at checkout</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between mb-6 pt-2 border-t border-border-warm">
          <span className="text-[14px] font-[600] font-public-sans text-primary">Total (excl. shipping)</span>
          <span className="text-[16px] font-[700] font-public-sans text-primary">{formatINR(total)}</span>
        </div>

        {/* MOQ warnings */}
        {brandSubtotals
          .filter((b) => !b.meetsMinOrder)
          .map((b) => (
            <MoqWarning key={b.brandId} brandName={b.brandName} needed={b.needed} />
          ))}

        {/* Checkout CTA */}
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={onCheckout}
          disabled={hasUnmetMoq}
        >
          Proceed to Checkout
        </Button>

        {hasUnmetMoq && (
          <p className="mt-2 text-[11px] font-public-sans text-muted-text text-center">
            Resolve MOQ issues above before proceeding
          </p>
        )}
      </div>
    </aside>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)

  // Redirect unauthenticated users to homepage and open auth modal
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/')
      openAuthModal('signup')
    }
  }, [isAuthenticated, router, openAuthModal])

  const items = useCartStore((s) => s.items)
  const getItemsByBrand = useCartStore((s) => s.getItemsByBrand)
  const getTotalValue = useCartStore((s) => s.getTotalValue)

  const byBrand = getItemsByBrand()
  const isEmpty = items.length === 0

  // Compute per-brand subtotals + MOQ check
  const brandSubtotals: BrandSubtotals[] = Object.entries(byBrand).map(([brandId, brandItems]) => {
    const subtotal = brandItems.reduce((sum, i) => sum + i.wholesalePrice * i.quantity, 0)
    // MOQ is per-item; we check each item individually
    const lowestMoqItem = brandItems.find((i) => i.quantity < i.moq)
    const meetsMinOrder = !lowestMoqItem
    const needed = lowestMoqItem ? lowestMoqItem.moq - lowestMoqItem.quantity : 0
    return {
      brandId,
      brandName: brandItems[0]?.brandName ?? '',
      subtotal,
      meetsMinOrder,
      needed,
    }
  })

  const total = getTotalValue()

  function handleCheckout() {
    router.push('/checkout')
  }

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 lg:px-16 py-12">
        {/* Page heading */}
        <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-8">
          Your Cart
        </h1>

        {isEmpty ? (
          <EmptyState
            title="Your cart is empty"
            description="Browse our curated selection of Indian artisan brands and add products to your cart."
            action={{
              label: 'Browse the Catalogue',
              onClick: () => router.push('/catalogue'),
            }}
          />
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* ── Left: Cart items by brand ── */}
            <section aria-label="Cart items">
              {Object.entries(byBrand).map(([brandId, brandItems]) => (
                <BrandGroup
                  key={brandId}
                  brandId={brandId}
                  brandName={brandItems[0]?.brandName ?? ''}
                  items={brandItems}
                />
              ))}
            </section>

            {/* ── Right: Order summary ── */}
            <OrderSummary
              brandSubtotals={brandSubtotals}
              total={total}
              onCheckout={handleCheckout}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
