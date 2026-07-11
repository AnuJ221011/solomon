'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { Button } from '@/components/ui/button'
import { useFormatPrice } from '@/components/ui/Price'

// ─── Page ─────────────────────────────────────────────────────────────────────
//
// Checkout (payment + order placement) isn't wired up yet — there's no PayPal
// integration and the buyer's local cart isn't synced to the backend. Rather
// than show a form that silently fails, this page states that plainly and
// keeps the buyer's cart context visible.

export default function CheckoutPage() {
  const fmt = useFormatPrice()
  const router = useRouter()
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

  const allItems        = useCartStore((s) => s.items)
  const checkoutItemIds = useCartStore((s) => s.checkoutItemIds)

  // If specific items were staged for checkout, use only those; otherwise use all.
  const items = checkoutItemIds?.length
    ? allItems.filter((i) => checkoutItemIds.includes(i.productId))
    : allItems

  const total = items.reduce((s, i) => s + i.wholesalePrice * i.quantity, 0)

  if (!hasHydrated || !isAuthenticated) return null

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-16 py-8 sm:py-12">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to cart
        </Link>

        <h1 className="text-[24px] sm:text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-8 sm:mb-10">
          Checkout
        </h1>

        <div className="lg:grid lg:grid-cols-[1fr_360px] gap-12 items-start">
          {/* ── Left: coming-soon notice ── */}
          <div className="bg-surface border border-border-warm rounded p-8 flex flex-col items-center text-center gap-4">
            <span className="w-12 h-12 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center">
              <Clock size={20} className="text-accent" aria-hidden="true" />
            </span>
            <h2 className="text-[19px] font-[500] font-playfair text-primary">Checkout is coming soon</h2>
            <p className="text-[14px] font-public-sans text-muted-text max-w-[420px] leading-[1.6]">
              We&apos;re finishing up secure payments so you can place orders directly from Solomon Bharat.
              Your cart is saved — check back shortly, or reach out to a brand directly from their storefront in the meantime.
            </p>
            <Link href="/catalogue" className="mt-2">
              <Button variant="ghost" size="md">Continue browsing</Button>
            </Link>
          </div>

          {/* ── Right: read-only order summary ── */}
          <aside className="sticky top-24 mt-8 lg:mt-0">
            <div className="bg-surface border border-border-warm rounded p-6">
              <h2 className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary mb-4">
                Order Summary
              </h2>

              <div className="flex flex-col gap-3 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 items-start">
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted-bg border border-border-warm">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted-bg" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-[600] font-public-sans text-primary truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] font-public-sans text-muted-text">
                        {item.brandName} &middot; qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-[13px] font-[600] font-public-sans text-primary flex-shrink-0 ml-2">
                      {fmt(item.wholesalePrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-warm pt-4 flex justify-between mb-6">
                <span className="text-[14px] font-[600] font-public-sans text-primary">Total</span>
                <span className="text-[18px] font-[600] font-public-sans text-primary">{fmt(total)}</span>
              </div>

              <button
                type="button"
                disabled
                className="w-full h-11 rounded-lg text-[14px] font-[600] font-public-sans bg-muted-bg text-muted-text cursor-not-allowed flex items-center justify-center gap-2"
              >
                Place order
                <span className="text-[11px] font-[500] bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                  Coming soon
                </span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
