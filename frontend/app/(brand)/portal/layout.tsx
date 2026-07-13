'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Bell, Search, Clock } from 'lucide-react'
import { PortalSidebar } from '@/components/brand-portal/PortalSidebar'
import { CompleteProfileFlow, type MissingItem } from '@/components/brand-portal/CompleteProfileFlow'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Mobile bottom tab items ──────────────────────────────────────────────────

const MOBILE_TABS = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/orders', label: 'Orders' },
  { href: '/portal/products', label: 'Products' },
  { href: '/portal/messages', label: 'Messages' },
  { href: '/portal/settings', label: 'Settings' },
]

// ─── Complete-your-profile prompt ───────────────────────────────────────────
// Onboarding now only collects the essentials — brand story, identity docs,
// and payout bank details are filled in later from the portal instead. This
// checks what's still missing and nudges the brand to finish it, once per
// session so it doesn't nag on every page.

const PROFILE_PROMPT_DISMISSED_KEY = 'sb_profile_prompt_dismissed'

function useProfileCompleteness(enabled: boolean) {
  const { data: brandProfile } = useQuery({
    queryKey: ['my-brand-profile'],
    queryFn: () => api.get('/brands/me/profile').then((r) => r.data.data),
    enabled,
  })
  const { data: bankAccount } = useQuery({
    queryKey: ['bank-account'],
    queryFn: () => api.get('/brands/me/bank-account').then((r) => r.data.data ?? null).catch(() => null),
    enabled,
  })

  if (!brandProfile) return { ready: false, missing: [] as MissingItem[], status: null as string | null }

  const missing: MissingItem[] = []
  if (!brandProfile.brandStory?.trim()) missing.push({ key: 'brandStory', label: 'Brand story' })
  if (!brandProfile.aadharUrl || !brandProfile.panUrl) missing.push({ key: 'identityDocs', label: 'Identity documents' })
  if (!bankAccount?.accountNumber) missing.push({ key: 'bankDetails', label: 'Payout bank details' })

  return { ready: true, missing, status: brandProfile.status as string }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function BrandPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const notificationCount = useAuthStore((s) => s.notificationCount)

  const brandName = user?.name ?? ''
  const brandInitials = brandName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated || user?.role !== 'BRAND') {
      router.replace('/')
    }
  }, [hasHydrated, isAuthenticated, user, router])

  const { ready, missing, status } = useProfileCompleteness(hasHydrated && isAuthenticated && user?.role === 'BRAND')
  const isPending = ready && status !== 'APPROVED'
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    if (!ready || missing.length === 0) return
    if (sessionStorage.getItem(PROFILE_PROMPT_DISMISSED_KEY)) return
    setShowProfileModal(true)
  }, [ready, missing])

  function dismissProfileModal() {
    sessionStorage.setItem(PROFILE_PROMPT_DISMISSED_KEY, '1')
    setShowProfileModal(false)
  }

  function openProfileModal() {
    setShowProfileModal(true)
  }

  if (!hasHydrated) return null
  if (!isAuthenticated || user?.role !== 'BRAND') return null

  return (
    <div className="flex min-h-screen bg-[#F9F7F2]">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <PortalSidebar locked={isPending} onLockedClick={openProfileModal} />
      </div>

      {/* Main area */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-[#E5E1D8] bg-white flex items-center justify-between px-6 sticky top-0 z-20">
          {/* Search */}
          <div className="relative max-w-[280px] w-full hidden sm:block">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search orders, products..."
              className="w-full h-9 pl-9 pr-4 rounded-md border border-[#E5E1D8] bg-[#F9F7F2] text-[13.5px] font-public-sans text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#A68B67] transition-colors"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Notification bell — dot shown only when there are unread notifications */}
            <button
              type="button"
              aria-label="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded-md border border-[#E5E1D8] text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors relative"
            >
              <Bell size={15} aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#A68B67]" aria-hidden="true" />
              )}
            </button>

            <div className="h-5 w-px bg-[#E5E1D8]" />

            {/* Avatar with real initials */}
            <div
              className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E5E1D8] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="User menu"
            >
              <span className="text-[11px] font-[700] font-public-sans text-[#A68B67]">
                {brandInitials}
              </span>
            </div>
          </div>
        </header>

        {isPending && (
          <div className="flex items-center gap-2.5 px-6 py-2.5 bg-[#FFF4E6] border-b border-[#FFD8A8]">
            <Clock size={14} className="text-[#B25E00] shrink-0" aria-hidden="true" />
            <p className="text-[13px] font-public-sans text-[#8A4B00]">
              {status === 'REJECTED'
                ? "Your brand application wasn't approved. Contact support for more information."
                : status === 'SUSPENDED'
                ? 'Your brand account has been suspended. Contact support for more information.'
                : 'Complete your profile to increase your chances of getting verified soon.'}
            </p>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-8 max-lg:p-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E5E1D8] flex">
        {MOBILE_TABS.map(({ href, label }) =>
          isPending ? (
            <button
              key={href}
              type="button"
              onClick={openProfileModal}
              title="Complete your profile to unlock this"
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-[600] font-public-sans text-[#9CA3AF]/50 cursor-not-allowed"
            >
              {label}
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-[600] font-public-sans text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
            >
              {label}
            </Link>
          )
        )}
      </nav>

      {showProfileModal && (
        <CompleteProfileFlow missing={missing} onDismiss={dismissProfileModal} />
      )}
    </div>
  )
}
