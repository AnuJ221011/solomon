'use client'

import { useState } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatINR } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductInfoProps {
  product: Product
}

// ─── Expandable Section ───────────────────────────────────────────────────────

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
        className={cn(
          'w-full flex items-center justify-between py-4',
          'text-left text-[14px] font-[600] font-public-sans text-primary',
          'hover:text-muted-text transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1 rounded'
        )}
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          size={16}
          className={cn('text-muted-text transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="pb-4 text-[16px] leading-[1.5] font-[400] font-public-sans text-muted-text">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Tag pills ────────────────────────────────────────────────────────────────

function TagPills({ tags }: { tags: string[] }) {
  const VISIBLE_COUNT = 5
  const visible = tags.slice(0, VISIBLE_COUNT)
  const overflow = tags.length - VISIBLE_COUNT

  return (
    <div className="flex flex-wrap gap-2 mt-3" aria-label="Product tags">
      {visible.map((tag) => (
        <span
          key={tag}
          className="bg-muted-bg text-muted-text rounded px-3 py-1 text-[12px] font-[500] font-public-sans border border-border-warm"
        >
          {tag}
        </span>
      ))}
      {overflow > 0 && (
        <span className="bg-muted-bg text-muted-text rounded px-3 py-1 text-[12px] font-[500] font-public-sans border border-border-warm">
          +{overflow} more
        </span>
      )}
    </div>
  )
}

// ─── Quantity Stepper ─────────────────────────────────────────────────────────

function QuantityStepper({
  value,
  onChange,
  min,
}: {
  value: number
  onChange: (v: number) => void
  min: number
}) {
  function decrement() {
    if (value > min) onChange(value - 1)
  }
  function increment() {
    onChange(value + 1)
  }

  return (
    <div
      className="flex items-center border border-border-warm rounded mt-6 w-fit"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className={cn(
          'h-10 px-3 inline-flex items-center justify-center',
          'text-primary hover:bg-muted-bg transition-colors rounded-l',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        aria-label="Decrease quantity"
      >
        <Minus size={14} aria-hidden="true" />
      </button>

      <div
        className="w-16 text-center text-[14px] font-[600] font-public-sans text-primary select-none border-x border-border-warm h-10 flex items-center justify-center"
        aria-live="polite"
        aria-label={`Quantity: ${value}`}
      >
        {value}
      </div>

      <button
        type="button"
        onClick={increment}
        className="h-10 px-3 inline-flex items-center justify-center text-primary hover:bg-muted-bg transition-colors rounded-r"
        aria-label="Increase quantity"
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductInfo({ product }: ProductInfoProps) {
  const {
    id,
    name,
    brandName,
    brandSlug,
    shortDescription,
    description,
    wholesalePrice,
    displayPrice,
    currency,
    moq,
    leadTime,
    weight,
    category,
    tags,
    images,
    inStock,
  } = product

  const [quantity, setQuantity] = useState(moq)
  const [addedFeedback, setAddedFeedback] = useState(false)

  const { requireAuth } = useAuth()
  const addItem = useCartStore((s) => s.addItem)

  const priceAmount = displayPrice ?? wholesalePrice
  const priceCurrency = currency ?? 'INR'
  const showINREquiv = priceCurrency !== 'INR'

  function handleAddToCart() {
    requireAuth(() => {
      addItem({
        productId: id,
        productName: name,
        brandId: product.brandId,
        brandName,
        image: images?.[0] ?? '',
        quantity,
        wholesalePrice,
        moq,
      })
      setAddedFeedback(true)
      setTimeout(() => setAddedFeedback(false), 2000)
    }, 'add_to_cart')
  }

  return (
    <div className="flex flex-col">
      {/* 1. Product name */}
      <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
        {name}
      </h1>

      {/* 2. Price */}
      <div className="mt-4">
        <p className="text-[48px] leading-[1.1] font-[700] font-public-sans text-primary tracking-[-0.02em]">
          {formatCurrency(priceAmount, priceCurrency)}
        </p>
        {showINREquiv && (
          <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-1">
            {formatINR(wholesalePrice)} per unit (INR)
          </p>
        )}
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-0.5">
          Minimum order: {moq} units
        </p>
      </div>

      {/* 3. Tag pills */}
      {tags && tags.length > 0 && <TagPills tags={tags} />}

      {/* 4. Short description */}
      <p className="text-[16px] leading-[1.5] font-[400] font-public-sans text-muted-text mt-4">
        {shortDescription}
      </p>

      {/* 5. Quantity stepper */}
      {inStock ? (
        <QuantityStepper value={quantity} onChange={setQuantity} min={moq} />
      ) : (
        <div className="mt-6 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" aria-hidden="true" />
          <span className="text-[14px] font-[500] font-public-sans text-error">Out of stock</span>
        </div>
      )}

      {/* 6. Add to Cart */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleAddToCart}
        disabled={!inStock}
        className={cn(
          'w-full mt-4 h-12 text-[14px] transition-all',
          addedFeedback && 'bg-success hover:bg-success'
        )}
        aria-label={inStock ? `Add ${quantity} units of ${name} to cart` : 'Out of stock'}
      >
        {addedFeedback ? 'Added to cart' : inStock ? 'Add to Cart' : 'Out of Stock'}
      </Button>

      {/* MOQ reminder */}
      <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text mt-2 text-center">
        MOQ {moq} units &middot; {leadTime} lead time
      </p>

      {/* 7. Expandable sections */}
      <div className="mt-8 flex flex-col">
        <ExpandableSection title="Product Details" defaultOpen>
          <ul className="flex flex-col gap-2">
            <li>
              <span className="text-[12px] font-[600] font-public-sans text-primary uppercase tracking-[0.04em]">
                Category
              </span>
              <br />
              {category}
            </li>
            <li>
              <span className="text-[12px] font-[600] font-public-sans text-primary uppercase tracking-[0.04em]">
                Weight
              </span>
              <br />
              {weight} kg per unit
            </li>
            <li>
              <span className="text-[12px] font-[600] font-public-sans text-primary uppercase tracking-[0.04em]">
                Brand
              </span>
              <br />
              <a
                href={`/brands/${brandSlug}`}
                className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
              >
                {brandName}
              </a>
            </li>
          </ul>
        </ExpandableSection>

        <ExpandableSection title="Shipping & Lead Time">
          <div className="flex flex-col gap-3">
            <p>
              <span className="text-[12px] font-[600] font-public-sans text-primary uppercase tracking-[0.04em] block mb-1">
                Lead Time
              </span>
              {leadTime} from order confirmation
            </p>
            <p>
              Orders are dispatched from {brandName}'s warehouse. International shipments are
              handled via our logistics partners. Tracking information is provided upon dispatch.
            </p>
            <p>
              Bulk orders (10x MOQ or above) may qualify for dedicated freight arrangements —
              contact your account manager for details.
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection title="Brand Story">
          <p>
            {description ??
              `${brandName} is a curated brand on Solomon Bharat, India's premium B2B wholesale marketplace. This product is crafted using traditional methods and responsibly sourced materials.`}
          </p>
        </ExpandableSection>
      </div>
    </div>
  )
}
