'use client'

import { useState } from 'react'
import { Star, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react'
import { AccountPageWrapper } from '@/components/shared/AccountPageWrapper'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useMyOrders, useOrder } from '@/hooks/queries/useOrders'
import { useSubmitReview } from '@/hooks/queries/useReviews'
import type { Order, OrderItem } from '@/hooks/queries/useOrders'

// ─── Star rating widget ────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className={cn(
              'transition-transform',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              size={20}
              aria-hidden="true"
              className={filled ? 'text-amber-400 fill-amber-400' : 'text-muted-text'}
            />
          </button>
        )
      })}
    </div>
  )
}

// ─── Single product review form ────────────────────────────────────────────────

function ProductReviewForm({
  item,
  orderId,
  onSubmitted,
}: {
  item: OrderItem
  orderId: string
  onSubmitted: (productId: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const submitReview = useSubmitReview()

  function handleSubmit() {
    if (rating === 0) return
    submitReview.mutate(
      { orderId, productId: item.productId, rating, comment: comment.trim() || undefined },
      { onSuccess: () => onSubmitted(item.productId) }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded border border-border-warm bg-muted-bg flex-shrink-0 overflow-hidden flex items-center justify-center">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] font-public-sans text-muted-text">IMG</span>
          )}
        </div>
        <p className="font-public-sans text-[14px] font-[600] text-primary truncate">{item.productName}</p>
      </div>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product (optional)"
        rows={3}
        maxLength={1000}
        className={cn(
          'w-full resize-none rounded border border-border-warm bg-muted-bg/30 px-3 py-2',
          'font-public-sans text-[13px] text-primary placeholder:text-muted-text',
          'focus:outline-none focus:border-primary/40 focus:bg-surface transition-colors'
        )}
      />

      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={rating === 0 || submitReview.isPending}
      >
        {submitReview.isPending ? 'Submitting…' : 'Submit Review'}
      </Button>
    </div>
  )
}

// ─── Order review card ─────────────────────────────────────────────────────────

function OrderReviewCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())

  const { data: fullOrder, isLoading } = useOrder(expanded ? order.id : null)

  const items = fullOrder?.items ?? []
  const unreviewedItems = items.filter((item) => !reviewedIds.has(item.productId))
  const allReviewed = !isLoading && items.length > 0 && unreviewedItems.length === 0

  function markReviewed(productId: string) {
    setReviewedIds((prev) => new Set([...prev, productId]))
  }

  return (
    <div className="border border-border-warm rounded bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted-bg/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <PackageCheck size={16} className="text-success flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-public-sans text-[14px] font-[600] text-primary">
              Order {order.orderNumber}
            </p>
            <p className="font-public-sans text-[12px] text-muted-text mt-0.5">
              Delivered ·{' '}
              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allReviewed && (
            <span className="text-[11px] font-[600] font-public-sans text-success bg-success/10 px-2 py-0.5 rounded">
              All reviewed
            </span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-muted-text" />
          ) : (
            <ChevronDown size={16} className="text-muted-text" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-warm px-5 py-4 space-y-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-text">
              <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <span className="font-public-sans text-[13px]">Loading items…</span>
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <p className="font-public-sans text-[13px] text-muted-text">
              No items found for this order.
            </p>
          )}

          {unreviewedItems.map((item) => (
            <ProductReviewForm
              key={item.productId}
              item={item}
              orderId={order.id}
              onSubmitted={markReviewed}
            />
          ))}

          {allReviewed && (
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" aria-hidden="true" />
              <p className="font-public-sans text-[13px] text-success font-[600]">
                All items reviewed — thank you!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { data, isLoading } = useMyOrders({ status: 'DELIVERED', limit: 50 })
  const orders: Order[] = data?.orders ?? []

  return (
    <AccountPageWrapper title="Reviews" description="Share your experience with delivered orders">

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded border border-border-warm bg-muted-bg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <EmptyState
          title="No delivered orders"
          description="Reviews can be left once your orders have been delivered."
          action={{
            label: 'Browse the Catalogue',
            onClick: () => { window.location.href = '/catalogue' },
          }}
        />
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderReviewCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </AccountPageWrapper>
  )
}
