import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { HeroSection } from '@/components/homepage/HeroSection'
import { TrustStrip } from '@/components/homepage/TrustStrip'
import { CategorySection } from '@/components/homepage/CategorySection'
import { TrendingProductsSection } from '@/components/homepage/TrendingProductsSection'
import { FeaturedBrandsSection } from '@/components/homepage/FeaturedBrandsSection'
import { HowItWorksSection } from '@/components/homepage/HowItWorksSection'
import { WhyChooseSection } from '@/components/homepage/WhyChooseSection'
import { TestimonialsSection } from '@/components/homepage/TestimonialsSection'
import { SupplierCTASection } from '@/components/homepage/SupplierCTASection'

// ─── Homepage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      <main className="flex-1">
        <HeroSection />
        <TrustStrip />
        <CategorySection />
        <TrendingProductsSection />
        <FeaturedBrandsSection />
        <HowItWorksSection />
        <WhyChooseSection />
        <TestimonialsSection />
        <SupplierCTASection />
      </main>

      <Footer />
    </div>
  )
}
