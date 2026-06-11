'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReferralEntry {
  id: string
  referredEmail?: string
  status: 'PENDING' | 'CONVERTED'
  createdAt: string
}

export interface ReferralLink {
  referralLink: string
  totalReferrals: number
  pendingCount: number
  referrals: ReferralEntry[]
}

export type WalletCreditType = 'REFERRAL' | 'BONUS' | 'REFUND' | 'ADJUSTMENT'
export type WalletCreditStatus = 'ACTIVE' | 'USED' | 'EXPIRED'

export interface WalletCredit {
  id: string
  amount: number
  type: WalletCreditType
  description: string
  createdAt: string
  expiresAt?: string
  status: WalletCreditStatus
}

export interface Wallet {
  balance: number
  credits: WalletCredit[]
}

export interface LeaderboardEntry {
  rank: number
  name: string
  count: number
  isCurrentUser: boolean
}

export interface Leaderboard {
  rank: number
  total: number
  leaderboard: LeaderboardEntry[]
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated buyer's referral link + stats.
 */
export function useReferralLink() {
  return useQuery<ReferralLink>({
    queryKey: ['referral-link'],
    queryFn: async () => {
      const response = await api.get('/referrals/link')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch the authenticated buyer's referral wallet balance and credits.
 */
export function useWallet() {
  return useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/referrals/wallet')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch the referral leaderboard for the authenticated buyer.
 */
export function useLeaderboard() {
  return useQuery<Leaderboard>({
    queryKey: ['referral-leaderboard'],
    queryFn: async () => {
      const response = await api.get('/referrals/leaderboard')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
