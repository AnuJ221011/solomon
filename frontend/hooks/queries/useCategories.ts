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
  parentId?: string | null
  level?: number
  sortOrder?: number
}

export interface CategoryAttribute {
  id: string
  categoryId: string
  name: string
  inputType: 'SELECT' | 'MULTI_SELECT' | 'RANGE' | 'BOOLEAN' | 'TEXT'
  options: string[]
  required: boolean
  sortOrder: number
}

export interface CategoryL3 extends Category {
  attributes: CategoryAttribute[]
}

export interface CategoryL2 extends Category {
  attributes: CategoryAttribute[]
  children: CategoryL3[]
}

export interface CategoryL1 extends Category {
  attributes: CategoryAttribute[]
  children: CategoryL2[]
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Flat list — used in brand product form dropdowns. Long stale time. */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories/flat')
      const payload = res.data.data
      return Array.isArray(payload) ? payload : (payload.categories ?? [])
    },
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Full L1 → L2 → L3 tree with CategoryAttributes at each node.
 * Used by NavBar mega-menu and category sidebar filter panel.
 */
export function useCategoryTree() {
  return useQuery<CategoryL1[]>({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const res = await api.get('/categories/tree')
      const payload = res.data.data
      return Array.isArray(payload) ? payload : []
    },
    staleTime: 15 * 60 * 1000,
  })
}
