'use client'

import React, { useState } from 'react'
import {
  Folder,
  File,
  MoreVertical,
  Download,
  Edit2,
  FolderSymlink,
  Share2,
  Trash2,
  ExternalLink,
  Clipboard,
  Check,
  Calendar,
  Lock,
  X,
  FileText,
  FileArchive,
  Film,
  Music,
  Image as ImageIcon,
  Star
} from 'lucide-react'
import { formatBytes } from '@/lib/utils/client-utils'
import FilePreviewModal from './file-preview-modal'

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

interface FileGridProps {
  folders: FolderItem[]
  files: FileItem[]
  trashMode?: boolean
  allFoldersList?: FolderItem[]
  onFolderDoubleClick: (folderId: string) => void
  onRefresh: () => void
}

export default function FileGrid({
  folders,
  files,
  trashMode = false,
  allFoldersList = [],
  onFolderDoubleClick,
  onRefresh
}: FileGridProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [activeMenuType, setActiveMenuType] = useState<'file' | 'folder' | null>(null)

  // Dialog states
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameType, setRenameType] = useState<'file' | 'folder' | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)

  const [moveId, setMoveId] = useState<string | null>(null)
  const [moveLoading, setMoveLoading] = useState(false)

  const [shareId, setShareId] = useState<string | null>(null)
  const [sharePassword, setSharePassword] = useState('')
  const [shareExpiry, setShareExpiry] = useState('')
  const [shareLinkToken, setShareLinkToken] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Preview State
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  // File type aesthetics resolver
  const getFileIcon = (mime: string) => {
    const isImage = mime.startsWith('image/')
    const isPdf = mime === 'application/pdf'
    const isVideo = mime.startsWith('video/')
    const isAudio = mime.startsWith('audio/')
    const isDoc = mime.includes('document') || mime.includes('msword') || mime.includes('text') || mime.includes('pdf')
    const isArchive = mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('gzip')

    if (isImage) return { icon: ImageIcon, color: 'text-emerald-600 bg-emerald-50' }
    if (isVideo) return { icon: Film, color: 'text-cyan-600 bg-cyan-50' }
    if (isAudio) return { icon: Music, color: 'text-fuchsia-600 bg-fuchsia-50' }
    if (isDoc) return { icon: FileText, color: 'text-blue-600 bg-blue-50' }
    if (isArchive) return { icon: FileArchive, color: 'text-amber-600 bg-amber-50' }

    return { icon: File, color: 'text-outline bg-surface-container' }
  }

  // Toggle options menu
  const toggleMenu = (id: string, type: 'file' | 'folder', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (activeMenuId === id) {
      setActiveMenuId(null)
      setActiveMenuType(null)
    } else {
      setActiveMenuId(id)
      setActiveMenuType(type)
    }
  }

  // Action: Download File
  const handleDownload = (id: string) => {
    window.location.assign(`/api/files/${id}`)
    setActiveMenuId(null)
    setTimeout(() => window.dispatchEvent(new Event('skybox-refresh')), 500)
  }

  // Action: Open Rename
  const openRename = (id: string, currentName: string, type: 'file' | 'folder') => {
    setRenameId(id)
    setRenameType(type)
    setRenameValue(currentName)
    setActiveMenuId(null)
  }

  // Action: Perform Rename
  const handleRename = async () => {
    if (!renameValue.trim() || !renameId || !renameType) return
    setRenameLoading(true)

    const endpoint = renameType === 'file' ? `/api/files/${renameId}` : `/api/folders/${renameId}`
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue }),
      })
      if (res.ok) {
        onRefresh()
        setRenameId(null)
        window.dispatchEvent(new Event('skybox-refresh'))
      }
    } catch (err) {
      console.error('Rename failed:', err)
    } finally {
      setRenameLoading(false)
    }
  }

  // Action: Delete/Trash Item
  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    setActiveMenuId(null)
    const isHard = trashMode
    const endpoint = type === 'file' ? `/api/files/${id}?hard=${isHard}` : `/api/folders/${id}?hard=${isHard}`

    if (type === 'folder' && !confirm('Are you sure? This will delete the folder and ALL nested files permanently.')) {
      return
    }

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
      })
      if (res.ok) {
        onRefresh()
        window.dispatchEvent(new Event('skybox-refresh'))
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // Action: Restore Soft-deleted File or Folder
  const handleRestore = async (id: string, type: 'file' | 'folder') => {
    setActiveMenuId(null)
    const endpoint = type === 'file' ? `/api/files/${id}` : `/api/folders/${id}`
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: false }),
      })
      if (res.ok) {
        onRefresh()
        window.dispatchEvent(new Event('skybox-refresh'))
      }
    } catch (err) {
      console.error('Restore failed:', err)
    }
  }

  // Action: Move File
  const handleMove = async (targetFolderId: string | null) => {
    if (!moveId) return
    setMoveLoading(true)
    try {
      const res = await fetch(`/api/files/${moveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId }),
      })
      if (res.ok) {
        onRefresh()
        setMoveId(null)
        window.dispatchEvent(new Event('skybox-refresh'))
      }
    } catch (err) {
      console.error('Move failed:', err)
    } finally {
      setMoveLoading(false)
    }
  }

  // Action: Create Share Link
  const handleShare = async () => {
    if (!shareId) return
    setShareLoading(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: shareId,
          password: sharePassword || undefined,
          expiresAt: shareExpiry || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const origin = window.location.origin
          setShareLinkToken(`${origin}/share/${data.shareLink.token}`)
        }
      }
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setShareLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!shareLinkToken) return
    navigator.clipboard.writeText(shareLinkToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Action: Toggle Favorite
  const handleToggleFavorite = async (id: string, type: 'file' | 'folder', currentFav: boolean) => {
    setActiveMenuId(null)
    const endpoint = type === 'file' ? `/api/files/${id}` : `/api/folders/${id}`
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentFav }),
      })
      if (res.ok) {
        onRefresh()
        window.dispatchEvent(new Event('skybox-refresh'))
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err)
    }
  }

  return (
    <div className="space-y-6 select-none" onClick={() => setActiveMenuId(null)}>

      {/* 1. Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Folders
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onDoubleClick={() => onFolderDoubleClick(folder.id)}
                className="group relative flex items-center justify-between p-4 bg-surface border border-outline-variant/30 hover:border-outline hover:bg-surface-container-low rounded-[16px] transition duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2.5 bg-secondary-container text-on-secondary-container rounded-xl relative">
                    <Folder className="w-5 h-5 fill-secondary-container" />
                    {folder.isFavorite && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 absolute -top-1 -right-1 drop-shadow-sm" />
                    )}
                  </div>
                  <span className="font-semibold text-sm truncate text-on-surface">
                    {folder.name}
                  </span>
                </div>

                {/* Options Action */}
                <button
                  onClick={(e) => toggleMenu(folder.id, 'folder', e)}
                  className="p-1.5 hover:bg-surface-container rounded-lg opacity-0 group-hover:opacity-100 transition text-on-surface-variant hover:text-on-surface"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {activeMenuId === folder.id && activeMenuType === 'folder' && (
                  <div className="absolute right-4 top-14 w-40 bg-surface-container-lowest border border-outline-variant/50 backdrop-blur-lg rounded-xl shadow-lg p-1.5 z-40 space-y-0.5">
                    {!trashMode ? (
                      <>
                        <button
                          onClick={() => openRename(folder.id, folder.name, 'folder')}
                          className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-on-surface transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => handleToggleFavorite(folder.id, 'folder', folder.isFavorite || false)}
                          className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-on-surface transition"
                        >
                          <Star className={`w-3.5 h-3.5 ${folder.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                          {folder.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                        </button>
                        <button
                          onClick={() => handleDelete(folder.id, 'folder')}
                          className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-error-container rounded-lg text-error transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Trash
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestore(folder.id, 'folder') }}
                          className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-primary transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Restore
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder') }}
                          className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-error-container rounded-lg text-error transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Forever
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Files Section */}
      {files.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Files
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {files.map((file, index) => {
              const fileAesthetics = getFileIcon(file.mimeType)
              const IconComponent = fileAesthetics.icon
              const isImage = file.mimeType.startsWith('image/')

              return (
                <div
                  key={file.id}
                  onClick={() => !trashMode && setPreviewIndex(index)}
                  className="group relative flex flex-col bg-surface border border-outline-variant/30 hover:border-outline hover:bg-surface-container-low rounded-[16px] transition duration-200 cursor-pointer shadow-sm hover:shadow-md overflow-hidden h-48"
                >
                  {/* Thumbnail / Icon Area */}
                  <div className="h-32 w-full bg-surface-container flex items-center justify-center relative overflow-hidden border-b border-outline-variant/20">
                    {isImage ? (
                      <img
                        src={`/api/files/${file.id}`}
                        alt={file.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className={`p-4 rounded-[16px] ${fileAesthetics.color}`}>
                        <IconComponent className="w-8 h-8" />
                      </div>
                    )}

                    {/* Options Action */}
                    {file.isFavorite && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 absolute top-2 left-2 drop-shadow-md z-10" />
                    )}
                    <button
                      onClick={(e) => toggleMenu(file.id, 'file', e)}
                      className="absolute top-2 right-2 p-1.5 bg-surface/80 hover:bg-surface backdrop-blur-md rounded-lg text-on-surface-variant hover:text-on-surface opacity-0 group-hover:opacity-100 transition shadow-sm z-20"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {activeMenuId === file.id && activeMenuType === 'file' && (
                    <div className="absolute right-4 top-10 w-44 bg-surface-container-lowest border border-outline-variant/50 backdrop-blur-lg rounded-xl shadow-lg p-1.5 z-40 space-y-0.5">
                      {!trashMode ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(file.id) }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-on-surface transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openRename(file.id, file.name, 'file') }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-on-surface transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Rename
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMoveId(file.id) }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-on-surface transition"
                          >
                            <FolderSymlink className="w-3.5 h-3.5" />
                            Move
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file.id, 'file', file.isFavorite || false) }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-on-surface transition"
                          >
                            <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                            {file.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShareId(file.id) }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-on-surface transition"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share Link
                          </button>
                          <div className="h-px bg-outline-variant/30 my-1" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id, 'file') }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-error-container rounded-lg text-error transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Trash
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(file.id, 'file') }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-surface-container rounded-lg text-primary transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Restore
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id, 'file') }}
                            className="w-full flex items-center gap-2 p-2 text-xs font-medium hover:bg-error-container rounded-lg text-error transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Forever
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* File Info Area */}
                  <div className="p-3 bg-surface flex flex-col justify-center flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate text-on-surface block" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-on-surface-variant block truncate mt-0.5">
                      {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        folders.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 text-center text-on-surface-variant gap-4 bg-surface border border-outline-variant/30 rounded-[24px] shadow-sm">
            <Folder className="w-16 h-16 text-outline stroke-[1.5]" />
            <div className="space-y-1.5">
              <p className="font-bold text-lg text-on-surface">Folder is empty</p>
              <p className="text-sm">Upload files or create subfolders using the options above.</p>
            </div>
          </div>
        )
      )}

      {/* RENAME DIALOG */}
      {renameId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
          <div
            className="bg-surface-container-lowest border border-outline-variant/50 p-6 rounded-[24px] shadow-2xl space-y-4"
            style={{ width: '100%', maxWidth: '24rem', minWidth: '320px' }}
          >
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Rename Item</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="input-stitch"
              placeholder="Enter new name"
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs font-semibold pt-2">
              <button
                onClick={() => setRenameId(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={renameLoading || !renameValue.trim()}
                className="btn-primary"
              >
                {renameLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE DIALOG */}
      {moveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
          <div
            className="bg-surface-container-lowest border border-outline-variant/50 p-6 rounded-[24px] shadow-2xl space-y-4"
            style={{ width: '100%', maxWidth: '28rem', minWidth: '320px' }}
          >
            <h3 className="text-lg font-bold tracking-tight text-on-surface">Move File</h3>
            <p className="text-sm text-on-surface-variant">Select target directory:</p>

            <div className="max-h-60 overflow-y-auto space-y-1 border border-outline-variant/30 bg-surface-container p-2 rounded-xl scrollbar-thin">
              <button
                onClick={() => handleMove(null)}
                disabled={moveLoading}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-surface-container-high rounded-lg text-sm font-semibold text-left text-on-surface transition"
              >
                <div className="p-1.5 bg-secondary-container text-on-secondary-container rounded-md">
                  <Folder className="w-4 h-4 fill-secondary-container" />
                </div>
                <span>My Drive (Root)</span>
              </button>

              {allFoldersList.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleMove(folder.id)}
                  disabled={moveLoading}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-surface-container-high rounded-lg text-sm font-medium text-left text-on-surface transition ml-4 border-l-2 border-outline-variant/50"
                >
                  <Folder className="w-4 h-4 text-outline" />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMoveId(null)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE DIALOG */}
      {shareId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4" onClick={() => { }}>
          <div
            className="bg-surface-container-lowest border border-outline-variant/50 p-6 rounded-[24px] shadow-2xl space-y-5"
            style={{ width: '100%', maxWidth: '28rem', minWidth: '320px' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-on-surface">Share File</h3>
              <button
                onClick={() => {
                  setShareId(null)
                  setShareLinkToken(null)
                  setSharePassword('')
                  setShareExpiry('')
                }}
                className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!shareLinkToken ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Password Protection (Optional)
                  </label>
                  <input
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Enter password to lock"
                    className="input-stitch"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={shareExpiry}
                    onChange={(e) => setShareExpiry(e.target.value)}
                    className="input-stitch"
                  />
                </div>

                <button
                  onClick={handleShare}
                  disabled={shareLoading}
                  className="btn-primary w-full py-3 text-sm justify-center mt-2"
                >
                  {shareLoading ? 'Generating Link...' : 'Generate Share Link'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-on-surface-variant">Share this link with anyone you want to give download access to:</p>
                <div className="flex items-center gap-2 p-1.5 bg-surface-container border border-outline-variant/50 rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={shareLinkToken}
                    className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-on-surface font-mono select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2.5 bg-surface hover:bg-surface-container-high rounded-lg text-on-surface transition shrink-0 border border-outline-variant/30"
                  >
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewIndex !== null && files[previewIndex] && (
        <FilePreviewModal
          file={files[previewIndex]}
          onClose={() => setPreviewIndex(null)}
          onNext={previewIndex < files.length - 1 ? () => setPreviewIndex(previewIndex + 1) : undefined}
          onPrev={previewIndex > 0 ? () => setPreviewIndex(previewIndex - 1) : undefined}
          onDelete={(id) => {
            setPreviewIndex(null)
            handleDelete(id, 'file')
          }}
          onRename={(id, name) => {
            setPreviewIndex(null)
            openRename(id, name, 'file')
          }}
          onShare={(id) => {
            setPreviewIndex(null)
            setShareId(id)
          }}
        />
      )}
    </div>
  )
}
