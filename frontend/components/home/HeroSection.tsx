import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

const STATS = [
  { value: "500+", label: "Indian Brands" },
  { value: "40+", label: "Countries" },
  { value: "0%", label: "Commission via your link" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#FAFAF8]">
      {/* Warm gradient overlay — subtle texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(200,149,108,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5EDE6] border border-[#E8C4A2] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8956C]" />
            <span className="text-xs font-medium text-[#92400E]">
              India's B2B Wholesale Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1A1A1A] leading-[1.05] tracking-tight text-balance">
            Wholesale from{" "}
            <span className="text-[#C8956C] italic">India's finest</span>{" "}
            artisan brands.
          </h1>

          <p className="mt-6 text-lg text-[#6B6056] leading-relaxed max-w-xl">
            Discover unique, story-driven products direct from Indian makers.
            Browse freely — create a free account when you're ready to order.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/shop" size="lg" variant="default">
              Browse products
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/signup?role=brand" size="lg" variant="outline">
              Sell on Solomon Bharat
            </LinkButton>
          </div>

          {/* Stats */}
          <div className="mt-12 flex flex-wrap gap-8">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-3xl font-bold text-[#1A1A1A]">{stat.value}</p>
                <p className="text-sm text-[#6B6056] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#E8E0D8] to-transparent" />
    </section>
  );
}
