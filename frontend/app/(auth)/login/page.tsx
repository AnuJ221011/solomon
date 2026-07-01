'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { User } from '@/types'

// ─── API shape ────────────────────────────────────────────────────────────────

interface AuthResponse {
  user: User
  accessToken: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function roleDestination(role: string) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'BRAND') return '/portal'
  return '/catalogue'
}

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const existingUser = useAuthStore((s) => s.user)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)

  // Already logged in — skip the login page entirely
  useEffect(() => {
    if (hasHydrated && existingUser) {
      router.replace(roleDestination(existingUser.role))
    }
  }, [hasHydrated, existingUser, router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email is required.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })

      if (typeof window !== 'undefined' && data.accessToken) {
        localStorage.setItem('sb_token', data.accessToken)
      }
      setUser(data.user)
      router.push(roleDestination(data.user.role))
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
    <div className="bg-bg min-h-screen flex items-center justify-center px-4">
      <div
        className={cn(
          'bg-surface border border-border-warm rounded p-8',
          'w-full max-w-[400px]'
        )}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="font-playfair text-[24px] font-[600] text-primary leading-none block"
        >
          Solomon Bharat
        </Link>

        {/* Heading */}
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary mt-3 mb-8">
          Welcome back
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
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
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        {/* Footer links */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex justify-center">
            <button
              type="button"
              className="text-[13px] font-public-sans text-muted-text hover:text-primary transition-colors underline underline-offset-2"
              onClick={() => {
                /* TODO: forgot password flow */
              }}
            >
              Forgot password?
            </button>
          </div>

          <p className="text-[13px] font-public-sans text-muted-text text-center">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-primary font-[600] underline underline-offset-2 hover:text-accent transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
