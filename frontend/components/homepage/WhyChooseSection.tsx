import { ShieldCheck, PackageCheck, DollarSign, Lock, Globe2, Truck } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: ShieldCheck,
    heading: 'Verified Suppliers',
    description:
      'Every brand is manually verified for quality standards, export compliance, and business legitimacy before listing on the platform.',
  },
  {
    Icon: PackageCheck,
    heading: 'Flexible MOQ',
    description:
      'Start with small opening orders. Suppliers offer flexible minimum quantities tailored for importers and retail buyers of all sizes.',
  },
  {
    Icon: DollarSign,
    heading: 'Direct Manufacturer Pricing',
    description:
      'No middlemen, no markups. Buy directly from manufacturers at true wholesale prices for maximum margin on every order.',
  },
  {
    Icon: Lock,
    heading: 'Secure Payments',
    description:
      'Trade with confidence. Secure payment processing with buyer protection and dedicated dispute resolution support.',
  },
  {
    Icon: Globe2,
    heading: 'Export Assistance',
    description:
      'Full documentation support including customs clearance guidance, HS codes, certificates of origin, and compliance assistance.',
  },
  {
    Icon: Truck,
    heading: 'Global Logistics',
    description:
      'Integrated freight solutions for seamless worldwide delivery from Indian warehouses directly to your destination.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function WhyChooseSection() {
  return (
    <section className="py-12 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">

        {/* Header */}
        <div className="max-w-xl mb-14">
          <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-3">
            Why Solomon Bharat
          </p>
          <h2 className="font-playfair font-[500] text-primary leading-[1.2] text-[28px] lg:text-[32px]">
            The Smarter Way to Source from India
          </h2>
        </div>

        {/* 3×2 grid — 4px radius, 1px border */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, heading, description }) => (
            <div
              key={heading}
              className="flex flex-col p-6 border border-border-warm rounded hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(26,26,26,0.04)] transition-all duration-200 bg-surface"
            >
              {/* Icon — 4px radius, muted-bg */}
              <div className="w-9 h-9 rounded bg-muted-bg border border-border-warm flex items-center justify-center text-accent mb-5 flex-shrink-0">
                <Icon size={16} aria-hidden="true" />
              </div>
              <h3 className="font-playfair font-[500] text-[16px] text-primary mb-2 leading-snug">{heading}</h3>
              <p className="font-public-sans text-[13px] font-[400] leading-[1.7] text-muted-text">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
