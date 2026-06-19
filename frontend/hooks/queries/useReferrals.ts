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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any = response.data.data ?? {}
      return {
        balance: Number(raw.balanceInr ?? raw.balance ?? 0),
        credits: (raw.credits ?? []).map((c: any) => ({
          id: c.id,
          amount: Number(c.amountInr ?? c.amount ?? 0),
          type: c.type ?? 'REFERRAL',
          description: c.description ?? c.reason ?? '',
          createdAt: c.createdAt,
          expiresAt: c.expiresAt,
          status: c.status,
        })),
      }
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
