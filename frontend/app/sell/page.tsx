'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight, Globe2, Shield, Zap, BarChart3, Star,
  ChevronDown, Store, Award, Users, Package, CheckCircle2,
  TrendingUp, Clock, Percent, MessageSquare, Smartphone,
  BadgeCheck, IndianRupee, Layers, Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative bg-primary overflow-hidden min-h-[640px] flex items-center">
      {/* Subtle wave texture */}
      <svg
        viewBox="0 0 1440 600"
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={`M ${-200 + i * 130} 700 C ${-100 + i * 130} 450 ${200 + i * 130} 280 ${380 + i * 130} 160 S ${600 + i * 130} -60 ${780 + i * 130} -200`}
            stroke="#A68B67"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pt-10 pb-16 lg:pt-12 lg:pb-24 w-full">
        <div className="max-w-[680px]">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 mb-8">
            <Store size={12} className="text-accent" aria-hidden />
            <span className="font-public-sans text-[11px] font-[600] text-white/80 uppercase tracking-[0.1em]">
              For Sellers · India's B2B Wholesale Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-playfair font-[500] text-white leading-[1.04] tracking-[-0.01em] text-[38px] sm:text-[52px] lg:text-[64px]">
            Sell your craft<br />
            <span className="text-accent">to the world.</span>
          </h1>

          <p className="font-public-sans text-[15px] sm:text-[16px] font-[400] leading-[1.7] text-white/65 mt-6 max-w-[500px]">
            Join 500+ verified Indian brands already reaching boutique retailers
            across 40+ countries — with zero upfront fees, your own storefront,
            and commission that drops as you grow.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded bg-accent text-white font-[600] font-public-sans text-[15px] px-7 py-3.5 hover:bg-accent-hover transition-colors"
            >
              Get started — it's free
              <ArrowRight size={15} aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded border border-white/25 text-white/80 font-[500] font-public-sans text-[14px] px-5 py-3.5 hover:bg-white/10 transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center gap-6">
            {[
              'No listing fees',
              '0% commission on share links',
              'Paid within 30 days',
            ].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent flex-shrink-0" aria-hidden />
                <span className="font-public-sans text-[13px] text-white/60">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

const STATS = [
  { value: '500+', label: 'Brands on platform' },
  { value: '40+', label: 'Countries reached' },
  { value: '₹1 Cr+', label: 'Target GMV year 1' },
  { value: '24–48h', label: 'Application review' },
]

function StatsBar() {
  return (
    <section className="bg-surface border-b border-border-warm py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-playfair text-[38px] lg:text-[46px] font-[500] text-primary leading-none">
                {value}
              </p>
              <p className="font-public-sans text-[12px] text-muted-text mt-1.5 uppercase tracking-[0.06em]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Why Solomon Bharat ───────────────────────────────────────────────────────

const WHY_ITEMS = [
  {
    Icon: Globe2,
    title: 'Reach global buyers instantly',
    body: 'Your products are visible to verified boutique retailers from the US, UK, Europe, Australia, UAE and 35+ more countries — from day one.',
  },
  {
    Icon: Percent,
    title: 'Commission that decreases as you grow',
    body: 'Start at 15% and unlock lower rates — down to 10% — as you hit sales milestones through our Achievement tiers. Share link orders are always 0%.',
  },
  {
    Icon: Shield,
    title: 'Secure, guaranteed payments',
    body: 'Buyers pay upfront. We hold funds in escrow and release your payout within 30 days of dispatch — no chasing invoices, no bad debt.',
  },
  {
    Icon: Zap,
    title: 'Your own branded storefront',
    body: 'A professionally designed shop page with your logo, banner, brand story, full catalogue, and reviews — no design skills needed.',
  },
  {
    Icon: Share2,
    title: 'Share links earn 0% commission',
    body: 'Generate a personal share link to any product, collection, or your storefront. Orders placed through your link pay zero commission — forever.',
  },
  {
    Icon: BarChart3,
    title: 'Tools to run your business',
    body: 'CRM, bulk messaging, invoicing, Shopify sync, analytics, team management, and promoted listings — all in one seller portal.',
  },
  {
    Icon: BadgeCheck,
    title: 'Opening order protection',
    body: "Every first order from a new buyer comes with 30-day free return policy — the buyer is protected and you still get paid regardless.",
  },
  {
    Icon: MessageSquare,
    title: 'Direct buyer relationships',
    body: 'Message buyers directly, respond to reviews, and build lasting wholesale accounts — we never hide buyer contact details from approved sellers.',
  },
]

function WhySection() {
  return (
    <section className="py-20 lg:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="max-w-[560px] mb-14">
          <p className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em] mb-3">
            Why Solomon Bharat
          </p>
          <h2 className="font-playfair text-[32px] sm:text-[40px] font-[500] text-primary leading-[1.1]">
            Built for Indian artisan brands
          </h2>
          <p className="font-public-sans text-[15px] text-muted-text mt-4 leading-[1.7]">
            We designed every feature around the reality of running a small independent
            brand in India — from GST to bank transfers to international shipping.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_ITEMS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="bg-surface border border-border-warm rounded-lg p-5 flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-accent" aria-hidden />
              </div>
              <h3 className="font-public-sans text-[14px] font-[600] text-primary leading-[1.3]">
                {title}
              </h3>
              <p className="font-public-sans text-[13px] text-muted-text leading-[1.65]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Submit your application',
    body: 'Fill in your brand details, upload a few photos, and add your business documents. Takes about 10 minutes. No fees, no commitments.',
  },
  {
    number: '02',
    title: 'Our team reviews (24–48h)',
    body: 'We manually review every application to maintain quality. You\'ll get a decision by email within two business days.',
  },
  {
    number: '03',
    title: 'List your products',
    body: 'Upload your catalogue using our simple product editor — or bulk import directly from Shopify. Set your wholesale pricing and MOQ.',
  },
  {
    number: '04',
    title: 'Receive orders & get paid',
    body: 'Orders land in your seller portal. Ship, mark dispatched, and we release payment to your bank account within 30 days.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-surface border-y border-border-warm">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="max-w-[560px] mb-14">
          <p className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em] mb-3">
            How it works
          </p>
          <h2 className="font-playfair text-[32px] sm:text-[40px] font-[500] text-primary leading-[1.1]">
            From application to first sale
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map(({ number, title, body }, i) => (
            <div key={number} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-playfair text-[40px] font-[500] text-border-warm leading-none select-none">
                  {number}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block flex-1 h-px bg-border-warm mt-1" />
                )}
              </div>
              <h3 className="font-public-sans text-[15px] font-[600] text-primary leading-[1.3]">
                {title}
              </h3>
              <p className="font-public-sans text-[13px] text-muted-text leading-[1.65]">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 rounded bg-primary text-white font-[600] font-public-sans text-[15px] px-8 py-3.5 hover:bg-[#2a2a2a] transition-colors"
          >
            Start your application
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Commission tiers ─────────────────────────────────────────────────────────

const TIERS = [
  { name: 'Sprout', emoji: '🌱', commission: '15%', description: 'New sellers getting started', range: '₹0 – ₹2L GMV' },
  { name: 'Rising', emoji: '📈', commission: '14%', description: 'Building momentum', range: '₹2L – ₹5L GMV' },
  { name: 'Trusted', emoji: '⭐', commission: '14%', description: 'Consistent performers', range: '₹5L – ₹15L GMV' },
  { name: 'Elite', emoji: '💎', commission: '12%', description: 'Top-tier sellers', range: '₹15L – ₹50L GMV' },
  { name: 'Legend', emoji: '🏆', commission: '10%', description: 'Platform ambassadors', range: '₹50L+ GMV' },
]

function CommissionSection() {
  return (
    <section className="py-20 lg:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: copy */}
          <div>
            <p className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em] mb-3">
              Pricing & commission
            </p>
            <h2 className="font-playfair text-[32px] sm:text-[40px] font-[500] text-primary leading-[1.1] mb-5">
              Commission that rewards growth
            </h2>
            <p className="font-public-sans text-[15px] text-muted-text leading-[1.7] mb-6">
              There are no listing fees, no monthly subscriptions, and no setup
              costs. We only make money when you make money.
            </p>
            <p className="font-public-sans text-[15px] text-muted-text leading-[1.7] mb-8">
              Marketplace commission starts at 15% and decreases automatically
              as you hit GMV milestones — down to 10% at the Legend tier. And
              any order that comes through your personal <strong className="text-primary font-[600]">Share Link</strong> is always 0% commission.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { Icon: CheckCircle2, text: 'No listing fees — ever' },
                { Icon: CheckCircle2, text: 'No monthly subscription' },
                { Icon: CheckCircle2, text: '0% on all Share Link orders' },
                { Icon: CheckCircle2, text: 'Commission drops automatically as you grow' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon size={15} className="text-accent flex-shrink-0" aria-hidden />
                  <span className="font-public-sans text-[14px] text-primary">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tier table */}
          <div className="bg-surface border border-border-warm rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-warm bg-muted-bg/50">
              <p className="font-public-sans text-[11px] font-[700] uppercase tracking-[0.08em] text-muted-text">
                Achievement Tiers
              </p>
            </div>
            <div className="divide-y divide-border-warm">
              {TIERS.map((tier, i) => (
                <div
                  key={tier.name}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4',
                    i === 0 && 'bg-white'
                  )}
                >
                  <span className="text-[22px] flex-shrink-0" role="img" aria-label={tier.name}>
                    {tier.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-public-sans text-[14px] font-[600] text-primary">
                      {tier.name}
                    </p>
                    <p className="font-public-sans text-[12px] text-muted-text">{tier.range}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'font-playfair text-[20px] font-[500] leading-none',
                      tier.commission === '10%' ? 'text-accent' : 'text-primary'
                    )}>
                      {tier.commission}
                    </p>
                    <p className="font-public-sans text-[11px] text-muted-text mt-0.5">commission</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3.5 bg-muted-bg/50 border-t border-border-warm">
              <p className="font-public-sans text-[12px] text-muted-text text-center">
                Share Link orders = <strong className="text-primary font-[600]">0% commission</strong> regardless of tier
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Seller portal features ───────────────────────────────────────────────────

const PORTAL_FEATURES = [
  { Icon: BarChart3, title: 'Analytics dashboard', body: 'Track views, orders, revenue, and conversion rates across every product and collection.' },
  { Icon: Share2, title: 'Share links', body: 'Create trackable links to any product or collection. 30-day attribution window. Orders via links = 0% commission.' },
  { Icon: MessageSquare, title: 'Buyer CRM & messaging', body: 'Message buyers directly, send bulk broadcasts, and manage relationships in one place.' },
  { Icon: Layers, title: 'Collections & promotions', body: 'Group products into curated collections and run time-limited promotions to drive repeat orders.' },
  { Icon: Smartphone, title: 'Shopify sync', body: 'Import your existing Shopify catalogue with one click. Inventory stays in sync automatically.' },
  { Icon: IndianRupee, title: 'Invoicing & off-platform orders', body: 'Record sales made outside the platform for 0% commission. Full invoice generation included.' },
  { Icon: Users, title: 'Team management', body: 'Invite team members with role-based permissions — ops, sales, admin, fulfilment.' },
  { Icon: TrendingUp, title: 'Promoted listings', body: 'Boost visibility in search results and category pages during key buying seasons.' },
]

function PortalSection() {
  return (
    <section className="py-20 lg:py-28 bg-primary">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="max-w-[560px] mb-14">
          <p className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em] mb-3">
            Seller portal
          </p>
          <h2 className="font-playfair text-[32px] sm:text-[40px] font-[500] text-white leading-[1.1]">
            Everything you need to run your wholesale business
          </h2>
          <p className="font-public-sans text-[15px] text-white/55 mt-4 leading-[1.7]">
            Your seller portal is a fully-featured business dashboard — not just a
            product upload tool.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PORTAL_FEATURES.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-white/10 bg-white/5 p-5 flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-accent" aria-hidden />
              </div>
              <h3 className="font-public-sans text-[14px] font-[600] text-white leading-[1.3]">
                {title}
              </h3>
              <p className="font-public-sans text-[13px] text-white/50 leading-[1.65]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Seller testimonials ──────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "Within three months of going live we had retailers in the UK, Singapore, and Australia placing repeat orders. The Share Link feature alone covers our commission costs.",
    name: 'Priya Mehta',
    brand: 'Indigo Root Textiles · Jaipur',
    avatar: 'PM',
  },
  {
    quote: "As a solo artisan I was scared of the paperwork, but the application process was clear and our approval came in 36 hours. The brand portal is genuinely easy to use.",
    name: 'Rajan Nair',
    brand: 'Canework & Clay · Thrissur',
    avatar: 'RN',
  },
  {
    quote: "We connected with a French boutique chain through Solomon Bharat and they became our single largest wholesale account. The platform handles all the payment complexity.",
    name: 'Anika Sharma',
    brand: 'Bagh Print House · Bhopal',
    avatar: 'AS',
  },
]

function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="max-w-[480px] mb-14">
          <p className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em] mb-3">
            Seller stories
          </p>
          <h2 className="font-playfair text-[32px] sm:text-[40px] font-[500] text-primary leading-[1.1]">
            Brands that are growing with us
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, brand, avatar }) => (
            <div key={name} className="bg-surface border border-border-warm rounded-xl p-6 flex flex-col gap-5">
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={13} fill="#A68B67" stroke="none" aria-hidden />
                ))}
              </div>
              <blockquote className="font-public-sans text-[14px] text-muted-text leading-[1.7] flex-1">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center flex-shrink-0">
                  <span className="font-public-sans text-[12px] font-[700] text-muted-text">{avatar}</span>
                </div>
                <div>
                  <p className="font-public-sans text-[13px] font-[600] text-primary">{name}</p>
                  <p className="font-public-sans text-[11px] text-muted-text">{brand}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Requirements ─────────────────────────────────────────────────────────────

const REQUIREMENTS = [
  { Icon: BadgeCheck, label: 'Based in India', detail: 'Products must be made or sourced in India' },
  { Icon: Package, label: 'Wholesale-ready', detail: 'Minimum 10 wholesale styles available' },
  { Icon: Clock, label: 'Reliable fulfilment', detail: 'Ability to ship within your stated lead time' },
  { Icon: Award, label: 'Quality products', detail: 'Handcrafted, artisan, or design-led goods' },
]

function RequirementsSection() {
  return (
    <section className="py-20 lg:py-28 bg-surface border-y border-border-warm">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em] mb-3">
              Who can apply
            </p>
            <h2 className="font-playfair text-[32px] sm:text-[40px] font-[500] text-primary leading-[1.1] mb-5">
              We're looking for quality, not scale
            </h2>
            <p className="font-public-sans text-[15px] text-muted-text leading-[1.7]">
              Solomon Bharat is designed for independent Indian brands with between
              1 and 200 employees. You don&apos;t need to be an established exporter —
              just a maker with a genuine product and the ability to fulfil wholesale orders.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {REQUIREMENTS.map(({ Icon, label, detail }) => (
              <div key={label} className="bg-bg border border-border-warm rounded-lg p-5 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center">
                  <Icon size={15} className="text-accent" aria-hidden />
                </div>
                <p className="font-public-sans text-[14px] font-[600] text-primary">{label}</p>
                <p className="font-public-sans text-[12px] text-muted-text leading-[1.5]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How long does approval take?',
    a: 'Our team manually reviews every application within 24–48 business hours. You\'ll receive an email whether your application is approved or if we need more information.',
  },
  {
    q: 'Are there any fees to join?',
    a: 'No. There are no listing fees, no monthly subscriptions, and no setup costs. We earn a commission only when you make a sale — starting at 15% and decreasing as you grow.',
  },
  {
    q: 'What is a Share Link and why does it matter?',
    a: 'A Share Link is a unique URL you generate for any product, collection, or your storefront. When a buyer places an order after clicking your share link, you pay zero commission — regardless of your tier. It rewards you for driving your own traffic.',
  },
  {
    q: 'When do I get paid?',
    a: 'Standard payouts are released within 30 days of dispatch (Net 30, free). We also offer Express payouts — next-business-day for a 2.5% fee — coming soon.',
  },
  {
    q: 'Do international buyers handle customs and import duties?',
    a: 'Yes. Buyers are responsible for import duties and customs clearance in their country. You ship Ex Works or with a Shiprocket-integrated label; we provide a commercial invoice template.',
  },
  {
    q: 'Can I list the same products on other platforms?',
    a: 'Yes. We do not require exclusivity. You can sell through your own website, Faire, or any other channel simultaneously.',
  },
  {
    q: 'What documents do I need to apply?',
    a: 'Individuals need an Aadhar card and PAN card. Businesses additionally need at least one of: GST certificate, incorporation certificate, MSME certificate, ISO certificate, or IEC code.',
  },
  {
    q: 'What categories of products can I sell?',
    a: 'Textiles, Home Decor, Jewellery, Accessories, Apparel, Food & Wellness, Art & Craft, Stationery — and more. If your product is Indian-made and wholesale-appropriate, apply and we\'ll review it.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 lg:py-28 bg-bg">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em] mb-3">
            FAQ
          </p>
          <h2 className="font-playfair text-[32px] sm:text-[40px] font-[500] text-primary leading-[1.1]">
            Common questions
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
          {FAQS.map(({ q, a }, i) => (
            <div key={q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full flex items-start justify-between gap-4 py-5 text-left"
              >
                <span className="font-public-sans text-[15px] font-[600] text-primary leading-[1.4]">
                  {q}
                </span>
                <ChevronDown
                  size={17}
                  className={cn(
                    'flex-shrink-0 mt-0.5 text-muted-text transition-transform duration-200',
                    open === i && 'rotate-180'
                  )}
                  aria-hidden
                />
              </button>
              {open === i && (
                <p className="font-public-sans text-[14px] text-muted-text leading-[1.7] pb-6 pr-8">
                  {a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  return (
    <section className="py-20 lg:py-28 bg-surface border-t border-border-warm">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-warm bg-muted-bg mb-8">
          <Store size={12} className="text-accent" aria-hidden />
          <span className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em]">
            Free to join · No contracts
          </span>
        </div>

        <h2 className="font-playfair text-[36px] sm:text-[50px] font-[500] text-primary leading-[1.05] mb-5">
          Ready to take your brand global?
        </h2>
        <p className="font-public-sans text-[15px] sm:text-[16px] text-muted-text leading-[1.7] max-w-[500px] mx-auto mb-10">
          Join hundreds of Indian artisan brands already selling wholesale to
          retailers across 40+ countries. Apply in 10 minutes.
        </p>

        <Link
          href="/apply"
          className="inline-flex items-center gap-2.5 rounded bg-primary text-white font-[600] font-public-sans text-[15px] px-9 py-4 hover:bg-[#2a2a2a] transition-colors"
        >
          Get started — it's free
          <ArrowRight size={16} aria-hidden />
        </Link>

        <p className="mt-6 font-public-sans text-[13px] text-muted-text">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="text-primary font-[600] underline underline-offset-2 hover:text-accent transition-colors"
          >
            Log in
          </button>
        </p>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SellPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <NavBar />

      <main className="flex-1">
        <Hero />
        <StatsBar />
        <WhySection />
        <HowItWorks />
        <CommissionSection />
        <PortalSection />
        <Testimonials />
        <RequirementsSection />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
