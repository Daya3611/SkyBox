'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import FileGrid from '@/components/file-grid'
import { Trash, RefreshCw } from 'lucide-react'

interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  isDeleted: boolean
  createdAt: string
}

interface TrashClientProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
}

export default function TrashClient({ user }: TrashClientProps) {
  const [folders, setFolders] = useState<any[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [emptyLoading, setEmptyLoading] = useState(false)

  const fetchTrashFiles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/files?isDeleted=true')
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
        setFiles(data.files || [])
      }
    } catch (err) {
      console.error('Failed to fetch trash items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all items in the Trash? This action cannot be undone.')) return
    
    setEmptyLoading(true)
    try {
      const res = await fetch('/api/trash/empty', { method: 'DELETE' })
      if (res.ok) {
        setFiles([])
        setFolders([])
        window.dispatchEvent(new Event('skybox-refresh'))
      }
    } catch (err) {
      console.error('Failed to empty trash:', err)
    } finally {
      setEmptyLoading(false)
    }
  }

  useEffect(() => {
    fetchTrashFiles()
  }, [])

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
          <div className="max-w-[1440px] mx-auto h-full flex flex-col space-y-6">

            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5 text-error">
                <Trash className="w-6 h-6" />
                <h1 className="text-[32px] font-semibold tracking-tight text-on-surface">
                  Trash Bin
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleEmptyTrash}
                  disabled={emptyLoading || (files.length === 0 && folders.length === 0)}
                  className="px-4 py-2 bg-error-container text-error font-medium rounded-xl hover:bg-error hover:text-on-error transition disabled:opacity-50 disabled:hover:bg-error-container disabled:hover:text-error"
                >
                  {emptyLoading ? 'Emptying...' : 'Empty Trash'}
                </button>
                <button
                  onClick={fetchTrashFiles}
                  disabled={loading}
                  className="p-2 bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container rounded-xl transition disabled:opacity-50 text-on-surface-variant"
                  title="Refresh trash items"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-surface-container-high rounded-[16px] border border-outline-variant/30" />
                ))}
              </div>
            ) : (
              <FileGrid
                folders={folders}
                files={files}
                trashMode={true}
                onFolderDoubleClick={() => { }}
                onRefresh={fetchTrashFiles}
                allFoldersList={[]}
              />
            )}

          </div>
        </div>

      </main>

    </div>
  )
}
