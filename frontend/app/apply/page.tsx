'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavBar } from '@/components/shared/NavBar'
import { Footer } from '@/components/shared/Footer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { getApiError } from '@/lib/getApiError'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9

const CATEGORIES = [
  'Textiles',
  'Home Decor',
  'Jewellery',
  'Accessories',
  'Apparel',
  'Food & Wellness',
  'Art & Craft',
  'Stationery',
  'Other',
]

// ─── Step progress indicator ──────────────────────────────────────────────────

interface StepIndicatorProps {
  current: number
  total: number
}

function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total} aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isDone = step < current
        const isCurrent = step === current

        return (
          <div
            key={step}
            className={cn(
              'h-1.5 rounded-[2px] transition-all duration-200',
              step <= 4 ? 'flex-1' : 'flex-1',
              isDone && 'bg-accent',
              isCurrent && 'bg-primary',
              !isDone && !isCurrent && 'bg-border-warm'
            )}
            aria-hidden="true"
          />
        )
      })}
      <span className="ml-2 text-[12px] font-public-sans text-muted-text flex-shrink-0">
        {current}/{total}
      </span>
    </div>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface Step1Form {
  websiteOrInstagram: string
  category: string
  city: string
  state: string
  wholesaleProductCount: string
  internationalPartnerships: string
}

// ─── Submitted state ──────────────────────────────────────────────────────────

function SubmittedState() {
  return (
    <div className="flex flex-col items-center text-center py-12">
      <span className="w-12 h-12 rounded-full bg-muted-bg border border-border-warm flex items-center justify-center mb-4">
        <Check size={22} className="text-accent" aria-hidden="true" />
      </span>
      <h2 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mb-2">
        Application submitted
      </h2>
      <p className="text-[16px] leading-[1.5] font-[400] font-public-sans text-muted-text max-w-[400px]">
        Our team will review your application within 24–48 hours. We&apos;ll reach out to you by email with next steps.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="ghost" size="md">
          Return to home
        </Button>
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const [currentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Step1Form>({
    websiteOrInstagram: '',
    category: '',
    city: '',
    state: '',
    wholesaleProductCount: '',
    internationalPartnerships: '',
  })

  function updateField(field: keyof Step1Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate required fields for step 1
    if (!form.websiteOrInstagram.trim()) {
      setError('Please enter your website or Instagram URL.')
      return
    }
    if (!form.category) {
      setError('Please select a product category.')
      return
    }
    if (!form.city.trim()) {
      setError('Please enter your city.')
      return
    }
    if (!form.state.trim()) {
      setError('Please enter your state.')
      return
    }
    if (!form.wholesaleProductCount.trim() || Number(form.wholesaleProductCount) < 1) {
      setError('Please enter the number of wholesale products available.')
      return
    }

    // For this MVP implementation, step 1 is the only step — submit the application
    setLoading(true)
    try {
      await api.post('/brand-applications', form)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 py-12 px-6">
        {/* Page header */}
        <div className="max-w-[600px] mx-auto mb-10">
          <h1 className="text-[32px] leading-[1.2] font-[500] font-playfair text-primary mb-2">
            Apply as a Brand
          </h1>
          <p className="text-[16px] leading-[1.5] font-[400] font-public-sans text-muted-text">
            Join India&apos;s finest wholesale marketplace
          </p>

          {/* Progress */}
          {!submitted && (
            <div className="mt-6">
              <StepIndicator current={currentStep} total={TOTAL_STEPS} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-[600px] mx-auto">
          {submitted ? (
            <SubmittedState />
          ) : (
            <>
              {/* Step label */}
              <p className="text-[12px] leading-[1.3] font-[500] font-public-sans text-muted-text uppercase tracking-[0.06em] mb-6">
                Step 1 — Brand basics
              </p>

              {/* Form */}
              <form onSubmit={handleNext} className="flex flex-col gap-6" noValidate>
                {/* Website or Instagram */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="website">Brand website or Instagram URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourbrand.com or @yourbrand"
                    value={form.websiteOrInstagram}
                    onChange={(e) => updateField('websiteOrInstagram', e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="category">Product category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => updateField('category', v)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City + State */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="e.g. Jaipur"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="e.g. Rajasthan"
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Wholesale product count */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="product-count">Number of wholesale products available</Label>
                  <Input
                    id="product-count"
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={form.wholesaleProductCount}
                    onChange={(e) => updateField('wholesaleProductCount', e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* International partnerships */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="partnerships">
                    Existing international retail partnerships?{' '}
                    <span className="text-muted-text font-[400]">(optional)</span>
                  </Label>
                  <textarea
                    id="partnerships"
                    placeholder="e.g. Stocked at Liberty London, Wolf & Badger, etc."
                    value={form.internationalPartnerships}
                    onChange={(e) => updateField('internationalPartnerships', e.target.value)}
                    disabled={loading}
                    rows={3}
                    className={cn(
                      'w-full rounded border border-border-warm bg-surface px-3 py-2.5',
                      'text-[16px] font-public-sans text-primary',
                      'placeholder:text-muted-text/60',
                      'outline-none focus:ring-1 focus:ring-accent focus:border-accent',
                      'transition-colors resize-none',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  />
                </div>

                {error && (
                  <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-error" role="alert">
                    {error}
                  </p>
                )}

                {/* CTA */}
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? 'Submitting…' : (
                      <>
                        Next: Brand Story
                        <ArrowRight size={16} aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Footer note */}
              <p className="mt-8 text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text text-center border-t border-border-warm pt-6">
                Applications are reviewed within 24–48 hours. Not all applicants are approved.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
