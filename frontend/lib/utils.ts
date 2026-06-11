import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus } from '@/types'

// ─── Class Name Utility ───────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─── Currency Formatting ──────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatINR(amount: number): string {
  return formatCurrency(amount, 'INR')
}

// ─── Achievement Labels ───────────────────────────────────────────────────────

export function getAchievementLabel(level: 1 | 2 | 3 | 4 | 5): string {
  const labels: Record<number, string> = {
    1: 'Sprout',
    2: 'Rising',
    3: 'Trusted',
    4: 'Elite',
    5: 'Legend',
  }
  return labels[level]
}

// ─── Order Status Badge Colors ────────────────────────────────────────────────

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-muted-bg text-muted-text border border-border-warm'
    case 'CONFIRMED':
      return 'bg-muted-bg text-primary border border-border-warm'
    case 'PROCESSING':
      return 'bg-muted-bg text-warning border border-border-warm'
    case 'DISPATCHED':
      return 'bg-muted-bg text-accent border border-border-warm'
    case 'DELIVERED':
      return 'bg-muted-bg text-success border border-border-warm'
    case 'DISPUTED':
      return 'bg-muted-bg text-error border border-border-warm'
    case 'CANCELLED':
      return 'bg-muted-bg text-muted-text border border-border-warm line-through'
    default:
      return 'bg-muted-bg text-muted-text border border-border-warm'
  }
}

// ─── String Utilities ─────────────────────────────────────────────────────────

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trimEnd() + '…'
}
