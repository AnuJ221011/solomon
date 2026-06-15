'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import type { User } from '@/types'

// ─── API shape ────────────────────────────────────────────────────────────────

interface AuthResponse {
  user: User
  accessToken: string
}

// ─── Country list ─────────────────────────────────────────────────────────────

const COUNTRIES: { label: string; code: string }[] = [
  { label: 'Australia',            code: 'AU' },
  { label: 'Canada',               code: 'CA' },
  { label: 'France',               code: 'FR' },
  { label: 'Germany',              code: 'DE' },
  { label: 'India',                code: 'IN' },
  { label: 'Japan',                code: 'JP' },
  { label: 'Netherlands',          code: 'NL' },
  { label: 'New Zealand',          code: 'NZ' },
  { label: 'Singapore',            code: 'SG' },
  { label: 'United Arab Emirates', code: 'AE' },
  { label: 'United Kingdom',       code: 'GB' },
  { label: 'United States',        code: 'US' },
]

// ─── Buyer signup form ────────────────────────────────────────────────────────

function BuyerSignupForm() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!businessName.trim()) {
      setError('Business name is required.')
      return
    }
    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and contain a number.')
      return
    }
    if (!country) {
      setError('Please select your country.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/buyer/signup', {
        businessName,
        email,
        password,
        countryCode: country,
      })

      if (typeof window !== 'undefined' && data.accessToken) {
        localStorage.setItem('sb_token', data.accessToken)
      }
      setUser(data.user)
      router.push(`/verify-email?next=/onboarding/buyer&email=${encodeURIComponent(email)}`)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyer-business">Business name</Label>
        <Input
          id="buyer-business"
          type="text"
          placeholder="e.g. The Curated Corner"
          autoComplete="organization"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyer-email">Email</Label>
        <Input
          id="buyer-email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyer-password">Password</Label>
        <Input
          id="buyer-password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyer-country">Country</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger id="buyer-country">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-error" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text text-center">
        By signing up you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-primary transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-primary transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}

// ─── Brand inquiry tab ────────────────────────────────────────────────────────

function BrandInquiryTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Info block */}
      <div className="rounded border border-border-warm bg-muted-bg p-5">
        <p className="text-[14px] font-[600] font-public-sans text-primary mb-1">
          Sell on Solomon Bharat
        </p>
        <p className="text-[13px] font-public-sans text-muted-text leading-[1.5]">
          We partner with India's finest artisan brands to connect them with international retailers.
          Applications are reviewed within 24–48 hours.
        </p>
      </div>

      {/* CTA */}
      <Link href="/apply">
        <Button variant="primary" size="lg" className="w-full">
          Start Brand Application
        </Button>
      </Link>

      {/* Already applied */}
      <p className="text-[13px] font-public-sans text-muted-text text-center">
        Already applied?{' '}
        <Link
          href="/login"
          className="text-primary font-[600] underline underline-offset-2 hover:text-accent transition-colors"
        >
          Log in to check your status
        </Link>
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  return (
    <div className="bg-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div
        className={cn(
          'bg-surface border border-border-warm rounded p-8',
          'w-full max-w-[440px]'
        )}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="font-playfair text-[24px] font-[600] text-primary leading-none block mb-6"
        >
          Solomon Bharat
        </Link>

        {/* Tabs */}
        <Tabs defaultValue="buyer" className="w-full">
          <TabsList className="mb-8 w-full">
            <TabsTrigger value="buyer" className="flex-1">
              Sign up to buy
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex-1">
              Apply as a brand
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyer">
            <BuyerSignupForm />
          </TabsContent>

          <TabsContent value="brand">
            <BrandInquiryTab />
          </TabsContent>
        </Tabs>

        {/* Log in link */}
        <div className="mt-6 pt-5 border-t border-border-warm text-center">
          <p className="text-[13px] font-public-sans text-muted-text">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary font-[600] underline underline-offset-2 hover:text-accent transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
