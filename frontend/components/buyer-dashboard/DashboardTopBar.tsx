'use client'

import { useState } from 'react'
import { Bell, Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'

// ─── Currency options ─────────────────────────────────────────────────────────

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD']

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardTopBar() {
  const user = useAuthStore((s) => s.user)
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const initials = user?.name
    ?.split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <header className="h-16 border-b border-border-warm bg-surface px-4 lg:px-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-20">
      {/* Left: search */}
      <div className="relative max-w-[360px] flex-1 mr-4">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search brands, products…"
          className={cn(
            'w-full h-9 pl-9 pr-3 rounded border border-border-warm bg-muted-bg/50',
            'text-[14px] font-public-sans text-primary placeholder:text-muted-text',
            'focus:outline-none focus:border-primary/30 focus:bg-surface',
            'transition-colors duration-150'
          )}
        />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            'relative w-9 h-9 flex items-center justify-center rounded',
            'border border-border-warm bg-transparent',
            'text-muted-text hover:text-primary hover:bg-muted-bg transition-colors'
          )}
        >
          <Bell size={16} aria-hidden="true" />
          {/* Unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
        </button>

        {/* Currency switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCurrencyOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={currencyOpen}
            aria-label="Switch currency"
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 rounded',
              'border border-border-warm bg-transparent',
              'text-[13px] font-[600] font-public-sans text-primary',
              'hover:bg-muted-bg transition-colors'
            )}
          >
            {currency}
            <ChevronDown size={13} aria-hidden="true" className={cn('transition-transform duration-150', currencyOpen && 'rotate-180')} />
          </button>

          {currencyOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setCurrencyOpen(false)}
                aria-hidden="true"
              />
              <ul
                role="listbox"
                aria-label="Currency"
                className={cn(
                  'absolute right-0 mt-1 w-20 z-20',
                  'bg-surface border border-border-warm rounded',
                  'shadow-[0_4px_20px_rgba(26,26,26,0.04)]',
                  'py-1'
                )}
              >
                {CURRENCIES.map((cur) => (
                  <li key={cur}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={currency === cur}
                      onClick={() => { setCurrency(cur); setCurrencyOpen(false) }}
                      className={cn(
                        'w-full text-left px-3 py-1.5',
                        'text-[13px] font-[500] font-public-sans',
                        'transition-colors duration-100',
                        currency === cur
                          ? 'text-accent bg-accent/[5%]'
                          : 'text-primary hover:bg-muted-bg'
                      )}
                    >
                      {cur}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Profile avatar */}
        <button
          type="button"
          aria-label="Profile menu"
          title={user?.name ?? ''}
          className={cn(
            'w-9 h-9 rounded border border-border-warm bg-muted-bg',
            'flex items-center justify-center',
            'text-[12px] font-[600] font-public-sans text-muted-text',
            'hover:bg-border-warm transition-colors'
          )}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded object-cover" />
          ) : (
            initials
          )}
        </button>
      </div>
    </header>
  )
}
