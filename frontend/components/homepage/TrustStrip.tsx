import { Store, Globe2, Star, Package, Truck } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const METRICS = [
  { Icon: Store, value: '500+', label: 'Verified Brands' },
  { Icon: Package, value: '10,000+', label: 'Products Listed' },
  { Icon: Globe2, value: '40+', label: 'Countries Served' },
  { Icon: Star, value: '98%', label: 'Buyer Satisfaction' },
  { Icon: Truck, value: 'Free', label: 'Export Assistance' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function TrustStrip() {
  return (
    <section className="bg-surface border-y border-border-warm py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          {METRICS.map(({ Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2.5">
              {/* Small icon — 4px radius square */}
              <div className="w-9 h-9 rounded bg-muted-bg border border-border-warm flex items-center justify-center text-accent flex-shrink-0">
                <Icon size={16} aria-hidden="true" />
              </div>
              {/* headline-md: 24px / 500 — using slightly smaller for compactness */}
              <p className="font-playfair font-[600] text-primary text-[26px] leading-none">{value}</p>
              {/* label-sm: 12px / 500 */}
              <p className="font-public-sans text-[12px] font-[500] text-muted-text">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
