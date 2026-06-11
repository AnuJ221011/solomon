import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types'
import { AchievementBadge } from '@/components/shared/AchievementBadge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandCardProps {
  brand: Brand
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BrandCard({ brand, className }: BrandCardProps) {
  const { name, slug, logo, location, achievementLevel, tagline } = brand

  return (
    <Link
      href={`/brands/${slug}`}
      className={cn(
        'flex flex-col w-[240px] flex-shrink-0 p-4',
        'bg-surface border border-border-warm rounded',
        'hover:shadow-[0_4px_20px_rgba(26,26,26,0.04)]',
        'transition-all duration-200',
        className
      )}
    >
      {/* Logo */}
      <div className="w-20 h-20 rounded border border-border-warm overflow-hidden bg-muted-bg flex-shrink-0 relative">
        {logo ? (
          <Image
            src={logo}
            alt={`${name} logo`}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[28px] font-[600] font-playfair text-muted-text/40 select-none">
              {name?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
        )}
      </div>

      {/* Brand name */}
      <p className="text-[24px] font-[500] font-playfair text-primary mt-3 leading-tight">
        {name}
      </p>

      {/* Location */}
      <p className="text-[12px] text-muted-text font-public-sans mt-0.5">
        {location}
      </p>

      {/* Achievement badge */}
      <div className="mt-1">
        <AchievementBadge level={achievementLevel} />
      </div>

      {/* Tagline */}
      {tagline && (
        <p className="text-[16px] text-muted-text font-public-sans mt-2 line-clamp-2 leading-snug">
          {tagline}
        </p>
      )}
    </Link>
  )
}
