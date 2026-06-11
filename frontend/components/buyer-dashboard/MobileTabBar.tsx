'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, ShoppingBag, Heart, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Tab config (5 items for mobile) ─────────────────────────────────────────

const TABS = [
  { label: 'Discover', href: '/dashboard', icon: Compass },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Saved', href: '/dashboard/saved', icon: Heart },
  { label: 'Referrals', href: '/dashboard/referrals', icon: Users },
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileTabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border-warm"
      aria-label="Mobile navigation"
    >
      <ul className="flex">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1',
                  'text-[10px] font-[600] font-public-sans',
                  'transition-colors duration-150',
                  active ? 'text-accent' : 'text-muted-text hover:text-primary'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  size={20}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
