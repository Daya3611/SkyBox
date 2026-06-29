'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, LogOut, User, Settings, ShieldAlert, Bell, Sun, Menu } from 'lucide-react'

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
  onMenuClick?: () => void
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  // Populate search box if query already exists in URL
  useEffect(() => {
    const query = searchParams.get('search')
    if (query) {
      setSearchQuery(query)
    } else {
      setSearchQuery('')
    }
  }, [searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() !== '') {
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSignOut = () => {
    import('next-auth/react').then(({ signOut }) => {
      signOut({ callbackUrl: '/login' })
    })
  }

  const initialLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <header className="docked full-width top-0 sticky bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center w-full px-6 py-2 max-w-[1440px] mx-auto z-50">

      {/* Mobile Brand (Visible only on small screens) */}
      <div className="md:hidden flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <svg className="w-4 h-4 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tighter text-primary">SkyBox</span>
      </div>

      {/* 1. Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 flex max-w-md hidden md:flex items-center relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files, folders..."
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-full font-medium text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline"
        />
      </form>

      {/* 2. User Controls */}
      <div className="flex items-center gap-3">
        <button className="p-2 text-on-surface-variant rounded-full hover:bg-surface-container-high/50 transition-all duration-300 relative group">
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>
        <button className="p-2 text-on-surface-variant rounded-full hover:bg-surface-container-high/50 transition-all duration-300 group hidden sm:block">
          <Sun className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
        </button>
        
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-8 h-8 rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center cursor-pointer shadow-sm transition duration-200 active:scale-95 border-2 border-surface-container-high ml-2"
          >
            {user?.image ? (
              <img src={user.image} alt={user.name || 'User'} className="w-full h-full rounded-full object-cover" />
            ) : (
              initialLetter
            )}
          </button>

          {profileOpen && (
            <>
              {/* Backdrop click closer */}
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />

              <div className="absolute right-0 top-12 w-56 bg-surface-container-lowest border border-outline-variant/50 backdrop-blur-xl rounded-2xl shadow-xl p-2 z-40 space-y-1">

                {/* Profile Details Header */}
                <div className="p-3 border-b border-outline-variant/30 space-y-0.5">
                  <p className="text-sm font-bold text-on-surface truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>

                  {/* Role badge */}
                  {user?.role === 'ADMIN' && (
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-error-container text-[10px] font-bold uppercase tracking-wider text-on-error-container rounded-full">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    router.push('/dashboard/settings')
                  }}
                  className="w-full flex items-center gap-2.5 p-2 hover:bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface-variant transition"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 p-2 hover:bg-error-container rounded-xl text-xs font-semibold text-error transition mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>

              </div>
            </>
          )}
        </div>
      </div>

    </header>
  )
}
