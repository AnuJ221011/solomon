'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShareLinkTarget = 'PRODUCT' | 'COLLECTION' | 'STOREFRONT'

export interface ShareLink {
  id: string
  slug: string
  token: string
  name?: string
  target: ShareLinkTarget
  productId?: string | null
  collectionId?: string | null
  views: number
  orders: number
  revenue: number
  commissionSaved: number
  active: boolean
  createdAt: string
  expiresAt?: string
  lockedCurrency?: string
  customMessage?: string
}

export interface CreateShareLinkInput {
  name?: string
  target: ShareLinkTarget
  productId?: string
  collectionId?: string
  slug?: string
  expiresAt?: string
  password?: string
  lockedCurrency?: string
  customMessage?: string
}

export interface UpdateShareLinkInput {
  id: string
  active?: boolean
  name?: string
  password?: string
  lockedCurrency?: string
  customMessage?: string
  expiresAt?: string
}

// ─── Raw API → ShareLink ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapShareLink(raw: any): ShareLink {
  return {
    id: raw.id,
    slug: raw.slug ?? raw.token,
    token: raw.token,
    name: raw.name ?? undefined,
    target: raw.target,
    productId: raw.productId ?? null,
    collectionId: raw.collectionId ?? null,
    views: raw.viewCount ?? 0,
    orders: raw.orderCount ?? 0,
    revenue: Number(raw.revenueInr ?? 0),
    commissionSaved: Number(raw.commissionSavedInr ?? 0),
    active: raw.isActive ?? false,
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt ?? undefined,
    lockedCurrency: raw.lockedCurrency ?? undefined,
    customMessage: raw.customMessage ?? undefined,
  }
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
      const rows = Array.isArray(payload) ? payload : (payload.shareLinks ?? [])
      return rows.map(mapShareLink)
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
      return mapShareLink(response.data.data)
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
    mutationFn: async ({ id, active, ...rest }) => {
      const body = { ...rest, ...(active !== undefined && { isActive: active }) }
      const response = await api.patch(`/share-links/${id}`, body)
      return mapShareLink(response.data.data)
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
