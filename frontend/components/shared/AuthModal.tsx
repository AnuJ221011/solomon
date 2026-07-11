'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { User } from '@/types'

function roleDestination(role: string) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'BRAND') return '/portal'
  return null // buyers stay on the current page
}

// ─── API response shapes ──────────────────────────────────────────────────────

interface AuthResponse {
  user: User
  accessToken: string
}

function extractErrorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
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
  phone: string
  countryCode: string
}

interface LoginForm {
  email: string
  password: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthModal() {
  const router = useRouter()
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
    phone: '',
    countryCode: '',
  })
  // Buyer signup is two-step: 'form' collects details and sends a code,
  // 'verify' confirms the code before the account actually gets created.
  const [signupStep, setSignupStep] = useState<'form' | 'verify'>('form')
  const [signupOtp, setSignupOtp] = useState('')
  const [signupResendSent, setSignupResendSent] = useState(false)

  // ── Login form state ────────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
  })
  // Password and one-time-code are two independent ways to reach the same
  // signed-in result — loginMethod picks which form is shown.
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')
  const [otpLoginStep, setOtpLoginStep] = useState<'request' | 'verify'>('request')
  const [otpLoginCode, setOtpLoginCode] = useState('')
  const [otpLoginResendSent, setOtpLoginResendSent] = useState(false)

  function resetFlowState() {
    setError(null)
    setSignupStep('form')
    setSignupOtp('')
    setSignupResendSent(false)
    setLoginMethod('password')
    setOtpLoginStep('request')
    setOtpLoginCode('')
    setOtpLoginResendSent(false)
  }

  // Start every fresh open on a clean slate — otherwise a user could close
  // the modal mid-OTP-entry and reopen it to a stale "enter code" screen.
  useEffect(() => {
    if (isAuthModalOpen) resetFlowState()
  }, [isAuthModalOpen])

  function handleTabChange(tab: string) {
    resetFlowState()
    openAuthModal(tab as 'login' | 'signup')
  }

  // Shared by every path that ends in a signed-in session (password login,
  // OTP login, and signup-verify) so they all "proceed in the same way".
  function completeAuthSuccess(user: User, accessToken: string) {
    if (typeof window !== 'undefined' && accessToken) {
      localStorage.setItem('sb_token', accessToken)
    }
    setUser(user)
    closeAuthModal()

    const dest = roleDestination(user.role)
    if (dest) router.push(dest)
  }

  // ── Signup submit (step 1 — sends the verification code) ───────────────────
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
    if (!signupForm.phone.trim() || signupForm.phone.trim().length < 7) {
      setError('Please enter a valid phone number.')
      return
    }
    if (!signupForm.countryCode) {
      setError('Please select your country.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/buyer/signup', {
        businessName: signupForm.businessName,
        email: signupForm.email,
        password: signupForm.password,
        phone: signupForm.phone.trim(),
        countryCode: signupForm.countryCode,
      })
      setSignupStep('verify')
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Signup submit (step 2 — verifies the code, creates the account) ────────
  async function handleVerifySignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (signupOtp.replace(/\D/g, '').length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/buyer/signup/verify', {
        email: signupForm.email,
        otp: signupOtp,
      })
      const { user, accessToken } = response.data.data as AuthResponse
      completeAuthSuccess(user, accessToken)
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Invalid or expired code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResendSignupOtp() {
    setLoading(true)
    try {
      await api.post('/auth/resend-otp', { email: signupForm.email })
      setSignupResendSent(true)
    } catch {
      setSignupResendSent(true) // avoid confirming/denying account existence
    } finally {
      setLoading(false)
    }
  }

  function backToSignupForm() {
    setSignupStep('form')
    setSignupOtp('')
    setSignupResendSent(false)
    setError(null)
  }

  // ── Login submit (password) ─────────────────────────────────────────────────
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
      completeAuthSuccess(user, accessToken)
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Invalid email or password.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Login via OTP (step 1 — request the code) ───────────────────────────────
  async function handleRequestLoginOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!loginForm.email.trim()) {
      setError('Email is required.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/login/otp/request', { email: loginForm.email })
      setOtpLoginStep('verify')
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Login via OTP (step 2 — verify, same result as password login) ─────────
  async function handleVerifyLoginOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (otpLoginCode.replace(/\D/g, '').length !== 6) {
      setError('Enter the 6-digit code.')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/login/otp/verify', {
        email: loginForm.email,
        otp: otpLoginCode,
      })
      const { user, accessToken } = response.data.data as AuthResponse
      completeAuthSuccess(user, accessToken)
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Invalid or expired code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResendLoginOtp() {
    setLoading(true)
    try {
      await api.post('/auth/login/otp/request', { email: loginForm.email })
      setOtpLoginResendSent(true)
    } catch {
      setOtpLoginResendSent(true)
    } finally {
      setLoading(false)
    }
  }

  function switchLoginMethod(method: 'password' | 'otp') {
    setLoginMethod(method)
    setOtpLoginStep('request')
    setOtpLoginCode('')
    setOtpLoginResendSent(false)
    setError(null)
  }

  function backToLoginEmail() {
    setOtpLoginStep('request')
    setOtpLoginCode('')
    setOtpLoginResendSent(false)
    setError(null)
  }

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent
        className={cn(
          'w-full max-w-[800px] max-h-[640px] p-0 overflow-hidden',
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
              {signupStep === 'form' ? (
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
                    <Label htmlFor="signup-phone">Phone number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      value={signupForm.phone}
                      onChange={(e) =>
                        setSignupForm((f) => ({ ...f, phone: e.target.value }))
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
                    {loading ? 'Sending code…' : 'Create account'}
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
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={backToSignupForm}
                    className="text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors flex items-center gap-1 self-start"
                  >
                    ← Back
                  </button>

                  <div>
                    <h3 className="text-[16px] font-[500] font-playfair text-primary mb-1">
                      Verify your email
                    </h3>
                    <p className="text-[13px] font-public-sans text-muted-text">
                      Enter the 6-digit code we sent to{' '}
                      <span className="font-[600] text-primary">{signupForm.email}</span> to finish creating your account.
                    </p>
                  </div>

                  <form onSubmit={handleVerifySignup} className="flex flex-col gap-4">
                    <div>
                      <Label htmlFor="signup-otp">Verification code</Label>
                      <Input
                        id="signup-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="6-digit code"
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={loading}
                        className="mt-1 tracking-[0.3em] text-center"
                      />
                    </div>

                    {error && (
                      <p className="text-[12px] font-public-sans text-error" role="alert">
                        {error}
                      </p>
                    )}

                    <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                      {loading ? 'Verifying…' : 'Verify & create account'}
                    </Button>
                  </form>

                  <div className="flex justify-center">
                    {signupResendSent ? (
                      <p className="text-[13px] font-public-sans text-success">Code resent! Check your inbox.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendSignupOtp}
                        disabled={loading}
                        className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline disabled:opacity-50"
                      >
                        Didn&apos;t receive it? Resend code
                      </button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Login tab ── */}
            <TabsContent value="login">
              {loginMethod === 'password' ? (
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

                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline"
                      onClick={() => switchLoginMethod('otp')}
                    >
                      Log via OTP instead
                    </button>
                    <button
                      type="button"
                      className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline"
                      onClick={() => setForgotView(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => switchLoginMethod('password')}
                    className="text-[13px] font-[500] font-public-sans text-muted-text hover:text-primary transition-colors flex items-center gap-1 self-start"
                  >
                    ← Use password instead
                  </button>

                  {otpLoginStep === 'request' ? (
                    <form onSubmit={handleRequestLoginOtp} className="flex flex-col gap-4">
                      <div>
                        <Label htmlFor="otp-login-email">Email</Label>
                        <Input
                          id="otp-login-email"
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

                      {error && (
                        <p className="text-[12px] font-public-sans text-error" role="alert">
                          {error}
                        </p>
                      )}

                      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                        {loading ? 'Sending…' : 'Send code'}
                      </Button>
                    </form>
                  ) : (
                    <>
                      <p className="text-[13px] font-public-sans text-muted-text">
                        We sent a 6-digit code to{' '}
                        <span className="font-[600] text-primary">{loginForm.email}</span>.
                      </p>

                      <form onSubmit={handleVerifyLoginOtp} className="flex flex-col gap-4">
                        <div>
                          <Label htmlFor="otp-login-code">Verification code</Label>
                          <Input
                            id="otp-login-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="6-digit code"
                            value={otpLoginCode}
                            onChange={(e) => setOtpLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={loading}
                            className="mt-1 tracking-[0.3em] text-center"
                          />
                        </div>

                        {error && (
                          <p className="text-[12px] font-public-sans text-error" role="alert">
                            {error}
                          </p>
                        )}

                        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                          {loading ? 'Logging in…' : 'Log in'}
                        </Button>
                      </form>

                      <div className="flex flex-col items-center gap-2">
                        {otpLoginResendSent ? (
                          <p className="text-[13px] font-public-sans text-success">Code resent! Check your inbox.</p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendLoginOtp}
                            disabled={loading}
                            className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline disabled:opacity-50"
                          >
                            Didn&apos;t receive it? Resend code
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={backToLoginEmail}
                          className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline"
                        >
                          Use a different email
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
