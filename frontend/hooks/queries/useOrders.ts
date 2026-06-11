'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'DISPUTED'
  | 'CANCELLED'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  quantity: number
  unitPrice: number
  totalPrice: number
  image?: string
}

export interface Order {
  id: string
  orderNumber: string
  buyerName: string
  status: OrderStatus
  amount: number
  currency: string
  createdAt: string
  dispatchedAt?: string
  trackingNumber?: string
  items?: OrderItem[]
}

export interface OrdersParams {
  status?: OrderStatus | string
  page?: number
  limit?: number
}

export interface OrdersResult {
  orders: Order[]
  total: number
}

export interface UpdateOrderStatusInput {
  id: string
  status: string
  trackingNumber?: string
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated buyer's own orders.
 */
export function useMyOrders(params?: OrdersParams) {
  return useQuery<OrdersResult>({
    queryKey: ['my-orders', params],
    queryFn: async () => {
      const response = await api.get('/orders/my', { params })
      const payload = response.data.data
      return {
        orders: payload.orders ?? payload ?? [],
        total: response.data.meta?.total ?? payload.total ?? 0,
      }
    },
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch orders received by the authenticated brand.
 */
export function useBrandOrders(params?: OrdersParams) {
  return useQuery<OrdersResult>({
    queryKey: ['brand-orders', params],
    queryFn: async () => {
      const response = await api.get('/orders/brand', { params })
      const payload = response.data.data
      return {
        orders: payload.orders ?? payload ?? [],
        total: response.data.meta?.total ?? payload.total ?? 0,
      }
    },
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch a single order by id (includes line items).
 */
export function useOrder(id: string | null) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

/**
 * Mutation: update an order's status (brand only).
 * Invalidates ['brand-orders'] on success.
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, UpdateOrderStatusInput>({
    mutationFn: ({ id, status, trackingNumber }) =>
      api.patch(`/orders/brand/${id}/status`, { status, trackingNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-orders'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
