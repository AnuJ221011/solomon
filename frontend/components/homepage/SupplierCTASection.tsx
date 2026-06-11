import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  'Access 40+ international markets',
  'Verified global buyer network',
  'Zero listing or commission fees',
  'Dedicated export support team',
]

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierCTASection() {
  return (
    <section className="py-24 bg-primary">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="max-w-2xl mx-auto text-center">

          {/* Eyebrow */}
          <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-5">
            For Indian Suppliers
          </p>

          {/* Headline — display-lg scale on charcoal bg */}
          <h2 className="font-playfair font-[600] text-white leading-[1.1] tracking-[-0.02em] text-[34px] lg:text-[48px] mb-6">
            Take Your Brand Global
          </h2>

          {/* Body */}
          <p className="font-public-sans text-[16px] font-[400] leading-[1.6] text-white/55 mb-10 max-w-[480px] mx-auto">
            Join hundreds of Indian manufacturers reaching buyers in 40+ countries. No middlemen, no hidden commissions — direct access to global retail.
          </p>

          {/* Benefits row */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2.5 mb-10">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-accent flex-shrink-0" aria-hidden="true" />
                <span className="font-public-sans text-[13px] font-[400] text-white/55">{b}</span>
              </div>
            ))}
          </div>

          {/* CTA — aged-brass button on charcoal bg, 4px radius */}
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 rounded bg-accent text-white font-[600] font-public-sans text-[14px] px-7 py-3.5 hover:bg-accent-hover transition-colors"
          >
            Apply as a Supplier
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
