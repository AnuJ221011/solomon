'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Clock,
  Users,
  CreditCard,
  AlertTriangle,
  Package,
  RotateCcw,
  ShoppingCart,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/brands', label: 'Brands', icon: Building2 },
  { href: '/admin/pending-brands', label: 'Pending Brands', icon: Clock },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/payouts', label: 'Payouts', icon: CreditCard },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const adminName = user?.name ?? 'Admin'
  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
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
          Admin Portal
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
            <span className="text-[12px] font-[600] font-public-sans text-white/80">
              {adminInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[600] font-public-sans text-white truncate">
              {adminName}
            </p>
            <p className="text-[11px] font-public-sans text-white/50">Administrator</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
