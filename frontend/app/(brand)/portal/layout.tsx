import { Bell, Search } from 'lucide-react'
import { PortalSidebar } from '@/components/brand-portal/PortalSidebar'
import Link from 'next/link'

// ─── Mobile bottom tab items ──────────────────────────────────────────────────

const MOBILE_TABS = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/orders', label: 'Orders' },
  { href: '/portal/products', label: 'Products' },
  { href: '/portal/share-links', label: 'Links' },
  { href: '/portal/settings', label: 'Settings' },
]

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function BrandPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <PortalSidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-border-warm bg-surface flex items-center justify-between px-6 sticky top-0 z-20">
          {/* Search */}
          <div className="relative max-w-[280px] w-full hidden sm:block">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search orders, products..."
              className="w-full h-9 pl-9 pr-4 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <button
              type="button"
              aria-label="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded border border-border-warm text-muted-text hover:text-primary hover:bg-muted-bg transition-colors relative"
            >
              <Bell size={16} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            </button>

            {/* Currency switcher */}
            <button
              type="button"
              className="h-9 px-3 rounded border border-border-warm text-[12px] font-[600] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
            >
              INR ₹
            </button>

            {/* Avatar */}
            <div
              className="w-10 h-10 rounded bg-muted-bg flex items-center justify-center shrink-0 cursor-pointer border border-border-warm"
              aria-label="User menu"
            >
              <span className="text-[13px] font-[700] font-public-sans text-primary">AR</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 max-lg:p-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border-warm flex">
        {MOBILE_TABS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-[600] font-public-sans text-muted-text hover:text-primary transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
