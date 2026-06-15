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

export interface ApprovedBrand {
  id: string
  brandName: string
  slug: string
  email: string
  category: string[]
  achievementLevel: string
  approvedAt: string
  productCount: number
  avgRating: number
  logoUrl?: string
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
  ordersCount: number
  gmvInr: number
  brandSlug?: string | null
  brandProfileId?: string | null
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
  dateFrom?: string
  dateTo?: string
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
      const raw: any[] = Array.isArray(payload) ? payload : (payload.brands ?? [])
      return raw.map((b) => ({
        id: b.id,
        name: b.brandName,
        email: b.user?.email ?? '',
        category: Array.isArray(b.category) ? b.category.join(', ') : (b.category ?? ''),
        city: b.city ?? '',
        state: b.state ?? '',
        instagramUrl: b.instagramUrl,
        websiteUrl: b.websiteUrl,
        skuCount: b.skuCount ?? 0,
        appliedAt: b.createdAt,
        status: b.status,
      }))
    },
  })
}

export function useAdminBrand(id: string | null) {
  return useQuery({
    queryKey: ['admin-brand', id],
    queryFn: async () => {
      const res = await api.get(`/admin/brands/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useOverrideAchievementLevel() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; level: string }>({
    mutationFn: ({ id, level }) => api.post(`/admin/brands/${id}/level`, { level }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-brand', vars.id] })
      qc.invalidateQueries({ queryKey: ['admin-approved-brands'] })
      toast.success('Achievement level updated.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useAdminApprovedBrands() {
  return useQuery<ApprovedBrand[]>({
    queryKey: ['admin-approved-brands'],
    queryFn: async () => {
      const res = await api.get('/admin/brands/approved')
      const payload = res.data.data
      return (Array.isArray(payload) ? payload : []).map((b: any) => ({
        id: b.id,
        brandName: b.brandName,
        slug: b.slug,
        email: b.user?.email ?? '',
        category: b.category ?? [],
        achievementLevel: b.achievementLevel ?? 'L1_SPROUT',
        approvedAt: b.approvedAt,
        productCount: b._count?.products ?? 0,
        avgRating: b.avgRating ?? 0,
        logoUrl: b.logoUrl,
      }))
    },
  })
}

export function useApproveBrand() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/brands/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-brands'] })
      qc.invalidateQueries({ queryKey: ['admin-approved-brands'] })
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

export function useAdminUsers(params?: { page?: number; search?: string; role?: string; status?: string }) {
  return useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users', params],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params })
      const payload = res.data.data
      return {
        users: payload.users ?? payload ?? [],
        total: payload.total ?? res.data.meta?.total ?? 0,
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

export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/disputes/${id}/resolve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Dispute resolved.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useCloseDispute() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/disputes/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Dispute closed.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface AdminProduct {
  id: string
  name: string
  brandName: string
  brandSlug: string
  availability: 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'
  photoUrl: string | null
  wholesalePriceInr: number
  moq: number
  totalStock: number
  variantCount: number
  activeVariants: number
  outOfStock: boolean
  orderCount: number
  viewCount: number
  categories: string[]
  createdAt: string
}

export function useAdminProducts(params?: { page?: number; search?: string; brandId?: string; availability?: string }) {
  return useQuery<{ products: AdminProduct[]; total: number }>({
    queryKey: ['admin-products', params],
    queryFn: async () => {
      const res = await api.get('/admin/products', { params })
      const payload = res.data.data
      return {
        products: payload.products ?? payload ?? [],
        total: payload.total ?? 0,
      }
    },
  })
}

// ─── Returns ──────────────────────────────────────────────────────────────────

export interface AdminReturn {
  id: string
  orderId: string
  orderNumber: string
  buyerName: string
  brandName: string
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'LABEL_ISSUED' | 'RECEIVED' | 'REFUNDED'
  photoUrls: string[]
  adminNotes: string | null
  returnLabelUrl: string | null
  resolvedAt: string | null
  createdAt: string
}

export function useAdminReturns(params?: { page?: number; status?: string }) {
  return useQuery<{ returns: AdminReturn[]; total: number }>({
    queryKey: ['admin-returns', params],
    queryFn: async () => {
      const res = await api.get('/admin/returns', { params })
      const payload = res.data.data
      return {
        returns: payload.returns ?? payload ?? [],
        total: payload.total ?? 0,
      }
    },
  })
}

export function useApproveReturn() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/returns/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-returns'] }); toast.success('Return approved.') },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useRejectReturn() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; adminNotes?: string }>({
    mutationFn: ({ id, adminNotes }) => api.post(`/admin/returns/${id}/reject`, { adminNotes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-returns'] }); toast.success('Return rejected.') },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useRefundReturn() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => api.post(`/admin/returns/${id}/refund`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-returns'] }); toast.success('Return marked as refunded.') },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useIssueReturnLabel() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; returnLabelUrl?: string }>({
    mutationFn: ({ id, returnLabelUrl }) => api.post(`/admin/returns/${id}/issue-label`, returnLabelUrl ? { returnLabelUrl } : {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-returns'] }); toast.success('Return label issued.') },
    onError: (err) => toast.error(getApiError(err)),
  })
}

// ─── Orders (platform-wide) ───────────────────────────────────────────────────

export interface AdminOrder {
  id: string
  orderNumber: string
  buyerName: string
  buyerEmail: string
  brandName: string
  brandSlug: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'DISPUTED' | 'RETURN_REQUESTED'
  totalInr: number
  itemCount: number
  notes: string | null
  disputeReason: string | null
  createdAt: string
  deliveredAt: string | null
}

export function useAdminOrders(params?: {
  page?: number
  search?: string
  status?: string
  brandId?: string
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery<{ orders: AdminOrder[]; total: number; totalPages: number }>({
    queryKey: ['admin-orders', params],
    queryFn: async () => {
      const res = await api.get('/admin/orders', { params })
      const payload = res.data.data
      return {
        orders: payload.orders ?? [],
        total: payload.total ?? 0,
        totalPages: payload.totalPages ?? 1,
      }
    },
  })
}

// ─── Digest ───────────────────────────────────────────────────────────────────

export function useSendDigest() {
  return useMutation<{ sent: number }, Error, void>({
    mutationFn: async () => {
      const res = await api.post('/admin/digest/send')
      return res.data.data
    },
    onSuccess: (data) => toast.success(`Digest sent to ${data.sent} buyers.`),
    onError: (err) => toast.error(getApiError(err)),
  })
}

// ─── Revenue over time ────────────────────────────────────────────────────────

export interface RevenueBucket { date: string; revenue: number }

export function useAdminRevenueStats(days: number = 30) {
  return useQuery<RevenueBucket[]>({
    queryKey: ['admin-revenue', days],
    queryFn: async () => {
      const res = await api.get('/admin/stats/revenue', { params: { days } })
      return res.data.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Low stock ────────────────────────────────────────────────────────────────

export interface LowStockVariant {
  variantId: string
  sku: string
  stock: number
  productId: string
  productName: string
  brandName: string
  brandSlug: string
  photoUrl: string | null
  attributes: string
}

export function useAdminLowStock(threshold: number = 10) {
  return useQuery<LowStockVariant[]>({
    queryKey: ['admin-low-stock', threshold],
    queryFn: async () => {
      const res = await api.get('/admin/inventory/low-stock', { params: { threshold } })
      return res.data.data ?? []
    },
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Category GMV ─────────────────────────────────────────────────────────────

export interface CategoryGmv { category: string; gmvInr: number; unitsSold: number }

export function useAdminCategoryStats() {
  return useQuery<CategoryGmv[]>({
    queryKey: ['admin-category-gmv'],
    queryFn: async () => {
      const res = await api.get('/admin/stats/categories')
      return res.data.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
