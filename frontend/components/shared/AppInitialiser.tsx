"use client";

import { useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCurrencyStore } from "@/lib/stores/currencyStore";

/**
 * Mounts once at the root. Handles:
 *  1. FX rate load + auto-currency from geo-detect
 *  2. Session restore (validate stored JWT)
 *  3. Cart item count sync for authenticated users
 */
export function AppInitialiser() {
  const { user, accessToken, setAuth, logout } = useAuthStore();
  const { setItemCount } = useCartStore();
  const { currency, setCurrency, setRates } = useCurrencyStore();

  // ── 1. FX rates + geo-detect ──────────────────────────────
  useEffect(() => {
    const loadFx = async () => {
      try {
        const { data } = await api.get("/fx/rates");
        if (data.data?.rates) setRates(data.data.rates);
      } catch {}
    };

    const detectGeo = async () => {
      // Only run if user hasn't manually chosen a currency
      const stored = localStorage.getItem("sb-currency");
      if (stored) return; // user set it manually → don't override
      try {
        const { data } = await api.get("/geo/detect");
        if (data.data?.currency) setCurrency(data.data.currency);
      } catch {}
    };

    loadFx();
    detectGeo();
  }, [setRates, setCurrency]);

  // ── 2. Session restore ────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    const validateSession = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setAuth(data.data, accessToken);
      } catch {
        logout();
      }
    };
    validateSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // ── 3. Cart sync ──────────────────────────────────────────
  useEffect(() => {
    if (!user) { setItemCount(0); return; }
    const syncCart = async () => {
      try {
        const { data } = await api.get("/buyer/cart");
        setItemCount(data.data?.items?.length ?? 0);
      } catch {}
    };
    syncCart();
  }, [user, setItemCount]);

  return null;
}
