import Image from 'next/image'
import { Star } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    company: 'Artisan Home Boutique',
    country: 'United Kingdom',
    avatar: 'https://picsum.photos/seed/sarah-testimonial/80/80',
    review:
      'Solomon Bharat transformed our sourcing entirely. We found incredible Indian artisan brands at factory-direct prices. The quality exceeded expectations and our customers love the authenticity.',
    rating: 5,
  },
  {
    name: 'Marco Ferretti',
    company: 'Casa Mediterranea',
    country: 'Italy',
    avatar: 'https://picsum.photos/seed/marco-testimonial/80/80',
    review:
      "We've been importing Indian textiles for years, but Solomon Bharat gave us true direct access to manufacturers. MOQs are reasonable and supplier verification gives real confidence to buy.",
    rating: 5,
  },
  {
    name: 'Emily Chen',
    company: 'Jade & Jasmine Imports',
    country: 'United States',
    avatar: 'https://picsum.photos/seed/emily-testimonial/80/80',
    review:
      'Finding authentic Indian brands at wholesale prices was my biggest sourcing challenge. Solomon Bharat solved that completely — and the platform makes managing global orders easy.',
    rating: 5,
  },
]

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="text-accent fill-accent" aria-hidden="true" />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TestimonialsSection() {
  return (
    <section className="py-12 bg-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">

        {/* Header */}
        <div className="max-w-xl mb-12">
          <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-3">
            Buyer Reviews
          </p>
          <h2 className="font-playfair font-[500] text-primary leading-[1.2] text-[28px] lg:text-[32px]">
            Trusted by Buyers in 40+ Countries
          </h2>
        </div>

        {/* Cards — 4px radius, 1px border, bg surface-container-lowest (white) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex flex-col bg-bg border border-border-warm rounded p-6">
              <StarRating count={t.rating} />
              {/* body-lg: 16px / 400 / 1.6 — using 14px for card density */}
              <p className="font-public-sans text-[14px] font-[400] leading-[1.75] text-primary mt-5 mb-6 flex-1">
                &ldquo;{t.review}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-5 border-t border-border-warm">
                {/* Avatar — rounded-full is acceptable for photos, not UI badges */}
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-playfair font-[500] text-[14px] text-primary truncate">{t.name}</p>
                  <p className="font-public-sans text-[12px] text-muted-text truncate">
                    {t.company} &middot; {t.country}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
