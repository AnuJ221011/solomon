'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/useAuthStore'
import api from '@/lib/api'

// ─── OTP digit input ─────────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  const digits = value.padEnd(6, ' ').split('')

  function handleChange(i: number, char: string) {
    const cleaned = char.replace(/\D/g, '').slice(-1)
    const arr = digits.map((d) => (d === ' ' ? '' : d))
    arr[i] = cleaned
    onChange(arr.join(''))
    if (cleaned && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i]?.trim() && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted.padEnd(6, ' ').slice(0, 6))
      refs.current[Math.min(pasted.length, 5)]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'w-12 h-14 text-center text-[22px] font-[600] font-public-sans rounded border',
            'text-primary bg-surface focus:outline-none transition-colors',
            d.trim() ? 'border-primary' : 'border-border-warm',
            'focus:border-accent'
          )}
        />
      ))}
    </div>
  )
}

// ─── Inner page (needs useSearchParams) ──────────────────────────────────────

function VerifyEmailInner() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const next = params.get('next') ?? '/'
  const patchUser = useAuthStore((s) => s.patchUser)

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendSent, setResendSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.replace(/\D/g, '').length < 6) { setError('Enter all 6 digits.'); return }
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/verify-email', { email, otp })
      patchUser({ verified: true })
      router.push(next)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendLoading(true)
    try {
      await api.post('/auth/resend-otp', { email })
      setResendSent(true)
    } catch {
      // silently ignore to avoid enumeration
      setResendSent(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="bg-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-surface border border-border-warm rounded p-8 w-full max-w-[420px]">
        {/* Wordmark */}
        <Link href="/" className="font-playfair text-[22px] font-[600] text-primary leading-none block mb-8">
          Solomon Bharat
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-[22px] font-[500] font-playfair text-primary mb-1">Check your email</h1>
          <p className="text-[14px] font-public-sans text-muted-text leading-[1.5]">
            We sent a 6-digit code to{' '}
            {email ? <span className="font-[600] text-primary">{email}</span> : 'your email address'}.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <OtpInput value={otp} onChange={setOtp} />

          {error && (
            <p className="text-[12px] font-public-sans text-error text-center" role="alert">{error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify email'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          {resendSent ? (
            <p className="text-[13px] font-public-sans text-success">Code resent! Check your inbox.</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors disabled:opacity-50"
            >
              {resendLoading ? 'Sending…' : "Didn't receive it? Resend code"}
            </button>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-border-warm text-center">
          <Link
            href={next}
            className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline underline-offset-2"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Page (Suspense wrapper for useSearchParams) ──────────────────────────────

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}
