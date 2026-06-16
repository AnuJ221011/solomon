'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

export interface ConversationPartner {
  id: string
  name: string
  role: string
  avatarUrl?: string
  brandProfile?: { brandName: string; slug: string }
}

export interface Conversation {
  partnerId: string
  lastMessage: string
  lastAt: string
  unreadCount: number
  partner: ConversationPartner
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
  isRead: boolean
}

export interface SendMessageInput {
  recipientId: string
  content: string
  orderId?: string
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/messages/conversations')
      return res.data.data ?? []
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useMessages(partnerId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', partnerId],
    queryFn: async () => {
      const res = await api.get(`/messages/${partnerId}`)
      return res.data.data?.messages ?? res.data.data ?? []
    },
    enabled: !!partnerId,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation<Message, Error, SendMessageInput>({
    mutationFn: (body) => api.post('/messages', body).then((r) => r.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.recipientId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}
