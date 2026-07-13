'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight, Globe2, Shield, Zap, BarChart3, Star,
  ChevronDown, Store, Award, Users, Package, CheckCircle2,
  TrendingUp, Clock, Percent, MessageSquare, Smartphone,
  BadgeCheck, IndianRupee, Layers, Share2, PartyPopper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Birthday offer (temporary launch promo) ─────────────────────────────────
// 0% commission across every tier, marketed as a limited-time launch offer.
// Flip to false once the promo ends to restore standard tier pricing
// everywhere it's referenced below (banner, commission section, FAQ) —
// should be kept in sync with COMMISSION_FREE_MODE on the backend.
const BIRTHDAY_OFFER_ACTIVE = true

function BirthdayOfferBanner() {
  return (
    <div className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-2.5 flex items-center justify-center gap-2.5 text-center flex-wrap">
        <PartyPopper size={15} className="text-accent flex-shrink-0" aria-hidden />
        <p className="font-public-sans text-[13px] font-[500] leading-snug">
          <strong className="font-[700]">Birthday Offer</strong> — 0% commission on every order, every tier —{' '}
          <span className="text-accent font-[600]">for a limited time only</span>
        </p>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_STATS = [
  { Icon: BadgeCheck, value: 'Curated', label: 'Handpicked brands'  },
  { Icon: Globe2,     value: '40+',     label: 'Countries Reached'  },
  { Icon: Users,      value: '24–48h',  label: 'Review Time'        },
  { Icon: Package,    value: '0%',      label: 'Share Link Fee'     },
]

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[580px] h-[90vh]">

      {/* Full-bleed background image */}
      <Image
        src="https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783429597/Gemini_Generated_Image_56ug4l56ug4l56ug_hvg3kn.png"
        alt="Indian artisan crafting handmade products for wholesale"
        fill
        sizes="100vw"
        className="object-cover object-right"
        priority
      />

      {/* Left-side fade — matches homepage exactly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(249,247,242,0.95) 0%, rgba(249,247,242,0.82) 50%, rgba(249,247,242,0.30) 72%, rgba(249,247,242,0) 100%)' }}
        aria-hidden
      />

      {/* Content — left side */}
      <div className="relative z-10 flex items-center h-full absolute inset-0">
        <div className="w-full px-5 sm:px-8 md:px-10 lg:px-16 py-12 sm:py-16 lg:py-20">
          <div className="max-w-[520px]">

            {/* Eyebrow pill — matches homepage style */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-warm bg-white/60 backdrop-blur-sm mb-7">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                <path d="M6.5 1L8.2 5.1H12.5L9.2 7.6L10.4 11.8L6.5 9.3L2.6 11.8L3.8 7.6L0.5 5.1H4.8L6.5 1Z" fill="#A68B67"/>
              </svg>
              <span className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em]">
                Sell on Solomon Bharat
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-playfair font-[600] text-primary leading-[1.05] tracking-[-0.01em] text-[26px] sm:text-[34px] lg:text-[44px]">
              Sell your craft<br />
              <span className="text-accent">to the world.</span><br />
              Zero upfront fees.
            </h1>

            {/* Body */}
            <p className="font-public-sans text-[14px] sm:text-[15px] font-[400] leading-[1.65] text-muted-text mt-4 sm:mt-6 max-w-[400px]">
              Join a curated community of Indian artisan brands reaching boutique
              retailers across 40+ countries — with your own branded storefront.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 rounded bg-primary text-white font-[600] font-public-sans text-[14px] px-6 py-3 hover:bg-[#2a2a2a] transition-colors"
              >
                Apply now — it&apos;s free
                <ArrowRight size={14} aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded border border-border-warm bg-white/50 backdrop-blur-sm text-primary font-[600] font-public-sans text-[14px] px-5 py-3 hover:bg-white/80 transition-colors"
              >
                How it works
              </a>
            </div>

            {/* Stats row */}
            <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-5 gap-y-3 sm:gap-x-6 sm:gap-y-4">
              {HERO_STATS.map(({ Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/70 border border-border-warm flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-accent" aria-hidden />
                  </div>
                  <div>
                    <p className="font-public-sans text-[13px] sm:text-[14px] font-[600] text-primary leading-tight">{value}</p>
                    <p className="font-public-sans text-[10px] sm:text-[11px] text-muted-text leading-tight">{label}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Floating trust card — matches homepage floating card */}
      <div className="hidden sm:flex absolute top-8 left-[52%] lg:left-[50%] bg-white border border-border-warm rounded-lg px-4 py-3 shadow-[0_4px_24px_rgba(26,26,26,0.10)] items-center gap-3 z-10">
        <div className="w-9 h-9 rounded-full bg-accent/10 border border-border-warm flex items-center justify-center flex-shrink-0">
          <Store size={15} className="text-accent" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-public-sans text-[13px] font-[600] text-primary leading-tight">Free to join</p>
          <p className="font-public-sans text-[11px] text-muted-text">No listing fees, ever</p>
        </div>
        <CheckCircle2 size={17} className="text-accent flex-shrink-0 ml-2" aria-hidden />
      </div>

    </section>
  )
}

// ─── Country ticker ───────────────────────────────────────────────────────────

const COUNTRIES = [
  'United Kingdom', 'United States', 'Germany', 'France', 'Netherlands',
  'Australia', 'Canada', 'UAE', 'Singapore', 'Italy', 'Spain', 'Sweden',
  'Denmark', 'Norway', 'Belgium', 'Switzerland', 'Japan', 'New Zealand',
]

function StatsBar() {
  const items = [...COUNTRIES, ...COUNTRIES]

  return (
    <section className="bg-muted-bg border-y border-border-warm py-5 lg:py-7 overflow-hidden">
      <p className="font-public-sans text-[10px] font-[700] text-accent uppercase tracking-[0.15em] text-center mb-4">
        Reaching buyers in
      </p>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-muted-bg to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-muted-bg to-transparent z-10 pointer-events-none" />
        <div className="flex animate-[ticker_35s_linear_infinite]" style={{ width: 'max-content' }}>
          {items.map((country, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-5 px-6 font-playfair text-[26px] lg:text-[33px] font-[500] text-primary whitespace-nowrap"
            >
              {country}
              <span className="w-1.5 h-1.5 rounded-full bg-accent/50 flex-shrink-0" aria-hidden />
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
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
    title: BIRTHDAY_OFFER_ACTIVE ? 'Birthday Offer — 0% commission, every tier' : 'Commission that decreases as you grow',
    body: BIRTHDAY_OFFER_ACTIVE
      ? "To celebrate our launch, every order pays 0% commission for a limited time — no matter your tier. Standard rates (20% down to 10% as you grow) resume once the offer ends."
      : 'Start at 20% and unlock lower rates — down to 10% — as you hit sales milestones through our Achievement tiers. Share link orders are always 0%.',
  },
  {
    Icon: Shield,
    title: 'Secure, guaranteed payments',
    body: 'Buyers pay upfront. We hold funds in escrow and release your payout within 15 days of dispatch — no chasing invoices, no bad debt.',
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
    <section className="py-14 lg:py-20 bg-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative">
        <div className="max-w-[600px] mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-accent flex-shrink-0" />
            <p className="font-public-sans text-[11px] font-[700] text-accent uppercase tracking-[0.12em]">
              Why Solomon Bharat
            </p>
          </div>
          <h2 className="font-playfair text-[34px] sm:text-[44px] font-[500] text-primary leading-[1.1]">
            Built for Indian artisan brands
          </h2>
          <p className="font-public-sans text-[15px] text-muted-text mt-4 leading-[1.7]">
            We designed every feature around the reality of running a small independent
            brand in India — from GST to bank transfers to international shipping.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_ITEMS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="group bg-surface border border-border-warm rounded-xl p-6 flex flex-col gap-4 hover:shadow-lg hover:shadow-black/6 hover:-translate-y-1 hover:border-accent/25 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:from-accent/25 group-hover:to-accent/10 transition-all duration-300">
                <Icon size={17} className="text-accent" aria-hidden />
              </div>
              <h3 className="font-public-sans text-[14px] font-[600] text-primary leading-[1.35]">
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
    body: 'Orders land in your seller portal. Ship, mark dispatched, and we release payment to your bank account within 15 days.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-14 lg:py-20 bg-surface border-y border-border-warm relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative">
        <div className="max-w-[560px] mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-accent flex-shrink-0" />
            <p className="font-public-sans text-[11px] font-[700] text-accent uppercase tracking-[0.12em]">
              How it works
            </p>
          </div>
          <h2 className="font-playfair text-[34px] sm:text-[44px] font-[500] text-primary leading-[1.1]">
            From application to first sale
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line (desktop only, behind steps) */}
          <div className="hidden lg:block absolute top-[22px] left-[calc(12.5%+22px)] right-[calc(12.5%+22px)] h-px bg-gradient-to-r from-accent/30 via-accent/20 to-accent/30 pointer-events-none" />

          {STEPS.map(({ number, title, body }) => (
            <div key={number} className="flex flex-col gap-4">
              <div className="relative w-11 h-11 rounded-full bg-bg border-2 border-accent/40 flex items-center justify-center z-10 flex-shrink-0 shadow-sm">
                <span className="font-playfair text-[14px] font-[600] text-accent">{number}</span>
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

        <div className="mt-10 text-center">
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-white font-[600] font-public-sans text-[15px] px-9 py-4 hover:bg-[#2a2a2a] transition-all hover:shadow-xl hover:shadow-black/12 hover:-translate-y-0.5"
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
  { name: 'Sprout',  Icon: Zap,        commission: '20%', description: 'New sellers getting started', range: '₹0 – ₹2L GMV'    },
  { name: 'Rising',  Icon: TrendingUp, commission: '15%', description: 'Building momentum',            range: '₹2L – ₹5L GMV'   },
  { name: 'Trusted', Icon: Star,       commission: '14%', description: 'Consistent performers',        range: '₹5L – ₹15L GMV'  },
  { name: 'Elite',   Icon: Award,      commission: '12%', description: 'Top-tier sellers',             range: '₹15L – ₹50L GMV' },
  { name: 'Legend',  Icon: BadgeCheck, commission: '10%', description: 'Platform ambassadors',         range: '₹50L+ GMV'        },
]

function CommissionSection() {
  return (
    <section className="py-14 lg:py-20 bg-bg relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[110px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-accent flex-shrink-0" />
              <p className="font-public-sans text-[11px] font-[700] text-accent uppercase tracking-[0.12em]">
                Pricing & commission
              </p>
            </div>
            <h2 className="font-playfair text-[34px] sm:text-[44px] font-[500] text-primary leading-[1.1] mb-5">
              {BIRTHDAY_OFFER_ACTIVE ? 'Our Birthday Offer: 0% commission' : 'Commission that rewards growth'}
            </h2>
            <p className="font-public-sans text-[15px] text-muted-text leading-[1.7] mb-5">
              There are no listing fees, no monthly subscriptions, and no setup
              costs. We only make money when you make money.
            </p>
            {BIRTHDAY_OFFER_ACTIVE ? (
              <p className="font-public-sans text-[15px] text-muted-text leading-[1.7] mb-7">
                For a limited time, every order — on every Achievement tier — earns{' '}
                <strong className="text-primary font-[600]">0% commission</strong>. Standard
                rates (starting at 20%, dropping to 10% as you grow) resume once the
                Birthday Offer ends — locking in now means you keep 100% of every sale
                you make during the offer.
              </p>
            ) : (
              <p className="font-public-sans text-[15px] text-muted-text leading-[1.7] mb-7">
                Marketplace commission starts at 20% and decreases automatically
                as you hit GMV milestones — down to 10% at the Legend tier. And
                any order that comes through your personal <strong className="text-primary font-[600]">Share Link</strong> is always 0% commission.
              </p>
            )}
            <div className="flex flex-col gap-3.5">
              {(BIRTHDAY_OFFER_ACTIVE
                ? [
                    '0% commission on every order, right now',
                    'No listing fees — ever',
                    'No monthly subscription',
                    'Limited-time Birthday Offer — lock in your tier before it ends',
                  ]
                : [
                    'No listing fees — ever',
                    'No monthly subscription',
                    '0% on all Share Link orders',
                    'Commission drops automatically as you grow',
                  ]
              ).map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={12} className="text-accent" aria-hidden />
                  </div>
                  <span className="font-public-sans text-[14px] text-primary">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tier table */}
          <div className="bg-surface border border-border-warm rounded-2xl overflow-hidden shadow-xl shadow-black/5">
            <div className="px-6 py-4 border-b border-border-warm bg-gradient-to-r from-accent/8 to-transparent">
              <p className="font-public-sans text-[11px] font-[700] uppercase tracking-[0.1em] text-muted-text">
                Achievement Tiers
              </p>
            </div>
            <div className="divide-y divide-border-warm">
              {TIERS.map(({ Icon, ...tier }, i) => (
                <div
                  key={tier.name}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 transition-colors',
                    i === 4
                      ? 'bg-gradient-to-r from-accent/10 to-transparent'
                      : 'hover:bg-muted-bg/50'
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-muted-bg border border-border-warm flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-accent" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-public-sans text-[14px] font-[600] text-primary">{tier.name}</p>
                    <p className="font-public-sans text-[12px] text-muted-text">{tier.range}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {BIRTHDAY_OFFER_ACTIVE ? (
                      <>
                        <p className="font-public-sans text-[12px] text-muted-text/70 line-through leading-none">
                          {tier.commission}
                        </p>
                        <p className="font-playfair text-[22px] font-[500] leading-none text-accent mt-0.5">
                          0%
                        </p>
                      </>
                    ) : (
                      <p className={cn(
                        'font-playfair text-[22px] font-[500] leading-none',
                        tier.commission === '10%' ? 'text-accent' : 'text-primary'
                      )}>
                        {tier.commission}
                      </p>
                    )}
                    <p className="font-public-sans text-[11px] text-muted-text mt-0.5">commission</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gradient-to-r from-accent/12 to-accent/5 border-t border-accent/20">
              <div className="flex items-center gap-2 justify-center">
                {BIRTHDAY_OFFER_ACTIVE ? (
                  <>
                    <PartyPopper size={13} className="text-accent flex-shrink-0" />
                    <p className="font-public-sans text-[12.5px] text-primary font-[500]">
                      Birthday Offer:{' '}
                      <strong className="text-accent font-[700]">0% on every tier</strong>
                      {' '}— limited time
                    </p>
                  </>
                ) : (
                  <>
                    <Share2 size={13} className="text-accent flex-shrink-0" />
                    <p className="font-public-sans text-[12.5px] text-primary font-[500]">
                      Share Link orders always{' '}
                      <strong className="text-accent font-[700]">0% commission</strong>
                    </p>
                  </>
                )}
              </div>
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
    <section className="py-14 lg:py-20 bg-surface border-y border-border-warm">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="max-w-[600px] mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-accent flex-shrink-0" />
            <p className="font-public-sans text-[11px] font-[700] text-accent uppercase tracking-[0.12em]">
              Seller portal
            </p>
          </div>
          <h2 className="font-playfair text-[34px] sm:text-[44px] font-[500] text-primary leading-[1.1]">
            Everything you need to run your wholesale business
          </h2>
          <p className="font-public-sans text-[15px] text-muted-text mt-4 leading-[1.7]">
            Your seller portal is a fully-featured business dashboard — not just a
            product upload tool.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PORTAL_FEATURES.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-xl border border-border-warm bg-bg p-5 flex flex-col gap-3.5 hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-muted-bg border border-border-warm flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-accent" aria-hidden />
              </div>
              <h3 className="font-public-sans text-[14px] font-[600] text-primary leading-[1.35]">
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
    <section className="py-14 lg:py-20 bg-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[110px] translate-x-1/4 -translate-y-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative">
        <div className="max-w-[480px] mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-accent flex-shrink-0" />
            <p className="font-public-sans text-[11px] font-[700] text-accent uppercase tracking-[0.12em]">
              Seller stories
            </p>
          </div>
          <h2 className="font-playfair text-[34px] sm:text-[44px] font-[500] text-primary leading-[1.1]">
            Brands that are growing with us
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, brand, avatar }) => (
            <div
              key={name}
              className="group relative bg-surface border border-border-warm rounded-2xl p-7 flex flex-col gap-5 overflow-hidden hover:shadow-xl hover:shadow-black/6 hover:-translate-y-1 hover:border-accent/20 transition-all duration-300"
            >
              {/* Decorative quote mark */}
              <span className="absolute top-3 right-5 font-playfair text-[90px] leading-none text-accent/[0.07] select-none pointer-events-none group-hover:text-accent/[0.12] transition-colors duration-300">
                &ldquo;
              </span>

              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={13} fill="#A68B67" stroke="none" aria-hidden />
                ))}
              </div>
              <blockquote className="font-public-sans text-[14px] text-muted-text leading-[1.75] flex-1 relative z-10">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-border-warm">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/25 flex items-center justify-center flex-shrink-0">
                  <span className="font-public-sans text-[12px] font-[700] text-accent">{avatar}</span>
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
    <section className="py-14 lg:py-20 bg-surface border-y border-border-warm">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-accent flex-shrink-0" />
              <p className="font-public-sans text-[11px] font-[700] text-accent uppercase tracking-[0.12em]">
                Who can apply
              </p>
            </div>
            <h2 className="font-playfair text-[34px] sm:text-[44px] font-[500] text-primary leading-[1.1] mb-5">
              We&apos;re looking for quality, not scale
            </h2>
            <p className="font-public-sans text-[15px] text-muted-text leading-[1.7]">
              Solomon Bharat is designed for independent Indian brands with between
              1 and 200 employees. You don&apos;t need to be an established exporter —
              just a maker with a genuine product and the ability to fulfil wholesale orders.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {REQUIREMENTS.map(({ Icon, label, detail }) => (
              <div
                key={label}
                className="group bg-bg border border-border-warm rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5 hover:border-accent/25 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/12 to-accent/4 border border-accent/18 flex items-center justify-center group-hover:from-accent/22 transition-all duration-300">
                  <Icon size={16} className="text-accent" aria-hidden />
                </div>
                <p className="font-public-sans text-[14px] font-[600] text-primary">{label}</p>
                <p className="font-public-sans text-[12.5px] text-muted-text leading-[1.5]">{detail}</p>
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
    a: BIRTHDAY_OFFER_ACTIVE
      ? "No. There are no listing fees, no monthly subscriptions, and no setup costs. As part of our Birthday Offer, commission is 0% on every order right now, regardless of tier — for a limited time. Standard rates (starting at 20%, decreasing to 10% as you grow) resume once the offer ends."
      : 'No. There are no listing fees, no monthly subscriptions, and no setup costs. We earn a commission only when you make a sale — starting at 20% and decreasing as you grow.',
  },
  {
    q: 'What is a Share Link and why does it matter?',
    a: 'A Share Link is a unique URL you generate for any product, collection, or your storefront. When a buyer places an order after clicking your share link, you pay zero commission — regardless of your tier. It rewards you for driving your own traffic.',
  },
  {
    q: 'When do I get paid?',
    a: 'Standard payouts are released within 15 days of dispatch (free). We also offer Express payouts — next-business-day for a 2.5% fee — coming soon.',
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
    <section className="py-14 lg:py-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <span className="w-10 h-px bg-accent" />
            <p className="font-public-sans text-[11px] font-[700] text-accent uppercase tracking-[0.12em]">FAQ</p>
            <span className="w-10 h-px bg-accent" />
          </div>
          <h2 className="font-playfair text-[34px] sm:text-[44px] font-[500] text-primary leading-[1.1]">
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
                className="w-full flex items-start justify-between gap-4 py-5 text-left group"
              >
                <span className="font-public-sans text-[15px] font-[600] text-primary leading-[1.4] group-hover:text-accent transition-colors duration-200">
                  {q}
                </span>
                <div className={cn(
                  'w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200',
                  open === i
                    ? 'bg-accent border-accent shadow-sm shadow-accent/30'
                    : 'bg-surface border-border-warm'
                )}>
                  <ChevronDown
                    size={13}
                    className={cn(
                      'transition-transform duration-200',
                      open === i ? 'rotate-180 text-white' : 'text-muted-text'
                    )}
                    aria-hidden
                  />
                </div>
              </button>
              {open === i && (
                <p className="font-public-sans text-[14px] text-muted-text leading-[1.75] pb-6 pr-10">
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
    <section className="py-14 lg:py-20 bg-bg border-t border-border-warm">
      <div className="max-w-3xl mx-auto px-6 text-center">

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-warm bg-white/60 mb-8">
          <Store size={11} className="text-accent" aria-hidden />
          <span className="font-public-sans text-[11px] font-[600] text-accent uppercase tracking-[0.1em]">
            Free to join · No contracts
          </span>
        </div>

        <h2 className="font-playfair text-[38px] sm:text-[50px] font-[600] text-primary leading-[1.05] mb-5">
          Ready to take your<br />
          <span className="text-accent">brand global?</span>
        </h2>
        <p className="font-public-sans text-[15px] text-muted-text leading-[1.75] max-w-[480px] mx-auto mb-10">
          Join a curated community of Indian artisan brands selling wholesale to
          retailers across 40+ countries. Apply in 10 minutes.
        </p>

        <Link
          href="/apply"
          className="inline-flex items-center gap-2 rounded bg-primary text-white font-[600] font-public-sans text-[14px] px-8 py-3.5 hover:bg-[#2a2a2a] transition-colors"
        >
          Apply now — it&apos;s free
          <ArrowRight size={14} aria-hidden />
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
      {BIRTHDAY_OFFER_ACTIVE && <BirthdayOfferBanner />}

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
