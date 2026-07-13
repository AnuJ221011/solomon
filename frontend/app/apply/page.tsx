'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Check, Eye, EyeOff,
  Upload, X, FileText, User, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'
import { toast } from 'sonner'
import { useCategoryTree } from '@/hooks/queries/useCategories'
import type { CategoryL1 } from '@/hooks/queries/useCategories'
import { useAuthStore } from '@/lib/store/useAuthStore'

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_LABELS = ['Basic info', 'Business details', 'Review & submit']

// Faire-style two-level category tree: primary → subcategories shown as chips
const CATEGORY_TREE: Record<string, string[]> = {
  'Textiles': ['Bed Linen', 'Table Linen', 'Kitchen Textiles', 'Bath Textiles', 'Fabric by the Yard', 'Cushion Covers', 'Curtains & Drapes', 'Shawls & Wraps'],
  'Home Decor': ['Candles & Holders', 'Vases & Pots', 'Wall Art', 'Mirrors', 'Storage & Baskets', 'Figurines & Sculptures', 'Rugs & Mats'],
  'Jewellery': ['Necklaces', 'Earrings', 'Bracelets & Bangles', 'Rings', 'Anklets', 'Brooches & Pins', 'Jewellery Sets'],
  'Accessories': ['Bags & Clutches', 'Scarves & Stoles', 'Hats & Caps', 'Belts', 'Footwear', 'Hair Accessories'],
  'Apparel': ['Kurtas & Tops', 'Sarees', 'Lehengas & Skirts', 'Dresses', 'Jackets & Coats', 'Loungewear', 'Ethnic Sets'],
  'Food & Wellness': ['Spices & Condiments', 'Teas & Infusions', 'Snacks & Sweets', 'Skincare', 'Aromatherapy', 'Supplements'],
  'Art & Craft': ['Paintings', 'Prints & Posters', 'Ceramics & Pottery', 'Woodwork', 'Sculpture', 'Handmade Cards'],
  'Stationery': ['Notebooks & Journals', 'Greeting Cards', 'Pens & Pencils', 'Desk Accessories', 'Gift Wrap', 'Planners'],
  'Other': [],
}
const PRIMARY_CATEGORIES = Object.keys(CATEGORY_TREE)

const LEAD_TIMES = [
  { value: 'ONE_TO_THREE_DAYS', label: '1–3 days' },
  { value: 'ONE_TO_TWO_WEEKS', label: '1–2 weeks' },
  { value: 'TWO_TO_FOUR_WEEKS', label: '2–4 weeks' },
]

// All regions — always shipped, not shown as a form step
const ALL_SHIPPING_ZONES = [
  'DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST',
  'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD',
]

// Faire-style phase transition screens — shown between phases, no form fields
const PHASE_TRANSITIONS = [
  {
    phase: 1,
    heading: 'Welcome to Solomon Bharat!',
    body: "Let's get your shop page set up so you can start selling. You'll be able to save your progress as you go.",
    estimatedTime: '5 minutes',
    cta: 'Get started',
  },
  {
    phase: 2,
    heading: "Now let's set up your business details",
    body: "Tell buyers about your capacity, your minimum order size, and the regions you're able to ship products to.",
    estimatedTime: null,
    cta: 'Continue',
  },
  {
    phase: 2,
    heading: "Let's confirm your business documents",
    body: 'This keeps the marketplace safe for everyone.',
    estimatedTime: null,
    cta: 'Continue',
  },
  {
    phase: 3,
    heading: 'Lastly, review your application',
    body: "Check everything looks right before we submit your brand application. Once you're approved, you'll finish setting up your brand story, identity verification, and payout details right from your seller dashboard.",
    estimatedTime: null,
    cta: 'Continue',
  },
]

// Returns the transition id to show after completing `step`, or null if no transition
function getTransitionId(step: number, type: RegistrationType): number | null {
  if (step === 1) return 0                                // welcome, after account creation
  if (step === 2) return 1                                // brand info → business info
  if (step === 3 && type === 'business') return 2          // business info → business docs
  if (step === 3 && type === 'individual') return 3        // business info → review (skips docs)
  if (step === 4) return 3                                 // business docs → review
  return null
}

const STEP_HEADING: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Create your account', subtitle: "It's free to join — no setup fees or commitments." },
  2: { title: 'About your brand', subtitle: 'Tell us who you are and what makes your brand unique.' },
  3: { title: 'About your business', subtitle: 'Help buyers understand your scale and capacity.' },
  4: { title: 'Business documents', subtitle: 'GST and IEC certificates are required. Providing more helps speed up your review.' },
  5: { title: 'Review & submit', subtitle: 'Check everything looks right before you send your application.' },
}

// Fixed, curated Unsplash photo IDs — one per step, always relevant, never random.
// URL format: images.unsplash.com (whitelisted in next.config.ts) + crop to portrait
const STEP_IMAGES: Record<number, { id: string; credit: string }> = {
  0: { id: '1558618666-fcd25c85cd64', credit: 'Artisan Marketplace' },
  1: { id: '1497366216548-37526070297c', credit: 'Building your business' },
  2: { id: '1542744173-8e7e53415bb0', credit: 'Your brand identity' },
  3: { id: '1523275335684-37898b6baf30', credit: 'Wholesale products' },
  4: { id: '1497366754035-f200968a6e72', credit: 'Business verified' },
  5: { id: '1499750310107-5fef28a66643', credit: 'Review & submit' },
  6: { id: '1499750310107-5fef28a66643', credit: 'Application complete' },
}

function getStepImage(step: number): { src: string; credit: string } {
  const cfg = STEP_IMAGES[step] ?? STEP_IMAGES[5]
  return {
    src: `https://images.unsplash.com/photo-${cfg.id}?auto=format&fit=crop&w=900&h=1200&q=80`,
    credit: cfg.credit,
  }
}

// ─── Phase routing ─────────────────────────────────────────────────────────────

function getPhase(step: number): number {
  if (step <= 2) return 1
  if (step <= 4) return 2
  return 3
}

function nextStep(step: number, type: RegistrationType): number {
  if (step === 3 && type === 'individual') return 5  // skip business docs
  return step + 1
}

function prevStep(step: number, type: RegistrationType): number {
  if (step === 5 && type === 'individual') return 3  // review → business info (skip business docs)
  return step - 1
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type RegistrationType = 'individual' | 'business'

interface FormState {
  email: string; password: string; confirmPassword: string; phone: string
  brandName: string; tagline: string; yearFounded: string
  primaryCategory: string; subCategories: string[]
  city: string; state: string; websiteOrInstagram: string
  brandLogoFile: File | null; brandBannerFile: File | null
  wholesaleProductCount: string; minimumOrderValue: string; leadTime: string
  gstCertFile: File | null; incorporateCertFile: File | null
  msmeCertFile: File | null; isoCertFile: File | null; iecCertFile: File | null
}

const INITIAL_FORM: FormState = {
  email: '', password: '', confirmPassword: '', phone: '',
  brandName: '', tagline: '', yearFounded: '', primaryCategory: '', subCategories: [],
  city: '', state: '', websiteOrInstagram: '',
  brandLogoFile: null, brandBannerFile: null,
  wholesaleProductCount: '', minimumOrderValue: '', leadTime: '',
  gstCertFile: null, incorporateCertFile: null,
  msmeCertFile: null, isoCertFile: null, iecCertFile: null,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseWebPresence(value: string): { websiteUrl?: string } {
  const v = value.trim().replace(/^https?:\/\//i, '')
  if (!v) return {}
  return { websiteUrl: `https://${v}` }
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

function getSubCategoriesFromTree(tree: CategoryL1[], primaryName: string): string[] {
  const l1 = tree.find((c) => c.name === primaryName)
  return l1 ? l1.children.map((l2) => l2.name) : []
}

// ─── PhaseIndicator ────────────────────────────────────────────────────────────
// Exact Faire style: numbered circles, connector lines, labels below

function PhaseIndicator({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="flex items-start">
      {PHASE_LABELS.map((label, i) => {
        const phase = i + 1
        const isDone = phase < currentPhase
        const isCurrent = phase === currentPhase
        const isLast = i === PHASE_LABELS.length - 1
        return (
          <div key={phase} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-[13px] font-[600]',
                (isDone || isCurrent) ? 'bg-primary border-primary text-white' : 'border-[#CACAC5] text-[#CACAC5] bg-white',
              )}>
                {isDone ? <Check size={13} strokeWidth={2.5} /> : phase}
              </div>
              <span className={cn(
                'text-[11px] mt-1.5 whitespace-nowrap font-[500]',
                isCurrent ? 'text-primary' : isDone ? 'text-primary' : 'text-[#CACAC5]',
              )}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn('h-[2px] mt-[15px] mx-2', isDone ? 'bg-primary' : 'bg-[#E2E0DA]')}
                style={{ width: '52px' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared header ──────────────────────────────────────────────────────────────

function TopBar({ showPhase, currentPhase }: { showPhase?: boolean; currentPhase?: number }) {
  return (
    <header className="flex-shrink-0 h-[60px] flex items-center justify-between px-6 md:px-10 border-b border-[#E8E3DC] bg-white z-10">
      <Link href="/" className="font-playfair text-[18px] font-[600] text-primary tracking-[0.01em] flex-shrink-0">
        Solomon Bharat
      </Link>

      {showPhase && currentPhase != null && (
        <div className="hidden md:flex flex-1 justify-center px-4">
          <PhaseIndicator currentPhase={currentPhase} />
        </div>
      )}

      <div className="flex items-center gap-5 flex-shrink-0 ml-auto">
        <a href="#" className="hidden sm:block text-[13px] text-[#555] hover:text-primary transition-colors">
          Get help
        </a>
        <Link href="/sell" className="text-[13px] text-[#555] hover:text-primary transition-colors">
          Save &amp; exit
        </Link>
      </div>
    </header>
  )
}

// ─── SVG wave art — used on transition screens (Faire-style flowing contour lines)

function WaveArt() {
  return (
    <svg viewBox="0 0 460 800" className="absolute inset-0 w-full h-full" fill="none" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => {
        const o = i * 25
        return (
          <path
            key={i}
            d={`M ${-130 + o} 850 C ${-50 + o} 600 ${110 + o} 420 ${200 + o} 280 S ${340 + o} 80 ${430 + o} -100`}
            stroke="#B89E78"
            strokeWidth="1.3"
            opacity={Math.max(0.07, 0.72 - i * 0.038)}
          />
        )
      })}
    </svg>
  )
}

// ─── TransitionScreen ──────────────────────────────────────────────────────────
// Shown between phases — Faire's "Welcome to Faire!", "Let's set up your shop", etc.

function TransitionScreen({
  data, onContinue, onBack, showBack,
}: {
  data: typeof PHASE_TRANSITIONS[0]
  onContinue: () => void
  onBack: () => void
  showBack: boolean
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar showPhase currentPhase={data.phase} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: warm cream + SVG wave art — exactly like Faire */}
        <div
          className="hidden lg:block relative flex-shrink-0 overflow-hidden"
          style={{ width: '44%', background: '#EDE8DC' }}
        >
          <WaveArt />
        </div>

        {/* Right: large serif heading + description + CTA */}
        <div className="flex-1 flex items-center overflow-y-auto bg-white">
          <div className="max-w-[560px] mx-auto px-5 lg:px-10 py-14">
            <h1 className="font-playfair text-[44px] md:text-[54px] font-[400] text-primary leading-[1.05] mb-5">
              {data.heading}
            </h1>
            <p className="text-[15px] text-[#555] leading-[1.75] mb-3">
              {data.body}
            </p>
            {data.estimatedTime && (
              <p className="text-[15px] text-primary font-[500] mb-10">
                Estimated time: <strong>{data.estimatedTime}</strong>
              </p>
            )}
            <div className={cn('flex items-center gap-3', data.estimatedTime ? '' : 'mt-10')}>
              {showBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded border border-[#E2E0DA] text-[#777] hover:border-primary hover:text-primary transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onContinue}
                className="flex-1 h-11 bg-primary text-white text-[14px] font-[600] rounded hover:bg-primary/90 transition-colors"
              >
                {data.cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SplitShell ────────────────────────────────────────────────────────────────
// Used on regular form steps — left lifestyle photo, right form panel

function SplitShell({
  step, currentPhase, showPhase = true, children,
}: {
  step: number; currentPhase?: number; showPhase?: boolean; children: React.ReactNode
}) {
  const { src, credit } = getStepImage(step)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [step])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <TopBar showPhase={showPhase} currentPhase={currentPhase} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: fixed curated photo via next/image — images.unsplash.com is whitelisted */}
        <div className="hidden lg:block relative flex-shrink-0 overflow-hidden" style={{ width: '44%' }}>
          <Image
            src={src}
            alt={credit}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <p className="absolute bottom-5 left-6 text-[12px] text-white/60 tracking-[0.03em]">
            {credit}
          </p>
        </div>

        {/* Right: form — scrolls independently; ref resets to top on step change */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Field helpers ─────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[14px] font-[500] text-primary mb-1.5">
      {children}
    </label>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-[#888] mt-1.5 leading-[1.5]">{children}</p>
}

// ─── Chip ──────────────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick, disabled }: {
  label: string; selected: boolean; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded border text-[13px] font-[500] transition-colors',
        selected
          ? 'bg-primary text-white border-primary'
          : 'bg-white text-primary border-[#D4D0C8] hover:border-primary',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {label}
    </button>
  )
}

// ─── FileUploadBox ─────────────────────────────────────────────────────────────

function FileUploadBox({ label, hint, file, onChange, required, disabled }: {
  label: string; hint?: string; file: File | null
  onChange: (f: File | null) => void; required?: boolean; disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function processFile(f: File | undefined | null) {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { alert('File must be under 5 MB.'); return }
    onChange(f)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    processFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>
        {label}
        {!required && <span className="text-[#B0ACA3] font-[400] ml-1.5">(optional)</span>}
      </FieldLabel>
      {hint && <p className="text-[12px] text-[#888]">{hint}</p>}
      <button
        type="button"
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={disabled}
        className={cn(
          'flex items-center gap-4 px-5 py-4 rounded border-2 border-dashed transition-colors text-left w-full',
          dragging ? 'border-primary bg-[#F8F7F4]' : file ? 'border-primary bg-[#F8F7F4]' : 'border-[#D4D0C8] hover:border-primary bg-white',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {file ? (
          <>
            <FileText size={20} className="text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-primary truncate">{file.name}</p>
              <p className="text-[12px] text-[#888]">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <span
              role="button"
              aria-label="Remove file"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="text-[#B0ACA3] hover:text-red-500 transition-colors flex-shrink-0 p-1 cursor-pointer"
            >
              <X size={14} />
            </span>
          </>
        ) : (
          <>
            <Upload size={20} className="text-[#B0ACA3] flex-shrink-0" />
            <div>
              <p className="text-[14px] font-[500] text-[#555]">{dragging ? 'Drop file here' : 'Click or drag file here to upload'}</p>
              <p className="text-[12px] text-[#B0ACA3]">PDF, JPG or PNG — max 5 MB</p>
            </div>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}

// ─── ReviewRow ─────────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b border-[#E8E3DC] last:border-0">
      <span className="text-[11px] font-[600] uppercase tracking-[0.08em] text-[#B0ACA3]">{label}</span>
      <span className="text-[14px] text-primary leading-[1.4]">
        {value || <span className="text-[#B0ACA3] italic text-[13px]">Not provided</span>}
      </span>
    </div>
  )
}

// ─── NavButtons ────────────────────────────────────────────────────────────────
// Exact Faire: outlined square ← back, full-width dark "Save & continue"

function NavButtons({ step, loading, isSubmit, onBack }: {
  step: number; loading: boolean; isSubmit: boolean; onBack: () => void
}) {
  return (
    <div className="flex items-center gap-3 pt-6 mt-4 border-t border-[#E8E3DC]">
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded border border-[#D4D0C8] text-[#777] hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex-1 h-11 bg-primary text-white text-[14px] font-[600] rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting…' : isSubmit ? 'Submit application' : 'Save & continue'}
      </button>
    </div>
  )
}

// ─── OtpVerifyStep ─────────────────────────────────────────────────────────────

function OtpVerifyStep({ email, onVerified, onChangeEmail }: {
  email: string
  onVerified: () => void
  onChangeEmail: (newEmail: string) => Promise<void>
}) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState(email)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  async function handleVerify(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true)
    try {
      await api.post('/auth/brand/signup/verify-otp', { email, otp })
      onVerified()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    try {
      await api.post('/auth/brand/signup/request-otp', { email })
      setResent(true)
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  async function handleEmailUpdate(e: React.SyntheticEvent) {
    e.preventDefault()
    setEmailError(null)
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailLoading(true)
    try {
      await onChangeEmail(newEmail.trim())
      setEditingEmail(false); setOtp(''); setResent(false)
    } catch (err) {
      setEmailError(getApiError(err))
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="max-w-[560px] mx-auto py-14 px-5 lg:px-10">
      <h1 className="font-playfair text-[40px] font-[400] text-primary leading-[1.1] mb-5">
        Confirm your email address
      </h1>
      <p className="text-[15px] text-[#555] leading-[1.75] mb-8">
        Before you continue, check your inbox at{' '}
        <strong className="text-primary">{email}</strong> to confirm the email address
        for your Solomon Bharat account.{' '}
        {!editingEmail && (
          <button
            type="button"
            onClick={() => { setEditingEmail(true); setNewEmail(email) }}
            className="underline text-primary hover:text-[#555] transition-colors"
          >
            Edit Email Address
          </button>
        )}
      </p>

      {editingEmail && (
        <div className="mb-8 p-4 rounded border border-[#E8E3DC] bg-[#FAFAF8]">
          <p className="text-[14px] font-[600] text-primary mb-3">Update your email address</p>
          <form onSubmit={handleEmailUpdate} className="flex flex-col gap-3">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={emailLoading}
              autoFocus
            />
            {emailError && <p className="text-[12px] text-red-600">{emailError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={emailLoading}
                className="flex-1 h-10 bg-primary text-white text-[13px] font-[600] rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {emailLoading ? 'Updating…' : 'Update & resend code'}
              </button>
              <button
                type="button"
                onClick={() => { setEditingEmail(false); setEmailError(null) }}
                disabled={emailLoading}
                className="px-4 h-10 border border-[#D4D0C8] text-[13px] text-[#555] rounded hover:border-primary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="text-center text-[28px] tracking-[0.45em] font-[700] h-14"
          disabled={loading}
        />
        {error && <p className="text-[13px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-primary text-white text-[14px] font-[600] rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Verify email'}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resent}
          className="text-[13px] text-[#555] hover:text-primary underline underline-offset-2 transition-colors disabled:opacity-50 text-center"
        >
          {resent ? 'Code resent!' : "Didn't receive it? Resend email"}
        </button>
      </form>
    </div>
  )
}

// ─── SuccessContent ────────────────────────────────────────────────────────────

function SuccessContent() {
  return (
    <div className="max-w-[560px] mx-auto py-16 px-5 lg:px-10 flex flex-col">
      <div className="w-12 h-12 rounded-full bg-[#EEFAEE] flex items-center justify-center mb-8">
        <Check size={22} className="text-[#3D8B3D]" />
      </div>
      <h1 className="font-playfair text-[46px] font-[400] text-primary leading-[1.05] mb-5">
        Application submitted
      </h1>
      <p className="text-[15px] text-[#555] leading-[1.75] mb-10">
        Thanks for applying to sell on Solomon Bharat. Your brand application is now under
        review — our team will get back to you within 24–48 hours.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-11 px-10 bg-primary text-white text-[14px] font-[600] rounded hover:bg-primary/90 transition-colors self-start"
      >
        Return to home
      </Link>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal)
  const [step, setStep] = useState(0)
  const [registrationType, setRegistrationType] = useState<RegistrationType | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  // Email verification happens right after "Create your account" (step 1),
  // before the rest of the wizard — submittedEmail gates that early OTP
  // screen. applicationSubmitted gates the final success screen, shown once
  // the full application (step 8) is submitted with no further OTP needed.
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  // Faire-style phase transition state: null = no transition, otherwise the transition to show
  const [phaseTransition, setPhaseTransition] = useState<{ id: number; targetStep: number } | null>(null)

  // ── Session persistence — restore on mount, save on every relevant change ──────
  // File fields (File | null) cannot be serialised; everything else can.
  type PersistedState = {
    step: number
    registrationType: RegistrationType | null
    form: Omit<FormState,
      'brandLogoFile' | 'brandBannerFile' |
      'gstCertFile' | 'incorporateCertFile' |
      'msmeCertFile' | 'isoCertFile' | 'iecCertFile'>
  }
  const STORAGE_KEY = 'sb-apply-draft'

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved: PersistedState = JSON.parse(raw)
      if (saved.step != null) setStep(saved.step)
      if (saved.registrationType) setRegistrationType(saved.registrationType)
      if (saved.form) setForm((f) => ({ ...f, ...saved.form }))
    } catch { /* ignore parse errors */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Don't save once the application has been successfully submitted
    if (applicationSubmitted) return
    // Destructured only to exclude these non-serialisable File fields from
    // what gets persisted — the individual bindings are intentionally unused.
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      brandLogoFile, brandBannerFile,
      gstCertFile, incorporateCertFile,
      msmeCertFile, isoCertFile, iecCertFile,
      ...serialisable
    } = form
    /* eslint-enable @typescript-eslint/no-unused-vars */
    const payload: PersistedState = { step, registrationType, form: serialisable }
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) } catch { /* quota */ }
  }, [step, registrationType, form, applicationSubmitted])

  // Category tree from backend (L1 → L2). Falls back to static list while loading.
  const { data: categoryTree = [] } = useCategoryTree()
  const primaryCategories = categoryTree.length > 0
    ? (categoryTree as CategoryL1[]).map((l1) => l1.name)
    : PRIMARY_CATEGORIES
  const subCategoryOptions = form.primaryCategory
    ? (categoryTree.length > 0
        ? getSubCategoriesFromTree(categoryTree as CategoryL1[], form.primaryCategory)
        : (CATEGORY_TREE[form.primaryCategory] ?? []))
    : []

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validateStep(): string | null {
    switch (step) {
      case 1:
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
          return 'Please enter a valid email address.'
        if (form.password.length < 8) return 'Password must be at least 8 characters.'
        if (!/\d/.test(form.password)) return 'Password must contain at least one number.'
        if (form.password !== form.confirmPassword) return 'Passwords do not match.'
        if (!form.phone.trim() || form.phone.trim().length < 7) return 'Please enter a valid phone number.'
        return null
      case 2:
        if (!form.brandName.trim()) return 'Please enter your brand name.'
        if (!form.primaryCategory) return 'Please select a primary category.'
        if (!form.brandBannerFile) return 'Please upload your brand banner.'
        if (!form.city.trim()) return 'Please enter your city.'
        if (!form.state.trim()) return 'Please enter your state.'
        if (form.yearFounded) {
          const y = Number(form.yearFounded)
          if (y < 1900 || y > new Date().getFullYear()) return 'Please enter a valid year.'
        }
        return null
      case 3:
        if (!form.wholesaleProductCount || Number(form.wholesaleProductCount) < 1)
          return 'Please enter the number of wholesale styles.'
        if (!form.minimumOrderValue || Number(form.minimumOrderValue) < 1)
          return 'Please enter a minimum order value.'
        if (!form.leadTime) return 'Please select a typical lead time.'
        return null
      case 4:
        if (!form.gstCertFile) return 'Please upload your GST certificate.'
        if (!form.iecCertFile) return 'Please upload your IEC (Import Export Code) certificate.'
        return null
      default:
        return null
    }
  }

  async function handleNext(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    const err = validateStep()
    if (err) { setError(err); return }

    if (step === 1) {
      // Verify the email address right away, before collecting the rest of
      // the application — the OTP screen below takes over from here.
      setLoading(true)
      try {
        await api.post('/auth/brand/signup/request-otp', { email: form.email })
        setSubmittedEmail(form.email)
      } catch (err) {
        const msg = getApiError(err)
        toast.error(msg)
        setError(msg)
      } finally {
        setLoading(false)
      }
      return
    }

    if (step === 5) {
      if (!agreedToTerms) { setError('Please agree to the Seller Terms to continue.'); return }
      // Final submit
      setLoading(true)
      try {
        const { websiteUrl } = parseWebPresence(form.websiteOrInstagram)
        const fd = new FormData()
        fd.append('data', JSON.stringify({
          email: form.email, password: form.password,
          brandName: form.brandName, category: [form.primaryCategory, ...form.subCategories].filter(Boolean),
          registrationType, countryOfOrigin: 'IN',
          phone: form.phone.trim(),
          ...(form.tagline.trim() && { tagline: form.tagline.trim() }),
          ...(form.yearFounded && { yearFounded: Number(form.yearFounded) }),
          ...(form.city.trim() && { city: form.city.trim() }),
          ...(form.state.trim() && { state: form.state.trim() }),
          ...(websiteUrl && { websiteUrl }),
          wholesaleProductCount: Number(form.wholesaleProductCount),
          minimumOrderValue: Number(form.minimumOrderValue),
          leadTime: form.leadTime,
          shippingZones: ALL_SHIPPING_ZONES,
        }))
        if (form.brandLogoFile) fd.append('brandLogo', form.brandLogoFile)
        if (form.brandBannerFile) fd.append('brandBanner', form.brandBannerFile)
        if (form.gstCertFile) fd.append('gstCert', form.gstCertFile)
        if (form.incorporateCertFile) fd.append('incorporateCert', form.incorporateCertFile)
        if (form.msmeCertFile) fd.append('msmeCert', form.msmeCertFile)
        if (form.isoCertFile) fd.append('isoCert', form.isoCertFile)
        if (form.iecCertFile) fd.append('iecCert', form.iecCertFile)
        await api.post('/auth/brand/signup', fd, { headers: { 'Content-Type': undefined } })
        sessionStorage.removeItem(STORAGE_KEY)
        setApplicationSubmitted(true)
      } catch (err) {
        const msg = getApiError(err)
        toast.error(msg)
        setError(msg)
      } finally {
        setLoading(false)
      }
      return
    }

    // Check if we should show a phase transition screen before advancing
    const tid = getTransitionId(step, registrationType!)
    const target = nextStep(step, registrationType!)
    if (tid !== null) {
      setPhaseTransition({ id: tid, targetStep: target })
    } else {
      setStep(target)
    }
  }

  // ── Transition screen ────────────────────────────────────────────────────────

  if (phaseTransition !== null) {
    const data = PHASE_TRANSITIONS[phaseTransition.id]
    return (
      <TransitionScreen
        data={data}
        showBack={phaseTransition.id > 0}
        onContinue={() => {
          const target = phaseTransition.targetStep
          setPhaseTransition(null)
          setStep(target)
        }}
        onBack={() => setPhaseTransition(null)}
      />
    )
  }

  // ── Early email verification (right after "Create your account") ────────────

  if (submittedEmail) {
    return (
      <SplitShell step={1} showPhase={false}>
        <OtpVerifyStep
          email={submittedEmail}
          onVerified={() => {
            setSubmittedEmail(null)
            // Continue exactly where step 1 would have gone next.
            const tid = getTransitionId(1, registrationType!)
            const target = nextStep(1, registrationType!)
            if (tid !== null) setPhaseTransition({ id: tid, targetStep: target })
            else setStep(target)
          }}
          onChangeEmail={async (newEmail) => {
            await api.post('/auth/brand/signup/request-otp', { email: newEmail })
            set('email', newEmail)
            setSubmittedEmail(newEmail)
          }}
        />
      </SplitShell>
    )
  }

  // ── Success (shown once the full application is submitted) ──────────────────

  if (applicationSubmitted) {
    return (
      <SplitShell step={6} showPhase={false}>
        <SuccessContent />
      </SplitShell>
    )
  }

  // ── Step 0: Type selection (Faire's initial "Grow your wholesale business") ──

  if (step === 0) {
    return (
      <SplitShell step={0} showPhase={false}>
        <div className="max-w-[560px] mx-auto py-14 px-5 lg:px-10">
          <h1 className="font-playfair text-[44px] md:text-[52px] font-[400] text-primary leading-[1.05] mb-4">
            Grow your wholesale business
          </h1>
          <p className="text-[15px] text-[#555] leading-[1.7] mb-10">
            Let's start with a few details. How are you registering today?
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {([
              {
                type: 'individual' as const,
                Icon: User,
                title: 'Individual',
                subtitle: 'Solo creator, artisan, or freelancer',
                docs: "We'll ask for identity verification after you sign up",
              },
              {
                type: 'business' as const,
                Icon: Building2,
                title: 'Business',
                subtitle: 'Registered company, firm, or partnership',
                docs: 'GST certificate & IEC certificate',
              },
            ]).map(({ type, Icon, title, subtitle, docs }) => (
              <button
                key={type}
                type="button"
                onClick={() => setRegistrationType(type)}
                className={cn(
                  'w-full p-5 rounded border-2 text-left flex items-start gap-4 transition-all',
                  registrationType === type
                    ? 'border-primary bg-white shadow-sm'
                    : 'border-[#E2E0DA] bg-white hover:border-primary/40',
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                  registrationType === type ? 'bg-primary text-white' : 'bg-[#F3F0EA] text-[#777]',
                )}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[15px] font-[600] text-primary">{title}</p>
                    {registrationType === type && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] text-[#666] leading-[1.45]">{subtitle}</p>
                  <p className="text-[11px] font-[600] text-[#B0ACA3] uppercase tracking-[0.07em] mt-3 mb-0.5">
                    Documents needed
                  </p>
                  <p className="text-[13px] text-primary">{docs}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!registrationType}
            onClick={() => { if (registrationType) setStep(1) }}
            className="w-full h-12 bg-primary text-white text-[15px] font-[600] rounded hover:bg-primary/90 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            Continue
          </button>

          <p className="mt-6 text-[13px] text-[#666] text-center">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-primary font-[600] underline underline-offset-2"
            >
              Log in
            </button>
          </p>
        </div>
      </SplitShell>
    )
  }

  // ── Steps 1–8 ──────────────────────────────────────────────────────────────

  const heading = STEP_HEADING[step]

  return (
    <SplitShell step={step} showPhase currentPhase={getPhase(step)}>
      <div className="max-w-[580px] mx-auto py-10 px-5 lg:px-10">

        {/* Large Faire-style serif heading */}
        <h1 className="font-playfair text-[38px] md:text-[44px] font-[400] text-primary leading-[1.1] mb-3">
          {heading.title}
        </h1>
        <p className="text-[15px] text-[#555] leading-[1.7] mb-10">
          {heading.subtitle}
        </p>

        <form onSubmit={handleNext} className="flex flex-col gap-6" noValidate>

          {/* ── Step 1: Create your account ─────────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <FieldLabel>Business email address</FieldLabel>
                <Input
                  id="email" type="email" placeholder="you@yourbrand.com" autoComplete="email"
                  value={form.email} onChange={(e) => set('email', e.target.value)} disabled={loading}
                />
                <FieldHint>We'll send a 6-digit code to verify this address before you continue.</FieldHint>
              </div>

              <div>
                <FieldLabel>Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password" type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters with 1 number" autoComplete="new-password"
                    value={form.password} onChange={(e) => set('password', e.target.value)}
                    disabled={loading} className="pr-10"
                  />
                  <button
                    type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0ACA3] hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <FieldLabel>Confirm password</FieldLabel>
                <Input
                  id="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password"
                  value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} disabled={loading}
                />
              </div>

              <div>
                <FieldLabel>Phone number</FieldLabel>
                <Input
                  id="phone" type="tel" placeholder="+91 98765 43210"
                  value={form.phone} onChange={(e) => set('phone', e.target.value)} disabled={loading}
                />
              </div>
            </>
          )}

          {/* ── Step 2: About your brand ─────────────────────────────────── */}
          {step === 2 && (
            <>
              <div>
                <FieldLabel>Brand name</FieldLabel>
                <Input
                  id="brandName" placeholder="e.g. Khadi Craft Studio"
                  value={form.brandName} onChange={(e) => set('brandName', e.target.value)} disabled={loading}
                />
              </div>

              <div>
                <FieldLabel>
                  Tagline <span className="text-[#B0ACA3] font-[400]">(optional)</span>
                </FieldLabel>
                <Input
                  id="tagline" placeholder={`"Handcrafted in Jaipur since 1998"`} maxLength={120}
                  value={form.tagline} onChange={(e) => set('tagline', e.target.value)} disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FileUploadBox
                  label="Brand logo"
                  hint="Square image — shown on your shop page and search results. JPG or PNG, max 5 MB."
                  file={form.brandLogoFile}
                  onChange={(f) => set('brandLogoFile', f)}
                  disabled={loading}
                />
                <FileUploadBox
                  label="Brand banner"
                  hint="Wide banner image — displayed at the top of your shop page. JPG or PNG, max 5 MB."
                  file={form.brandBannerFile}
                  onChange={(f) => set('brandBannerFile', f)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>
                    Year founded <span className="text-[#B0ACA3] font-[400]">(optional)</span>
                  </FieldLabel>
                  <Input
                    id="yearFounded" type="number" placeholder="e.g. 2015"
                    min={1900} max={new Date().getFullYear()}
                    value={form.yearFounded} onChange={(e) => set('yearFounded', e.target.value)} disabled={loading}
                  />
                </div>
                <div>
                  <FieldLabel>
                    Website <span className="text-[#B0ACA3] font-[400]">(optional)</span>
                  </FieldLabel>
                  <div className="flex items-center h-10 rounded border border-border-warm bg-surface focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-colors overflow-hidden">
                    <span className="px-3 h-full flex items-center text-[14px] font-public-sans text-muted-text bg-muted-bg border-r border-border-warm shrink-0">
                      https://
                    </span>
                    <input
                      id="web" type="text" placeholder="yourbrand.com"
                      value={form.websiteOrInstagram} onChange={(e) => set('websiteOrInstagram', e.target.value)} disabled={loading}
                      className="flex-1 h-full px-3 bg-transparent text-[16px] font-public-sans text-primary placeholder:text-muted-text/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel>Primary category</FieldLabel>
                <FieldHint>Choose the main category that best describes your products.</FieldHint>
                <div className="mt-1.5">
                  <Select
                    value={form.primaryCategory}
                    onValueChange={(v) => { set('primaryCategory', v); set('subCategories', []) }}
                  >
                    <SelectTrigger id="primaryCategory">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.primaryCategory && subCategoryOptions.length > 0 && (
                <div>
                  <FieldLabel>
                    Subcategories <span className="text-[#B0ACA3] font-[400]">(optional)</span>
                  </FieldLabel>
                  <FieldHint>Select all that apply to your products.</FieldHint>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {subCategoryOptions.map((sub) => (
                      <Chip
                        key={sub} label={sub}
                        selected={form.subCategories.includes(sub)}
                        onClick={() => set('subCategories', toggle(form.subCategories, sub))}
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>City</FieldLabel>
                  <Input
                    id="city" placeholder="e.g. Jaipur"
                    value={form.city} onChange={(e) => set('city', e.target.value)} disabled={loading}
                  />
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <Input
                    id="state" placeholder="e.g. Rajasthan"
                    value={form.state} onChange={(e) => set('state', e.target.value)} disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: About your business ──────────────────────────────── */}
          {step === 3 && (
            <>
              <div>
                <FieldLabel>How many unique wholesale styles do you sell?</FieldLabel>
                <Input
                  id="skuCount" type="number" min={1} placeholder="e.g. 42"
                  value={form.wholesaleProductCount} onChange={(e) => set('wholesaleProductCount', e.target.value)} disabled={loading}
                />
                <FieldHint>Don't count colour or size variants — only distinct styles.</FieldHint>
              </div>

              <div>
                <FieldLabel>Minimum order value (₹ INR)</FieldLabel>
                <Input
                  id="moValue" type="number" min={1} placeholder="e.g. 5000"
                  value={form.minimumOrderValue} onChange={(e) => set('minimumOrderValue', e.target.value)} disabled={loading}
                />
                <FieldHint>The minimum a buyer must spend per order at your store.</FieldHint>
              </div>

              <div>
                <FieldLabel>Average lead time</FieldLabel>
                <Select value={form.leadTime} onValueChange={(v) => set('leadTime', v)}>
                  <SelectTrigger id="leadTime"><SelectValue placeholder="Select lead time" /></SelectTrigger>
                  <SelectContent>
                    {LEAD_TIMES.map((lt) => (
                      <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint>How long it typically takes to ship after receiving an order.</FieldHint>
              </div>
            </>
          )}

          {/* ── Step 4: Business documents ───────────────────────────────── */}
          {step === 4 && (
            <>
              <FileUploadBox label="GST Certificate" file={form.gstCertFile} onChange={(f) => set('gstCertFile', f)} required disabled={loading} />
              <FileUploadBox label="IEC (Import Export Code) Certificate" file={form.iecCertFile} onChange={(f) => set('iecCertFile', f)} required disabled={loading} />
              <FileUploadBox label="Incorporation / Registration Certificate" file={form.incorporateCertFile} onChange={(f) => set('incorporateCertFile', f)} disabled={loading} />
              <FileUploadBox label="MSME Certificate" file={form.msmeCertFile} onChange={(f) => set('msmeCertFile', f)} disabled={loading} />
              <FileUploadBox label="ISO Certificate" file={form.isoCertFile} onChange={(f) => set('isoCertFile', f)} disabled={loading} />
            </>
          )}

          {/* ── Step 5: Review & submit ──────────────────────────────────── */}
          {step === 5 && (
            <>
              <div className="rounded border border-[#E8E3DC] bg-white overflow-hidden divide-y divide-[#E8E3DC]">
                <div className="px-5 py-4">
                  <p className="text-[11px] font-[700] uppercase tracking-[0.08em] text-[#B0ACA3] mb-2">Account</p>
                  <ReviewRow label="Registration type" value={registrationType === 'individual' ? 'Individual' : 'Business'} />
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow label="Phone" value={form.phone} />
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] font-[700] uppercase tracking-[0.08em] text-[#B0ACA3] mb-2">Brand</p>
                  <ReviewRow label="Brand name" value={form.brandName} />
                  {form.tagline && <ReviewRow label="Tagline" value={form.tagline} />}
                  {form.yearFounded && <ReviewRow label="Year founded" value={form.yearFounded} />}
                  <ReviewRow label="Category" value={form.primaryCategory} />
                  {form.subCategories.length > 0 && (
                    <ReviewRow label="Subcategories" value={form.subCategories.join(', ')} />
                  )}
                  <ReviewRow label="Location" value={[form.city, form.state].filter(Boolean).join(', ')} />
                  {form.websiteOrInstagram && <ReviewRow label="Website" value={`https://${form.websiteOrInstagram.replace(/^https?:\/\//i, '')}`} />}
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] font-[700] uppercase tracking-[0.08em] text-[#B0ACA3] mb-2">Products</p>
                  <ReviewRow label="Wholesale styles" value={form.wholesaleProductCount} />
                  <ReviewRow label="Minimum order value" value={`₹${Number(form.minimumOrderValue).toLocaleString('en-IN')}`} />
                  <ReviewRow label="Lead time" value={LEAD_TIMES.find((l) => l.value === form.leadTime)?.label} />
                  <ReviewRow label="Shipping" value="All regions worldwide" />
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] font-[700] uppercase tracking-[0.08em] text-[#B0ACA3] mb-2">Documents</p>
                  {form.brandLogoFile && <ReviewRow label="Brand logo" value={form.brandLogoFile.name} />}
                  {form.brandBannerFile && <ReviewRow label="Brand banner" value={form.brandBannerFile.name} />}
                  {registrationType === 'business' && (
                    <>
                      {form.gstCertFile && <ReviewRow label="GST Certificate" value={form.gstCertFile.name} />}
                      {form.incorporateCertFile && <ReviewRow label="Incorporation Certificate" value={form.incorporateCertFile.name} />}
                      {form.msmeCertFile && <ReviewRow label="MSME Certificate" value={form.msmeCertFile.name} />}
                      {form.isoCertFile && <ReviewRow label="ISO Certificate" value={form.isoCertFile.name} />}
                      {form.iecCertFile && <ReviewRow label="IEC Certificate" value={form.iecCertFile.name} />}
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 rounded border border-[#E8E3DC] bg-[#FAFAF8]">
                <p className="text-[13px] text-[#555] leading-[1.6]">
                  Almost there — once approved, you'll finish setting up your brand story, identity verification, and payout bank details right from your seller dashboard.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox" className="sr-only"
                    checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} disabled={loading}
                  />
                  <div className={cn(
                    'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                    agreedToTerms ? 'bg-primary border-primary' : 'bg-white border-[#C8C4BB] group-hover:border-primary/40',
                  )}>
                    {agreedToTerms && <Check size={10} className="text-white" />}
                  </div>
                </div>
                <span className="text-[13px] text-[#555] leading-[1.55]">
                  I agree to Solomon Bharat's{' '}
                  <Link href="/terms" className="text-primary underline underline-offset-2">
                    Seller Terms
                  </Link>{' '}
                  and confirm all information provided is accurate.
                </span>
              </label>
            </>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {error && (
            <p className="text-[13px] text-red-600" role="alert">{error}</p>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <NavButtons
            step={step}
            loading={loading}
            isSubmit={step === 5}
            onBack={() => { setError(null); setStep(prevStep(step, registrationType!)) }}
          />
        </form>

        <p className="mt-8 pb-14 text-[13px] text-[#666] text-center">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="text-primary font-[600] underline underline-offset-2"
          >
            Log in
          </button>
        </p>
      </div>
    </SplitShell>
  )
}
