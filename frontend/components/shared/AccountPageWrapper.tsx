'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { useAuthStore } from '@/lib/store/useAuthStore'

export function AccountPageWrapper({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const router = useRouter()

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) {
      router.replace('/')
      openAuthModal('login')
    }
  }, [hasHydrated, isAuthenticated, router, openAuthModal])

  if (!hasHydrated || !isAuthenticated) return null

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-[1120px] mx-auto w-full px-4 lg:px-8 py-8 lg:py-12">
        {children}
      </main>
      <Footer />
    </div>
  )
}
