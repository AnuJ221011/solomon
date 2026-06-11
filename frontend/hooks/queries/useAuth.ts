'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  role: 'BUYER' | 'BRAND' | 'ADMIN'
  name: string
  avatar?: string
  verified: boolean
}

// ─── Token gate ───────────────────────────────────────────────────────────────

/**
 * Returns true when a session token exists in localStorage.
 * Safe to call during SSR (returns false).
 */
function hasToken(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('sb_token')
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the currently authenticated user from /auth/me.
 *
 * The query is only enabled when an access token is present in localStorage,
 * avoiding a guaranteed-to-fail 401 on unauthenticated page loads.
 *
 * NOTE: This hook is a React Query companion to hooks/useAuth.ts (Zustand).
 * Use hooks/useAuth.ts for auth actions (openAuthModal, requireAuth).
 * Use this hook when you need server-authoritative user data or want to
 * benefit from automatic background refetching.
 */
export function useMe() {
  return useQuery<AuthUser>({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/auth/me')
      return response.data.data
    },
    enabled: hasToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
