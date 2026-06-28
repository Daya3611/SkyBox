'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import UploadDialog from '@/components/upload-dialog'
import { formatBytes } from '@/lib/utils/client-utils'
import { Upload, FolderPlus, Share2, FileText, Image as ImageIcon, Film, FileArchive, File, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  isDeleted: boolean
  createdAt: string
}

interface OverviewClientProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
}

export default function OverviewClient({ user }: OverviewClientProps) {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog toggles
  const [uploadOpen, setUploadOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false) // If you want to build a modal, or redirect

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        const [statsRes, filesRes] = await Promise.all([
          fetch('/api/storage/stats'),
          fetch('/api/files?sort=date_desc')
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          if (data.success) setStats(data.data)
        }

        if (filesRes.ok) {
          const data = await filesRes.json()
          // Only show top 4 recent files
          if (data.files) setRecentFiles(data.files.slice(0, 4))
        }
      } catch (err) {
        console.error('Error fetching overview data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOverviewData()
  }, [])

  const used = stats?.totalSize || 0
  const total = stats?.quota || 20 * 1024 * 1024 * 1024
  const percentage = total > 0 ? (used / total) * 100 : 0

  // Mock breakdown data since API doesn't support it yet
  const breakdown = [
    { label: 'Images', value: used * 0.5, color: 'bg-primary-container' },
    { label: 'Documents', value: used * 0.3, color: 'bg-secondary-container' },
    { label: 'Videos', value: used * 0.2, color: 'bg-error-container' },
  ]

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return { icon: ImageIcon, color: 'text-emerald-600 bg-emerald-50' }
    if (mime.startsWith('video/')) return { icon: Film, color: 'text-cyan-600 bg-cyan-50' }
    if (mime.includes('document') || mime.includes('pdf') || mime.includes('text')) return { icon: FileText, color: 'text-primary-container bg-primary/10' }
    if (mime.includes('zip') || mime.includes('rar')) return { icon: FileArchive, color: 'text-amber-600 bg-amber-50' }
    return { icon: File, color: 'text-outline bg-surface-container' }
  }

  const circumference = 2 * Math.PI * 15.9155
  const strokeDasharray = `${(percentage / 100) * circumference}, ${circumference}`

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">

      {/* Sidebar - Fixed to left */}
      <Sidebar
        onCreateFolderClick={() => setNewFolderOpen(true)}
        onUploadClick={() => setUploadOpen(true)}
        userRole={user.role}
      />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden">

        {/* Header */}
        <Header user={user} />

        {/* Canvas - Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-[1440px] mx-auto h-full flex flex-col">

            <h1 className="text-[32px] font-semibold tracking-tight text-on-surface mb-6">Dashboard</h1>

            {loading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-48 bg-surface-container-high rounded-[16px] w-full"></div>
                <div className="h-64 bg-surface-container-high rounded-[16px] w-full"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Storage Overview Widget */}
                  <div className="bg-surface/70 border border-outline-variant/30 rounded-[16px] p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                    <h2 className="text-lg font-semibold text-on-surface mb-4">Storage Overview</h2>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-3xl font-bold text-primary">{formatBytes(used)}</span>
                        <span className="text-sm font-medium text-on-surface-variant mt-1">of {formatBytes(total)} used</span>
                      </div>
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-surface-variant"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="text-primary transition-all duration-1000 ease-out"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray={strokeDasharray}
                            strokeLinecap="round"
                            strokeWidth="3"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-semibold text-on-surface">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storage Breakdown */}
                  <div className="bg-surface/70 border border-outline-variant/30 rounded-[16px] p-6 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                    <h2 className="text-lg font-semibold text-on-surface mb-4">Storage Breakdown</h2>
                    <div className="flex-1 flex flex-col justify-center gap-4">
                      {breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span className="text-sm font-medium text-on-surface">{item.label}</span>
                          </div>
                          <span className="text-sm font-medium text-on-surface-variant">{formatBytes(item.value)}</span>
                        </div>
                      ))}
                      <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden flex mt-2">
                        <div className="h-full bg-primary-container" style={{ width: '50%' }}></div>
                        <div className="h-full bg-secondary-container" style={{ width: '31%' }}></div>
                        <div className="h-full bg-error-container" style={{ width: '19%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-surface/70 border border-outline-variant/30 rounded-[16px] p-6 flex flex-col shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                    <h2 className="text-lg font-semibold text-on-surface mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <button
                        onClick={() => setUploadOpen(true)}
                        className="bg-surface-container-lowest border border-outline-variant/30 rounded-[16px] p-4 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all text-on-surface col-span-2"
                      >
                        <Upload className="w-6 h-6 text-primary" />
                        <span className="text-xs font-semibold">Upload File</span>
                      </button>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-surface-container-lowest border border-outline-variant/30 rounded-[16px] p-4 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all text-on-surface"
                      >
                        <FolderPlus className="w-6 h-6 text-secondary-container" />
                        <span className="text-[11px] font-semibold">New Folder</span>
                      </button>
                      <button
                        onClick={() => router.push('/dashboard/shared')}
                        className="bg-surface-container-lowest border border-outline-variant/30 rounded-[16px] p-4 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all text-on-surface"
                      >
                        <Share2 className="w-6 h-6 text-error-container" />
                        <span className="text-[11px] font-semibold">Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Quick Access Files */}
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-on-surface">Quick Access</h2>
                      <button onClick={() => router.push('/dashboard')} className="text-primary text-xs font-semibold hover:underline">
                        View All
                      </button>
                    </div>

                    {recentFiles.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {recentFiles.map((file) => {
                          const fileAesthetics = getFileIcon(file.mimeType)
                          const IconComponent = fileAesthetics.icon

                          return (
                            <div
                              key={file.id}
                              onClick={() => router.push('/dashboard')}
                              className="bg-surface-container-lowest border border-outline-variant/30 rounded-[16px] p-4 flex flex-col gap-2 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="w-full h-24 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/20">
                                {file.mimeType.startsWith('image/') ? (
                                  <img src={`/api/files/${file.id}`} alt={file.name} loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <IconComponent className="w-10 h-10 text-outline" />
                                )}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-[12px] font-semibold text-on-surface truncate" title={file.name}>{file.name}</span>
                                <span className="text-[10px] font-medium text-on-surface-variant">{formatBytes(file.size)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[16px] p-8 text-center text-on-surface-variant text-sm">
                        No recent files found. Upload files to see them here.
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold text-on-surface">Recent Activity</h2>
                    <div className="bg-surface/70 border border-outline-variant/30 rounded-[16px] p-4 flex flex-col gap-4 flex-1 shadow-sm">

                      <div className="flex gap-3">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                          <div className="w-px h-full bg-outline-variant/50 my-1"></div>
                        </div>
                        <div className="flex flex-col pb-2 text-sm">
                          <span className="text-on-surface font-medium">You uploaded <span className="font-bold">Q3_Report.pdf</span></span>
                          <span className="text-xs font-semibold text-on-surface-variant mt-0.5">2 hours ago</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-secondary-container"></div>
                          <div className="w-px h-full bg-outline-variant/50 my-1"></div>
                        </div>
                        <div className="flex flex-col pb-2 text-sm">
                          <span className="text-on-surface font-medium">Sarah edited <span className="font-bold">Design_System.fig</span></span>
                          <span className="text-xs font-semibold text-on-surface-variant mt-0.5">Yesterday at 4:30 PM</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-error-container"></div>
                          <div className="w-px h-full bg-outline-variant/50 my-1"></div>
                        </div>
                        <div className="flex flex-col pb-2 text-sm">
                          <span className="text-on-surface font-medium">Shared <span className="font-bold">Product_Demo.mp4</span></span>
                          <span className="text-xs font-semibold text-on-surface-variant mt-0.5">Yesterday at 2:15 PM</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                        </div>
                        <div className="flex flex-col text-sm">
                          <span className="text-on-surface font-medium">System backed up <span className="font-bold">14 items</span></span>
                          <span className="text-xs font-semibold text-on-surface-variant mt-0.5">Yesterday at 2:00 AM</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        </div>
      </main>

      {/* UPLOAD DIALOG */}
      {uploadOpen && (
        <UploadDialog
          currentFolderId={null}
          onUploadComplete={() => {
            setUploadOpen(false)
            router.refresh()
          }}
          onClose={() => setUploadOpen(false)}
        />
      )}

    </div>
  )
}
