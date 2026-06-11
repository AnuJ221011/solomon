import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'

const TOKEN_KEY = 'sb_token'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  authModalTab: 'login' | 'signup'
  pendingAction: string | null
}

interface AuthActions {
  setUser: (user: User) => void
  logout: () => void
  openAuthModal: (tab?: 'login' | 'signup', pendingAction?: string) => void
  closeAuthModal: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ─── State ────────────────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      authModalTab: 'login',
      pendingAction: null,

      // ─── Actions ──────────────────────────────────────────────────────────
      setUser: (user: User) =>
        set({
          user,
          isAuthenticated: true,
          isAuthModalOpen: false,
          pendingAction: null,
        }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY)
        }
        set({
          user: null,
          isAuthenticated: false,
          isAuthModalOpen: false,
          pendingAction: null,
        })
      },

      openAuthModal: (tab: 'login' | 'signup' = 'login', pendingAction?: string) =>
        set({
          isAuthModalOpen: true,
          authModalTab: tab,
          pendingAction: pendingAction ?? null,
        }),

      closeAuthModal: () =>
        set({
          isAuthModalOpen: false,
          pendingAction: null,
        }),
    }),
    {
      name: 'sb_auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as never)
      ),
      // Only persist the user field; modal/UI state is ephemeral
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
