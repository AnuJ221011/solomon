import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  DELIVERED: {
    label: 'Delivered',
    className: 'bg-success/10 text-success',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-warning/[12%] text-warning',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-warning/[12%] text-warning',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-accent/10 text-accent-hover',
  },
  DISPATCHED: {
    label: 'Dispatched',
    className: 'bg-accent/10 text-accent-hover',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-error/10 text-error',
  },
  DISPUTED: {
    label: 'Disputed',
    className: 'bg-primary/[8%] text-primary',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-muted-bg text-muted-text',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded',
        'text-[12px] font-[500] font-public-sans',
        'px-2 py-0.5',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
