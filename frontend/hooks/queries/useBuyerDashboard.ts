'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuyerStats {
  totalOrders: number
  totalSpend: number
  savedBrands: number
  walletBalance: number
}

export interface SavedProduct {
  id: string
  name: string
  slug: string
  wholesalePrice: number
  moq: number
  image?: string
  brandName: string
  brandSlug: string
  inStock: boolean
}

export interface SavedBrand {
  id: string
  name: string
  slug: string
  logo?: string
  location: string
  achievementLevel: number
}

export interface BuyerDashboard {
  recentOrders: unknown[]
  savedProducts: SavedProduct[]
  savedBrands: SavedBrand[]
  stats: BuyerStats
}

export interface Saved {
  products: SavedProduct[]
  brands: SavedBrand[]
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated buyer's full dashboard.
 */
export function useBuyerDashboard() {
  return useQuery<BuyerDashboard>({
    queryKey: ['buyer-dashboard'],
    queryFn: async () => {
      const response = await api.get('/buyer/dashboard')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch the authenticated buyer's saved products and brands.
 */
export function useSaved() {
  return useQuery<Saved>({
    queryKey: ['saved'],
    queryFn: async () => {
      const response = await api.get('/buyer/saved')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

/**
 * Mutation: save a product to the buyer's wishlist.
 * Invalidates ['saved', 'buyer-dashboard'] on success.
 */
export function useSaveProduct() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: (productId) => api.post(`/buyer/saved/product/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] })
      queryClient.invalidateQueries({ queryKey: ['buyer-dashboard'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

/**
 * Mutation: remove a product from the buyer's wishlist.
 * Invalidates ['saved', 'buyer-dashboard'] on success.
 */
export function useUnsaveProduct() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: (productId) => api.delete(`/buyer/saved/product/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] })
      queryClient.invalidateQueries({ queryKey: ['buyer-dashboard'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

/**
 * Mutation: save a brand to the buyer's followed brands.
 * Invalidates ['saved', 'buyer-dashboard'] on success.
 */
export function useSaveBrand() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: (brandProfileId) => api.post(`/buyer/saved/brand/${brandProfileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] })
      queryClient.invalidateQueries({ queryKey: ['buyer-dashboard'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

/**
 * Mutation: remove a brand from the buyer's followed brands.
 * Invalidates ['saved', 'buyer-dashboard'] on success.
 */
export function useUnsaveBrand() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: (brandProfileId) => api.delete(`/buyer/saved/brand/${brandProfileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] })
      queryClient.invalidateQueries({ queryKey: ['buyer-dashboard'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
