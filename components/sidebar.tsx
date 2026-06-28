'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Cloud,
  LayoutDashboard,
  FolderOpen,
  Share2,
  Trash2,
  Settings,
  Shield,
  HelpCircle,
  Plus,
  Upload,
  FolderPlus,
  Clock,
  Star,
  HardDrive,
  CreditCard
} from 'lucide-react'

interface SidebarProps {
  onCreateFolderClick: () => void
  onUploadClick: () => void
  userRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
}

export default function Sidebar({ onCreateFolderClick, onUploadClick, userRole = 'USER' }: SidebarProps) {
  const pathname = usePathname()
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  
  const [stats, setStats] = useState({
    trashCount: 0,
    favoritesCount: 0,
    recentCount: 0,
    storagePercentage: 0
  })

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/sidebar')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setStats(json.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch sidebar stats:', err)
    }
  }

  useEffect(() => {
    fetchStats()
    const handleRefresh = () => fetchStats()
    window.addEventListener('skybox-refresh', handleRefresh)
    return () => window.removeEventListener('skybox-refresh', handleRefresh)
  }, [pathname])

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard/overview', // Just a visual mock if route doesn't exist yet
      icon: LayoutDashboard,
      active: pathname === '/dashboard/overview',
    },
    {
      name: 'My Files',
      href: '/dashboard',
      icon: FolderOpen,
      active: pathname === '/dashboard' || pathname.startsWith('/dashboard/folders'),
    },
    {
      name: 'Recent',
      href: '/dashboard/recent',
      icon: Clock,
      active: pathname === '/dashboard/recent',
      badge: stats.recentCount > 0 ? stats.recentCount : undefined
    },
    {
      name: 'Favorites',
      href: '/dashboard/favorites',
      icon: Star,
      active: pathname === '/dashboard/favorites',
      badge: stats.favoritesCount > 0 ? stats.favoritesCount : undefined
    },
    {
      name: 'Shared',
      href: '/dashboard/shared',
      icon: Share2,
      active: pathname === '/dashboard/shared',
    },
    {
      name: 'Trash',
      href: '/dashboard/trash',
      icon: Trash2,
      active: pathname === '/dashboard/trash',
      badge: stats.trashCount > 0 ? stats.trashCount : undefined
    },
    {
      name: 'Storage',
      href: '/dashboard/storage',
      icon: HardDrive,
      active: pathname === '/dashboard/storage',
      badge: stats.storagePercentage > 0 ? `${stats.storagePercentage}%` : undefined
    },
    {
      name: 'Billing & Plans',
      href: '/dashboard/billing',
      icon: CreditCard,
      active: pathname === '/dashboard/billing',
    },
  ]

  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    navItems.push({
      name: 'Admin Panel',
      href: '/dashboard/admin',
      icon: Shield,
      active: pathname === '/dashboard/admin',
    })
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-[280px] border-r border-outline-variant/50 bg-surface flex flex-col p-4 gap-2 z-40 hidden md:flex select-none">

      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
          <Cloud className="w-6 h-6 text-on-primary" fill="currentColor" strokeWidth={1} />
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-primary leading-tight">SkyBox</h1>
          <p className="text-[11px] font-semibold text-on-surface-variant leading-none">Cloud Storage</p>
        </div>
      </div>

      {/* Upload & New Buttons (Not in code.html but required for functionality, so keeping them styled to match) */}
      <div className="flex gap-2 px-2 pb-2 relative">
        <button
          onClick={() => { setCreateMenuOpen(false); onUploadClick() }}
          className="flex-1 py-2 bg-primary text-on-primary rounded-xl text-[12px] font-semibold shadow-sm hover:shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          Upload
        </button>
        <button
          onClick={() => setCreateMenuOpen(!createMenuOpen)}
          className="px-3 py-2 bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-high rounded-xl text-[12px] font-semibold transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          New
        </button>

        {createMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setCreateMenuOpen(false)} />
            <div className="absolute left-2 right-2 top-12 mt-1 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-lg p-1.5 z-20 space-y-0.5">
              <button
                onClick={() => { setCreateMenuOpen(false); onCreateFolderClick() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-low rounded-lg text-sm font-medium text-on-surface transition"
              >
                <FolderPlus className="w-4 h-4 text-primary" />
                New Folder
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-2 rounded-xl text-[12px] transition-transform duration-200 hover:translate-x-1 ${item.active
                ? 'bg-secondary-container text-on-secondary-container font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low font-medium'
                }`}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${item.active ? 'text-on-secondary-container' : 'text-on-surface-variant'}`}
                fill={item.active ? 'currentColor' : 'none'}
                strokeWidth={item.active ? 1.5 : 2}
              />
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* Footer / Utility */}
      <div className="mt-auto pt-4 border-t border-outline-variant/30 flex flex-col gap-1">
        <button className="w-full py-2 px-4 bg-primary text-on-primary rounded-xl text-[12px] font-semibold shadow-sm hover:shadow-md hover:opacity-90 transition-all mb-2">
          Upgrade Plan
        </button>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-4 px-4 py-2 rounded-xl text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          <Settings className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
          Settings
        </Link>
        <a
          href="#"
          className="flex items-center gap-4 px-4 py-2 rounded-xl text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          <HelpCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
          Help
        </a>
      </div>

    </nav>
  )
}
