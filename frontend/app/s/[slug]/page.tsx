'use client'

import { use, useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin, Lock, X } from 'lucide-react'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { BrandStorefrontClient } from '@/app/(shop)/brands/[slug]/BrandStorefrontClient'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Product } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareLinkData {
  id: string
  slug: string
  name?: string
  linkType: 'BRAND' | 'PRODUCT' | 'COLLECTION'
  active: boolean
  passwordRequired: boolean
  welcomeMessage?: string
  currency?: string
  brand?: {
    id: string
    name: string
    slug: string
    logo?: string
    banner?: string
    description: string
    location: string
    yearFounded?: number
    achievementLevel: number
    tagline?: string
    productCount: number
    collections?: Array<{ id: string; name: string; slug: string; productCount: number }>
  }
  products?: Array<Record<string, unknown>>
  product?: Record<string, unknown>
}

const ACHIEVEMENT_LEVEL: Record<string, number> = {
  L1_SPROUT: 1, L2_RISING: 2, L3_TRUSTED: 3, L4_ELITE: 4, L5_LEGEND: 5,
}
const LEAD_TIME_LABEL: Record<string, string> = {
  ONE_TO_THREE_DAYS: '1-3 days', ONE_TO_TWO_WEEKS: '1-2 weeks', TWO_TO_FOUR_WEEKS: '2-4 weeks',
}

function toTypedProduct(p: Record<string, unknown>): Product {
  const bp = (p.brandProfile as Record<string, unknown>) ?? {}
  const photos = (p.photos as Array<{ id: string; url: string; position: number }>) ?? []
  const categories = (p.categories as string[]) ?? []
  return {
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    brandId: (p.brandProfileId as string) ?? (p.brandId as string) ?? '',
    brandName: (bp.brandName as string) ?? (p.brandName as string) ?? '',
    brandSlug: (bp.slug as string) ?? (p.brandSlug as string) ?? '',
    shortDescription: (p.shortDescription as string) ?? '',
    description: (p.fullDescription as string) ?? (p.description as string | undefined),
    images: photos.sort((a, b) => a.position - b.position).map((ph) => ph.url),
    wholesalePrice: Number(p.wholesalePriceInr ?? p.wholesalePrice ?? 0),
    moq: p.moq as number,
    leadTime: (LEAD_TIME_LABEL[p.leadTime as string] ?? p.leadTime ?? '1-2 weeks') as Product['leadTime'],
    weight: (p.weightGrams as number) ?? (p.weight as number) ?? 0,
    category: categories[0] ?? (p.category as string) ?? '',
    tags: (p.tags as string[]) ?? [],
    achievementLevel: (ACHIEVEMENT_LEVEL[bp.achievementLevel as string] ?? undefined) as Product['achievementLevel'],
    inStock: (p.availability as string) === 'ACTIVE',
  }
}

// ─── Share link attribution ───────────────────────────────────────────────────
// Stores the share link slug in sessionStorage so it survives page navigation.
// Read at signup to attribute the 0% commission window to this buyer.

function useShareLinkAttribution(slug: string) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sb_share_slug', slug)
    }
  }, [slug])
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
        <span className="font-[700]">{brandName}</span> invited you to their wholesale catalogue — create a free account to place orders.
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => openAuthModal('signup')}
          className="h-7 px-3 rounded bg-white text-accent text-[12px] font-[700] font-public-sans hover:bg-white/90 transition-colors whitespace-nowrap"
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
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setError('')
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
            {error && (
              <p className="text-[13px] font-public-sans text-error">{error}</p>
            )}
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

// ─── Brand storefront view ────────────────────────────────────────────────────

function ShareLinkBrandView({ data }: { data: ShareLinkData }) {
  const brand = data.brand!
  const products: Product[] = (data.products ?? []).map(toTypedProduct)
  const collections = ['All Products', ...(brand.collections?.map((c) => c.name) ?? [])]

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      {/* Share link invite banner for unauthenticated visitors */}
      <ShareLinkBanner brandName={brand.name} />

      {/* Welcome message banner */}
      {data.welcomeMessage && (
        <div className="bg-accent/10 border-b border-accent/20 px-6 py-3 text-center">
          <p className="text-[14px] font-public-sans text-primary">{data.welcomeMessage}</p>
        </div>
      )}

      {/* Hero banner */}
      <div className="w-full h-72 md:h-80 bg-muted-bg overflow-hidden relative">
        {brand.banner ? (
          <Image src={brand.banner} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted-bg to-border-warm" />
        )}
        {/* Logo */}
        <div className="absolute bottom-0 left-6 lg:left-16 translate-y-1/2 z-10">
          <div className="w-20 h-20 rounded-full bg-surface border-4 border-surface overflow-hidden shadow-md">
            {brand.logo ? (
              <Image src={brand.logo} alt={brand.name} width={80} height={80} className="object-cover w-full h-full" unoptimized />
            ) : (
              <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                <span className="text-[28px] font-[700] font-playfair text-muted-text">
                  {brand.name?.[0] ?? '?'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand header */}
      <div className="bg-surface border-b border-border-warm px-6 lg:px-16 pt-14 pb-6">
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
            {brand.yearFounded && <span>Est. {brand.yearFounded}</span>}
            <span>{brand.productCount ?? products.length} products</span>
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
        {products.length === 0 ? (
          <EmptyState title="No products yet" description="This brand hasn't added products to this catalogue." />
        ) : (
          <BrandStorefrontClient products={products} collections={collections} />
        )}
      </main>

      <Footer />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShareLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [password, setPassword] = useState<string | undefined>(undefined)

  // Record attribution in sessionStorage for 0% commission at signup
  useShareLinkAttribution(slug)

  const { data, isLoading, error } = useQuery<ShareLinkData>({
    queryKey: ['share-link', slug, password],
    queryFn: async () => {
      const response = await api.get(`/share-links/view/${slug}`, {
        params: password ? { password } : undefined,
      })
      return response.data.data
    },
    retry: false,
  })

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

  // Link requires password and none entered yet (or wrong password)
  if (!data && (error as { response?: { status?: number } })?.response?.status === 401) {
    return (
      <PasswordGate onUnlock={(pw) => setPassword(pw)} />
    )
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

  return <ShareLinkBrandView data={data} />
}
