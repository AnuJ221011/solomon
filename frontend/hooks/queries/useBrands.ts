'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandCollection {
  id: string
  name: string
  slug: string
  productCount: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
  banner?: string
  description: string
  location: string
  yearFounded?: number
  achievementLevel: number
  tagline?: string
  productCount: number
  minimumOrderValue: number
  collections?: BrandCollection[]
}

export interface BrandDashboardStats {
  gmvThisMonth: number
  ordersThisMonth: number
  avgOrderValue: number
  commissionSaved: number
  totalOrders: number
  avgRating: number
}

export interface BrandAchievement {
  level: number
  criteria: Array<{
    label: string
    target: number
    current: number
    met: boolean
  }>
}

export interface BrandDashboard {
  stats: BrandDashboardStats
  recentOrders: unknown[]
  achievement: BrandAchievement
}

export interface BrandsParams {
  page?: number
  limit?: number
  search?: string
}

export interface BrandsResult {
  brands: Brand[]
  total: number
}

// ─── Normalise raw API brand → Brand ─────────────────────────────────────────

const ACHIEVEMENT_MAP: Record<string, 1 | 2 | 3 | 4 | 5> = {
  L1_SPROUT: 1,
  L2_RISING: 2,
  L3_TRUSTED: 3,
  L4_ELITE: 4,
  L5_LEGEND: 5,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseBrand(raw: any): Brand {
  return {
    id: raw.id,
    name: raw.name ?? raw.brandName ?? '',
    slug: raw.slug,
    logo: raw.logo ?? raw.logoUrl ?? undefined,
    banner: raw.banner ?? raw.bannerUrl ?? undefined,
    description: raw.description ?? '',
    location: raw.location ?? raw.countryOfOrigin ?? '',
    yearFounded: raw.yearFounded,
    achievementLevel: ACHIEVEMENT_MAP[raw.achievementLevel] ?? (typeof raw.achievementLevel === 'number' ? raw.achievementLevel : 1),
    tagline: raw.tagline,
    productCount: raw.productCount ?? 0,
    minimumOrderValue: raw.minimumOrderValue ?? 0,
    collections: raw.collections,
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated / filtered brand listings.
 */
export function useBrands(params?: BrandsParams) {
  return useQuery<BrandsResult>({
    queryKey: ['brands', params],
    queryFn: async () => {
      const response = await api.get('/brands', { params })
      const payload = response.data.data
      const rawBrands = payload.brands ?? payload ?? []
      return {
        brands: rawBrands.map(normaliseBrand),
        total: payload.total ?? response.data.meta?.total ?? 0,
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Fetch a single brand by slug (with collections).
 */
export function useBrand(slug: string | null) {
  return useQuery<Brand>({
    queryKey: ['brand', slug],
    queryFn: async () => {
      const response = await api.get(`/brands/${slug}`)
      return normaliseBrand(response.data.data)
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Fetch the authenticated brand's own profile.
 */
export function useMyBrandProfile() {
  return useQuery<Brand>({
    queryKey: ['my-brand-profile'],
    queryFn: async () => {
      const response = await api.get('/brands/me/profile')
      return response.data.data
    },
  })
}

/**
 * Fetch minimum order values for a list of brand slugs in a single request.
 * Returns a map of slug → minimumOrderValue (INR).
 */
export function useBrandMinimums(slugs: string[]): Record<string, number> {
  const key = [...slugs].sort().join(',')
  const { data } = useQuery({
    queryKey: ['brand-minimums', key],
    queryFn: async () => {
      const response = await api.get('/brands', {
        params: { slugs: key, limit: Math.max(slugs.length, 1) },
      })
      const payload = response.data.data
      const rawBrands: Array<{ slug: string; minimumOrderValue?: number }> =
        payload.brands ?? payload ?? []
      return Object.fromEntries(rawBrands.map((b) => [b.slug, b.minimumOrderValue ?? 0]))
    },
    enabled: slugs.length > 0,
    staleTime: 5 * 60 * 1000,
  })
  return data ?? {}
}

/**
 * Fetch the authenticated brand's dashboard stats + recent orders.
 */
export function useMyBrandDashboard() {
  return useQuery<BrandDashboard>({
    queryKey: ['brand-dashboard'],
    queryFn: async () => {
      const response = await api.get('/brands/me/dashboard')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}
