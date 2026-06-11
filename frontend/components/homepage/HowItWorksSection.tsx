import { Search, MessageSquare, Package } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    Icon: Search,
    heading: 'Discover Suppliers',
    description:
      'Browse 500+ verified Indian manufacturers, artisan brands, and exporters. Filter by category, MOQ, certifications, and lead time to find the right match.',
  },
  {
    number: '02',
    Icon: MessageSquare,
    heading: 'Request Quotations',
    description:
      'Send direct inquiries to multiple suppliers. No middlemen, no hidden fees — communicate directly with manufacturers for transparent, competitive pricing.',
  },
  {
    number: '03',
    Icon: Package,
    heading: 'Place Orders Globally',
    description:
      'Place your opening order with confidence. Brands ship directly to your location with complete tracking and export documentation support.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function HowItWorksSection() {
  return (
    <section className="py-12 bg-surface">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">

        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-3">
            Simple Process
          </p>
          <h2 className="font-playfair font-[500] text-primary leading-[1.2] text-[28px] lg:text-[32px]">
            From Discovery to Delivery in Three Steps
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {STEPS.map(({ number, Icon, heading, description }) => (
            <div key={number} className="flex flex-col">
              {/* Number + icon row */}
              <div className="flex items-start gap-4 mb-6">
                {/* Step number — label-sm style, muted */}
                <span className="font-public-sans text-[12px] font-[600] text-muted-text/50 tracking-[0.05em] mt-0.5 w-7 flex-shrink-0">
                  {number}
                </span>
                {/* Icon square — 4px radius, charcoal bg */}
                <div className="w-11 h-11 rounded bg-primary flex items-center justify-center text-white flex-shrink-0">
                  <Icon size={19} aria-hidden="true" />
                </div>
              </div>

              {/* headline-md: 24px / 500 — using 18px for compactness at card level */}
              <h3 className="font-playfair font-[500] text-[18px] text-primary mb-3 leading-snug">{heading}</h3>
              {/* body-md: 16px / 400 / 1.5 */}
              <p className="font-public-sans text-[14px] font-[400] leading-[1.7] text-muted-text">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
