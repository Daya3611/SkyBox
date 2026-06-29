'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import Breadcrumbs from '@/components/breadcrumbs'
import FileGrid from '@/components/file-grid'
import UploadDialog from '@/components/upload-dialog'
import { FolderPlus, RefreshCw, Grid, List, ArrowUpDown, Filter, X } from 'lucide-react'
import Link from 'next/link'

interface FolderItem {
  id: string
  name: string
  parentId: string | null
  createdAt: string
}

interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  isDeleted: boolean
  createdAt: string
}

interface DashboardClientProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const folderId = searchParams.get('folderId')
  const searchQuery = searchParams.get('search') || ''

  const [sort, setSort] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'size_desc' | 'size_asc'>('date_desc')

  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [flatFolders, setFlatFolders] = useState<FolderItem[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderLoading, setNewFolderLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const currentFolderParam = folderId ? `folderId=${folderId}` : 'folderId=null'
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
      const sortParam = `&sort=${sort}`

      const res = await fetch(`/api/files?${currentFolderParam}${searchParam}${sortParam}`)
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
        setFiles(data.files || [])
      }

      if (folderId) {
        const breadcrumbRes = await fetch(`/api/files/breadcrumbs?folderId=${folderId}`)
        if (breadcrumbRes.ok) {
          const bData = await breadcrumbRes.json()
          setBreadcrumbs(bData.breadcrumbs || [])
        }
      } else {
        setBreadcrumbs([])
      }

      const allFoldersRes = await fetch(`/api/files/flat-folders`)
      if (allFoldersRes.ok) {
        const allFData = await allFoldersRes.json()
        setFlatFolders(allFData.folders?.filter((f: any) => f.id !== folderId) || [])
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [folderId, searchQuery, sort])

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setNewFolderLoading(true)

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: folderId || null,
        }),
      })

      if (res.ok) {
        setNewFolderName('')
        setNewFolderOpen(false)
        fetchData()
      }
    } catch (err) {
      console.error('Failed to create folder:', err)
    } finally {
      setNewFolderLoading(false)
    }
  }

  const handleFolderDoubleClick = (fid: string) => {
    router.push(`/dashboard?folderId=${fid}`)
  }

  const handleBreadcrumbNavigate = (fid: string | null) => {
    if (fid) {
      router.push(`/dashboard?folderId=${fid}`)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">

      {/* Sidebar - Fixed to left */}
      <Sidebar
        onCreateFolderClick={() => setNewFolderOpen(true)}
        onUploadClick={() => setUploadOpen(true)}
        userRole={user.role}
        mobileMenuOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Panel - Pushed by Sidebar width on desktop */}
      <main className="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden">
        
        {/* Header - Stays above the canvas but within main */}
        <Header user={user} onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Canvas - Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-[1440px] mx-auto h-full flex flex-col">

            {/* Breadcrumb & Page Title */}
            <div className="mb-6 pt-2">
              {searchQuery ? (
                <div className="text-sm font-medium text-on-surface-variant">
                  Search results for: <span className="text-on-surface font-semibold">&ldquo;{searchQuery}&rdquo;</span>
                </div>
              ) : (
                <>
                  <Breadcrumbs
                    items={breadcrumbs}
                    currentFolderId={folderId}
                    onNavigate={handleBreadcrumbNavigate}
                  />
                  <h2 className="text-[32px] font-semibold tracking-tight text-on-surface mt-1 leading-tight">
                    {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1]?.name : 'My Drive'}
                  </h2>
                </>
              )}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-2 bg-surface-container-low rounded-xl border border-outline-variant/30">
              
              {/* Left Toolbar Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewFolderOpen(true)}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-[12px] font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all flex items-center gap-2"
                >
                  <FolderPlus className="w-[18px] h-[18px]" />
                  New
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="px-3 py-2 bg-transparent text-on-surface rounded-lg text-[12px] font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors flex items-center gap-2"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload
                </button>
              </div>

              {/* Right Toolbar Actions */}
              <div className="flex items-center gap-3">
                
                {/* View toggles */}
                <div className="hidden md:flex items-center border border-outline-variant/50 rounded-lg overflow-hidden bg-surface-container-lowest">
                  <button className="p-2 bg-surface-container-high text-on-surface transition-colors" title="Grid View">
                    <Grid className="w-[20px] h-[20px] fill-on-surface stroke-none" />
                  </button>
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors" title="List View">
                    <List className="w-[20px] h-[20px]" />
                  </button>
                </div>

                <div className="h-6 w-[1px] bg-outline-variant/50 hidden md:block"></div>

                {/* Sorting Select */}
                <div className="relative flex items-center hover:bg-surface-container rounded-lg px-2 transition text-[12px] font-semibold text-on-surface-variant cursor-pointer">
                  <ArrowUpDown className="w-[18px] h-[18px] mr-2" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                    className="bg-transparent border-none outline-none py-2 pr-6 cursor-pointer appearance-none text-on-surface-variant font-semibold"
                  >
                    <option value="date_desc">Newest Uploaded</option>
                    <option value="date_asc">Oldest Uploaded</option>
                    <option value="name_asc">Name (A–Z)</option>
                    <option value="name_desc">Name (Z–A)</option>
                    <option value="size_desc">Largest Size</option>
                    <option value="size_asc">Smallest Size</option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-on-surface-variant" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Reload Button */}
                <button
                  onClick={fetchData}
                  disabled={loading}
                  title="Refresh"
                  className="flex items-center gap-2 px-3 py-2 text-on-surface-variant text-[12px] font-semibold hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-[18px] h-[18px] ${loading ? 'animate-spin' : ''}`} />
                </button>

              </div>
            </div>

            {/* Content Area */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse pt-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-32 bg-surface-container-high rounded-[16px] border border-outline-variant/30" />
                ))}
              </div>
            ) : (
              <FileGrid
                folders={folders}
                files={files}
                allFoldersList={flatFolders}
                onFolderDoubleClick={handleFolderDoubleClick}
                onRefresh={fetchData}
              />
            )}

          </div>
        </div>

      </main>

      {/* CREATE FOLDER DIALOG */}
      {newFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/50 p-6 rounded-[16px] shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-primary">
                <FolderPlus className="w-5 h-5" />
                <h3 className="text-base font-semibold text-on-surface">New Folder</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewFolderOpen(false)}
                className="p-1 hover:bg-surface-container rounded-lg text-on-surface-variant transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors text-on-surface"
              placeholder="Folder name"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewFolderOpen(false)}
                className="px-4 py-2 border border-outline-variant hover:bg-surface-container rounded-lg text-[12px] font-semibold text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={newFolderLoading || !newFolderName.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50"
              >
                {newFolderLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD DIALOG */}
      {uploadOpen && (
        <UploadDialog
          currentFolderId={folderId}
          onUploadComplete={fetchData}
          onClose={() => setUploadOpen(false)}
        />
      )}

    </div>
  )
}
