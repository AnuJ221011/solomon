'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

export interface BuyerProfile {
  id: string
  userId: string
  businessName: string
  countryCode: string
  phone?: string
  addressLine?: string
  city?: string
  state?: string
  postalCode?: string
  preferredCurrency: string
  storeType?: string
  notifNewArrivals: boolean
  notifOrderUpdates: boolean
  notifPromotions: boolean
}

export interface UpdateBuyerProfileInput {
  businessName?: string
  phone?: string
  addressLine?: string
  city?: string
  state?: string
  postalCode?: string
  countryCode?: string
  preferredCurrency?: string
  storeType?: string
  notifNewArrivals?: boolean
  notifOrderUpdates?: boolean
  notifPromotions?: boolean
}

export function useBuyerProfile() {
  return useQuery<BuyerProfile>({
    queryKey: ['buyer-profile'],
    queryFn: async () => {
      const res = await api.get('/buyer/profile')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateBuyerProfile() {
  const queryClient = useQueryClient()

  return useMutation<BuyerProfile, Error, UpdateBuyerProfileInput>({
    mutationFn: async (body) => {
      const res = await api.patch('/buyer/profile', body)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-profile'] })
      toast.success('Profile updated successfully.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
