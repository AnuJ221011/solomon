import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Store, Globe2, Users, Package, Star } from 'lucide-react'

// â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATS = [
  { Icon: Users,   value: '500+',    label: 'Verified Brands'    },
  { Icon: Package, value: '10,000+', label: 'Products'           },
  { Icon: Globe2,  value: '40+',     label: 'Countries Served'   },
  { Icon: Star,    value: '98%',     label: 'Buyer Satisfaction' },
]

const TRUST_AVATARS = [
  'https://picsum.photos/seed/buyer-a/40/40',
  'https://picsum.photos/seed/buyer-b/40/40',
  'https://picsum.photos/seed/buyer-c/40/40',
]

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function HeroSection() {
  return (
    <section className="relative overflow-hidden h-[90vh]">

      {/* Full-bleed background image â€” no overlay */}
      <Image
        src="https://res.cloudinary.com/dxnqyvcdl/image/upload/v1781188595/heroSection_lzdtky.png"
        alt="Indian artisan home dÃ©cor products"
        fill
        sizes="100vw"
        className="object-cover object-right"
        priority
      />

      {/* Very subtle left-side fade so dark text stays readable â€” no darkness on image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(249,247,242,0.82) 0%, rgba(249,247,242,0.55) 45%, rgba(249,247,242,0) 70%)' }}
        aria-hidden="true"
      />

      {/* Content overlaid on the left */}
      <div className="relative z-10 flex items-center h-full absolute inset-0">
        <div className="w-full px-6 md:px-10 lg:px-16 py-20">
          <div className="max-w-[520px]">

            {/* Eyebrow pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-warm bg-white/60 backdrop-blur-sm mb-7">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 1L8.2 5.1H12.5L9.2 7.6L10.4 11.8L6.5 9.3L2.6 11.8L3.8 7.6L0.5 5.1H4.8L6.5 1Z" fill="#A68B67"/>
              </svg>
              <span className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em]">
                B2B Wholesale Marketplace
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-playfair font-[600] text-primary leading-[1.05] tracking-[-0.01em] text-[30px] sm:text-[38px] lg:text-[44px]">
              Source India&apos;s Finest<br />
              <span className="text-accent">Brands</span><br />
              Directly From Manufacturers
            </h1>

            {/* Body */}
            <p className="font-public-sans text-[15px] font-[400] leading-[1.65] text-muted-text mt-6 max-w-[400px]">
              Connect with verified artisan brands, exporters, and wholesale
              suppliers across India.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 rounded bg-primary text-white font-[600] font-public-sans text-[14px] px-6 py-3 hover:bg-[#2a2a2a] transition-colors"
              >
                Explore Products
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 rounded border border-border-warm bg-white/50 backdrop-blur-sm text-primary font-[600] font-public-sans text-[14px] px-5 py-3 hover:bg-white/80 transition-colors"
              >
                <Store size={14} aria-hidden="true" />
                Become a Seller
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 flex gap-x-6 gap-y-4">
              {STATS.map(({ Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/70 border border-border-warm flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-public-sans text-[14px] font-[600] text-primary leading-tight">{value}</p>
                    <p className="font-public-sans text-[11px] text-muted-text leading-tight">{label}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Floating trust card â€” top right area */}
      <div className="absolute top-8 left-[50%] lg:left-[50%] bg-white border border-border-warm rounded-lg px-4 py-3 shadow-[0_4px_24px_rgba(26,26,26,0.10)] flex items-center gap-3 z-10">
        <div className="flex -space-x-1.5 flex-shrink-0">
          {TRUST_AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              aria-hidden="true"
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-public-sans text-[13px] font-[600] text-primary leading-tight">Trusted by buyers</p>
          <p className="font-public-sans text-[11px] text-muted-text">from 40+ countries</p>
        </div>
        <Globe2 size={17} className="text-accent flex-shrink-0 ml-2" aria-hidden="true" />
      </div>

    </section>
  )
}
