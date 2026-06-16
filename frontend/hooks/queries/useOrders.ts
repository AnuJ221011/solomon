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

// ─── Normalizers ──────────────────────────────────────────────────────────────
// The Prisma Order model uses totalInr / unitPriceInr and nests buyer info.
// These functions map raw API responses to the stable Order / OrderItem interfaces.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeItem(raw: any): OrderItem {
  return {
    id: raw.id,
    productId: raw.productId,
    productName: raw.product?.name ?? raw.productName ?? '',
    productSlug: raw.product?.slug ?? raw.productSlug ?? '',
    quantity: raw.quantity,
    unitPrice: raw.unitPriceInr ?? raw.unitPrice ?? 0,
    totalPrice: raw.totalInr ?? raw.totalPrice ?? raw.quantity * (raw.unitPriceInr ?? raw.unitPrice ?? 0),
    image: raw.product?.imageUrl ?? raw.imageUrl ?? raw.image ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeOrder(raw: any): Order {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    buyerName:
      raw.buyer?.buyerProfile?.businessName ??
      raw.buyer?.name ??
      raw.buyerName ??
      '',
    status: raw.status,
    amount: raw.totalInr ?? raw.amount ?? 0,
    currency: raw.buyerCurrency ?? raw.currency ?? 'INR',
    createdAt: raw.createdAt,
    dispatchedAt: raw.dispatchedAt ?? undefined,
    trackingNumber: raw.trackingNumber ?? undefined,
    items: raw.items ? raw.items.map(normalizeItem) : undefined,
  }
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
      const rawOrders: unknown[] = payload.orders ?? payload ?? []
      return {
        orders: rawOrders.map(normalizeOrder),
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
      const rawOrders: unknown[] = payload.orders ?? payload ?? []
      return {
        orders: rawOrders.map(normalizeOrder),
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
      return normalizeOrder(response.data.data)
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
