'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { Shield, RefreshCw, Users, FileText, HardDrive, ScrollText, UserCheck, Calendar } from 'lucide-react'
import { formatBytes } from '@/lib/utils/client-utils'

interface UserItem {
  id: string
  name: string | null
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  _count: {
    files: number
    folders: number
  }
}

interface ActivityLogItem {
  id: string
  action: string
  createdAt: string
  user: {
    name: string | null
    email: string
  }
}

interface AdminStats {
  totalUsers: number
  totalFiles: number
  totalFolders: number
  totalStorageBytes: number
  recentLogs: ActivityLogItem[]
  usersList: UserItem[]
}

interface AdminClientProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
}

export default function AdminClient({ user }: AdminClientProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAdminStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminStats()
  }, [])

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">
      
      {/* Sidebar */}
      <Sidebar
        onCreateFolderClick={() => {}}
        onUploadClick={() => {}}
        userRole={user.role}
      />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden">
        
        {/* Header */}
        <Header user={user} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-[1440px] mx-auto h-full flex flex-col space-y-6">
            
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5 text-error">
                <Shield className="w-6 h-6 animate-pulse" />
                <h1 className="text-[32px] font-semibold tracking-tight text-on-surface">
                  Admin Console
                </h1>
              </div>

              <button
                onClick={fetchAdminStats}
                disabled={loading}
                className="p-2 bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container rounded-xl transition disabled:opacity-50 text-on-surface-variant"
                title="Refresh stats"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-surface-container-high rounded-[16px] border border-outline-variant/30" />
                  ))}
                </div>
                <div className="h-64 bg-surface-container-high rounded-[16px] border border-outline-variant/30" />
              </div>
            ) : stats ? (
              <div className="space-y-6">
                
                {/* METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Users */}
                  <div className="bg-surface/70 border border-outline-variant/30 p-5 rounded-[16px] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Users</p>
                      <p className="text-3xl font-extrabold text-on-surface">{stats.totalUsers}</p>
                    </div>
                    <div className="p-3 bg-secondary-container text-on-secondary-container rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Files */}
                  <div className="bg-surface/70 border border-outline-variant/30 p-5 rounded-[16px] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Files</p>
                      <p className="text-3xl font-extrabold text-on-surface">{stats.totalFiles}</p>
                    </div>
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Storage */}
                  <div className="bg-surface/70 border border-outline-variant/30 p-5 rounded-[16px] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Telegram Storage</p>
                      <p className="text-2xl font-extrabold text-on-surface">{formatBytes(stats.totalStorageBytes)}</p>
                    </div>
                    <div className="p-3 bg-primary-container text-on-primary-container rounded-xl">
                      <HardDrive className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Folders */}
                  <div className="bg-surface/70 border border-outline-variant/30 p-5 rounded-[16px] shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Folders</p>
                      <p className="text-3xl font-extrabold text-on-surface">{stats.totalFolders}</p>
                    </div>
                    <div className="p-3 bg-error-container text-on-error-container rounded-xl">
                      <Shield className="w-6 h-6" />
                    </div>
                  </div>

                </div>

                {/* DETAILS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* USER MANAGEMENT */}
                  <div className="lg:col-span-2 bg-surface/70 border border-outline-variant/30 rounded-[16px] shadow-sm p-6 space-y-4">
                    <h3 className="text-base font-bold tracking-tight text-on-surface flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Users Database
                    </h3>
                    <div className="overflow-x-auto max-h-80 border border-outline-variant/30 rounded-xl">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-surface-container-low text-on-surface border-b border-outline-variant/30 font-semibold">
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Files / Folders</th>
                            <th className="p-4">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30 text-on-surface">
                          {stats.usersList.map((usr) => (
                            <tr key={usr.id} className="hover:bg-surface-container-lowest transition-colors">
                              <td className="p-4 font-semibold text-on-surface">{usr.name || 'Anonymous'}</td>
                              <td className="p-4 text-on-surface-variant">{usr.email}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                  usr.role === 'ADMIN'
                                    ? 'bg-error-container border-error/20 text-on-error-container'
                                    : 'bg-surface-container-high border-outline-variant/50 text-on-surface-variant'
                                }`}>
                                  {usr.role}
                                </span>
                              </td>
                              <td className="p-4 text-on-surface-variant font-medium">{usr._count.files} / {usr._count.folders}</td>
                              <td className="p-4 text-outline">{new Date(usr.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AUDIT LOGS */}
                  <div className="bg-surface/70 border border-outline-variant/30 rounded-[16px] shadow-sm p-6 space-y-4">
                    <h3 className="text-base font-bold tracking-tight text-on-surface flex items-center gap-2">
                      <ScrollText className="w-5 h-5 text-primary" />
                      System Audit Trail
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 text-sm">
                      {stats.recentLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl space-y-1.5 hover:border-outline-variant/50 transition-colors shadow-sm">
                          <div className="flex items-center justify-between text-on-surface-variant">
                            <span className="font-semibold text-on-surface truncate max-w-[120px]">
                              {log.user.name || log.user.email}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-outline">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-bold text-[11px] tracking-wide text-primary uppercase">
                            {log.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <p className="text-on-surface-variant text-sm">Failed to retrieve admin stats.</p>
            )}

          </div>
        </div>

      </main>

    </div>
  )
}
