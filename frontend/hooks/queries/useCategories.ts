'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
  imageUrl?: string
  productCount?: number
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the flat category list (with product counts).
 * Long stale time — categories rarely change.
 */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories/flat')
      const payload = response.data.data
      return Array.isArray(payload) ? payload : (payload.categories ?? [])
    },
    staleTime: 10 * 60 * 1000,
  })
}
