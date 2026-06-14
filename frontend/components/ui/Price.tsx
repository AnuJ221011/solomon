'use client'

import { useAuthStore } from '@/lib/store/useAuthStore'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { cn } from '@/lib/utils'

interface PriceProps {
  /** Wholesale price in INR (stored unit) */
  amountInr: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
}

export function Price({ amountInr, className, size = 'md' }: PriceProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const { currency, convertFromINR } = useCurrencyStore()

  const converted = convertFromINR(amountInr)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(converted)

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal('login')}
        className={cn(
          'cursor-pointer select-none rounded',
          'blur-[5px] transition-none',
          sizeClass[size],
          className
        )}
        aria-label="Sign in to view wholesale price"
        title="Sign in to view wholesale prices"
      >
        ₹0,000
      </button>
    )
  }

  return (
    <span className={cn(sizeClass[size], className)}>
      {formatted}
    </span>
  )
}
