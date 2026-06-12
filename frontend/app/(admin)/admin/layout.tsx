'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { cn } from '@/lib/utils'

// ─── Mobile bottom tabs ───────────────────────────────────────────────────────

const MOBILE_TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/pending-brands', label: 'Pending' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/payouts', label: 'Payouts' },
]

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)

  useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/')
    }
  }, [hasHydrated, isAuthenticated, user, router])

  // Wait for store to rehydrate from localStorage before making auth decisions
  if (!hasHydrated) return null
  if (!isAuthenticated || user?.role !== 'ADMIN') return null

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-border-warm bg-surface flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="relative max-w-[280px] w-full hidden sm:block">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search users, brands..."
              className="w-full h-9 pl-9 pr-4 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              aria-label="Notifications"
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded',
                'border border-border-warm text-muted-text',
                'hover:text-primary hover:bg-muted-bg transition-colors relative'
              )}
            >
              <Bell size={16} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            </button>

            <div className="h-6 w-px bg-border-warm" />
            <span className="text-[12px] font-[600] font-public-sans text-muted-text px-2 py-1 rounded border border-border-warm">
              ADMIN
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 max-lg:p-4">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border-warm flex">
        {MOBILE_TABS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-[600] font-public-sans text-muted-text hover:text-primary transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  )
}
