import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementBadgeProps {
  level: 1 | 2 | 3 | 4 | 5
  className?: string
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<
  1 | 2 | 3 | 4 | 5,
  { label: string; className: string }
> = {
  1: {
    label: 'Sprout',
    className: 'bg-muted-bg text-muted-text',
  },
  2: {
    label: 'Rising Brand',
    className: 'bg-accent/[15%] text-accent-hover',
  },
  3: {
    label: 'Trusted',
    className: 'bg-accent/[25%] text-accent-hover',
  },
  4: {
    label: 'Elite',
    className: 'bg-primary/[8%] text-primary',
  },
  5: {
    label: 'Legend',
    className: 'bg-primary text-white',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AchievementBadge({ level, className }: AchievementBadgeProps) {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[1]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded',
        'text-[11px] font-[600] font-public-sans',
        'px-2 py-0.5',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
