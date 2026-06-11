import type { Metadata } from 'next'
import { DashboardSidebar } from '@/components/buyer-dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/buyer-dashboard/DashboardTopBar'
import { MobileTabBar } from '@/components/buyer-dashboard/MobileTabBar'

export const metadata: Metadata = {
  title: 'Buyer Dashboard — Solomon Bharat',
  description: 'Discover Indian artisan brands, manage orders, and track your wholesale business.',
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        {/* Top bar */}
        <DashboardTopBar />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden">
        <MobileTabBar />
      </div>
    </div>
  )
}
