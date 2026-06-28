'use client'

import React, { useState, useEffect } from 'react'
import { HardDrive, Download, Lock, AlertCircle, FileText, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { formatBytes } from '@/lib/utils/client-utils'

interface ShareMetadata {
  name: string
  size: number
  mimeType: string
  passwordRequired: boolean
  expiresAt: string | null
  createdAt: string
}

interface ShareClientProps {
  token: string
}

export default function ShareClient({ token }: ShareClientProps) {
  const [metadata, setMetadata] = useState<ShareMetadata | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Fetch file info
  const fetchInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/share/${token}?info=true`)
      const data = await res.json()
      if (res.ok && data.success) {
        setMetadata(data.metadata)
        // If password is not required, mark verified
        if (!data.metadata.passwordRequired) {
          setVerified(true)
        }
      } else {
        setError(data.error || 'Failed to retrieve sharing details.')
      }
    } catch (err) {
      setError('Failed to fetch file sharing details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInfo()
  }, [token])

  // Handle password submit
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setVerifying(true)
    setError(null)

    try {
      const res = await fetch(`/api/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setVerified(true)
      } else {
        setError(data.error || 'Incorrect password.')
      }
    } catch (err) {
      setError('An error occurred during verification.')
    } finally {
      setVerifying(false)
    }
  }

  // Handle actual download
  const handleDownload = () => {
    const link = document.createElement('a')
    const passwordParam = password ? `?password=${encodeURIComponent(password)}` : ''
    link.href = `/api/share/${token}${passwordParam}`
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-on-background">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-3xl flex flex-col items-center gap-4 animate-pulse shadow-sm">
          <div className="w-12 h-12 bg-surface-container rounded-full" />
          <div className="h-5 bg-surface-container rounded w-1/2" />
          <div className="h-4 bg-surface-container rounded w-2/3" />
        </div>
      </div>
    )
  }

  const isImage = metadata?.mimeType.startsWith('image/')
  const isVideo = metadata?.mimeType.startsWith('video/')
  const isAudio = metadata?.mimeType.startsWith('audio/')
  const isPdf = metadata?.mimeType === 'application/pdf'
  const isPreviewable = isImage || isVideo || isAudio || isPdf

  const previewUrl = `/api/share/${token}${password ? `?password=${encodeURIComponent(password)}` : ''}`

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-on-background font-sans">
      <div 
        className="bg-surface-container-lowest border border-outline-variant/50 p-8 rounded-[24px] shadow-xl space-y-6 transition-all duration-300 ease-in-out"
        style={{ width: '100%', maxWidth: showPreview ? '48rem' : '28rem', minWidth: '320px' }}
      >

        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="p-4 bg-primary/10 rounded-[20px] text-primary mb-2 shadow-sm">
            <HardDrive className="w-8 h-8" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            SkyBox Share Portal
          </h1>
          <p className="text-sm text-on-surface-variant font-medium">Download files safely and securely</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center gap-3 bg-error-container/30 border border-error/20 text-error text-sm p-4 rounded-xl font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* PASSWORD FORM (if password is required and not verified) */}
        {!verified && metadata?.passwordRequired ? (
          <form onSubmit={handleVerifyPassword} className="space-y-5">
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-on-surface">Password Protected File</p>
              <p className="text-sm text-on-surface-variant">Please enter the password to download this file.</p>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={verifying}
                  placeholder="Enter file password"
                  className="input-stitch w-full pl-11 py-3 bg-surface text-base"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || !password}
              className="w-full py-3.5 bg-primary hover:bg-primary-container rounded-xl text-sm font-bold text-on-primary hover:text-on-primary-container transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-md"
            >
              {verifying ? 'Verifying...' : 'Unlock & Download'}
            </button>
          </form>
        ) : (
          /* DOWNLOAD PANEL (if verified or public) */
          metadata && (
            <div className="space-y-6">
              
              {/* Preview Box */}
              {showPreview && isPreviewable && (
                <div className="w-full bg-surface-container rounded-[20px] overflow-hidden border border-outline-variant/30 flex items-center justify-center max-h-[60vh] animate-fade-in shadow-inner relative">
                  {isImage && <img src={previewUrl} alt={metadata.name} className="max-w-full max-h-[60vh] object-contain" />}
                  {isVideo && <video src={previewUrl} controls className="max-w-full max-h-[60vh]" />}
                  {isAudio && <audio src={previewUrl} controls className="w-full m-8" />}
                  {isPdf && <iframe src={previewUrl} className="w-full h-[60vh]" title={metadata.name} />}
                </div>
              )}

              {/* File Information Card */}
              <div className="p-5 bg-surface/50 border border-outline-variant/30 rounded-2xl flex items-center gap-4 transition-all">
                <div className="p-3.5 bg-secondary/10 text-secondary rounded-[16px]">
                  <FileText className="w-7 h-7" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-base font-bold text-on-surface truncate" title={metadata.name}>
                    {metadata.name}
                  </p>
                  <p className="text-sm font-medium text-on-surface-variant">
                    {formatBytes(metadata.size)} • {metadata.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                </div>
              </div>

              {metadata.expiresAt && (
                <div className="text-center text-xs font-medium text-on-surface-variant bg-surface-container-low py-2 px-4 rounded-lg inline-block mx-auto w-full">
                  Link expires: {new Date(metadata.expiresAt).toLocaleString()}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {isPreviewable && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full py-3.5 bg-surface hover:bg-surface-container-low border-2 border-outline-variant/50 rounded-xl text-sm font-bold text-on-surface transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    {showPreview ? 'Hide Preview' : 'Preview File'}
                  </button>
                )}
                
                <button
                  onClick={handleDownload}
                  className={`w-full py-3.5 bg-primary hover:bg-primary-container rounded-xl text-sm font-bold text-on-primary hover:text-on-primary-container transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${!isPreviewable ? 'sm:col-span-2' : ''}`}
                >
                  <Download className="w-5 h-5" />
                  Download File
                </button>
              </div>

              {metadata.passwordRequired && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-secondary mt-4">
                  <CheckCircle2 className="w-4 h-4" />
                  Unlocked Successfully
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
