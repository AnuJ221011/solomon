'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShareLink {
  id: string
  slug: string
  name?: string
  linkType: 'BRAND' | 'PRODUCT' | 'COLLECTION'
  target: string
  targetId?: string
  views: number
  orders: number
  revenue: number
  commissionSaved: number
  active: boolean
  createdAt: string
  expiresAt?: string
  password?: string
  currency?: string
  welcomeMessage?: string
}

export interface CreateShareLinkInput {
  name: string
  target: string
  targetId?: string
  customSlug?: string
  expiresAt?: string
  password?: string
  currency?: string
  welcomeMessage?: string
}

export interface UpdateShareLinkInput extends Partial<CreateShareLinkInput> {
  id: string
  active?: boolean
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch all share links for the authenticated brand.
 */
export function useShareLinks() {
  return useQuery<ShareLink[]>({
    queryKey: ['share-links'],
    queryFn: async () => {
      const response = await api.get('/share-links')
      const payload = response.data.data
      return Array.isArray(payload) ? payload : (payload.shareLinks ?? [])
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Mutation: create a new share link.
 * Invalidates ['share-links'] on success.
 */
export function useCreateShareLink() {
  const queryClient = useQueryClient()

  return useMutation<ShareLink, Error, CreateShareLinkInput>({
    mutationFn: async (body) => {
      const response = await api.post('/share-links', body)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

/**
 * Mutation: update an existing share link.
 * Invalidates ['share-links'] on success.
 */
export function useUpdateShareLink() {
  const queryClient = useQueryClient()

  return useMutation<ShareLink, Error, UpdateShareLinkInput>({
    mutationFn: async ({ id, ...body }) => {
      const response = await api.patch(`/share-links/${id}`, body)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

/**
 * Mutation: delete a share link by id.
 * Invalidates ['share-links'] on success.
 */
export function useDeleteShareLink() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.delete(`/share-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
