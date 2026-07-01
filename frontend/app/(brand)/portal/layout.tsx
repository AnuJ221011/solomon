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
    <div className="flex min-h-screen bg-[#F9F7F2]">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <PortalSidebar />
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
            {/* Notification bell */}
            <button
              type="button"
              aria-label="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded-md border border-[#E5E1D8] text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors relative"
            >
              <Bell size={15} aria-hidden="true" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#A68B67]" aria-hidden="true" />
            </button>

            {/* Currency switcher */}
            <button
              type="button"
              className="h-9 px-3 rounded-md border border-[#E5E1D8] text-[12px] font-[600] font-public-sans text-[#444748] hover:text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors"
            >
              INR ₹
            </button>

            <div className="h-5 w-px bg-[#E5E1D8]" />

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E5E1D8] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="User menu"
            >
              <span className="text-[11px] font-[700] font-public-sans text-[#A68B67]">AR</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 max-lg:p-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E5E1D8] flex">
        {MOBILE_TABS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-[600] font-public-sans text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
