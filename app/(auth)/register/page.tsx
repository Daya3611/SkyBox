'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp } from '@/app/actions/auth-actions'
import { UserPlus, User, KeyRound, Mail, AlertTriangle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSuccess(null)

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)

      try {
        const result = await signUp(null, formData)
        if (result && result.errors) {
          setFieldErrors(result.errors)
          setError(result.message || 'Validation failed.')
        } else if (result && result.success) {
          setSuccess(result.message)
          // Reset form fields
          setName('')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          // Redirect after 3s
          setTimeout(() => {
            router.push('/login')
          }, 2500)
        } else if (result && result.message) {
          setError(result.message)
        }
      } catch (err: any) {
        setError('An unexpected error occurred. Please try again.')
      }
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
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
            Create Account
          </h1>
          <p className="text-sm text-slate-400">
            Get started with your Telegram-backed storage.
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3.5 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Success Callout */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3.5 rounded-xl">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">{success}</p>
              <p className="text-xs opacity-80">Redirecting you to login page...</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm text-slate-200 placeholder-slate-500 transition"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-rose-400 text-xs mt-1">{fieldErrors.name[0]}</p>
            )}
          </div>

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
            {fieldErrors.email && (
              <p className="text-rose-400 text-xs mt-1">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="At least 6 characters"
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm text-slate-200 placeholder-slate-500 transition"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-rose-400 text-xs mt-1">{fieldErrors.password[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
                placeholder="Repeat password"
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm text-slate-200 placeholder-slate-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-violet-500/20 active:scale-[0.98] mt-2"
          >
            {isPending ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Links */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-violet-400 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
