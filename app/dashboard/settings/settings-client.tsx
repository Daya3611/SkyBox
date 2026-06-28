'use client'

import React, { useState } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { Settings, User, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface SettingsClientProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [name, setName] = useState(user.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setProfileLoading(true)
    setProfileStatus(null)

    try {
      const res = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setProfileStatus({ type: 'success', msg: 'Profile updated successfully!' })
      } else {
        setProfileStatus({ type: 'error', msg: data.error || 'Failed to update profile.' })
      }
    } catch (err) {
      setProfileStatus({ type: 'error', msg: 'An unexpected error occurred.' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'Please fill in all password fields.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match.' })
      return
    }

    setPasswordLoading(true)
    setPasswordStatus(null)

    try {
      const res = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordStatus({ type: 'error', msg: data.error || 'Failed to change password.' })
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', msg: 'An unexpected error occurred.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">

      {/* Sidebar */}
      <Sidebar
        onCreateFolderClick={() => { }}
        onUploadClick={() => { }}
        userRole={user.role}
      />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden">

        {/* Header */}
        <Header user={user} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-4xl mx-auto h-full flex flex-col space-y-8">

            <div className="flex items-center gap-2.5 border-b border-outline-variant/30 pb-4 text-primary">
              <Settings className="w-6 h-6" />
              <h1 className="text-[32px] font-semibold tracking-tight text-on-surface">
                Account Settings
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* PROFILE SECTION */}
              <form onSubmit={handleUpdateProfile} className="bg-surface/70 border border-outline-variant/30 p-6 rounded-[16px] space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-on-surface font-semibold border-b border-outline-variant/30 pb-3">
                  <User className="w-[18px] h-[18px] text-primary" />
                  Profile Information
                </div>

                {profileStatus && (
                  <div className={`flex items-center gap-2 text-xs p-3 rounded-xl border ${profileStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-error-container border-error/20 text-on-error-container'
                    }`}>
                    {profileStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {profileStatus.msg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full px-4 py-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-sm text-outline cursor-not-allowed outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    placeholder="Your Name"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold text-on-primary transition shadow-sm disabled:opacity-50 mt-2"
                >
                  {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Profile
                </button>
              </form>

              {/* PASSWORD SECTION */}
              <form onSubmit={handleUpdatePassword} className="bg-surface/70 border border-outline-variant/30 p-6 rounded-[16px] space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-on-surface font-semibold border-b border-outline-variant/30 pb-3">
                  <KeyRound className="w-[18px] h-[18px] text-primary" />
                  Change Password
                </div>

                {passwordStatus && (
                  <div className={`flex items-center gap-2 text-xs p-3 rounded-xl border ${passwordStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-error-container border-error/20 text-on-error-container'
                    }`}>
                    {passwordStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {passwordStatus.msg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold text-on-primary transition shadow-sm disabled:opacity-50 mt-2"
                >
                  {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Change Password
                </button>
              </form>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
