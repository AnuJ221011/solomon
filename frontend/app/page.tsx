import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WhySection } from "@/components/home/WhySection";
import { BrandsSection } from "@/components/home/BrandsSection";
import { SellerCTA } from "@/components/home/SellerCTA";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <CategoryStrip />
        <FeaturedProducts />
        <WhySection />
        <BrandsSection />
        <SellerCTA />
      </main>
      <Footer />
    </div>
  );
}
