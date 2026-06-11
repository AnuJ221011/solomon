'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  ShoppingBag,
  Heart,
  Users,
  Wallet,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Discover', href: '/dashboard', icon: Compass },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Saved', href: '/dashboard/saved', icon: Heart },
  { label: 'Referrals', href: '/dashboard/referrals', icon: Users },
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  // Derive initials from user name
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : '?'

  return (
    <aside className="h-screen w-[280px] bg-surface border-r border-border-warm flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-border-warm flex-shrink-0">
        <Link href="/" className="font-playfair text-[20px] font-[600] text-primary tracking-[-0.01em] hover:text-accent transition-colors">
          Solomon Bharat
        </Link>
        <p className="text-[11px] font-public-sans text-muted-text mt-0.5 tracking-[0.06em] uppercase">
          Buyer Portal
        </p>
      </div>

      {/* Nav */}
      <nav className="py-4 flex-1 overflow-y-auto" aria-label="Buyer dashboard navigation">
        <ul className="space-y-0.5 px-3">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded',
                    'text-[14px] leading-[1.4] font-[600] font-public-sans',
                    'transition-colors duration-150',
                    active
                      ? 'text-accent border-l-[3px] border-accent bg-accent/[5%] pl-[9px]'
                      : 'text-muted-text hover:text-primary hover:bg-muted-bg border-l-[3px] border-transparent pl-[9px]'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    size={18}
                    aria-hidden="true"
                    className={active ? 'text-accent' : 'text-current'}
                  />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User profile area */}
      <div className="p-4 border-t border-border-warm flex-shrink-0">
        {user ? (
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded bg-muted-bg border border-border-warm flex-shrink-0 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[13px] font-[600] font-public-sans text-muted-text select-none">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-[600] font-public-sans text-primary leading-tight truncate">
                {user.name}
              </p>
              <p className="text-[12px] font-public-sans text-muted-text leading-tight mt-0.5 truncate">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            {/* Skeleton avatar */}
            <div className="w-9 h-9 rounded bg-muted-bg border border-border-warm flex-shrink-0 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted-bg rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted-bg rounded animate-pulse w-full" />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-text hover:text-primary"
          aria-label="Sign out"
          onClick={logout}
        >
          <LogOut size={14} aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
