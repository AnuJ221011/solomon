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
  MessageCircle,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useConversations } from '@/hooks/queries/useMessages'

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
      { href: '/portal/messages', label: 'Messages', icon: MessageCircle },
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

export function PortalSidebar({ locked = false, onLockedClick }: {
  locked?: boolean
  onLockedClick?: () => void
} = {}) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
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

  const { data: conversations = [] } = useConversations()
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <aside className="h-screen w-[260px] bg-white border-r border-border-warm flex flex-col fixed left-0 top-0 z-30">

      {/* Logo */}
      <div className="px-6 h-16 flex items-center border-b border-border-warm shrink-0">
        <Link href="/" className="block">
          <span className="font-playfair text-[18px] text-primary font-[600] tracking-[-0.01em]">
            Solomon Bharat
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-1 text-[10px] font-[700] font-public-sans text-accent tracking-[0.1em] uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                const itemClassName = cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md w-full text-left',
                  'text-[13.5px] font-public-sans transition-colors',
                  locked
                    ? 'text-muted-text/50 cursor-not-allowed hover:bg-bg/60'
                    : active
                      ? 'bg-muted-bg text-primary font-[600]'
                      : 'text-muted-text font-[400] hover:bg-bg hover:text-primary'
                )
                const content = (
                  <>
                    <Icon
                      size={15}
                      aria-hidden="true"
                      className={cn('shrink-0', locked ? 'text-[#9CA3AF]/50' : active ? 'text-accent' : 'text-[#9CA3AF]')}
                    />
                    {label}
                    {!locked && href === '/portal/messages' && unreadMessages > 0 && (
                      <span className="ml-auto min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-[700] flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                    {!locked && active && !(href === '/portal/messages' && unreadMessages > 0) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                    )}
                  </>
                )
                return (
                  <li key={href}>
                    {locked ? (
                      <button
                        type="button"
                        onClick={onLockedClick}
                        title="Complete your profile to unlock this"
                        className={itemClassName}
                      >
                        {content}
                      </button>
                    ) : (
                      <Link href={href} className={itemClassName}>
                        {content}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Brand profile section */}
      <div className="px-4 py-4 border-t border-border-warm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center shrink-0">
            <span className="text-[11px] font-[700] font-public-sans text-accent">
              {brandInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[600] font-public-sans text-primary truncate leading-tight">
              {brandName}
            </p>
            <p className="text-[11px] font-public-sans text-[#9CA3AF] leading-tight">Brand Portal</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="text-[#C4BDB4] hover:text-muted-text transition-colors p-1"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}
