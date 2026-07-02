'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Minus, Plus, Package, RotateCcw, CalendarDays, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatINR } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types'

// ─── Trust badge map ──────────────────────────────────────────────────────────

const BADGE_MAP: Record<string, string> = {
  'handmade':       'Handmade',
  'hand-crafted':   'Handmade',
  'handcraft':      'Handmade',
  'hand-stitched':  'Handmade',
  'organic':        'Organic',
  'eco':            'Eco-friendly',
  'eco-friendly':   'Eco-friendly',
  'sustainable':    'Sustainable',
  'zero-waste':     'Zero-waste',
  'women-owned':    'Women-owned',
  'block-print':    'Block-printed',
  'block-printed':  'Block-printed',
  'artisan':        'Artisan-made',
  'natural':        'Natural',
  'vegan':          'Vegan',
  'not-on-amazon':  'Not on Amazon',
  'fair-trade':     'Fair Trade',
  'upcycled':       'Upcycled',
}

// ─── Free-shipping thresholds by currency ─────────────────────────────────────

const FREE_SHIP: Record<string, number> = {
  INR: 15000, USD: 200, EUR: 180, GBP: 150, AED: 750, SGD: 270, AUD: 300,
}

// ─── Delivery range from lead time ───────────────────────────────────────────

function getDeliveryRange(leadTime: string): string {
  const lt = leadTime.toUpperCase()
  let minDays = 9, maxDays = 16
  if (lt.includes('THREE_DAYS') || lt.includes('1-3')) { minDays = 4; maxDays = 8 }
  else if (lt.includes('FOUR_WEEKS') || lt.includes('4 WEEKS')) { minDays = 18; maxDays = 32 }

  const now = Date.now()
  const min = new Date(now + minDays * 86_400_000)
  const max = new Date(now + maxDays * 86_400_000)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (min.getMonth() === max.getMonth()) {
    return `${min.toLocaleDateString('en-US', { month: 'short' })} ${min.getDate()}–${max.getDate()}`
  }
  return `${fmt(min)} – ${fmt(max)}`
}

function getBadges(tags: string[]): string[] {
  const badges: string[] = []
  const seen = new Set<string>()
  for (const tag of tags) {
    const badge = BADGE_MAP[tag.toLowerCase()]
    if (badge && !seen.has(badge)) {
      badges.push(badge)
      seen.add(badge)
    }
  }
  return badges
}

// ─── Expandable section ───────────────────────────────────────────────────────

function ExpandableSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border-warm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 text-left text-[14px] font-[600] font-public-sans text-primary hover:text-muted-text transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          size={16}
          className={cn('text-muted-text transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div className={cn('overflow-hidden transition-all duration-200', open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0')}>
        <div className="pb-5 text-[14px] leading-[1.7] font-[400] font-public-sans text-muted-text">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────

function QuantityStepper({ value, onChange, min }: { value: number; onChange: (v: number) => void; min: number }) {
  return (
    <div className="flex items-center border border-border-warm rounded w-fit" role="group" aria-label="Quantity">
      <button
        type="button"
        onClick={() => value > min && onChange(value - 1)}
        disabled={value <= min}
        className="h-10 px-3 inline-flex items-center justify-center text-primary hover:bg-muted-bg transition-colors rounded-l disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <div
        className="w-16 text-center text-[14px] font-[600] font-public-sans text-primary select-none border-x border-border-warm h-10 flex items-center justify-center"
        aria-live="polite"
      >
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="h-10 px-3 inline-flex items-center justify-center text-primary hover:bg-muted-bg transition-colors rounded-r"
        aria-label="Increase quantity"
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── Variant selector helpers ─────────────────────────────────────────────────

function buildAxes(variants: NonNullable<Product['variants']>) {
  const map = new Map<string, string[]>()
  for (const v of variants) {
    for (const a of v.attributes) {
      if (!map.has(a.name)) map.set(a.name, [])
      if (!map.get(a.name)!.includes(a.value)) map.get(a.name)!.push(a.value)
    }
  }
  return Array.from(map.entries()).map(([name, values]) => ({ name, values }))
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductInfo({ product }: { product: Product }) {
  const {
    id, name, brandName, brandSlug,
    description,
    wholesalePrice, displayPrice, currency,
    moq, leadTime, weight, category, tags, images, inStock,
    variants = [],
    countryOfOrigin,
    freeShippingAboveInr,
    returnsWindowDays,
  } = product

  const [quantity, setQuantity] = useState(moq)
  const [addedFeedback, setAddedFeedback] = useState(false)

  // ── Variant state ──────────────────────────────────────────────────────────
  const axes = buildAxes(variants)
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})

  const selectedVariant = variants.find((v) =>
    axes.length > 0 &&
    v.attributes.every((a) => selectedAttrs[a.name] === a.value) &&
    v.attributes.length === axes.length
  ) ?? null

  function selectAttr(axisName: string, value: string) {
    setSelectedAttrs((prev) => ({ ...prev, [axisName]: value }))
  }

  function isValueAvailable(axisName: string, val: string) {
    return variants.some(
      (v) => v.stock > 0 && v.attributes.some((a) => a.name === axisName && a.value === val)
    )
  }

  const { requireAuth } = useAuth()
  const addItem = useCartStore((s) => s.addItem)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)

  const basePrice = displayPrice ?? wholesalePrice
  const activePrice = selectedVariant ? selectedVariant.priceInr : basePrice
  const priceCurrency = currency ?? 'INR'
  const showINREquiv = priceCurrency !== 'INR'
  const suggestedRetail = activePrice * 2
  const minOrderValue = activePrice * moq

  const badges = getBadges(tags ?? [])

  const effectiveInStock = variants.length > 0
    ? (selectedVariant ? selectedVariant.stock > 0 : variants.some((v) => v.stock > 0))
    : inStock

  function handleAddToCart() {
    requireAuth(() => {
      addItem({
        productId: id,
        productName: name,
        brandId: product.brandId,
        brandName,
        brandSlug,
        image: images?.[0] ?? '',
        quantity,
        wholesalePrice,
        moq,
        leadTime,
        achievementLevel: product.achievementLevel,
        brandMinimumOrderValue: product.brandMinimumOrderValue,
      })
      toast.success(`${name} added to cart`, {
        description: `Qty: ${quantity} · ${brandName}`,
        duration: 3000,
      })
      setAddedFeedback(true)
      setTimeout(() => setAddedFeedback(false), 2000)
    }, 'add_to_cart')
  }

  function handleRequestSamples() {
    requireAuth(() => {
      alert('Sample request feature coming soon!')
    }, 'request_samples')
  }

  const freeShipThreshold = freeShippingAboveInr ?? FREE_SHIP[priceCurrency] ?? 15000
  const deliveryRange = getDeliveryRange(leadTime)
  const shipFromCountry = (() => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryOfOrigin ?? 'IN') ?? 'India'
    } catch {
      return 'India'
    }
  })()

  return (
    <div className="flex flex-col">

      {/* 1. Product name */}
      <h1 className="font-playfair font-[500] text-primary text-[22px] sm:text-[26px] leading-[1.2] mb-5">
        {name}
      </h1>

      {/* 3. Price block */}
      <div
        className={cn('mb-4 relative', !isAuthenticated && 'cursor-pointer')}
        onClick={!isAuthenticated ? () => openAuthModal('login') : undefined}
      >
        <div className={cn(!isAuthenticated && 'blur-sm select-none pointer-events-none')}>
          <p className="font-public-sans text-[11px] font-[600] text-muted-text uppercase tracking-[0.07em] mb-1.5">
            Wholesale price
          </p>
          <p className="font-public-sans text-[38px] font-[600] text-primary tracking-[-0.025em] leading-none">
            {formatCurrency(activePrice, priceCurrency)}
            {variants.length > 0 && !selectedVariant && (
              <span className="text-[14px] font-[400] text-muted-text ml-2 tracking-normal">from</span>
            )}
          </p>
          <p className="font-public-sans text-[13px] text-muted-text mt-1.5">
            Suggested retail:&nbsp;
            <span className="text-primary font-[500]">{formatCurrency(suggestedRetail, priceCurrency)}</span>
            &nbsp;/ unit
          </p>
          {showINREquiv && (
            <p className="font-public-sans text-[12px] text-muted-text mt-0.5">
              {formatINR(wholesalePrice)} per unit (INR)
            </p>
          )}
        </div>
        {!isAuthenticated && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <p className="font-public-sans text-[14px] font-[600] text-primary">Sign in to see price</p>
            <p className="font-public-sans text-[12px] text-muted-text">Wholesale pricing for verified buyers</p>
          </div>
        )}
      </div>

      {/* Variant selector */}
      {axes.length > 0 && (
        <div className="mb-5 space-y-4">
          {axes.map((axis) => (
            <div key={axis.name}>
              <p className="font-public-sans text-[12px] font-[600] text-muted-text uppercase tracking-[0.05em] mb-2">
                {axis.name}
                {selectedAttrs[axis.name] && (
                  <span className="ml-1.5 text-primary normal-case font-[500] tracking-normal">
                    — {selectedAttrs[axis.name]}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {axis.values.map((val) => {
                  const available = isValueAvailable(axis.name, val)
                  const selected = selectedAttrs[axis.name] === val
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => available && selectAttr(axis.name, val)}
                      className={cn(
                        'h-9 px-4 rounded border text-[13px] font-[500] font-public-sans transition-colors relative',
                        selected
                          ? 'border-primary bg-primary text-white'
                          : available
                          ? 'border-border-warm text-primary hover:border-primary'
                          : 'border-border-warm text-muted-text opacity-40 cursor-not-allowed',
                      )}
                      aria-pressed={selected}
                    >
                      {val}
                      {!available && (
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="absolute w-full h-px bg-muted-text/40 rotate-[-20deg]" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {selectedVariant && (
            <p className="text-[12px] font-public-sans text-muted-text">
              SKU: <span className="text-primary font-[500]">{selectedVariant.sku}</span>
              {selectedVariant.stock > 0 && (
                <> &nbsp;·&nbsp; <span className="text-green-600">{selectedVariant.stock} in stock</span></>
              )}
            </p>
          )}
          {axes.length > 0 && Object.keys(selectedAttrs).length < axes.length && (
            <p className="text-[12px] font-public-sans text-muted-text italic">
              Select {axes.filter((a) => !selectedAttrs[a.name]).map((a) => a.name.toLowerCase()).join(' and ')} to continue
            </p>
          )}
        </div>
      )}

      {/* 4. Min. order */}
      <p className="font-public-sans text-[13px] text-muted-text mb-4">
        Min. order:&nbsp;
        <span className="font-[600] text-primary">{moq} units</span>
        {isAuthenticated && (
          <>
            &nbsp;·&nbsp;
            <span className="text-primary font-[500]">{formatCurrency(minOrderValue, priceCurrency)} total</span>
          </>
        )}
      </p>

      {/* 5. Trust / attribute badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center bg-muted-bg border border-border-warm rounded-full px-3 py-1 text-[12px] font-[500] font-public-sans text-muted-text"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-border-warm mb-5" />

      {/* 6. Quantity stepper */}
      {effectiveInStock && (
        <div className="mb-4">
          <p className="font-public-sans text-[12px] font-[500] text-muted-text mb-2">
            Quantity&nbsp;<span className="text-primary">(min. {moq})</span>
          </p>
          <QuantityStepper value={quantity} onChange={setQuantity} min={moq} />
        </div>
      )}

      {!effectiveInStock && (
        <div className="mb-4 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
          <span className="font-public-sans text-[14px] font-[500] text-red-500">Out of stock</span>
        </div>
      )}

      {/* 7. CTAs */}
      <div className="flex flex-col gap-2.5">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          disabled={!effectiveInStock || (axes.length > 0 && !selectedVariant)}
          className={cn('w-full h-12 text-[14px] font-[600] transition-all', addedFeedback && 'bg-success hover:bg-success')}
          aria-label={effectiveInStock ? `Add ${quantity} units to order` : 'Out of stock'}
        >
          {addedFeedback
            ? 'Added to order ✓'
            : axes.length > 0 && !selectedVariant
            ? 'Select options to continue'
            : effectiveInStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>

      {/* 8. Shipping & policies */}
      <div className="mt-5 pt-5 border-t border-border-warm">
        <p className="font-public-sans text-[14px] font-[600] text-primary mb-3.5">
          Shipping &amp; policies
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Package size={15} className="text-muted-text mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-public-sans text-[13px] text-muted-text leading-snug">
              Free shipping on orders{' '}
              <span className="border-b border-dotted border-muted-text/60 cursor-default">
                {formatCurrency(freeShipThreshold, priceCurrency)}+
              </span>
            </span>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays size={15} className="text-muted-text mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-public-sans text-[13px] text-muted-text leading-snug">
              Estimated delivery{' '}
              <span className="border-b border-dotted border-muted-text/60 cursor-default">
                {deliveryRange}
              </span>
            </span>
          </div>
          <div className="flex items-start gap-3">
            <Globe size={15} className="text-muted-text mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-public-sans text-[13px] text-muted-text leading-snug">
              Ships from{' '}
              <span className="border-b border-dotted border-muted-text/60 cursor-default">{shipFromCountry}</span>
            </span>
          </div>
          {returnsWindowDays != null && (
          <div className="flex items-start gap-3">
            <RotateCcw size={15} className="text-muted-text mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-public-sans text-[13px] text-muted-text leading-snug">
              Eligible for{' '}
              <span className="border-b border-dotted border-muted-text/60 cursor-default">free returns</span>
              {' '}on first-time orders within {returnsWindowDays} days
            </span>
          </div>
          )}
        </div>
      </div>

      <div className="border-t border-border-warm mt-6 mb-6" />

      {/* 9. About this product — visible, not in accordion */}
      <div className="mb-2">
        <p className="font-public-sans text-[11px] font-[600] text-muted-text uppercase tracking-[0.07em] mb-3">
          About this product
        </p>
        <p className="font-public-sans text-[15px] leading-[1.75] text-muted-text whitespace-pre-wrap">
          {description}
        </p>
      </div>

      {/* 10. Accordions */}
      <div className="mt-4 flex flex-col">
        <ExpandableSection title="Product Details" defaultOpen>
          <dl className="flex flex-col gap-3">
            {[
              { label: 'Category',   value: category },
              { label: 'Weight',     value: `${weight}g per unit` },
              { label: 'Lead time',  value: leadTime },
              { label: 'Min. order', value: `${moq} units` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="font-public-sans text-[12px] font-[600] text-primary uppercase tracking-[0.04em] flex-shrink-0">
                  {label}
                </dt>
                <dd className="font-public-sans text-[14px] text-muted-text text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </ExpandableSection>

        <ExpandableSection title="Shipping & Returns">
          <div className="flex flex-col gap-2.5">
            <p>Lead time: <span className="text-primary font-[500]">{leadTime}</span> from order confirmation.</p>
            <p>Orders dispatched from {brandName}'s warehouse. Tracking info provided on dispatch. International shipments via our logistics partners.</p>
            <p>Bulk orders (10× MOQ or above) may qualify for dedicated freight — contact your account manager.</p>
            <p className="pt-1 border-t border-border-warm mt-1">Free returns on first-time orders within <span className="text-primary font-[500]">60 days</span> of delivery.</p>
          </div>
        </ExpandableSection>

        <ExpandableSection title="About the Brand">
          <p className="mb-3">
            {description ??
              `${brandName} is a curated brand on Solomon Bharat, India's B2B wholesale marketplace. Products are crafted using traditional methods and responsibly sourced materials.`}
          </p>
          <Link
            href={`/brands/${brandSlug}`}
            className="text-[13px] font-[600] font-public-sans text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
          >
            Visit brand storefront →
          </Link>
        </ExpandableSection>
      </div>

      {/* 11. Tags */}
      {tags && tags.length > 0 && (
        <div className="mt-6 pt-5 border-t border-border-warm flex flex-wrap gap-2">
          {tags.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="bg-muted-bg text-muted-text rounded px-3 py-1 text-[12px] font-[500] font-public-sans border border-border-warm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
