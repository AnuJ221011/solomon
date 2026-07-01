'use client'

import React from 'react'
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

// ─── Nav groups ────────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/portal', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Store',
    items: [
      { href: '/portal/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/portal/products', label: 'Products', icon: Package },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/portal/share-links', label: 'Share Links', icon: Link2 },
      { href: '/portal/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/portal/payouts', label: 'Payouts', icon: CreditCard },
      { href: '/portal/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const brandName = user?.name ?? 'Brand'
  const brandInitials = brandName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="h-screen w-[260px] bg-white border-r border-[#E5E1D8] flex flex-col fixed left-0 top-0 z-30">

      {/* Logo */}
      <div className="px-6 h-16 flex items-center border-b border-[#E5E1D8] shrink-0">
        <Link href="/" className="block">
          <span className="font-playfair text-[18px] text-[#1A1A1A] font-[600] tracking-[-0.01em]">
            Solomon Bharat
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-1 text-[10px] font-[700] font-public-sans text-[#A68B67] tracking-[0.1em] uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md',
                        'text-[13.5px] font-public-sans transition-colors',
                        active
                          ? 'bg-[#F5F0E8] text-[#1A1A1A] font-[600]'
                          : 'text-[#444748] font-[400] hover:bg-[#F9F7F2] hover:text-[#1A1A1A]'
                      )}
                    >
                      <Icon
                        size={15}
                        aria-hidden="true"
                        className={cn('shrink-0', active ? 'text-[#A68B67]' : 'text-[#9CA3AF]')}
                      />
                      {label}
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#A68B67]" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Brand profile section */}
      <div className="px-4 py-4 border-t border-[#E5E1D8] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E5E1D8] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-[700] font-public-sans text-[#A68B67]">
              {brandInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[600] font-public-sans text-[#1A1A1A] truncate leading-tight">
              {brandName}
            </p>
            <p className="text-[11px] font-public-sans text-[#9CA3AF] leading-tight">Brand Portal</p>
          </div>
          <Link
            href="/portal/settings"
            aria-label="Settings"
            className="text-[#C4BDB4] hover:text-[#444748] transition-colors p-1"
          >
            <Settings size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
