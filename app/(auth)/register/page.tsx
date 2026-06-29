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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-on-surface">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-2xl shadow-sm space-y-6 mt-8 mb-8">
        {/* Header / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary-container rounded-2xl border border-primary/20 text-on-primary-container mb-2">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Create Account
          </h1>
          <p className="text-sm text-on-surface-variant">
            Get started with your Telegram-backed storage.
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-3 bg-error-container border border-error/20 text-on-error-container text-sm p-3.5 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Success Callout */}
        {success && (
          <div className="flex items-center gap-3 bg-primary-container border border-primary/20 text-on-primary-container text-sm p-3.5 rounded-xl">
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
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 bg-surface-container-highest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface placeholder-on-surface-variant transition"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-error text-xs mt-1">{fieldErrors.name[0]}</p>
            )}
          </div>

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
            {fieldErrors.email && (
              <p className="text-error text-xs mt-1">{fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="At least 6 characters"
                className="w-full pl-11 pr-4 py-3 bg-surface-container-highest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface placeholder-on-surface-variant transition"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-error text-xs mt-1">{fieldErrors.password[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
                placeholder="Repeat password"
                className="w-full pl-11 pr-4 py-3 bg-surface-container-highest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface placeholder-on-surface-variant transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary font-semibold rounded-xl text-sm transition shadow-sm active:scale-[0.98] mt-2"
          >
            {isPending ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Links */}
        <p className="text-center text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
