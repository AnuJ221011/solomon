'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductPhoto {
  id: string
  url: string
  position: number
}

export interface ProductVariant {
  id: string
  name: string
  value: string
  price?: number
  inStock: boolean
}

export interface ProductBrandInfo {
  achievementLevel: number
}

export interface Product {
  id: string
  name: string
  slug: string
  brandId: string
  brandName: string
  brandSlug: string
  shortDescription: string
  description?: string
  photos: ProductPhoto[]
  wholesalePrice: number // INR
  moq: number
  leadTime: string
  weight: number
  category: string
  tags: string[]
  brand: ProductBrandInfo
  variants: ProductVariant[]
  inStock: boolean
  availability: string
}

export interface ProductsParams {
  page?: number
  limit?: number
  category?: string | string[]
  search?: string
  sort?: string
  brandSlug?: string
}

export interface ProductsResult {
  products: Product[]
  total: number
  page: number
  limit: number
}

// ─── Raw API → Product mapper ─────────────────────────────────────────────────

const ACHIEVEMENT_LEVEL: Record<string, number> = {
  L1_SPROUT: 1,
  L2_RISING: 2,
  L3_TRUSTED: 3,
  L4_ELITE: 4,
  L5_LEGEND: 5,
}

const LEAD_TIME_LABEL: Record<string, string> = {
  ONE_TO_THREE_DAYS: '1-3 days',
  ONE_TO_TWO_WEEKS: '1-2 weeks',
  TWO_TO_FOUR_WEEKS: '2-4 weeks',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(raw: Record<string, any>): Product {
  const bp: Record<string, unknown> = raw.brandProfile ?? {}
  const photos: Array<{ id?: string; url: string; position?: number }> = raw.photos ?? []
  const categories: string[] = raw.categories ?? []

  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    brandId: raw.brandProfileId ?? raw.brandId ?? '',
    brandName: (bp.brandName as string) ?? raw.brandName ?? '',
    brandSlug: (bp.slug as string) ?? raw.brandSlug ?? '',
    shortDescription: raw.shortDescription ?? '',
    description: raw.fullDescription ?? raw.description,
    photos: photos.map((ph) => ({
      id: ph.id ?? '',
      url: ph.url,
      position: ph.position ?? 0,
    })),
    wholesalePrice: Number(raw.wholesalePriceInr ?? raw.wholesalePrice ?? 0),
    moq: raw.moq ?? 1,
    leadTime: LEAD_TIME_LABEL[raw.leadTime] ?? raw.leadTime ?? '1-2 weeks',
    weight: raw.weightGrams ?? raw.weight ?? 0,
    category: categories[0] ?? raw.category ?? '',
    tags: raw.tags ?? [],
    brand: {
      achievementLevel: ACHIEVEMENT_LEVEL[(bp.achievementLevel as string)] ?? 1,
    },
    variants: raw.variants ?? [],
    inStock: raw.availability === 'ACTIVE',
    availability: raw.availability ?? '',
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(params?: ProductsParams) {
  return useQuery<ProductsResult>({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await api.get('/products', { params })
      const payload = response.data.data
      const rawProducts: Record<string, unknown>[] = payload.products ?? payload ?? []
      return {
        products: rawProducts.map(mapProduct),
        total: response.data.meta?.total ?? payload.total ?? 0,
        page: response.data.meta?.page ?? payload.page ?? 1,
        limit: response.data.meta?.limit ?? payload.limit ?? 20,
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useProduct(slug: string | null) {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await api.get(`/products/${slug}`)
      return mapProduct(response.data.data)
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  })
}

export function useMyProducts() {
  return useQuery<Product[]>({
    queryKey: ['my-products'],
    queryFn: async () => {
      const response = await api.get('/products/me/listings')
      const payload = response.data.data
      const rawProducts: Record<string, unknown>[] = Array.isArray(payload)
        ? payload
        : (payload.products ?? [])
      return rawProducts.map(mapProduct)
    },
    staleTime: 2 * 60 * 1000,
  })
}
