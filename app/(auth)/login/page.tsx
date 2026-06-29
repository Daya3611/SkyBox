'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '@/app/actions/auth-actions'
import { LogIn, KeyRound, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      try {
        const result = await login(null, formData)
        if (result && result.message) {
          setError(result.message)
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      } catch (err: any) {
        // NextAuth redirect throws an error, which we let go to the top,
        // but if it's a real failure, we catch it here.
        if (err.message && !err.message.includes('NEXT_REDIRECT')) {
          setError('An unexpected error occurred. Please try again.')
        }
      }
    })
  }

  // Google OAuth triggers NextAuth signIn
  const handleGoogleLogin = () => {
    // NextAuth v5 sign in trigger
    import('next-auth/react').then(({ signIn }) => {
      signIn('google', { callbackUrl: '/dashboard' })
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-on-surface">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-2xl shadow-sm space-y-6">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary-container rounded-2xl border border-primary/20 text-on-primary-container mb-2">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            SkyBox
          </h1>
          <p className="text-sm text-on-surface-variant">
            Secure cloud storage, powered by Telegram.
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-3 bg-error-container border border-error/20 text-on-error-container text-sm p-3.5 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-surface-container-highest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface placeholder-on-surface-variant transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-surface-container-highest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface placeholder-on-surface-variant transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-outline hover:text-on-surface transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary font-semibold rounded-xl text-sm transition shadow-sm active:scale-[0.98]"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center text-xs text-on-surface-variant uppercase tracking-widest">
          <div className="flex-grow border-t border-outline-variant/30" />
          <span className="mx-4">Or continue with</span>
          <div className="flex-grow border-t border-outline-variant/30" />
        </div>

        {/* Social Sign-in */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface font-semibold rounded-xl text-sm transition active:scale-[0.98]"
        >
          {/* Google Logo SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Account
        </button>

        {/* Links */}
        <p className="text-center text-sm text-on-surface-variant">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-primary font-semibold hover:underline"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  )
}
