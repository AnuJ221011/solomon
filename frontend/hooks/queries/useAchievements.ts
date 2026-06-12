'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AchievementCriterion {
  label: string
  target: number
  current: number
  met: boolean
}

export interface AchievementProgress {
  level: number
  name: string
  criteria: AchievementCriterion[]
  nextLevel?: number
  nextLevelName?: string
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

// Maps a backend criteria object + live stats into the array the UI needs.
// Uses the *next* level's criteria so the bar shows "what to unlock next".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCriteriaList(criteriaObj: Record<string, any>, stats: any): AchievementCriterion[] {
  const items: AchievementCriterion[] = []
  if ('profileComplete' in criteriaObj) {
    items.push({ label: 'Profile complete', target: 1, current: stats.profileComplete ? 1 : 0, met: !!stats.profileComplete })
  }
  if ('minActiveListings' in criteriaObj) {
    const t = criteriaObj.minActiveListings
    items.push({ label: 'Active listings', target: t, current: stats.activeListings ?? 0, met: (stats.activeListings ?? 0) >= t })
  }
  if ('minConfirmedOrders' in criteriaObj) {
    const t = criteriaObj.minConfirmedOrders
    items.push({ label: 'Confirmed orders', target: t, current: stats.confirmedOrders ?? 0, met: (stats.confirmedOrders ?? 0) >= t })
  }
  if ('maxAvgDispatchDays' in criteriaObj) {
    const t = criteriaObj.maxAvgDispatchDays
    const cur = Math.round(stats.avgDispatchDays ?? 0)
    items.push({ label: `Avg dispatch ≤ ${t} days`, target: t, current: cur, met: cur > 0 && cur <= t })
  }
  if ('noDisputes' in criteriaObj || 'unresolvedDisputes' in criteriaObj) {
    const cur = stats.unresolvedDisputes ?? 0
    items.push({ label: 'No unresolved disputes', target: 0, current: cur, met: cur === 0 })
  }
  if ('minAvgRating' in criteriaObj) {
    const t = criteriaObj.minAvgRating
    items.push({ label: 'Average rating', target: t, current: stats.avgRating ?? 0, met: (stats.avgRating ?? 0) >= t })
  }
  if ('minGmvInr' in criteriaObj) {
    const t = criteriaObj.minGmvInr
    items.push({ label: 'Total GMV (₹)', target: t, current: stats.totalGmvInr ?? 0, met: (stats.totalGmvInr ?? 0) >= t })
  }
  if ('minRepeatInternationalBuyers' in criteriaObj) {
    const t = criteriaObj.minRepeatInternationalBuyers
    items.push({ label: 'Repeat intl. buyers', target: t, current: stats.repeatInternationalBuyers ?? 0, met: (stats.repeatInternationalBuyers ?? 0) >= t })
  }
  return items
}

/**
 * Fetch the authenticated brand's achievement progress.
 */
export function useAchievementProgress() {
  return useQuery<AchievementProgress>({
    queryKey: ['achievement-progress'],
    queryFn: async () => {
      const response = await api.get('/achievements/progress')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: any = response.data.data
      const levelNum: number = d.currentLevelConfig?.level ?? 1
      const name: string     = d.currentLevelConfig?.name ?? 'Sprout'
      const stats            = d.stats ?? {}

      // Show criteria for the next level so the bar reflects progress toward unlocking it.
      // If at max level, fall back to current level criteria (all met).
      const targetCriteria   = d.nextLevel?.criteria ?? d.currentLevelConfig?.criteria ?? {}
      const criteria         = buildCriteriaList(targetCriteria, stats)

      return {
        level:         levelNum as AchievementProgress['level'],
        name,
        criteria,
        nextLevelName: d.nextLevel?.name,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
