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
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black p-4 text-slate-100">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-violet-400 mb-2">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
            SkyBox
          </h1>
          <p className="text-sm text-slate-400">
            Secure cloud storage, powered by Telegram.
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3.5 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm text-slate-200 placeholder-slate-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm text-slate-200 placeholder-slate-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-violet-500/20 active:scale-[0.98]"
          >
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center text-xs text-slate-500 uppercase tracking-widest">
          <div className="flex-grow border-t border-white/10" />
          <span className="mx-4">Or continue with</span>
          <div className="flex-grow border-t border-white/10" />
        </div>

        {/* Social Sign-in */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-semibold rounded-xl text-sm transition active:scale-[0.98]"
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
        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-violet-400 font-semibold hover:underline"
          >
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  )
}
