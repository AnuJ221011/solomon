'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import type { Order } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Australia',
  'Canada',
  'France',
  'Germany',
  'India',
  'Japan',
  'Netherlands',
  'New Zealand',
  'Singapore',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Other',
]

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary mb-4 pb-3 border-b border-border-warm">
      {children}
    </h2>
  )
}

// ─── Order confirmation state ─────────────────────────────────────────────────

function OrderConfirmed({ order }: { order: Order }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <span className="w-14 h-14 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center mb-5">
        <Check size={24} className="text-accent" aria-hidden="true" />
      </span>
      <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-2">
        Order confirmed
      </h1>
      <p className="text-[16px] font-public-sans text-muted-text mb-1">
        Order #{order.orderNumber}
      </p>
      <p className="text-[14px] font-public-sans text-muted-text max-w-[400px] mt-3 leading-[1.6]">
        Your order has been placed. Brands will confirm availability and reach out with dispatch timelines.
        You&apos;ll receive a confirmation email shortly.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard">
          <Button variant="primary" size="md">View my orders</Button>
        </Link>
        <Link href="/catalogue">
          <Button variant="ghost" size="md">Continue shopping</Button>
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ShippingForm {
  fullName: string
  company: string
  address1: string
  address2: string
  city: string
  state: string
  postcode: string
  country: string
  phone: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/')
      openAuthModal('signup')
    }
  }, [isAuthenticated, router, openAuthModal])
  const items = useCartStore((s) => s.items)
  const getTotalValue = useCartStore((s) => s.getTotalValue)
  const clearCart = useCartStore((s) => s.clearCart)

  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: user?.name ?? '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null)

  const total = getTotalValue()

  function updateShipping(field: keyof ShippingForm, value: string) {
    setShipping((f) => ({ ...f, [field]: value }))
  }

  // ── Auth gate ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
          <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-3">
            Sign in to checkout
          </h1>
          <p className="text-[16px] font-public-sans text-muted-text mb-8 max-w-[360px]">
            Create an account or log in to complete your purchase.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" size="lg" onClick={() => openAuthModal('signup')}>
              Create account
            </Button>
            <Button variant="ghost" size="lg" onClick={() => openAuthModal('login')}>
              Log in
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
          <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-3">
            Your cart is empty
          </h1>
          <p className="text-[16px] font-public-sans text-muted-text mb-8">
            Add products before proceeding to checkout.
          </p>
          <Link href="/catalogue">
            <Button variant="primary" size="lg">Browse the Catalogue</Button>
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  // ── Confirmed ───────────────────────────────────────────────────────────────
  if (confirmedOrder) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 max-w-[720px] mx-auto w-full px-6 py-12">
          <OrderConfirmed order={confirmedOrder} />
        </main>
        <Footer />
      </div>
    )
  }

  // ── Place order ─────────────────────────────────────────────────────────────
  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate required shipping fields
    const required: (keyof ShippingForm)[] = ['fullName', 'address1', 'city', 'country', 'postcode']
    for (const field of required) {
      if (!shipping[field].trim()) {
        setError('Please fill in all required shipping fields.')
        return
      }
    }

    setLoading(true)
    try {
      const { data } = await api.post<Order>('/orders', {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          wholesalePrice: i.wholesalePrice,
        })),
        shipping,
        total,
      })
      clearCart()
      setConfirmedOrder(data)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to place order. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 lg:px-16 py-12">
        {/* Back link */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to cart
        </Link>

        <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-10">
          Checkout
        </h1>

        <form onSubmit={handlePlaceOrder} noValidate>
          <div className="lg:grid lg:grid-cols-[1fr_360px] gap-12 items-start">
            {/* ── Left: Shipping form ── */}
            <div className="flex flex-col gap-8">
              {/* Shipping address */}
              <section>
                <SectionHeading>Shipping address</SectionHeading>
                <div className="flex flex-col gap-5">
                  {/* Full name + company */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="full-name">
                        Full name <span className="text-error">*</span>
                      </Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Jane Smith"
                        autoComplete="name"
                        value={shipping.fullName}
                        onChange={(e) => updateShipping('fullName', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Your store name"
                        autoComplete="organization"
                        value={shipping.company}
                        onChange={(e) => updateShipping('company', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Address lines */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="address1">
                      Address line 1 <span className="text-error">*</span>
                    </Label>
                    <Input
                      id="address1"
                      type="text"
                      placeholder="Street address"
                      autoComplete="address-line1"
                      value={shipping.address1}
                      onChange={(e) => updateShipping('address1', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="address2">Address line 2</Label>
                    <Input
                      id="address2"
                      type="text"
                      placeholder="Apartment, suite, unit, etc."
                      autoComplete="address-line2"
                      value={shipping.address2}
                      onChange={(e) => updateShipping('address2', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* City + State + Postcode */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="city">
                        City <span className="text-error">*</span>
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="City"
                        autoComplete="address-level2"
                        value={shipping.city}
                        onChange={(e) => updateShipping('city', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="state">State / Province</Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="State"
                        autoComplete="address-level1"
                        value={shipping.state}
                        onChange={(e) => updateShipping('state', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="postcode">
                        Postcode <span className="text-error">*</span>
                      </Label>
                      <Input
                        id="postcode"
                        type="text"
                        placeholder="Postcode"
                        autoComplete="postal-code"
                        value={shipping.postcode}
                        onChange={(e) => updateShipping('postcode', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Country + Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="country">
                        Country <span className="text-error">*</span>
                      </Label>
                      <Select
                        value={shipping.country}
                        onValueChange={(v) => updateShipping('country', v)}
                      >
                        <SelectTrigger id="country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+44 20 1234 5678"
                        autoComplete="tel"
                        value={shipping.phone}
                        onChange={(e) => updateShipping('phone', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Order notes */}
              <section>
                <SectionHeading>Order notes</SectionHeading>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes">Special instructions (optional)</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Notes for the brands, e.g. delivery preferences..."
                    className={cn(
                      'w-full rounded border border-border-warm bg-surface px-3 py-2.5',
                      'text-[16px] font-public-sans text-primary',
                      'placeholder:text-muted-text/60',
                      'outline-none focus:ring-1 focus:ring-accent focus:border-accent',
                      'transition-colors resize-none',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                    disabled={loading}
                  />
                </div>
              </section>
            </div>

            {/* ── Right: Order summary ── */}
            <aside className="sticky top-24 mt-8 lg:mt-0">
              <div className="bg-surface border border-border-warm rounded p-6">
                <h2 className="text-[14px] leading-[1.4] font-[600] font-public-sans text-primary mb-4">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="flex flex-col gap-3 mb-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 items-start">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted-bg border border-border-warm">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted-bg" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-[600] font-public-sans text-primary truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] font-public-sans text-muted-text">
                          {item.brandName} &middot; qty {item.quantity}
                        </p>
                      </div>
                      {/* Price */}
                      <span className="text-[13px] font-[600] font-public-sans text-primary flex-shrink-0 ml-2">
                        {formatINR(item.wholesalePrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Divider + totals */}
                <div className="border-t border-border-warm pt-4 flex flex-col gap-2 mb-4">
                  <div className="flex justify-between text-[13px] font-public-sans">
                    <span className="text-muted-text">Subtotal</span>
                    <span className="text-primary font-[600]">{formatINR(total)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-public-sans">
                    <span className="text-muted-text">Shipping</span>
                    <span className="text-muted-text">Calculated separately</span>
                  </div>
                </div>

                <div className="border-t border-border-warm pt-4 flex justify-between mb-6">
                  <span className="text-[14px] font-[600] font-public-sans text-primary">Total</span>
                  <span className="text-[18px] font-[700] font-public-sans text-primary">{formatINR(total)}</span>
                </div>

                {error && (
                  <p className="mb-4 text-[12px] font-public-sans text-error" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Placing order…' : 'Place order'}
                </Button>

                <p className="mt-3 text-[11px] font-public-sans text-muted-text text-center leading-[1.4]">
                  By placing this order you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                  . Payment is arranged directly with each brand.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}
