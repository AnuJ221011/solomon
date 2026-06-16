'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

export interface Review {
  id: string
  orderId: string
  productId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface SubmitReviewInput {
  orderId: string
  productId: string
  rating: number
  comment?: string
}

export interface UpdateReviewInput {
  id: string
  rating?: number
  comment?: string
}

export function useSubmitReview() {
  const queryClient = useQueryClient()
  return useMutation<Review, Error, SubmitReviewInput>({
    mutationFn: (body) => api.post('/reviews', body).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Review submitted')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export function useUpdateReview() {
  return useMutation<Review, Error, UpdateReviewInput>({
    mutationFn: ({ id, ...body }) => api.patch(`/reviews/${id}`, body).then((r) => r.data.data),
    onSuccess: () => toast.success('Review updated'),
    onError: (err) => toast.error(getApiError(err)),
  })
}
