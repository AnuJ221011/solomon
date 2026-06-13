'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareLinkBannerProps {
  brandName: string
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareLinkBanner({ brandName, className }: ShareLinkBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)

  if (dismissed) return null

  return (
    <div
      className={cn(
        'top-0 w-full bg-accent py-2 px-4',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Message */}
        <p className="text-[14px] leading-[1.4] font-[600] font-public-sans text-white">
          <span className="font-[600]">{brandName}</span> invited you to their wholesale
          catalogue — create a free account to place orders
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className={cn(
              'inline-flex items-center justify-center h-8 px-3 rounded',
              'text-[12px] font-[600] font-public-sans text-white',
              'border border-white/60 bg-transparent',
              'hover:bg-white/10 transition-colors',
              'whitespace-nowrap'
            )}
          >
            Sign up free
          </button>

          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white transition-colors p-1 rounded"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
