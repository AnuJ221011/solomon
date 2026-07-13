'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, CalendarDays, Lock, X } from 'lucide-react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { BrandStorefrontClient } from '@/app/(shop)/brands/[slug]/BrandStorefrontClient'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useBrand } from '@/hooks/queries/useBrands'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useImageLightbox } from '@/components/shared/ImageLightbox'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareLinkView {
  id: string
  name?: string
  target: 'PRODUCT' | 'COLLECTION' | 'STOREFRONT'
  active: boolean
  passwordRequired: boolean
  customMessage?: string
  lockedCurrency?: string
  brandSlug: string | null
  productSlug: string | null
}

// ─── Attribution + view tracking ──────────────────────────────────────────────
// Stores the share link identifier (slug) in sessionStorage so it survives
// page navigation — read at signup to attribute the 0% commission window to
// this buyer, and fires a one-time-per-session view count against the link.

function useShareLinkTracking(slug: string, resolved: boolean) {
  useEffect(() => {
    if (typeof window === 'undefined' || !resolved) return
    sessionStorage.setItem('sb_share_slug', slug)

    const visitedKey = `sb_share_visited_${slug}`
    const isUnique = !localStorage.getItem(visitedKey)
    localStorage.setItem(visitedKey, '1')
    api.post('/share-links/visit', { identifier: slug, isUnique }).catch(() => {})
  }, [slug, resolved])
}

// ─── Sticky invite banner ─────────────────────────────────────────────────────

function ShareLinkBanner({ brandName }: { brandName: string }) {
  const [dismissed, setDismissed] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)

  if (dismissed || isAuthenticated) return null

  return (
    <div className="sticky top-16 z-30 bg-accent text-white px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm">
      <p className="text-[13px] font-[500] font-public-sans leading-snug">
        <span className="font-[600]">{brandName}</span> invited you to their wholesale catalogue — create a free account to place orders.
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => openAuthModal('signup')}
          className="h-7 px-3 rounded bg-white text-accent text-[12px] font-[600] font-public-sans hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          Sign up free
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-white/70 hover:text-white transition-colors"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// ─── Password gate ────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onUnlock(value.trim())
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-surface border border-border-warm rounded p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center mx-auto mb-4">
            <Lock size={20} className="text-muted-text" aria-hidden="true" />
          </div>
          <h1 className="text-[22px] font-[500] font-playfair text-primary mb-1">
            Password Required
          </h1>
          <p className="text-[14px] font-public-sans text-muted-text mb-6">
            This catalogue is private. Enter the password to view it.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter password"
              className="w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30 text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
            />
            <Button type="submit" variant="primary" size="md" disabled={!value.trim()}>
              View Catalogue
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// ─── Brand storefront view (reuses the real /brands/:slug data + grid) ───────

function ShareLinkBrandView({ link }: { link: ShareLinkView }) {
  const { data: brand, isLoading, isError } = useBrand(link.brandSlug)
  const { openLightbox, lightboxNode } = useImageLightbox()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="space-y-3 w-48">
            <div className="h-4 bg-muted-bg rounded animate-pulse" />
            <div className="h-4 bg-muted-bg rounded w-3/4 animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (isError || !brand) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center px-4">
          <EmptyState title="Brand not found" description="This catalogue may have been removed." />
        </main>
        <Footer />
      </div>
    )
  }

  const collectionNames = ['All Products', ...(brand.collections ?? []).map((c) => c.name)]

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <ShareLinkBanner brandName={brand.name} />

      {link.customMessage && (
        <div className="bg-accent/10 border-b border-accent/20 px-6 py-3 text-center">
          <p className="text-[14px] font-public-sans text-primary">{link.customMessage}</p>
        </div>
      )}

      {/* Hero banner */}
      <div className="w-full h-88 bg-muted-bg overflow-hidden relative">
        {brand.banner ? (
          <button
            type="button"
            onClick={() => openLightbox(brand.banner, `${brand.name} banner`)}
            className="absolute inset-0 cursor-zoom-in"
            aria-label="View full-size banner"
          >
            <Image src={brand.banner} alt="" fill className="object-cover" unoptimized />
          </button>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted-bg to-border-warm" />
        )}
      </div>

      {/* Brand header */}
      <div className="relative bg-surface border-b border-border-warm px-6 lg:px-16 pt-14 pb-6">
        {/* Brand logo — overlaps the hero/header seam. Lives here (not inside
            the hero div above) since that div's overflow-hidden — needed to
            crop the banner image — would otherwise clip the half of the
            logo that's meant to hang above it. */}
        <div className="absolute -top-10 left-6 lg:left-16 z-10">
          <div className="w-20 h-20 rounded-full bg-surface border-4 border-surface overflow-hidden shadow-md">
            {brand.logo ? (
              <button
                type="button"
                onClick={() => openLightbox(brand.logo, `${brand.name} logo`)}
                className="w-full h-full cursor-zoom-in"
                aria-label="View full-size logo"
              >
                <Image src={brand.logo} alt={brand.name} width={80} height={80} className="object-cover w-full h-full" unoptimized />
              </button>
            ) : (
              <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                <span className="text-[28px] font-[600] font-playfair text-muted-text">
                  {brand.name?.[0] ?? '?'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[28px] md:text-[32px] font-[500] font-playfair text-primary leading-tight">
              {brand.name}
            </h1>
            <AchievementBadge level={brand.achievementLevel as 1 | 2 | 3 | 4 | 5} />
          </div>
          {brand.tagline && (
            <p className="text-[16px] font-public-sans text-muted-text italic">{brand.tagline}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap text-[13px] font-public-sans text-muted-text mt-1">
            {brand.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} aria-hidden="true" />
                {brand.location}
              </span>
            )}
            {brand.yearFounded && (
              <span className="flex items-center gap-1">
                <CalendarDays size={13} aria-hidden="true" />
                Est. {brand.yearFounded}
              </span>
            )}
            <span>{brand.productCount} products</span>
          </div>
          {brand.description && (
            <p className="text-[14px] font-public-sans text-primary/80 mt-2 max-w-2xl leading-relaxed">
              {brand.description}
            </p>
          )}
        </div>
      </div>

      {/* Products */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-16 py-10">
        {brand.productCount === 0 ? (
          <EmptyState title="No products yet" description="This brand hasn't added products to this catalogue." />
        ) : (
          <BrandStorefrontClient brandSlug={brand.slug} collections={collectionNames} />
        )}
      </main>

      <Footer />
      {lightboxNode}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShareLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [password, setPassword] = useState<string | undefined>(undefined)

  const { data, isLoading, error } = useQuery<ShareLinkView>({
    queryKey: ['share-link', slug, password],
    queryFn: async () => {
      const response = await api.get(`/share-links/view/${slug}`, {
        params: password ? { password } : undefined,
      })
      return response.data.data
    },
    retry: false,
  })

  const resolved = !!data && data.active && !(data.passwordRequired && !password)
  useShareLinkTracking(slug, resolved)

  useEffect(() => {
    if (resolved && data?.target === 'PRODUCT' && data.productSlug) {
      router.replace(`/products/${data.productSlug}`)
    }
  }, [resolved, data, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="space-y-3 w-48">
            <div className="h-4 bg-muted-bg rounded animate-pulse" />
            <div className="h-4 bg-muted-bg rounded w-3/4 animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Link requires a password and none has been entered yet (or it was wrong)
  if (!data && (error as { response?: { status?: number } })?.response?.status === 401) {
    return <PasswordGate onUnlock={(pw) => setPassword(pw)} />
  }

  if (!data || error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            title="Link not found"
            description="This share link may have expired or been deactivated."
          />
        </main>
        <Footer />
      </div>
    )
  }

  if (!data.active) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            title="Link deactivated"
            description="This share link is no longer active."
          />
        </main>
        <Footer />
      </div>
    )
  }

  if (data.passwordRequired && !password) {
    return <PasswordGate onUnlock={(pw) => setPassword(pw)} />
  }

  // PRODUCT-target links redirect straight to the real product page (above effect)
  if (data.target === 'PRODUCT') {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-4 w-32 bg-muted-bg rounded animate-pulse" />
        </main>
        <Footer />
      </div>
    )
  }

  return <ShareLinkBrandView link={data} />
}
