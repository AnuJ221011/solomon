'use client'

import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { HeroSection } from '@/components/homepage/HeroSection'
import { TrustStrip } from '@/components/homepage/TrustStrip'
import { CategorySection } from '@/components/homepage/CategorySection'
import { TrendingProductsSection } from '@/components/homepage/TrendingProductsSection'
import { RetailerHighlightSection } from '@/components/homepage/RetailerHighlightSection'
import { FeaturedBrandsSection } from '@/components/homepage/FeaturedBrandsSection'
import { StatsSection } from '@/components/homepage/StatsSection'
import { HowItWorksSection } from '@/components/homepage/HowItWorksSection'
import { TestimonialsSection } from '@/components/homepage/TestimonialsSection'
import { SupplierCTASection } from '@/components/homepage/SupplierCTASection'
import { BuyerFeed } from '@/components/home/BuyerFeed'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Marketing homepage (unauthenticated) ─────────────────────────────────────

function MarketingHomepage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      <main className="flex-1">
        <HeroSection />
        {/* <TrustStrip /> */}
        <CategorySection />
        <TrendingProductsSection />
        <RetailerHighlightSection />
        <FeaturedBrandsSection />
        <StatsSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <SupplierCTASection />
      </main>

      <Footer />
    </div>
  )
}

// ─── Authenticated buyer feed ─────────────────────────────────────────────────

function AuthenticatedHomepage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      <main className="flex-1">
        <BuyerFeed />
      </main>

      <Footer />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)

  // Render marketing page during SSR/before hydration to avoid layout flash
  if (!hasHydrated || !isAuthenticated) {
    return <MarketingHomepage />
  }

  return <AuthenticatedHomepage />
}
