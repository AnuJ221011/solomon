import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Globe2, Star } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRUST_SIGNALS = [
  { Icon: ShieldCheck, label: '500+ Verified Brands' },
  { Icon: Globe2, label: '40+ Countries Served' },
  { Icon: Star, label: '98% Buyer Satisfaction' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="bg-bg min-h-[88vh] flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-20 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: content ── */}
          <div className="max-w-[600px]">

            {/* Eyebrow */}
            <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-5">
              India's Premier B2B Wholesale Marketplace
            </p>

            {/* Headline — display-lg from design system: 48px / 600 / 1.1 / -0.02em */}
            <h1
              className="font-playfair font-[600] text-primary leading-[1.1] tracking-[-0.02em] text-[34px] sm:text-[42px] lg:text-[48px]"
            >
              Source Authentic Indian Brands Directly From Manufacturers
            </h1>

            {/* Subheadline — body-lg: 18px / 400 / 1.6 */}
            <p className="font-public-sans text-[18px] font-[400] leading-[1.6] text-muted-text mt-6 max-w-[480px]">
              Discover verified artisan brands, manufacturers, and exporters from across India.
              Transparent pricing, global shipping, and direct supplier relationships.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-3">
              {/* Primary — charcoal bg + white text, 4px radius */}
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 rounded bg-primary text-white font-[600] font-public-sans text-[14px] px-6 py-3 hover:bg-[#333333] transition-colors"
              >
                Explore Products
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              {/* Secondary — subtle-border */}
              <Link
                href="/apply"
                className="inline-flex items-center rounded border border-border-warm text-primary font-[600] font-public-sans text-[14px] px-6 py-3 hover:bg-muted-bg transition-colors"
              >
                Become a Supplier
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-border-warm pt-8">
              {TRUST_SIGNALS.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={13} className="text-accent flex-shrink-0" aria-hidden="true" />
                  <span className="font-public-sans text-[13px] font-[500] text-muted-text">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: editorial image ── */}
          <div className="relative hidden lg:block">
            {/* Tall portrait crop */}
            <div className="relative h-[580px] rounded overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85"
                alt="Indian artisan craftsmanship"
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
              {/* Subtle warm tint overlay */}
              <div
                className="absolute inset-0"
                style={{ background: 'rgba(249,247,242,0.08)' }}
                aria-hidden="true"
              />
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-8 bg-surface border border-border-warm rounded px-5 py-4 shadow-[0_4px_20px_rgba(26,26,26,0.06)]">
              <p className="font-playfair text-[26px] font-[600] text-primary leading-none">10,000+</p>
              <p className="font-public-sans text-[12px] font-[500] text-muted-text mt-1">Products from India</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
