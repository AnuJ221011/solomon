'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, X, ChevronDown, LogOut, User as UserIcon, ShoppingBag, Bell, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { useCategoryTree } from '@/hooks/queries/useCategories'
import type { CategoryL1, CategoryL2 } from '@/hooks/queries/useCategories'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD']

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > threshold) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [ref, handler, enabled])
}

// ─── All-categories mega-dropdown (Faire-style 3-column) ─────────────────────

function AllCategoriesDropdown({ onClose }: { onClose: () => void }) {
  const { data: tree = [] } = useCategoryTree()
  const l1s = tree as CategoryL1[]
  const [activeL1, setActiveL1] = useState<CategoryL1 | null>(null)
  const [activeL2, setActiveL2] = useState<CategoryL2 | null>(null)

  // Default-select first L1 once tree loads
  useEffect(() => {
    if (l1s.length > 0 && !activeL1) setActiveL1(l1s[0])
  }, [l1s, activeL1])

  const l2s: CategoryL2[] = activeL1?.children ?? []
  const l3s = activeL2?.children ?? []

  function pickL1(l1: CategoryL1) {
    setActiveL1(l1)
    setActiveL2(null)
  }

  return (
    <div className="absolute left-0 top-full z-50 mt-0">
      <div className="bg-surface border border-border-warm shadow-[0_12px_48px_rgba(26,26,26,0.14)] flex overflow-hidden rounded-b-lg min-h-[360px]">

        {/* Col 1 — L1 list */}
        <div className="w-52 border-r border-border-warm flex-shrink-0 py-4 overflow-y-auto max-h-[520px]">
          <p className="text-[11px] font-[600] font-public-sans uppercase tracking-[0.08em] text-muted-text px-5 mb-2">
            Categories
          </p>
          {l1s.map((l1) => (
            <button
              key={l1.id}
              type="button"
              onMouseEnter={() => pickL1(l1)}
              onClick={() => { onClose() }}
              className={cn(
                'w-full text-left px-5 py-[7px] text-[14px] font-public-sans transition-colors',
                activeL1?.id === l1.id
                  ? 'font-[600] text-primary underline underline-offset-2'
                  : 'text-primary/80 hover:text-primary hover:bg-muted-bg'
              )}
            >
              <Link href={`/categories/${l1.slug}`} onClick={onClose} className="block w-full">
                {l1.name}
              </Link>
            </button>
          ))}
        </div>

        {/* Col 2 — L2 list */}
        <div className="w-52 border-r border-border-warm flex-shrink-0 py-4 overflow-y-auto max-h-[520px]">
          {activeL1 && (
            <>
              <p className="text-[11px] font-[600] font-public-sans uppercase tracking-[0.08em] text-muted-text px-5 mb-2">
                {activeL1.name}
              </p>

              {/* "All [L1]" link */}
              <Link
                href={`/categories/${activeL1.slug}`}
                onClick={onClose}
                className="block px-5 py-[7px] text-[14px] font-public-sans text-primary/80 hover:text-primary hover:bg-muted-bg transition-colors"
              >
                All {activeL1.name}
              </Link>

              {l2s.length > 0 && <div className="my-2 border-t border-border-warm/60" />}

              {l2s.map((l2) => (
                <button
                  key={l2.id}
                  type="button"
                  onMouseEnter={() => setActiveL2(l2)}
                  className={cn(
                    'w-full text-left px-5 py-[7px] text-[14px] font-public-sans transition-colors',
                    activeL2?.id === l2.id
                      ? 'font-[600] text-primary underline underline-offset-2'
                      : 'text-primary/80 hover:text-primary hover:bg-muted-bg'
                  )}
                >
                  <Link href={`/categories/${l2.slug}`} onClick={onClose} className="block w-full">
                    {l2.name}
                  </Link>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Col 3 — L3 list */}
        <div className="w-52 flex-shrink-0 py-4 overflow-y-auto max-h-[520px]">
          {activeL2 && l3s.length > 0 && (
            <>
              <p className="text-[11px] font-[600] font-public-sans uppercase tracking-[0.08em] text-muted-text px-5 mb-2">
                {activeL2.name}
              </p>
              {l3s.map((l3) => (
                <Link
                  key={l3.id}
                  href={`/categories/${l3.slug}`}
                  onClick={onClose}
                  className="block px-5 py-[7px] text-[14px] font-public-sans text-primary/80 hover:text-primary hover:bg-muted-bg transition-colors"
                >
                  {l3.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── All-categories button (Row 1) ───────────────────────────────────────────

function AllCategoriesButton({ ghost }: { ghost?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false), open)

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 h-8 px-4 rounded-full border text-[13px] font-[500] font-public-sans transition-colors',
          ghost
            ? open
              ? 'bg-white/20 text-white border-white/40'
              : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
            : open
              ? 'bg-primary text-white border-primary'
              : 'bg-muted-bg border-border-warm text-primary hover:border-primary'
        )}
      >
        <LayoutGrid size={13} aria-hidden="true" />
        All categories
        {open
          ? <X size={12} aria-hidden="true" />
          : <ChevronDown size={12} aria-hidden="true" />}
      </button>

      {open && <AllCategoriesDropdown onClose={() => setOpen(false)} />}
    </div>
  )
}

// ─── Category nav row (Row 2) — plain L1 links, no dropdown ──────────────────

function CategoryNavRow() {
  const { data: tree = [] } = useCategoryTree()

  return (
    <div className="h-11 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
      {(tree as CategoryL1[]).map((l1) => (
        <Link
          key={l1.id}
          href={`/categories/${l1.slug}`}
          className="inline-flex items-center h-8 px-3 rounded whitespace-nowrap flex-shrink-0 text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
        >
          {l1.name}
        </Link>
      ))}

      <div className="ml-auto flex-shrink-0">
        <Link
          href="/apply"
          className="inline-flex items-center h-8 px-3 rounded text-[12px] font-[600] font-public-sans text-accent hover:text-accent-hover hover:bg-accent/5 transition-colors whitespace-nowrap"
        >
          Sell on Solomon Bharat
        </Link>
      </div>
    </div>
  )
}

// ─── Currency selector ────────────────────────────────────────────────────────

function CurrencySelector() {
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false), open)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 h-9 px-2.5 rounded text-[13px] font-[600] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
      >
        {currency}
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border-warm rounded shadow-[0_4px_20px_rgba(26,26,26,0.08)] py-1 min-w-[96px]">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setCurrency(c); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-[13px] font-public-sans hover:bg-muted-bg transition-colors',
                c === currency ? 'text-primary font-[600]' : 'text-muted-text'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Cart button ──────────────────────────────────────────────────────────────

function CartButton() {
  const items = useCartStore((s) => s.items)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const cartCount = useAuthStore((s) => s.cartCount)

  if (!isAuthenticated) return null

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0) || cartCount
  const brandIds = [...new Set(items.map((i) => i.brandId))]
  const cartHref = brandIds.length === 1 ? `/cart/${brandIds[0]}` : '/cart'

  return (
    <Link
      href={cartHref}
      aria-label={`Cart — ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
    >
      <ShoppingBag size={17} aria-hidden="true" />
      {totalItems > 0 && (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-accent text-white text-[9px] font-[700] font-public-sans flex items-center justify-center px-0.5 tabular-nums leading-none pointer-events-none">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}

// ─── Notification button ──────────────────────────────────────────────────────

function NotificationButton() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const notificationCount = useAuthStore((s) => s.notificationCount)

  if (!isAuthenticated) return null

  return (
    <button
      type="button"
      aria-label={`Notifications${notificationCount > 0 ? ` — ${notificationCount} unread` : ''}`}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
    >
      <Bell size={17} aria-hidden="true" />
      {notificationCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-accent text-white text-[9px] font-[700] font-public-sans flex items-center justify-center px-0.5 tabular-nums leading-none pointer-events-none">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </button>
  )
}

// ─── User dropdown ────────────────────────────────────────────────────────────

function UserDropdown() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false), open)

  if (!user) return null

  const dashHref =
    user.role === 'ADMIN' ? '/admin' :
    user.role === 'BRAND' ? '/portal' :
    '/dashboard'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="User menu"
        className="inline-flex items-center gap-1.5 h-9 px-2 rounded hover:bg-muted-bg transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover border border-border-warm flex-shrink-0"
          />
        ) : (
          <span className="w-7 h-7 rounded-full inline-flex items-center justify-center flex-shrink-0 bg-muted-bg border border-border-warm text-muted-text">
            <UserIcon size={13} aria-hidden="true" />
          </span>
        )}
        <span className="hidden lg:block text-[13px] font-[500] font-public-sans text-primary truncate max-w-[72px]">
          {user.name?.split(' ')[0]}
        </span>
        <ChevronDown size={11} className={cn('text-muted-text transition-transform flex-shrink-0', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border-warm rounded shadow-[0_4px_20px_rgba(26,26,26,0.08)] py-1 min-w-[180px]">
          <div className="px-3 py-2.5 border-b border-border-warm">
            <p className="text-[13px] font-[600] font-public-sans text-primary truncate">{user.name}</p>
            <p className="text-[11px] font-public-sans text-muted-text truncate">{user.email}</p>
          </div>
          <Link
            href={dashHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
          >
            <UserIcon size={13} aria-hidden="true" />
            {user.role === 'ADMIN' ? 'Admin Panel' : user.role === 'BRAND' ? 'Brand Portal' : 'My Account'}
          </Link>
          <button
            type="button"
            onClick={() => { logout(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-[500] font-public-sans text-muted-text hover:text-red-500 hover:bg-muted-bg transition-colors"
          >
            <LogOut size={13} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Search input ─────────────────────────────────────────────────────────────

function SearchInput({ className, ghost }: { className?: string; ghost?: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={14}
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
          ghost ? 'text-white/50' : 'text-muted-text'
        )}
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder="Search brands and products…"
        className={cn(
          'w-full h-9 rounded border pl-9 pr-4 text-[13px] font-public-sans outline-none transition-colors',
          ghost
            ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/40'
            : 'bg-muted-bg/60 border-border-warm text-primary placeholder:text-muted-text/60 focus:bg-surface focus:ring-1 focus:ring-accent focus:border-accent'
        )}
      />
    </div>
  )
}

// ─── Mobile drawer ────────────────────────────────────────────────────────────

function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const { data: tree = [] } = useCategoryTree()

  function handleAuth(tab: 'login' | 'signup') { onClose(); openAuthModal(tab) }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[320px] max-w-[90vw] flex flex-col">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetClose />
        </SheetHeader>

        <nav className="flex flex-col px-6 py-4 flex-1 overflow-y-auto gap-0">
          {isAuthenticated && user && (
            <div className="mb-4 pb-4 border-b border-border-warm">
              <p className="text-[14px] font-[600] font-public-sans text-primary">{user.name}</p>
              <p className="text-[12px] font-public-sans text-muted-text">{user.email}</p>
            </div>
          )}

          <Link href="/catalogue" onClick={onClose} className="py-3 text-[15px] font-[500] font-public-sans text-primary hover:text-accent transition-colors border-b border-border-warm/50">
            Catalogue
          </Link>
          <Link href="/brands" onClick={onClose} className="py-3 text-[15px] font-[500] font-public-sans text-primary hover:text-accent transition-colors border-b border-border-warm/50">
            Brands
          </Link>
          <Link href="/apply" onClick={onClose} className="py-3 text-[15px] font-[600] font-public-sans text-accent hover:text-accent-hover transition-colors border-b border-border-warm/50">
            Sell on Solomon Bharat
          </Link>

          {tree.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-3">
                Shop by Category
              </p>
              <div className="flex flex-col gap-0.5">
                {tree.map((l1) => (
                  <Link
                    key={l1.id}
                    href={`/categories/${l1.slug}`}
                    onClick={onClose}
                    className="py-2 text-[13px] font-[500] font-public-sans text-muted-text hover:text-accent transition-colors"
                  >
                    {l1.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border-warm">
            <p className="text-[11px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-3">
              Currency
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'px-2.5 py-1 rounded border text-[12px] font-[600] font-public-sans transition-colors',
                    c === currency
                      ? 'border-primary bg-primary text-white'
                      : 'border-border-warm text-muted-text hover:border-primary hover:text-primary'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button variant="ghost" className="w-full" onClick={() => { logout(); onClose() }}>
                Sign out
              </Button>
            ) : (
              <>
                <Button variant="primary" className="w-full" onClick={() => handleAuth('signup')}>Sign up</Button>
                <Button variant="ghost" className="w-full" onClick={() => handleAuth('login')}>Log in</Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

interface NavBarProps {
  /** When true: first row has transparent bg + white text until scrolled */
  transparent?: boolean
}

export function NavBar({ transparent = false }: NavBarProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const scrolled = useScrolled(24)

  const ghost = transparent && !scrolled

  return (
    <>
      {!transparent && <div className="h-[108px] shrink-0" aria-hidden="true" />}

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          ghost
            ? 'bg-transparent border-b border-transparent'
            : 'bg-surface border-b border-border-warm shadow-[0_1px_0_0_rgba(26,26,26,0.05)]'
        )}
      >
        {/* ── Row 1: 64px ── */}
        <div className="h-16">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-3">

            {/* Wordmark */}
            <Link
              href="/"
              aria-label="Solomon Bharat — home"
              className={cn(
                'font-playfair text-[22px] font-[600] leading-none flex-shrink-0 transition-colors duration-300',
                ghost ? 'text-white' : 'text-primary'
              )}
            >
              Solomon Bharat
            </Link>

            {/* All categories button — desktop only */}
            <div className="hidden md:block">
              <AllCategoriesButton ghost={ghost} />
            </div>

            {/* Search — center */}
            <div className="hidden md:flex flex-1 justify-center px-4">
              <SearchInput ghost={ghost} className="max-w-[420px] w-full" />
            </div>

            {/* Right cluster */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0 ml-auto">
              <CurrencySelector />
              <CartButton />
              <NotificationButton />

              {isAuthenticated ? (
                <UserDropdown />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => openAuthModal('login')}
                    className={cn(ghost && 'text-white hover:bg-white/10')}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => openAuthModal('signup')}
                    className={cn(ghost && 'bg-white text-primary hover:bg-white/90 border-0')}
                  >
                    Join as Buyer
                  </Button>
                </>
              )}
            </div>

            {/* Mobile icons */}
            <div className="flex md:hidden items-center gap-0.5 ml-auto">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setMobileSearchOpen((v) => !v)}
                className={cn(
                  'inline-flex items-center justify-center w-9 h-9 rounded transition-colors',
                  ghost ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-muted-bg'
                )}
              >
                <Search size={17} aria-hidden="true" />
              </button>
              <CartButton />
              {isAuthenticated ? (
                <UserDropdown />
              ) : (
                <button
                  type="button"
                  aria-label="Log in"
                  onClick={() => openAuthModal('login')}
                  className={cn(
                    'inline-flex items-center justify-center w-9 h-9 rounded transition-colors',
                    ghost ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-muted-bg'
                  )}
                >
                  <UserIcon size={17} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileMenuOpen((v) => !v)}
                className={cn(
                  'inline-flex items-center justify-center w-9 h-9 rounded transition-colors',
                  ghost ? 'text-white hover:bg-white/10' : 'text-primary hover:bg-muted-bg'
                )}
              >
                {mobileMenuOpen
                  ? <X size={17} aria-hidden="true" />
                  : <Menu size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Mobile search expansion */}
          {mobileSearchOpen && (
            <div className={cn(
              'md:hidden px-4 pb-3 border-b',
              ghost ? 'border-white/20 bg-black/30 backdrop-blur-sm' : 'border-border-warm bg-surface'
            )}>
              <SearchInput ghost={ghost} className="w-full" />
            </div>
          )}
        </div>

        {/* ── Row 2: 44px — category nav (desktop only) ── */}
        <div
          className={cn(
            'hidden md:block border-t h-11',
            ghost ? 'border-white/10' : 'border-border-warm/60'
          )}
        >
          <div className="max-w-7xl mx-auto px-4">
            <CategoryNavRow />
          </div>
        </div>
      </header>

      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
