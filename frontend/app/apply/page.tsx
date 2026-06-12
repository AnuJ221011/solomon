'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Check, Eye, EyeOff, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9

const PRODUCT_CATEGORIES = [
  'Textiles', 'Home Decor', 'Jewellery', 'Accessories', 'Apparel',
  'Food & Wellness', 'Art & Craft', 'Stationery', 'Other',
]

const LEAD_TIMES = [
  { value: 'ONE_TO_THREE_DAYS', label: '1–3 days' },
  { value: 'ONE_TO_TWO_WEEKS', label: '1–2 weeks' },
  { value: 'TWO_TO_FOUR_WEEKS', label: '2–4 weeks' },
]

const SHIPPING_ZONES = [
  { value: 'DOMESTIC', label: 'Domestic (India)' },
  { value: 'SOUTH_ASIA', label: 'South Asia' },
  { value: 'SOUTHEAST_ASIA', label: 'Southeast Asia' },
  { value: 'MIDDLE_EAST', label: 'Middle East' },
  { value: 'EUROPE', label: 'Europe' },
  { value: 'NORTH_AMERICA', label: 'North America' },
  { value: 'OCEANIA', label: 'Oceania' },
  { value: 'REST_OF_WORLD', label: 'Rest of World' },
]

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
]

const STEP_LABELS = [
  'Brand basics',
  'Brand identity',
  'Brand story',
  'Products & capacity',
  'Business credentials',
  'Shipping zones',
  'Existing presence',
  'Account setup',
  'Review & submit',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  // Step 1
  websiteOrInstagram: string
  categories: string[]
  city: string
  state: string
  // Step 2
  brandName: string
  yearFounded: string
  tagline: string
  // Step 3
  brandStory: string
  uniqueValue: string
  // Step 4
  wholesaleProductCount: string
  minimumOrderValue: string
  leadTime: string
  // Step 5
  gstNumber: string
  businessRegNumber: string
  countryOfOrigin: string
  // Step 6
  shippingZones: string[]
  // Step 7
  existingRetailPartners: string
  hasExportExperience: boolean | null
  // Step 8
  email: string
  password: string
  confirmPassword: string
  phone: string
}

const INITIAL_FORM: FormState = {
  websiteOrInstagram: '',
  categories: [],
  city: '',
  state: '',
  brandName: '',
  yearFounded: '',
  tagline: '',
  brandStory: '',
  uniqueValue: '',
  wholesaleProductCount: '',
  minimumOrderValue: '',
  leadTime: '',
  gstNumber: '',
  businessRegNumber: '',
  countryOfOrigin: 'IN',
  shippingZones: [],
  existingRetailPartners: '',
  hasExportExperience: null,
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseWebPresence(value: string): { instagramHandle?: string; websiteUrl?: string } {
  const v = value.trim()
  if (!v) return {}
  if (v.startsWith('@')) return { instagramHandle: v.slice(1) }
  if (v.includes('instagram.com/')) {
    const handle = v.split('instagram.com/')[1]?.replace(/\/$/, '').split('?')[0]
    return { instagramHandle: handle }
  }
  return { websiteUrl: v }
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1
        return (
          <div
            key={s}
            aria-hidden="true"
            className={cn(
              'h-1.5 flex-1 rounded-[2px] transition-all duration-200',
              s < current && 'bg-accent',
              s === current && 'bg-primary',
              s > current && 'bg-border-warm',
            )}
          />
        )
      })}
      <span className="ml-2 text-[12px] font-public-sans text-muted-text flex-shrink-0">
        {current}/{total}
      </span>
    </div>
  )
}

function Chip({
  label, selected, onClick, disabled,
}: {
  label: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded border text-[13px] font-[500] font-public-sans transition-colors',
        selected
          ? 'bg-primary text-white border-primary'
          : 'bg-surface text-muted-text border-border-warm hover:border-primary/40 hover:text-primary',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {label}
    </button>
  )
}

function Textarea({
  id, value, onChange, placeholder, rows = 4, disabled, maxLength,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  maxLength?: number
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      maxLength={maxLength}
      className={cn(
        'w-full rounded border border-border-warm bg-surface px-3 py-2.5',
        'text-[16px] font-public-sans text-primary placeholder:text-muted-text/60',
        'outline-none focus:ring-1 focus:ring-accent focus:border-accent',
        'transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    />
  )
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-border-warm last:border-0">
      <span className="text-[11px] font-[500] uppercase tracking-[0.06em] text-muted-text font-public-sans">
        {label}
      </span>
      <span className="text-[14px] font-public-sans text-primary leading-[1.4]">
        {value || <span className="text-muted-text italic text-[13px]">Not provided</span>}
      </span>
    </div>
  )
}

// ─── OTP Verification ─────────────────────────────────────────────────────────

function OtpVerifyStep({
  email,
  onVerified,
  onChangeEmail,
}: {
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true)
    try {
      await api.post('/auth/verify-email', { email, otp })
      onVerified()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    try {
      await api.post('/auth/resend-otp', { email })
      setResent(true)
    } catch { /* silent */ }
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailLoading(true)
    try {
      await onChangeEmail(newEmail.trim())
      setEditingEmail(false)
      setOtp('')
      setResent(false)
    } catch (err) {
      setEmailError(getApiError(err))
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center text-center py-10 gap-6">
      <div className="w-14 h-14 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center text-[24px]">
        ✉️
      </div>
      <div>
        <h2 className="text-[22px] font-[500] font-playfair text-primary mb-2">
          Check your email
        </h2>
        <p className="text-[14px] font-public-sans text-muted-text max-w-[360px] leading-[1.6]">
          We sent a 6-digit verification code to{' '}
          <strong className="text-primary">{email}</strong>. Enter it below.
        </p>
      </div>

      <form onSubmit={handleVerify} className="w-full max-w-[280px] flex flex-col gap-4">
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="text-center text-[24px] tracking-[0.3em] font-[600]"
          disabled={loading}
        />
        {error && (
          <p className="text-[12px] text-error font-public-sans">{error}</p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resent}
        className="text-[13px] font-public-sans text-muted-text hover:text-primary underline underline-offset-2 transition-colors disabled:opacity-50"
      >
        {resent ? 'Code resent!' : "Didn't receive it? Resend"}
      </button>

      {/* Wrong email inline edit */}
      {!editingEmail ? (
        <button
          type="button"
          onClick={() => { setEditingEmail(true); setNewEmail(email) }}
          className="text-[13px] font-public-sans text-muted-text hover:text-primary underline underline-offset-2 transition-colors"
        >
          Wrong email address?
        </button>
      ) : (
        <form
          onSubmit={handleEmailUpdate}
          className="w-full max-w-[320px] flex flex-col gap-3 p-4 rounded border border-border-warm bg-muted-bg"
        >
          <p className="text-[13px] font-[600] font-public-sans text-primary text-left">
            Update email address
          </p>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={emailLoading}
            autoFocus
          />
          {emailError && (
            <p className="text-[12px] text-error font-public-sans text-left">{emailError}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={emailLoading} className="flex-1">
              {emailLoading ? 'Updating…' : 'Update & resend code'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setEditingEmail(false); setEmailError(null) }}
              disabled={emailLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="flex flex-col items-center text-center py-12 gap-6">
      <div className="w-14 h-14 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center">
        <Check size={24} className="text-accent" />
      </div>
      <div>
        <h2 className="text-[26px] font-[500] font-playfair text-primary mb-3">
          Application submitted!
        </h2>
        <p className="text-[15px] font-public-sans text-muted-text max-w-[420px] leading-[1.6]">
          Your brand is under review. Our team will get back to you within 24–48 hours.
          Once approved, you'll receive an email and can log in to start listing products.
        </p>
      </div>
      <Link href="/">
        <Button variant="ghost" size="md">Return to home</Button>
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<string[]>(PRODUCT_CATEGORIES)
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const newCategoryRef = useRef<HTMLInputElement>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validateStep(): string | null {
    switch (step) {
      case 1:
        if (!form.websiteOrInstagram.trim()) return 'Please enter your website or Instagram URL.'
        if (form.categories.length === 0) return 'Please select at least one product category.'
        if (!form.city.trim()) return 'Please enter your city.'
        if (!form.state.trim()) return 'Please enter your state.'
        return null
      case 2:
        if (!form.brandName.trim()) return 'Please enter your brand name.'
        if (form.yearFounded) {
          const y = Number(form.yearFounded)
          if (y < 1900 || y > new Date().getFullYear()) return 'Please enter a valid year.'
        }
        return null
      case 3:
        if (form.brandStory.trim().length < 100) return 'Brand story must be at least 100 characters.'
        return null
      case 4:
        if (!form.wholesaleProductCount || Number(form.wholesaleProductCount) < 1)
          return 'Please enter the number of wholesale products.'
        if (!form.minimumOrderValue || Number(form.minimumOrderValue) < 1)
          return 'Please enter a minimum order value.'
        if (!form.leadTime) return 'Please select a typical lead time.'
        return null
      case 5:
        if (!form.gstNumber.trim() && !form.businessRegNumber.trim())
          return 'Please provide your GST number or business registration number.'
        return null
      case 6:
        if (form.shippingZones.length === 0) return 'Please select at least one shipping zone.'
        return null
      case 7:
        if (form.hasExportExperience === null) return 'Please indicate your export experience.'
        return null
      case 8:
        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
          return 'Please enter a valid email address.'
        if (form.password.length < 8) return 'Password must be at least 8 characters.'
        if (!/\d/.test(form.password)) return 'Password must contain at least one number.'
        if (form.password !== form.confirmPassword) return 'Passwords do not match.'
        return null
      case 9:
        if (!agreedToTerms) return 'Please agree to the Seller Terms to continue.'
        return null
      default:
        return null
    }
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const err = validateStep()
    if (err) { setError(err); return }

    if (step < 9) {
      setStep((s) => s + 1)
      return
    }

    // Final submit
    setLoading(true)
    try {
      const { instagramHandle, websiteUrl } = parseWebPresence(form.websiteOrInstagram)
      await api.post('/auth/brand/signup', {
        email: form.email,
        password: form.password,
        brandName: form.brandName,
        category: form.categories,
        countryOfOrigin: form.countryOfOrigin,
        ...(form.city.trim() && { city: form.city.trim() }),
        ...(form.state.trim() && { state: form.state.trim() }),
        ...(form.gstNumber.trim() && { gstNumber: form.gstNumber.trim() }),
        ...(form.businessRegNumber.trim() && { businessRegNumber: form.businessRegNumber.trim() }),
        ...(instagramHandle && { instagramHandle }),
        ...(websiteUrl && { websiteUrl }),
        ...(form.yearFounded && { yearFounded: Number(form.yearFounded) }),
        ...(form.brandStory.trim() && { brandStory: form.brandStory.trim() }),
        ...(form.existingRetailPartners.trim() && { existingRetailPartners: form.existingRetailPartners.trim() }),
      })
      setSubmittedEmail(form.email)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  // ── Post-submit screens ──────────────────────────────────────────────────────

  if (submittedEmail && !verified) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 py-12 px-6">
          <div className="max-w-[600px] mx-auto">
            <OtpVerifyStep
              email={submittedEmail}
              onVerified={() => setVerified(true)}
              onChangeEmail={async (newEmail) => {
                await api.post('/auth/change-pending-email', {
                  currentEmail: submittedEmail,
                  newEmail,
                })
                await api.post('/auth/resend-otp', { email: newEmail })
                set('email', newEmail)
                setSubmittedEmail(newEmail)
              }}
            />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (verified) {
    return (
      <div className="bg-bg min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 py-12 px-6">
          <div className="max-w-[600px] mx-auto">
            <SuccessScreen />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 py-12 px-6">
        {/* Header */}
        <div className="max-w-[600px] mx-auto mb-10">
          <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-2">
            Apply as a Brand
          </h1>
          <p className="text-[16px] font-public-sans text-muted-text leading-[1.5]">
            Join India&apos;s finest wholesale marketplace
          </p>
          <div className="mt-6">
            <StepIndicator current={step} total={TOTAL_STEPS} />
          </div>
        </div>

        <div className="max-w-[600px] mx-auto">
          <p className="text-[12px] font-[500] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-6">
            Step {step} — {STEP_LABELS[step - 1]}
          </p>

          <form onSubmit={handleNext} className="flex flex-col gap-6" noValidate>

            {/* ── Step 1: Brand Basics ─────────────────────────────────────── */}
            {step === 1 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="web">Brand website or Instagram</Label>
                  <Input
                    id="web"
                    type="text"
                    placeholder="https://yourbrand.com or @yourbrand"
                    value={form.websiteOrInstagram}
                    onChange={(e) => set('websiteOrInstagram', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Product categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        selected={form.categories.includes(cat)}
                        disabled={loading}
                        onClick={() => set('categories', toggle(form.categories, cat))}
                      />
                    ))}

                    {/* Add new category */}
                    {showNewCategoryInput ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={newCategoryRef}
                          type="text"
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const trimmed = newCategoryInput.trim()
                              if (trimmed && !categoryOptions.includes(trimmed)) {
                                setCategoryOptions((prev) => [...prev, trimmed])
                                set('categories', [...form.categories, trimmed])
                              } else if (trimmed && !form.categories.includes(trimmed)) {
                                set('categories', [...form.categories, trimmed])
                              }
                              setNewCategoryInput('')
                              setShowNewCategoryInput(false)
                            }
                            if (e.key === 'Escape') {
                              setNewCategoryInput('')
                              setShowNewCategoryInput(false)
                            }
                          }}
                          placeholder="Category name"
                          autoFocus
                          className="h-[36px] px-3 rounded border border-accent bg-surface text-[13px] font-public-sans text-primary outline-none w-[160px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newCategoryInput.trim()
                            if (trimmed && !categoryOptions.includes(trimmed)) {
                              setCategoryOptions((prev) => [...prev, trimmed])
                              set('categories', [...form.categories, trimmed])
                            } else if (trimmed && !form.categories.includes(trimmed)) {
                              set('categories', [...form.categories, trimmed])
                            }
                            setNewCategoryInput('')
                            setShowNewCategoryInput(false)
                          }}
                          className="h-[36px] px-3 rounded border border-accent bg-accent text-white text-[12px] font-[500] font-public-sans"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setShowNewCategoryInput(true)
                          setTimeout(() => newCategoryRef.current?.focus(), 50)
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded border border-dashed border-border-warm text-[13px] font-[500] font-public-sans text-muted-text hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                      >
                        <Plus size={13} aria-hidden="true" />
                        New category
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Jaipur"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g. Rajasthan"
                      value={form.state}
                      onChange={(e) => set('state', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Brand Identity ───────────────────────────────────── */}
            {step === 2 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="brandName">Brand name</Label>
                  <Input
                    id="brandName"
                    placeholder="e.g. Khadi Craft Studio"
                    value={form.brandName}
                    onChange={(e) => set('brandName', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tagline">
                    Tagline{' '}
                    <span className="text-muted-text font-[400]">(optional)</span>
                  </Label>
                  <Input
                    id="tagline"
                    placeholder={`"Handcrafted in Jaipur since 1998"`}
                    value={form.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                    disabled={loading}
                    maxLength={120}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="yearFounded">
                    Year founded{' '}
                    <span className="text-muted-text font-[400]">(optional)</span>
                  </Label>
                  <Input
                    id="yearFounded"
                    type="number"
                    placeholder="e.g. 2015"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={form.yearFounded}
                    onChange={(e) => set('yearFounded', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* ── Step 3: Brand Story ──────────────────────────────────────── */}
            {step === 3 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="brandStory">Brand story</Label>
                    <span className={cn(
                      'text-[11px] font-public-sans',
                      form.brandStory.length < 100 ? 'text-muted-text' : 'text-accent',
                    )}>
                      {form.brandStory.length} / 1000
                    </span>
                  </div>
                  <Textarea
                    id="brandStory"
                    value={form.brandStory}
                    onChange={(v) => set('brandStory', v)}
                    placeholder="Tell us about your brand's origins, the artisans behind it, and what drives you. Minimum 100 characters."
                    rows={6}
                    disabled={loading}
                    maxLength={1000}
                  />
                  {form.brandStory.length > 0 && form.brandStory.length < 100 && (
                    <p className="text-[11px] text-muted-text font-public-sans">
                      {100 - form.brandStory.length} more characters needed
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="uniqueValue">
                    What makes your products unique?{' '}
                    <span className="text-muted-text font-[400]">(optional)</span>
                  </Label>
                  <Textarea
                    id="uniqueValue"
                    value={form.uniqueValue}
                    onChange={(v) => set('uniqueValue', v)}
                    placeholder="e.g. Hand-block printed using natural dyes sourced from Rajasthan, zero chemical processes..."
                    rows={3}
                    disabled={loading}
                    maxLength={500}
                  />
                </div>
              </>
            )}

            {/* ── Step 4: Products & Capacity ──────────────────────────────── */}
            {step === 4 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="skuCount">Number of wholesale SKUs ready to list</Label>
                  <Input
                    id="skuCount"
                    type="number"
                    min={1}
                    placeholder="e.g. 42"
                    value={form.wholesaleProductCount}
                    onChange={(e) => set('wholesaleProductCount', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="moValue">Minimum order value (₹ INR)</Label>
                  <Input
                    id="moValue"
                    type="number"
                    min={1}
                    placeholder="e.g. 5000"
                    value={form.minimumOrderValue}
                    onChange={(e) => set('minimumOrderValue', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-[11px] text-muted-text font-public-sans">
                    The minimum total a buyer must spend per order at your store.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="leadTime">Typical lead time</Label>
                  <Select value={form.leadTime} onValueChange={(v) => set('leadTime', v)}>
                    <SelectTrigger id="leadTime">
                      <SelectValue placeholder="Select lead time" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_TIMES.map((lt) => (
                        <SelectItem key={lt.value} value={lt.value}>
                          {lt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* ── Step 5: Business Credentials ────────────────────────────── */}
            {step === 5 && (
              <>
                <div className="rounded border border-border-warm bg-muted-bg px-4 py-3 text-[13px] font-public-sans text-muted-text leading-[1.5]">
                  At least one of GST number or business registration number is required to verify your business legitimacy.
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gst">
                    GST number{' '}
                    <span className="text-muted-text font-[400]">(if registered)</span>
                  </Label>
                  <Input
                    id="gst"
                    placeholder="e.g. 08AAACK2596N1ZN"
                    value={form.gstNumber}
                    onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
                    disabled={loading}
                    maxLength={15}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border-warm" />
                  <span className="text-[12px] font-public-sans text-muted-text">or</span>
                  <div className="flex-1 h-px bg-border-warm" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="businessReg">Business registration number</Label>
                  <Input
                    id="businessReg"
                    placeholder="e.g. U74999DL2019PTC354657"
                    value={form.businessRegNumber}
                    onChange={(e) => set('businessRegNumber', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="country">Country of origin</Label>
                  <Select
                    value={form.countryOfOrigin}
                    onValueChange={(v) => set('countryOfOrigin', v)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* ── Step 6: Shipping Zones ───────────────────────────────────── */}
            {step === 6 && (
              <>
                <p className="text-[14px] font-public-sans text-muted-text leading-[1.5]">
                  Select all regions you can ship to. You can adjust this per product from your portal.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SHIPPING_ZONES.map((zone) => (
                    <Chip
                      key={zone.value}
                      label={zone.label}
                      selected={form.shippingZones.includes(zone.value)}
                      onClick={() => set('shippingZones', toggle(form.shippingZones, zone.value))}
                      disabled={loading}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── Step 7: Existing Presence ────────────────────────────────── */}
            {step === 7 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="partners">
                    Existing retail partners{' '}
                    <span className="text-muted-text font-[400]">(optional)</span>
                  </Label>
                  <Textarea
                    id="partners"
                    value={form.existingRetailPartners}
                    onChange={(v) => set('existingRetailPartners', v)}
                    placeholder="e.g. Wolf & Badger London, Liberty London, The Conran Shop..."
                    rows={3}
                    disabled={loading}
                    maxLength={500}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Do you have international export experience?</Label>
                  <div className="flex gap-3">
                    {[
                      { value: true as boolean, label: 'Yes, we export internationally' },
                      { value: false as boolean, label: "No, this would be our first time" },
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => set('hasExportExperience', opt.value)}
                        disabled={loading}
                        className={cn(
                          'flex-1 px-4 py-3 rounded border text-[13px] font-[500] font-public-sans text-left transition-colors leading-[1.4]',
                          form.hasExportExperience === opt.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-muted-text border-border-warm hover:border-primary/40 hover:text-primary',
                          loading && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Step 8: Account Setup ────────────────────────────────────── */}
            {step === 8 && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@yourbrand.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-[11px] text-muted-text font-public-sans">
                    You&apos;ll verify this with a 6-digit code after submitting.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters with 1 number"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">
                    Phone{' '}
                    <span className="text-muted-text font-[400]">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* ── Step 9: Review & Submit ──────────────────────────────────── */}
            {step === 9 && (
              <>
                <div className="rounded border border-border-warm bg-surface overflow-hidden divide-y divide-border-warm">
                  {/* Brand */}
                  <div className="px-4 py-3">
                    <p className="text-[11px] font-[600] uppercase tracking-[0.06em] text-muted-text font-public-sans mb-1">
                      Brand
                    </p>
                    <ReviewRow label="Brand name" value={form.brandName} />
                    <ReviewRow label="Categories" value={form.categories.join(', ')} />
                    <ReviewRow label="Location" value={[form.city, form.state].filter(Boolean).join(', ')} />
                    <ReviewRow label="Year founded" value={form.yearFounded} />
                    <ReviewRow label="Tagline" value={form.tagline} />
                    <ReviewRow label="Website / Instagram" value={form.websiteOrInstagram} />
                  </div>

                  {/* Story */}
                  <div className="px-4 py-3">
                    <p className="text-[11px] font-[600] uppercase tracking-[0.06em] text-muted-text font-public-sans mb-1">
                      Story
                    </p>
                    <ReviewRow
                      label="Brand story"
                      value={
                        <span className="line-clamp-3 text-[13px] leading-[1.5]">
                          {form.brandStory}
                        </span>
                      }
                    />
                  </div>

                  {/* Products */}
                  <div className="px-4 py-3">
                    <p className="text-[11px] font-[600] uppercase tracking-[0.06em] text-muted-text font-public-sans mb-1">
                      Products & capacity
                    </p>
                    <ReviewRow label="Wholesale SKUs" value={form.wholesaleProductCount} />
                    <ReviewRow
                      label="Minimum order value"
                      value={form.minimumOrderValue ? `₹${Number(form.minimumOrderValue).toLocaleString('en-IN')}` : ''}
                    />
                    <ReviewRow
                      label="Lead time"
                      value={LEAD_TIMES.find((l) => l.value === form.leadTime)?.label}
                    />
                    <ReviewRow
                      label="Shipping zones"
                      value={form.shippingZones
                        .map((z) => SHIPPING_ZONES.find((s) => s.value === z)?.label)
                        .filter(Boolean)
                        .join(', ')}
                    />
                  </div>

                  {/* Business */}
                  <div className="px-4 py-3">
                    <p className="text-[11px] font-[600] uppercase tracking-[0.06em] text-muted-text font-public-sans mb-1">
                      Business
                    </p>
                    <ReviewRow label="GST number" value={form.gstNumber} />
                    <ReviewRow label="Business reg. number" value={form.businessRegNumber} />
                    <ReviewRow
                      label="Country of origin"
                      value={COUNTRIES.find((c) => c.code === form.countryOfOrigin)?.name}
                    />
                    <ReviewRow label="Retail partners" value={form.existingRetailPartners} />
                    <ReviewRow
                      label="Export experience"
                      value={
                        form.hasExportExperience === null ? '' :
                        form.hasExportExperience ? 'Yes' : 'No'
                      }
                    />
                  </div>

                  {/* Account */}
                  <div className="px-4 py-3">
                    <p className="text-[11px] font-[600] uppercase tracking-[0.06em] text-muted-text font-public-sans mb-1">
                      Account
                    </p>
                    <ReviewRow label="Email" value={form.email} />
                    <ReviewRow label="Phone" value={form.phone} />
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={loading}
                    />
                    <div className={cn(
                      'w-4 h-4 rounded border transition-colors flex items-center justify-center',
                      agreedToTerms
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border-warm group-hover:border-primary/40',
                    )}>
                      {agreedToTerms && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-[13px] font-public-sans text-muted-text leading-[1.5]">
                    I agree to Solomon Bharat&apos;s{' '}
                    <Link
                      href="/terms"
                      className="text-primary underline underline-offset-2 hover:text-accent transition-colors"
                    >
                      Seller Terms
                    </Link>{' '}
                    and confirm all information provided is accurate.
                  </span>
                </label>
              </>
            )}

            {/* ── Error ──────────────────────────────────────────────────────── */}
            {error && (
              <p className="text-[12px] font-public-sans text-error" role="alert">
                {error}
              </p>
            )}

            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <div className={cn('flex gap-3 pt-2', step === 1 ? 'justify-end' : 'justify-between')}>
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => { setError(null); setStep((s) => s - 1) }}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  Back
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading ? 'Submitting…' : step === 9 ? (
                  <>Submit application <Check size={15} aria-hidden="true" /></>
                ) : (
                  <>Next <ArrowRight size={15} aria-hidden="true" /></>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-[12px] font-public-sans text-muted-text text-center border-t border-border-warm pt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary font-[600] underline underline-offset-2 hover:text-accent transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
