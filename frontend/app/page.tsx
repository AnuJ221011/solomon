import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { HeroSection }        from "@/components/home/HeroSection";
import { TrustStrip }         from "@/components/home/TrustStrip";
import { CategoryGrid }       from "@/components/home/CategoryGrid";
import { FeaturedProducts }   from "@/components/home/FeaturedProducts";
import { TrustBadges }        from "@/components/home/TrustBadges";
import { TrendingProducts }   from "@/components/home/TrendingProducts";
import { MadeInIndiaSection } from "@/components/home/MadeInIndiaSection";
import { BrandsSection }      from "@/components/home/BrandsSection";
import { RegionalSpotlight }  from "@/components/home/RegionalSpotlight";
import { WhySection }         from "@/components/home/WhySection";
import { SellerCTA }          from "@/components/home/SellerCTA";
import { NewsletterSection }  from "@/components/home/NewsletterSection";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* 1 — Hero with background image/video */}
        <HeroSection />

        {/* 2 — Animated trust strip */}
        <TrustStrip />

        {/* 3 — Visual category grid (bento) */}
        <CategoryGrid />

        {/* 4 — Featured / ranked products */}
        <FeaturedProducts />

        {/* 5 — Buyer trust badges */}
        <TrustBadges />

        {/* 6 — Trending / new this week */}
        <TrendingProducts />

        {/* 7 — Made in India editorial */}
        <MadeInIndiaSection />

        {/* 8 — Featured brands */}
        <BrandsSection />

        {/* 9 — Regional spotlight */}
        <RegionalSpotlight />

        {/* 10 — Why Solomon Bharat */}
        <WhySection />

        {/* 11 — Seller acquisition CTA */}
        <SellerCTA />

        {/* 12 — Newsletter */}
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
