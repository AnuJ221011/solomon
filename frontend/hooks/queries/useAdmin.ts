'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalBrands: number
  pendingApprovals: number
  totalBuyers: number
  totalOrders: number
  totalGMV: number
  openDisputes: number
  pendingPayouts: number
  pendingPayoutsValue: number
}

export interface PendingBrand {
  id: string
  name: string
  email: string
  category: string
  city: string
  state: string
  instagramUrl?: string
  websiteUrl?: string
  skuCount: number
  appliedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface AdminPayout {
  id: string
  orderId: string
  orderNumber: string
  brandId: string
  brandName: string
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  netAmount: number
  status: 'PENDING' | 'PROCESSING' | 'PAID'
  isShareLink: boolean
  createdAt: string
  paidAt?: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'BUYER' | 'BRAND' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED'
  createdAt: string
  ordersCount?: number
}

export interface AdminDispute {
  id: string
  orderId: string
  orderNumber: string
  buyerName: string
  brandName: string
  amount: number
  reason: string
  status: 'OPEN' | 'RESOLVED' | 'CLOSED'
  createdAt: string
}

export interface AdminPayoutsParams {
  page?: number
  limit?: number
  isPaid?: boolean
  brandId?: string
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats')
      return res.data.data
    },
    staleTime: 60 * 1000,
  })
}

// ─── Brands ───────────────────────────────────────────────────────────────────

export function useAdminPendingBrands() {
  return useQuery<PendingBrand[]>({
    queryKey: ['admin-pending-brands'],
    queryFn: async () => {
      const res = await api.get('/admin/brands/pending')
      const payload = res.data.data
      return Array.isArray(payload) ? payload : (payload.brands ?? [])
    },
  })
}

export function useApproveBrand() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/brands/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-brands'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Brand approved.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useRejectBrand() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => api.post(`/admin/brands/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-brands'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Brand rejected.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export function useAdminPayouts(params?: AdminPayoutsParams) {
  return useQuery<{ payouts: AdminPayout[]; total: number }>({
    queryKey: ['admin-payouts', params],
    queryFn: async () => {
      const res = await api.get('/admin/payouts', { params })
      const payload = res.data.data
      return {
        payouts: payload.payouts ?? payload ?? [],
        total: res.data.meta?.total ?? payload.total ?? 0,
      }
    },
  })
}

export function useMarkPayoutPaid() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; paypalBatchId?: string }>({
    mutationFn: ({ id, paypalBatchId }) =>
      api.post(`/admin/payouts/${id}/mark-paid`, paypalBatchId ? { paypalBatchId } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Payout marked as paid.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useBulkMarkPayoutsPaid() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { payoutIds: string[]; paypalBatchId?: string }>({
    mutationFn: (body) => api.post('/admin/payouts/bulk-paid', body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-payouts'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success(`${vars.payoutIds.length} payouts marked as paid.`)
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: { page?: number; search?: string; role?: string }) {
  return useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users', params],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params })
      const payload = res.data.data
      return {
        users: payload.users ?? payload ?? [],
        total: res.data.meta?.total ?? payload.total ?? 0,
      }
    },
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/users/${id}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User suspended.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useReactivateUser() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/users/${id}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User reactivated.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

export function useAdminDisputes(params?: { page?: number; status?: string }) {
  return useQuery<{ disputes: AdminDispute[]; total: number }>({
    queryKey: ['admin-disputes', params],
    queryFn: async () => {
      const res = await api.get('/admin/disputes', { params })
      const payload = res.data.data
      return {
        disputes: payload.disputes ?? payload ?? [],
        total: res.data.meta?.total ?? payload.total ?? 0,
      }
    },
  })
}
