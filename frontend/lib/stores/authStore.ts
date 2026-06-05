import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "BUYER" | "BRAND" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatarUrl: string | null;
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isBuyer: () => boolean;
  isBrand: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => {
        set({ user: null, accessToken: null });
        // Cookie cleared server-side via /auth/logout endpoint
      },

      isAuthenticated: () => !!get().user && !!get().accessToken,
      isBuyer: () => get().user?.role === "BUYER",
      isBrand: () => get().user?.role === "BRAND",
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    {
      name: "sb-auth",
      // Only persist the user object; access token is regenerated from cookie
      partialize: (state) => ({ user: state.user }),
    }
  )
);
