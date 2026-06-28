'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import UploadDialog from '@/components/upload-dialog'
import { formatBytes } from '@/lib/utils/client-utils'
import { HardDrive, Trash2, Download, AlertTriangle, File, Film, Music, Image as ImageIcon, FileText, FileArchive } from 'lucide-react'

export default function StorageClient({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null)
  const [cleanup, setCleanup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resStats, resCleanup] = await Promise.all([
        fetch('/api/storage/stats'),
        fetch('/api/storage/cleanup')
      ])

      if (resStats.ok) {
        const data = await resStats.json()
        setStats(data.data)
      }
      if (resCleanup.ok) {
        const data = await resCleanup.json()
        setCleanup(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch storage data:', err)
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

  const handleTrash = async (id: string, type: 'file' | 'folder') => {
    try {
      const endpoint = type === 'file' ? `/api/files/${id}?hard=false` : `/api/folders/${id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
        window.dispatchEvent(new Event('skybox-refresh'))
      }
    } catch (err) {
      console.error('Failed to delete item', err)
    }
  }

  const categoryColors: Record<string, string> = {
    Images: 'bg-emerald-500',
    Videos: 'bg-cyan-500',
    Audio: 'bg-fuchsia-500',
    Documents: 'bg-blue-500',
    Archives: 'bg-amber-500',
    Applications: 'bg-rose-500',
    Other: 'bg-slate-500'
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">
      <Sidebar
        onCreateFolderClick={() => {}}
        onUploadClick={() => setUploadOpen(true)}
        userRole={user.role}
      />

      <main className="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden">
        <Header user={user} />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-[1000px] mx-auto h-full flex flex-col space-y-8 pb-12">
            
            <div className="mb-2 pt-2">
              <h2 className="text-[32px] font-semibold tracking-tight text-on-surface leading-tight">
                Storage & Analytics
              </h2>
              <p className="text-sm text-on-surface-variant mt-1">Manage your cloud storage and clean up space.</p>
            </div>

            {loading || !stats ? (
              <div className="animate-pulse space-y-6">
                <div className="h-32 bg-surface-container-high rounded-[24px]" />
                <div className="h-64 bg-surface-container-high rounded-[24px]" />
              </div>
            ) : (
              <>
                {/* Top Storage Bar */}
                <div className="bg-surface border border-outline-variant/30 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-on-surface">{formatBytes(stats.totalSize)} <span className="text-on-surface-variant font-medium text-lg">used</span></h3>
                      <p className="text-sm text-on-surface-variant">of {formatBytes(stats.quota)} total ({Math.round(stats.totalSize / stats.quota * 100)}%)</p>
                    </div>
                    <div className="p-3 bg-primary-container text-on-primary-container rounded-xl">
                      <HardDrive className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Stacked Bar Chart */}
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-surface-container-highest">
                    {Object.entries(stats.categories).map(([name, cat]: [string, any]) => {
                      if (cat.size === 0) return null;
                      const percentage = (cat.size / stats.quota) * 100
                      return (
                        <div 
                          key={name}
                          style={{ width: `${percentage}%` }}
                          className={`h-full ${categoryColors[name] || 'bg-slate-500'} hover:opacity-80 transition`}
                          title={`${name}: ${formatBytes(cat.size)}`}
                        />
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mt-2">
                    {Object.entries(stats.categories).map(([name, cat]: [string, any]) => {
                      if (cat.size === 0) return null;
                      return (
                        <div key={name} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${categoryColors[name] || 'bg-slate-500'}`} />
                          <span className="text-xs font-semibold text-on-surface">{name}</span>
                          <span className="text-xs text-on-surface-variant">{formatBytes(cat.size)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface border border-outline-variant/30 rounded-[16px] p-4 flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Files</span>
                    <span className="text-xl font-bold text-on-surface">{stats.totalFiles}</span>
                  </div>
                  <div className="bg-surface border border-outline-variant/30 rounded-[16px] p-4 flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Folders</span>
                    <span className="text-xl font-bold text-on-surface">{stats.totalFolders}</span>
                  </div>
                  <div className="bg-surface border border-outline-variant/30 rounded-[16px] p-4 flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Trash Size</span>
                    <span className="text-xl font-bold text-error">{formatBytes(stats.trashSize)}</span>
                  </div>
                  <div className="bg-surface border border-outline-variant/30 rounded-[16px] p-4 flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Free Space</span>
                    <span className="text-xl font-bold text-primary">{formatBytes(stats.quota - stats.totalSize)}</span>
                  </div>
                </div>

                {/* Cleanup Recommendations */}
                {cleanup && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-on-surface mt-4">Cleanup Recommendations</h3>
                    
                    {/* Large Files */}
                    {cleanup.largeFiles.length > 0 && (
                      <div className="bg-surface border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertTriangle className="w-5 h-5" />
                          <h4 className="font-bold text-on-surface">Large Files</h4>
                        </div>
                        <p className="text-sm text-on-surface-variant">These files are taking up a lot of space. Consider deleting them if no longer needed.</p>
                        <div className="space-y-2 mt-4">
                          {cleanup.largeFiles.map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition">
                              <div className="flex flex-col min-w-0 pr-4">
                                <span className="text-sm font-semibold text-on-surface truncate">{file.name}</span>
                                <span className="text-xs text-on-surface-variant">{formatBytes(file.size)}</span>
                              </div>
                              <button
                                onClick={() => handleTrash(file.id, 'file')}
                                className="p-2 bg-error-container text-error hover:bg-error hover:text-on-error rounded-lg transition shrink-0"
                                title="Move to Trash"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Old Downloads / Inactive */}
                    {cleanup.oldFiles.length > 0 && (
                      <div className="bg-surface border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-blue-600">
                          <AlertTriangle className="w-5 h-5" />
                          <h4 className="font-bold text-on-surface">Inactive Files</h4>
                        </div>
                        <p className="text-sm text-on-surface-variant">These files haven't been opened in over 6 months.</p>
                        <div className="space-y-2 mt-4">
                          {cleanup.oldFiles.map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition">
                              <div className="flex flex-col min-w-0 pr-4">
                                <span className="text-sm font-semibold text-on-surface truncate">{file.name}</span>
                                <span className="text-xs text-on-surface-variant">{formatBytes(file.size)} • Last opened: {new Date(file.lastAccessedAt).toLocaleDateString()}</span>
                              </div>
                              <button
                                onClick={() => handleTrash(file.id, 'file')}
                                className="p-2 bg-error-container text-error hover:bg-error hover:text-on-error rounded-lg transition shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty Folders */}
                    {cleanup.emptyFolders.length > 0 && (
                      <div className="bg-surface border border-outline-variant/30 rounded-[24px] p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <AlertTriangle className="w-5 h-5" />
                          <h4 className="font-bold text-on-surface">Empty Folders</h4>
                        </div>
                        <p className="text-sm text-on-surface-variant">These folders contain no files or subfolders.</p>
                        <div className="space-y-2 mt-4">
                          {cleanup.emptyFolders.map((folder: any) => (
                            <div key={folder.id} className="flex items-center justify-between p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition">
                              <span className="text-sm font-semibold text-on-surface truncate pr-4">{folder.name}</span>
                              <button
                                onClick={() => handleTrash(folder.id, 'folder')}
                                className="p-2 bg-error-container text-error hover:bg-error hover:text-on-error rounded-lg transition shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                  </div>
                )}
              </>
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

