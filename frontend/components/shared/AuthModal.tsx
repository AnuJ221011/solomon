'use client'

import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { User } from '@/types'

// ─── API response shapes ──────────────────────────────────────────────────────

interface AuthResponse {
  user: User
  accessToken: string
}

// ─── Country list (ISO-2 codes) ───────────────────────────────────────────────

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

// ─── Form state ───────────────────────────────────────────────────────────────

interface SignupForm {
  businessName: string
  email: string
  password: string
  countryCode: string
}

interface LoginForm {
  email: string
  password: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthModal() {
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen)
  const authModalTab = useAuthStore((s) => s.authModalTab)
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal)
  const setUser = useAuthStore((s) => s.setUser)
  const openAuthModal = useAuthStore((s) => s.openAuthModal)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Forgot password state ───────────────────────────────────────────────────
  const [forgotView, setForgotView] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() })
      setForgotSent(true)
    } catch {
      // show success regardless to avoid email enumeration
      setForgotSent(true)
    } finally {
      setLoading(false)
    }
  }

  function exitForgotView() {
    setForgotView(false)
    setForgotEmail('')
    setForgotSent(false)
    setError(null)
  }

  // ── Signup form state ───────────────────────────────────────────────────────
  const [signupForm, setSignupForm] = useState<SignupForm>({
    businessName: '',
    email: '',
    password: '',
    countryCode: '',
  })

  // ── Login form state ────────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
  })

  function handleTabChange(tab: string) {
    setError(null)
    openAuthModal(tab as 'login' | 'signup')
  }

  // ── Signup submit ───────────────────────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!signupForm.businessName.trim()) {
      setError('Business name is required.')
      return
    }
    if (!signupForm.email.trim()) {
      setError('Email is required.')
      return
    }
    if (signupForm.password.length < 8 || !/\d/.test(signupForm.password)) {
      setError('Password must be at least 8 characters and contain a number.')
      return
    }
    if (!signupForm.countryCode) {
      setError('Please select your country.')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/buyer/signup', {
        businessName: signupForm.businessName,
        email: signupForm.email,
        password: signupForm.password,
        countryCode: signupForm.countryCode,
      })
      const { user, accessToken } = response.data.data as AuthResponse

      if (typeof window !== 'undefined' && accessToken) {
        localStorage.setItem('sb_token', accessToken)
      }
      setUser(user)
      closeAuthModal()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // ── Login submit ────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!loginForm.email.trim()) {
      setError('Email is required.')
      return
    }
    if (!loginForm.password) {
      setError('Password is required.')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email: loginForm.email,
        password: loginForm.password,
      })
      const { user, accessToken } = response.data.data as AuthResponse

      if (typeof window !== 'undefined' && accessToken) {
        localStorage.setItem('sb_token', accessToken)
      }
      setUser(user)
      closeAuthModal()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid email or password.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent
        className={cn(
          'w-full max-w-[800px] max-h-[560px] p-0 overflow-hidden',
          'flex flex-row'
        )}
        showClose={false}
      >
        {/* ── Left editorial panel (desktop only) ── */}
        <div
          className={cn(
            'hidden md:flex flex-col items-center justify-center',
            'w-1/2 flex-shrink-0',
            'bg-gradient-to-br from-muted-bg to-border-warm',
            'relative overflow-hidden'
          )}
          aria-hidden="true"
        >
          {/* Decorative line art background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            viewBox="0 0 400 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="200" cy="280" r="160" stroke="#1A1A1A" strokeWidth="1" />
            <circle cx="200" cy="280" r="110" stroke="#1A1A1A" strokeWidth="1" />
            <circle cx="200" cy="280" r="60" stroke="#1A1A1A" strokeWidth="1" />
            <line x1="40" y1="280" x2="360" y2="280" stroke="#1A1A1A" strokeWidth="1" />
            <line x1="200" y1="120" x2="200" y2="440" stroke="#1A1A1A" strokeWidth="1" />
          </svg>

          {/* Text content */}
          <div className="relative z-10 text-center px-8">
            <p className="font-playfair text-[28px] font-[500] text-primary leading-[1.2]">
              Indian Craft &amp;
              <br />
              Textile Heritage
            </p>
            <p className="mt-3 text-[14px] font-public-sans text-muted-text leading-[1.5]">
              Curated wholesale brands from India's finest artisan communities.
            </p>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex flex-col w-full md:w-1/2 p-8 overflow-y-auto relative">
          {/* Close button */}
          <DialogClose className="absolute top-4 right-4 text-muted-text hover:text-primary transition-colors">
            <X size={18} aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogClose>

          {/* Wordmark */}
          <p className="font-playfair text-[20px] font-[600] text-primary mb-6">
            Solomon Bharat
          </p>

          {/* ── Forgot password view ── */}
          {forgotView ? (
            <div className="flex-1">
              <button
                type="button"
                onClick={exitForgotView}
                className="text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors mb-6 flex items-center gap-1"
              >
                ← Back to log in
              </button>
              <h2 className="text-[20px] font-[500] font-playfair text-primary mb-1">Reset password</h2>
              <p className="text-[14px] font-public-sans text-muted-text mb-6">
                Enter your email and we'll send a reset link.
              </p>
              {forgotSent ? (
                <div className="rounded border border-success/30 bg-success/5 px-4 py-3">
                  <p className="text-[14px] font-[500] font-public-sans text-success">
                    If an account exists for {forgotEmail}, you'll receive a reset link shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="forgot-email">Email address</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                    {loading ? 'Sending…' : 'Send reset link'}
                  </Button>
                </form>
              )}
            </div>
          ) : (
          /* Tabs */
          <Tabs
            value={authModalTab}
            onValueChange={handleTabChange}
            className="flex-1"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="signup">Create account</TabsTrigger>
              <TabsTrigger value="login">Log in</TabsTrigger>
            </TabsList>

            {/* ── Signup tab ── */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="flex flex-col gap-4" noValidate>
                <div>
                  <Label htmlFor="signup-business">Business name</Label>
                  <Input
                    id="signup-business"
                    type="text"
                    placeholder="e.g. Artisan Weaves Co."
                    autoComplete="organization"
                    value={signupForm.businessName}
                    onChange={(e) =>
                      setSignupForm((f) => ({ ...f, businessName: e.target.value }))
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm((f) => ({ ...f, email: e.target.value }))
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Min 8 chars, include a number"
                    autoComplete="new-password"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm((f) => ({ ...f, password: e.target.value }))
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="signup-country">Country</Label>
                  <select
                    id="signup-country"
                    value={signupForm.countryCode}
                    onChange={(e) =>
                      setSignupForm((f) => ({ ...f, countryCode: e.target.value }))
                    }
                    disabled={loading}
                    className={cn(
                      'mt-1 w-full h-10 px-3 rounded border border-border-warm bg-muted-bg/30',
                      'text-[14px] font-public-sans text-primary',
                      'focus:outline-none focus:border-primary/40 focus:bg-surface',
                      'transition-colors duration-150 appearance-none cursor-pointer',
                      !signupForm.countryCode && 'text-muted-text'
                    )}
                  >
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-[12px] font-public-sans text-error" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-1"
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>

                <p className="text-[12px] leading-[1.3] font-[400] font-public-sans text-muted-text text-center">
                  By signing up you agree to our{' '}
                  <a href="/terms" className="underline hover:text-primary transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="underline hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </TabsContent>

            {/* ── Login tab ── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm((f) => ({ ...f, email: e.target.value }))
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((f) => ({ ...f, password: e.target.value }))
                    }
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-[12px] font-public-sans text-error" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-1"
                  disabled={loading}
                >
                  {loading ? 'Logging in…' : 'Log in'}
                </Button>

                <div className="flex justify-center">
                  <button
                    type="button"
                    className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline"
                    onClick={() => setForgotView(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
