'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3

const STORE_TYPES = [
  { value: 'boutique', label: 'Boutique' },
  { value: 'gift_shop', label: 'Gift Shop' },
  { value: 'subscription_box', label: 'Subscription Box' },
  { value: 'online_store', label: 'Online Store' },
  { value: 'pop_up', label: 'Pop-up' },
  { value: 'other', label: 'Other' },
]

const STORE_AESTHETICS = [
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'bohemian', label: 'Bohemian' },
  { value: 'artisan', label: 'Artisan' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'eclectic', label: 'Eclectic' },
]

const CATEGORIES = [
  { value: 'textiles', label: 'Textiles' },
  { value: 'home_decor', label: 'Home Decor' },
  { value: 'jewellery', label: 'Jewellery' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'food_wellness', label: 'Food & Wellness' },
  { value: 'stationery', label: 'Stationery' },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: number
  total: number
}

function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isDone = step < current
        const isCurrent = step === current

        return (
          <div
            key={step}
            className={cn(
              'h-1 flex-1 rounded-[2px] transition-all duration-300',
              isDone && 'bg-accent',
              isCurrent && 'bg-primary',
              !isDone && !isCurrent && 'bg-border-warm'
            )}
            aria-hidden="true"
          />
        )
      })}
      <span className="text-[12px] font-public-sans text-muted-text flex-shrink-0 ml-1">
        {current}/{total}
      </span>
    </div>
  )
}

// ─── Option card ──────────────────────────────────────────────────────────────

interface OptionCardProps {
  label: string
  selected: boolean
  onClick: () => void
}

function OptionCard({ label, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-5 rounded border text-left transition-colors',
        'text-[14px] leading-[1.4] font-[600] font-public-sans',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
        selected
          ? 'border-accent bg-accent/[5%] text-primary'
          : 'border-border-warm text-primary hover:border-primary/30 hover:bg-muted-bg'
      )}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}

// ─── Multi-select pill ────────────────────────────────────────────────────────

interface PillProps {
  label: string
  selected: boolean
  onClick: () => void
}

function Pill({ label, selected, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded border text-[14px] font-[500] font-public-sans transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
        selected
          ? 'border-accent bg-accent/[8%] text-primary font-[600]'
          : 'border-border-warm text-muted-text hover:border-primary/30 hover:text-primary hover:bg-muted-bg'
      )}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyerOnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [storeType, setStoreType] = useState<string | null>(null)
  const [aesthetic, setAesthetic] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggleCategory(value: string) {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    )
  }

  function canAdvance() {
    if (step === 1) return storeType !== null
    if (step === 2) return aesthetic !== null
    if (step === 3) return selectedCategories.length > 0
    return false
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  async function handleNext() {
    if (!canAdvance()) return

    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
      return
    }

    // Step 3: complete onboarding
    setSaving(true)
    try {
      await api.post('/auth/store-quiz', { storeType, aesthetic, categoryInterests: selectedCategories })
      router.push('/catalogue')
    } catch {
      // fail silently — redirect anyway for now
      router.push('/catalogue')
    } finally {
      setSaving(false)
    }
  }

  // ─── Step content ───────────────────────────────────────────────────────────

  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mb-1">
              What type of store do you run?
            </h2>
            <p className="text-[14px] font-public-sans text-muted-text mb-6">
              This helps us personalise your catalogue experience.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STORE_TYPES.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={storeType === opt.value}
                  onClick={() => setStoreType(opt.value)}
                />
              ))}
            </div>
          </>
        )

      case 2:
        return (
          <>
            <h2 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mb-1">
              What&apos;s your store&apos;s aesthetic?
            </h2>
            <p className="text-[14px] font-public-sans text-muted-text mb-6">
              We&apos;ll surface brands that match your visual direction.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STORE_AESTHETICS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  selected={aesthetic === opt.value}
                  onClick={() => setAesthetic(opt.value)}
                />
              ))}
            </div>
          </>
        )

      case 3:
        return (
          <>
            <h2 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mb-1">
              Which product categories interest you?
            </h2>
            <p className="text-[14px] font-public-sans text-muted-text mb-6">
              Select all that apply — you can change these in your settings.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.map((cat) => (
                <Pill
                  key={cat.value}
                  label={cat.label}
                  selected={selectedCategories.includes(cat.value)}
                  onClick={() => toggleCategory(cat.value)}
                />
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <p className="mt-3 text-[12px] font-public-sans text-muted-text">
                Select at least one category to continue.
              </p>
            )}
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div
        className={cn(
          'w-full max-w-[560px]',
          'bg-surface border border-border-warm rounded p-8'
        )}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="font-playfair text-[18px] font-[600] text-primary leading-none block mb-6"
        >
          Solomon Bharat
        </Link>

        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator current={step} total={TOTAL_STEPS} />
        </div>

        {/* Step content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border-warm">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="md"
              onClick={handleBack}
              disabled={saving}
            >
              Back
            </Button>
          ) : (
            <div aria-hidden="true" />
          )}

          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            disabled={!canAdvance() || saving}
          >
            {saving
              ? 'Saving…'
              : step === TOTAL_STEPS
              ? 'Complete setup'
              : 'Next'}
          </Button>
        </div>

        {/* Skip */}
        {step < TOTAL_STEPS && (
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-[12px] font-public-sans text-muted-text hover:text-primary transition-colors underline underline-offset-2"
              onClick={() => router.push('/catalogue')}
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
