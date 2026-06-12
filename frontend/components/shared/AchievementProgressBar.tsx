import { cn } from '@/lib/utils'
import type { AchievementCriteria } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementProgressBarProps {
  currentLevel: 1 | 2 | 3 | 4 | 5
  criteria: AchievementCriteria[]
  nextLevelName: string
  className?: string
}

// ─── Level labels ─────────────────────────────────────────────────────────────

const LEVEL_NAMES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Sprout',
  2: 'Rising Brand',
  3: 'Trusted',
  4: 'Elite',
  5: 'Legend',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AchievementProgressBar({
  currentLevel,
  criteria = [],
  nextLevelName,
  className,
}: AchievementProgressBarProps) {
  const metCount = criteria.filter((c) => c.met).length
  const totalCount = criteria.length
  const progressPercent = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0

  const currentLevelName = LEVEL_NAMES[currentLevel]

  return (
    <div className={cn('w-full', className)}>
      {/* Level labels */}
      <div className="flex justify-between mb-1">
        <span className="text-[12px] leading-[1.3] font-[500] font-public-sans text-muted-text">
          {currentLevelName}
        </span>
        <span className="text-[12px] leading-[1.3] font-[500] font-public-sans text-muted-text">
          {nextLevelName}
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-1 bg-border-warm rounded overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Achievement progress: ${progressPercent}%`}
        />
      </div>

      {/* Criteria list */}
      {criteria.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {criteria.map((criterion, index) => (
            <li key={index} className="flex items-center gap-2">
              {criterion.met ? (
                <span className="text-success text-[14px] leading-none" aria-label="Met">
                  ✓
                </span>
              ) : (
                <span className="text-muted-text text-[14px] leading-none" aria-label="Not yet met">
                  –
                </span>
              )}
              <span className="text-[14px] font-public-sans text-primary leading-tight">
                <span className={cn(criterion.met ? 'text-muted-text' : 'text-primary')}>
                  {criterion.current} / {criterion.target}
                </span>{' '}
                <span className="text-muted-text">{criterion.label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
