'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface UploadDialogProps {
  currentFolderId: string | null
  onUploadComplete: () => void
  onClose: () => void
}

interface UploadQueueItem {
  id: string
  name: string
  size: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  errorMsg?: string
  progress?: number
}

export default function UploadDialog({ currentFolderId, onUploadComplete, onClose }: UploadDialogProps) {
  const [dragActive, setDragActive] = useState(false)
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const processFiles = (files: FileList) => {
    const newItems: UploadQueueItem[] = Array.from(files).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      status: 'idle',
      progress: 0,
    }))
    setQueue((prev) => [...prev, ...newItems])

    // Start upload process automatically
    uploadQueue(Array.from(files), newItems)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files)
    }
  }

  const uploadQueue = async (rawFiles: File[], items: UploadQueueItem[]) => {
    setUploading(true)

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i]
      const queueItem = items[i]

      setQueue((prev) =>
        prev.map((item) => (item.id === queueItem.id ? { ...item, status: 'uploading', progress: 0 } : item))
      )

      const formData = new FormData()
      formData.append('file', file)
      if (currentFolderId) {
        formData.append('folderId', currentFolderId)
      }

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload', true)

        let simInterval: NodeJS.Timeout | null = null

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // First 50% is network transfer to our server
            const networkPercent = Math.round((event.loaded / event.total) * 50)
            setQueue((prev) =>
              prev.map((item) => (item.id === queueItem.id ? { ...item, progress: networkPercent } : item))
            )
            
            // Once browser finishes sending, simulate server processing to Telegram (50% -> 99%)
            if (event.loaded === event.total && !simInterval) {
              // Estimate server processing time (assume ~5MB/s to Telegram)
              const estimatedSeconds = Math.max(3, file.size / (5 * 1024 * 1024)) 
              const updateIntervalMs = 500
              const totalSteps = estimatedSeconds * (1000 / updateIntervalMs)
              const stepIncrement = (99 - 50) / totalSteps
              
              let currentProgress = 50
              
              simInterval = setInterval(() => {
                currentProgress += stepIncrement
                if (currentProgress >= 99) currentProgress = 99
                
                setQueue((prev) => {
                  // Only update if still uploading
                  const target = prev.find((item) => item.id === queueItem.id)
                  if (target && target.status === 'uploading') {
                     return prev.map((item) => (item.id === queueItem.id ? { ...item, progress: Math.floor(currentProgress) } : item))
                  }
                  if (simInterval) clearInterval(simInterval)
                  return prev
                })
              }, updateIntervalMs)
            }
          }
        }

        xhr.onload = () => {
          if (simInterval) clearInterval(simInterval)
          if (xhr.status >= 200 && xhr.status < 300) {
            setQueue((prev) =>
              prev.map((item) => (item.id === queueItem.id ? { ...item, status: 'success', progress: 100 } : item))
            )
          } else {
            let errData = {}
            try { errData = JSON.parse(xhr.responseText) } catch (e) {}
            const errMsg = (errData as any).error || `Upload failed (${xhr.statusText})`
            setQueue((prev) =>
              prev.map((item) => (item.id === queueItem.id ? { ...item, status: 'error', errorMsg: errMsg } : item))
            )
          }
          resolve()
        }

        xhr.onerror = () => {
          if (simInterval) clearInterval(simInterval)
          setQueue((prev) =>
            prev.map((item) => (item.id === queueItem.id ? { ...item, status: 'error', errorMsg: 'Network error' } : item))
          )
          resolve()
        }

        xhr.send(formData)
      })
    }

    setUploading(false)
    onUploadComplete()
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
      <div 
        className="bg-surface-container-lowest border border-outline-variant/50 rounded-[24px] shadow-2xl flex flex-col max-h-[85vh]"
        style={{ width: '100%', maxWidth: '32rem', minWidth: '320px' }}
      >

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-on-surface">
              Upload Files
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drag Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant/50 bg-surface-container hover:border-primary/50'
            }`}
          >
            <div className="p-4 bg-surface-container-lowest rounded-full shadow-sm text-primary">
              <Upload className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-sm text-on-surface">
                Drag & drop files here or <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Any file type. Files over 40MB will be automatically chunked.
              </p>
            </div>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Queue ({queue.length})
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-surface border border-outline-variant/30 rounded-xl text-sm"
                  >
                    <div className="flex items-center gap-3 truncate pr-4">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <File className="w-4 h-4 text-primary" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-sm truncate text-on-surface">{item.name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {(item.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {item.status === 'uploading' && (
                        <div className="flex flex-col items-end gap-1.5 w-28">
                          <span className="flex items-center gap-1.5 text-[11px] text-primary font-bold tracking-wide">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {item.progress !== undefined ? `${item.progress}%` : 'Uploading'}
                          </span>
                          {item.progress !== undefined && (
                            <Progress value={item.progress} className="w-full h-1.5" />
                          )}
                        </div>
                      )}
                      {item.status === 'success' && (
                        <span className="flex items-center gap-1.5 text-xs text-[#006E1C] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Success
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span
                          className="flex items-center gap-1.5 text-xs text-error font-semibold cursor-help"
                          title={item.errorMsg}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                      {item.status === 'idle' && (
                        <span className="text-xs text-on-surface-variant font-medium">Waiting</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-outline-variant/30 bg-surface-container-low flex justify-end rounded-b-[24px]">
          <button
            onClick={onClose}
            disabled={uploading}
            className="btn-outline px-6 py-2.5 text-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
