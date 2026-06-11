'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, X, ChevronDown, LogOut, User as UserIcon, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { useCategories } from '@/hooks/queries/useCategories'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD']

const NAV_LINKS = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/brands', label: 'Brands' },
]

// ─── Scroll hook ──────────────────────────────────────────────────────────────

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

// ─── Outside-click hook ───────────────────────────────────────────────────────

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [ref, handler, enabled])
}

// ─── Categories megamenu ──────────────────────────────────────────────────────

function CategoriesMenu({ ghost }: { ghost: boolean }) {
  const { data: categories = [] } = useCategories()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function delayClose() { closeTimer.current = setTimeout(() => setOpen(false), 150) }
  function cancelClose() { clearTimeout(closeTimer.current) }

  return (
    <div
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true) }}
      onMouseLeave={delayClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'inline-flex items-center gap-1 h-10 px-3 rounded',
          'text-[14px] font-[500] font-public-sans transition-colors',
          ghost
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-primary hover:bg-muted-bg'
        )}
      >
        Categories
        <ChevronDown size={13} className={cn('transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={delayClose}
          className="absolute left-0 top-full pt-1 z-50 w-[520px]"
        >
          <div className="bg-surface border border-border-warm rounded shadow-[0_8px_40px_rgba(26,26,26,0.10)] p-5">
            {categories.length === 0 ? (
              <p className="text-[13px] font-public-sans text-muted-text">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/catalogue?category=${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between py-2 px-2 rounded text-[13px] font-[500] font-public-sans text-primary hover:bg-muted-bg hover:text-accent transition-colors"
                    >
                      <span>{cat.name}</span>
                      {cat.productCount > 0 && (
                        <span className="text-[11px] font-public-sans text-muted-text group-hover:text-accent/60 tabular-nums ml-2">
                          {cat.productCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border-warm">
                  <Link
                    href="/catalogue"
                    onClick={() => setOpen(false)}
                    className="text-[13px] font-[600] font-public-sans text-accent hover:text-accent-hover transition-colors"
                  >
                    Browse all products →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Currency selector ────────────────────────────────────────────────────────

function CurrencySelector({ ghost }: { ghost: boolean }) {
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
        className={cn(
          'inline-flex items-center gap-1 h-10 px-3 rounded',
          'text-[14px] font-[600] font-public-sans transition-colors',
          ghost
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-primary hover:bg-muted-bg'
        )}
      >
        {currency}
        <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border-warm rounded shadow-[0_4px_20px_rgba(26,26,26,0.08)] py-1 min-w-[100px]">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setCurrency(c); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-[13px] font-[500] font-public-sans hover:bg-muted-bg transition-colors',
                c === currency ? 'text-primary font-[700]' : 'text-muted-text'
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

function CartButton({ ghost }: { ghost: boolean }) {
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return null

  return (
    <Link
      href="/cart"
      aria-label={`Cart — ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
      className={cn(
        'relative inline-flex items-center justify-center w-10 h-10 rounded transition-colors',
        ghost ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-primary hover:bg-muted-bg'
      )}
    >
      <ShoppingBag size={18} aria-hidden="true" />
      {totalItems > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] rounded-full bg-accent text-white text-[9px] font-[700] font-public-sans flex items-center justify-center px-0.5 tabular-nums leading-none pointer-events-none">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}

// ─── User dropdown ────────────────────────────────────────────────────────────

function UserDropdown({ ghost }: { ghost: boolean }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false), open)

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="User menu"
        className={cn(
          'inline-flex items-center gap-1.5 h-10 px-2 rounded transition-colors',
          ghost ? 'hover:bg-white/10' : 'hover:bg-muted-bg'
        )}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-border-warm flex-shrink-0" />
        ) : (
          <span className={cn(
            'w-8 h-8 rounded inline-flex items-center justify-center flex-shrink-0',
            ghost ? 'bg-white/20 border border-white/30 text-white' : 'bg-muted-bg border border-border-warm text-muted-text'
          )}>
            <UserIcon size={15} aria-hidden="true" />
          </span>
        )}
        <span className={cn(
          'hidden lg:block text-[13px] font-[500] font-public-sans truncate max-w-[80px]',
          ghost ? 'text-white/80' : 'text-primary'
        )}>
          {user.name?.split(' ')[0]}
        </span>
        <ChevronDown size={13} className={cn('transition-transform flex-shrink-0', ghost ? 'text-white/50' : 'text-muted-text', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border-warm rounded shadow-[0_4px_20px_rgba(26,26,26,0.08)] py-1 min-w-[180px]">
          <div className="px-3 py-2 border-b border-border-warm">
            <p className="text-[13px] font-[600] font-public-sans text-primary truncate">{user.name}</p>
            <p className="text-[11px] font-public-sans text-muted-text truncate">{user.email}</p>
          </div>
          <Link
            href={user.role === 'BRAND' ? '/portal' : '/dashboard'}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary hover:bg-muted-bg transition-colors"
          >
            <UserIcon size={14} aria-hidden="true" />
            {user.role === 'BRAND' ? 'Brand Portal' : 'My Account'}
          </Link>
          <button
            type="button"
            onClick={() => { logout(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-[500] font-public-sans text-muted-text hover:text-error hover:bg-muted-bg transition-colors"
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Search input ─────────────────────────────────────────────────────────────

function SearchInput({ className, ghost }: { className?: string; ghost: boolean }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={15}
        className={cn('absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none', ghost ? 'text-white/50' : 'text-muted-text')}
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder="Search brands and products…"
        className={cn(
          'w-full h-10 rounded border pl-9 pr-4 text-[14px] font-public-sans outline-none transition-colors',
          ghost
            ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/40'
            : 'bg-surface border-border-warm text-primary placeholder:text-muted-text/60 focus:ring-1 focus:ring-accent focus:border-accent'
        )}
      />
    </div>
  )
}

// ─── Mobile nav drawer ────────────────────────────────────────────────────────

function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const currency = useCurrencyStore((s) => s.currency)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const { data: categories = [] } = useCategories()

  function handleAuth(tab: 'login' | 'signup') { onClose(); openAuthModal(tab) }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[320px] max-w-[90vw] flex flex-col">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetClose />
        </SheetHeader>

        <nav className="flex flex-col px-6 py-4 flex-1 overflow-y-auto">
          {isAuthenticated && user && (
            <div className="mb-4 pb-4 border-b border-border-warm">
              <p className="text-[14px] font-[600] font-public-sans text-primary">{user.name}</p>
              <p className="text-[12px] font-public-sans text-muted-text">{user.email}</p>
            </div>
          )}

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="py-3 text-[15px] font-[500] font-public-sans text-primary hover:text-accent transition-colors border-b border-border-warm/50"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/apply"
            onClick={onClose}
            className="py-3 text-[15px] font-[600] font-public-sans text-accent hover:text-accent-hover transition-colors border-b border-border-warm/50"
          >
            Sell on Solomon Bharat
          </Link>

          {categories.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-2">
                Shop by Category
              </p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/catalogue?category=${cat.slug}`}
                    onClick={onClose}
                    className="px-2.5 py-1 rounded border border-border-warm text-[12px] font-[500] font-public-sans text-muted-text hover:border-accent hover:text-accent transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border-warm">
            <p className="text-[11px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-2">
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
  transparent?: boolean
}

export function NavBar({ transparent = false }: NavBarProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const scrolled = useScrolled(24)

  // Ghost mode: transparent bg + white text (only on homepage hero before scroll)
  const ghost = transparent && !scrolled

  return (
    <>
      <div className="h-16 shrink-0" aria-hidden="true" />
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 h-16 transition-all duration-300',
          ghost
            ? 'bg-transparent border-b border-transparent'
            : 'bg-surface border-b border-border-warm shadow-[0_1px_0_0_rgba(26,26,26,0.05)]'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-2">

          {/* Wordmark */}
          <Link
            href="/"
            aria-label="Solomon Bharat — home"
            className={cn(
              'font-playfair text-[22px] font-[600] leading-none flex-shrink-0 mr-2 transition-colors duration-300',
              ghost ? 'text-white' : 'text-primary'
            )}
          >
            Solomon Bharat
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center h-10 px-3 rounded text-[14px] font-[500] font-public-sans transition-colors duration-200',
                  ghost ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-primary hover:bg-muted-bg'
                )}
              >
                {link.label}
              </Link>
            ))}
            <CategoriesMenu ghost={ghost} />
          </nav>

          {/* Search — center, flex-1 */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <SearchInput ghost={ghost} className="max-w-[420px] w-full" />
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0 ml-auto">
            <Link
              href="/apply"
              className={cn(
                'inline-flex items-center h-10 px-3 rounded text-[13px] font-[600] font-public-sans whitespace-nowrap transition-colors duration-200',
                ghost ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-muted-text hover:text-primary hover:bg-muted-bg'
              )}
            >
              Sign up to sell
            </Link>

            <CurrencySelector ghost={ghost} />
            <CartButton ghost={ghost} />

            {isAuthenticated ? (
              <UserDropdown ghost={ghost} />
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
                  className={cn(ghost && 'bg-white text-primary hover:bg-white/90')}
                >
                  Sign up
                </Button>
              </>
            )}
          </div>

          {/* Mobile right */}
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
              <Search size={18} aria-hidden="true" />
            </button>
            <CartButton ghost={ghost} />
            {isAuthenticated ? (
              <UserDropdown ghost={ghost} />
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
                <UserIcon size={18} aria-hidden="true" />
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
              {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
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
      </header>

      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
