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

/**
 * Fetch the authenticated brand's achievement progress.
 */
export function useAchievementProgress() {
  return useQuery<AchievementProgress>({
    queryKey: ['achievement-progress'],
    queryFn: async () => {
      const response = await api.get('/achievements/progress')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
