'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Link2,
  CreditCard,
  BarChart2,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'

// â”€â”€â”€ Nav items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const NAV_ITEMS = [
  { href: '/portal', label: 'Overview', icon: LayoutDashboard },
  { href: '/portal/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/portal/products', label: 'Products', icon: Package },
  { href: '/portal/share-links', label: 'Share Links', icon: Link2 },
  { href: '/portal/payouts', label: 'Payouts', icon: CreditCard },
  { href: '/portal/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/portal/settings', label: 'Settings', icon: Settings },
]

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function PortalSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const brandName = user?.name ?? 'Brand'
  const brandInitials = brandName.split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  const isActive = (href: string) => {
    if (href === '/portal') return pathname === '/portal'
    return pathname.startsWith(href)
  }

  return (
    <aside className="h-screen w-[280px] bg-primary flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="block">
          <span className="font-playfair text-[20px] text-white font-[600] tracking-[-0.01em]">
            Solomon Bharat
          </span>
        </Link>
        <span className="block text-[11px] font-public-sans text-white/40 mt-0.5 tracking-[0.08em] uppercase">
          Brand Portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-3 rounded',
                    'text-[14px] font-[600] font-public-sans',
                    'transition-colors',
                    active
                      ? 'text-accent border-l-[3px] border-accent bg-white/[8%] -ml-[3px] pl-[calc(1rem-3px)]'
                      : 'text-white/70 hover:text-white hover:bg-white/[5%]'
                  )}
                >
                  <Icon size={16} aria-hidden="true" className="shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Profile section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-[12px] font-[600] font-public-sans text-white/80">{brandInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[600] font-public-sans text-white truncate">{brandName}</p>
            <p className="text-[11px] font-public-sans text-white/50">Brand Portal</p>
          </div>
          <Link href="/portal/settings" className="text-white/40 hover:text-white/70 transition-colors">
            <Settings size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
