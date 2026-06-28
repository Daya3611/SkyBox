'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import FileGrid from '@/components/file-grid'
import UploadDialog from '@/components/upload-dialog'
import { useRouter } from 'next/navigation'

interface FolderItem {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  isFavorite?: boolean
}

interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  isDeleted: boolean
  createdAt: string
  lastAccessedAt?: string
  isFavorite?: boolean
}

export default function FavoritesClient({ user }: { user: any }) {
  const router = useRouter()
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/files?isFavorite=true`)
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
        setFiles(data.files || [])
      }
    } catch (err) {
      console.error('Failed to fetch favorite items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const handleRefresh = () => fetchData()
    window.addEventListener('skybox-refresh', handleRefresh)
    return () => window.removeEventListener('skybox-refresh', handleRefresh)
  }, [])

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">
      <Sidebar
        onCreateFolderClick={() => {}} // Disabled on Favorites
        onUploadClick={() => setUploadOpen(true)}
        userRole={user.role}
      />

      <main className="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden">
        <Header user={user} />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-[1440px] mx-auto h-full flex flex-col">
            
            <div className="mb-6 pt-2">
              <h2 className="text-[32px] font-semibold tracking-tight text-on-surface mt-1 leading-tight">
                Favorites
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">Files and folders you've marked as favorite.</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse pt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-surface-container-high rounded-[16px] border border-outline-variant/30" />
                ))}
              </div>
            ) : (
              <FileGrid
                folders={folders}
                files={files}
                onFolderDoubleClick={(id) => router.push(`/dashboard?folderId=${id}`)}
                onRefresh={fetchData}
              />
            )}
          </div>
        </div>
      </main>

      {uploadOpen && (
        <UploadDialog
          currentFolderId={null}
          onUploadComplete={() => { fetchData(); window.dispatchEvent(new Event('skybox-refresh')) }}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </div>
  )
}
