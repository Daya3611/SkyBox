'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, Download, Share2, Trash2, Edit2, ChevronLeft, ChevronRight,
  File, FileText, Image as ImageIcon, Film, Music, FileArchive, Link as LinkIcon
} from 'lucide-react'
import { formatBytes } from '@/lib/utils/client-utils'

interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  isDeleted: boolean
  createdAt: string
}

interface FilePreviewModalProps {
  file: FileItem
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onShare: (id: string) => void
}

export default function FilePreviewModal({ 
  file, onClose, onNext, onPrev, onDelete, onRename, onShare 
}: FilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isImage = file.mimeType.startsWith('image/')
  const isVideo = file.mimeType.startsWith('video/')
  const isAudio = file.mimeType.startsWith('audio/')
  const isPdf = file.mimeType === 'application/pdf'
  const isText = file.mimeType.startsWith('text/') || file.mimeType.includes('json') || file.mimeType.includes('xml')
  
  const canPreviewDirectly = isImage || isVideo || isAudio
  const needsFetch = isPdf || isText
  const isUnsupported = !canPreviewDirectly && !needsFetch

  useEffect(() => {
    let active = true
    let currentBlobUrl: string | null = null

    const fetchContent = async () => {
      if (!needsFetch) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const res = await fetch(`/api/files/${file.id}`)
        if (!res.ok) throw new Error('Failed to fetch file content')

        if (isText) {
          const text = await res.text()
          if (active) setTextContent(text)
        } else if (isPdf) {
          const buffer = await res.arrayBuffer()
          const pdfBlob = new Blob([buffer], { type: 'application/pdf' })
          currentBlobUrl = URL.createObjectURL(pdfBlob)
          if (active) setBlobUrl(currentBlobUrl)
        }
      } catch (err: any) {
        if (active) setError('Could not load preview. Please download the file instead.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchContent()

    return () => {
      active = false
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
    }
  }, [file.id, isText, isPdf, needsFetch])

  const handleDownload = () => {
    window.location.assign(`/api/files/${file.id}`)
  }

  // Fallback icon logic
  const getFallbackIcon = () => {
    if (file.mimeType.includes('zip') || file.mimeType.includes('rar') || file.mimeType.includes('archive')) return FileArchive
    if (file.mimeType.includes('msword') || file.mimeType.includes('officedocument')) return FileText
    return File
  }
  const FallbackIcon = getFallbackIcon()

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background md:bg-on-surface/40 md:backdrop-blur-md md:p-6 animate-fade-in">
      
      {/* Modal Container */}
      <div className="flex-1 flex flex-col bg-background md:bg-surface-container-lowest md:rounded-[24px] md:shadow-2xl overflow-hidden md:border md:border-outline-variant/50 max-w-[1200px] mx-auto w-full relative">
        
        {/* Toolbar */}
        <div className="h-16 border-b border-outline-variant/30 flex items-center justify-between px-4 shrink-0 bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition text-on-surface-variant">
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm text-on-surface truncate">{file.name}</span>
              <span className="text-[10px] text-on-surface-variant">{formatBytes(file.size)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => onRename(file.id, file.name)} className="p-2 hover:bg-surface-container rounded-full transition text-on-surface-variant hidden sm:block" title="Rename">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onShare(file.id)} className="p-2 hover:bg-surface-container rounded-full transition text-on-surface-variant" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="p-2 hover:bg-surface-container rounded-full transition text-primary" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(file.id)} className="p-2 hover:bg-error-container rounded-full transition text-error hidden sm:block" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-surface-container-low flex items-center justify-center overflow-hidden group">
          
          {/* Navigation Prev */}
          {onPrev && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPrev() }} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-surface border border-outline-variant/50 rounded-full shadow-lg text-on-surface opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-surface-container hover:scale-105"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main Preview Container */}
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4 md:p-8">
            
            {loading && needsFetch ? (
              <div className="flex flex-col items-center gap-3 text-primary animate-pulse">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-semibold">Loading preview...</span>
              </div>
            ) : error ? (
              <div className="text-center space-y-3">
                <FallbackIcon className="w-16 h-16 text-error mx-auto opacity-50" />
                <p className="text-error font-medium">{error}</p>
                <button onClick={handleDownload} className="btn-primary">Download File</button>
              </div>
            ) : (
              <>
                {/* IMAGE */}
                {isImage && (
                  <img 
                    src={`/api/files/${file.id}`} 
                    alt={file.name} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                )}
                
                {/* VIDEO */}
                {isVideo && (
                  <video 
                    src={`/api/files/${file.id}`} 
                    controls 
                    controlsList="nodownload"
                    className="max-w-full max-h-full rounded-xl shadow-lg bg-black"
                  />
                )}
                
                {/* AUDIO */}
                {isAudio && (
                  <div className="flex flex-col items-center gap-6 bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant/30 w-full max-w-md">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Music className="w-12 h-12" />
                    </div>
                    <div className="text-center w-full">
                      <h3 className="font-bold text-on-surface truncate">{file.name}</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Audio File</p>
                    </div>
                    <audio src={`/api/files/${file.id}`} controls className="w-full" />
                  </div>
                )}
                
                {isPdf && blobUrl && (
                  <iframe 
                    src={blobUrl}
                    className="w-full h-full rounded-xl border border-outline-variant/50 bg-white"
                    title={file.name}
                  />
                )}
                
                {/* TEXT / CODE */}
                {isText && textContent !== null && (
                  <div className="w-full h-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden flex flex-col shadow-sm text-left">
                    <div className="bg-surface-container py-2 px-4 border-b border-outline-variant/30 flex justify-between items-center text-xs text-on-surface-variant font-mono">
                      <span>{file.name}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(textContent)}
                        className="hover:text-primary transition"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 overflow-auto flex-1 text-sm text-on-surface font-mono leading-relaxed whitespace-pre-wrap">
                      <code>{textContent}</code>
                    </pre>
                  </div>
                )}
                
                {/* UNSUPPORTED FALLBACK */}
                {isUnsupported && (
                  <div className="flex flex-col items-center justify-center p-10 bg-surface rounded-3xl border border-outline-variant/30 shadow-sm max-w-sm w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-surface-container rounded-2xl flex items-center justify-center text-outline">
                      <FallbackIcon className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-on-surface break-words">{file.name}</h3>
                      <p className="text-sm text-on-surface-variant mt-1.5">{formatBytes(file.size)} • {file.mimeType || 'Unknown format'}</p>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl text-sm text-on-surface-variant w-full">
                      This file type cannot be previewed. Download the file to view it.
                    </div>
                    <div className="flex gap-3 w-full">
                      <button onClick={() => onShare(file.id)} className="btn-outline flex-1">Share</button>
                      <button onClick={handleDownload} className="btn-primary flex-1">Download</button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Navigation Next */}
          {onNext && (
            <button 
              onClick={(e) => { e.stopPropagation(); onNext() }} 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-surface border border-outline-variant/50 rounded-full shadow-lg text-on-surface opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-surface-container hover:scale-105"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
