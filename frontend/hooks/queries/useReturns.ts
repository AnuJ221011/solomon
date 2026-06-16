'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

export interface RequestReturnInput {
  orderId: string
  reason: string
  photoUrls?: string[]
}

export interface ReturnRequest {
  id: string
  orderId: string
  reason: string
  status: string
  createdAt: string
}

export function useRequestReturn() {
  const queryClient = useQueryClient()
  return useMutation<ReturnRequest, Error, RequestReturnInput>({
    mutationFn: ({ orderId, ...body }) =>
      api.post(`/returns/order/${orderId}`, body).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      toast.success('Return request submitted. Our team will review it shortly.')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
