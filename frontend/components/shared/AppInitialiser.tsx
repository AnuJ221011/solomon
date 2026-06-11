'use client'

import { useEffect } from 'react'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'

interface IpapiResponse {
  currency?: string
}

interface FrankfurterResponse {
  rates?: Record<string, number>
}

/**
 * AppInitialiser
 *
 * Runs once on client mount to:
 *  1. Detect the visitor's local currency via ipapi.co (2 s timeout, silent on error).
 *  2. Fetch live FX rates from Frankfurter (base=INR) and store them.
 *
 * Renders nothing — purely a side-effect component placed in <Providers>.
 */
export function AppInitialiser() {
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const setRates = useCurrencyStore((s) => s.setRates)
  const lastFetched = useCurrencyStore((s) => s.lastFetched)

  useEffect(() => {
    let cancelled = false

    async function init() {
      // ── Step 1: geo-detect currency on first-ever visit ───────────────────
      // Skip if user already has a persisted preference (sb_currency in localStorage)
      const hasPersistedCurrency =
        typeof window !== 'undefined' &&
        (() => {
          try {
            const stored = localStorage.getItem('sb_currency')
            if (!stored) return false
            const parsed = JSON.parse(stored)
            return Boolean(parsed?.state?.currency)
          } catch {
            return false
          }
        })()

      if (!hasPersistedCurrency) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2000)

          const res = await fetch('https://ipapi.co/json', {
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (res.ok) {
            const data: IpapiResponse = await res.json()
            if (data.currency && typeof data.currency === 'string') {
              if (!cancelled) setCurrency(data.currency)
            }
          }
        } catch {
          // Network error or timeout — silently ignore, keep default
        }
      }

      if (cancelled) return

      // ── Step 2: fetch FX rates base=INR from Frankfurter (once per session) ─
      const RATES_TTL = 6 * 60 * 60 * 1000
      if (lastFetched && Date.now() - lastFetched < RATES_TTL) return
      try {
        const res = await fetch('https://api.frankfurter.app/latest?base=INR')

        if (res.ok) {
          const data: FrankfurterResponse = await res.json()
          if (data.rates && typeof data.rates === 'object') {
            setRates(data.rates)
          }
        }
      } catch {
        // Network error — silently ignore, app will display INR amounts
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [setCurrency, setRates, lastFetched])

  return null
}
