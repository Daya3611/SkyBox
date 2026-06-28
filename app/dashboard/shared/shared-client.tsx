'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { Share2, RefreshCw, Trash2, ExternalLink, Copy, Check, Lock, Calendar } from 'lucide-react'
import { formatBytes } from '@/lib/utils/client-utils'

interface ShareItem {
  id: string
  token: string
  passwordHash: string | null
  expiresAt: string | null
  downloadCount: number
  createdAt: string
  file: {
    id: string
    name: string
    size: number
    mimeType: string
  }
}

interface SharedClientProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
}

export default function SharedClient({ user }: SharedClientProps) {
  const [shares, setShares] = useState<ShareItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchShares = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/share')
      if (res.ok) {
        const data = await res.json()
        setShares(data.shares || [])
      }
    } catch (err) {
      console.error('Failed to fetch shared links:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this share link? Anyone with this link will lose access.')) {
      return
    }

    try {
      const res = await fetch(`/api/share?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareLinkId: id })
      })

      if (res.ok) {
        fetchShares()
      }
    } catch (err) {
      console.error('Failed to revoke link:', err)
    }
  }

  const handleCopy = (id: string, token: string) => {
    const origin = window.location.origin
    navigator.clipboard.writeText(`${origin}/share/${token}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  useEffect(() => {
    fetchShares()
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
              <div className="flex items-center gap-2.5 text-primary">
                <Share2 className="w-6 h-6" />
                <h1 className="text-[32px] font-semibold tracking-tight text-on-surface">
                  Shared Links
                </h1>
              </div>

              <button
                onClick={fetchShares}
                disabled={loading}
                className="p-2 bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container rounded-xl transition disabled:opacity-50 text-on-surface-variant"
                title="Refresh links"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-surface-container-high rounded-xl border border-outline-variant/30" />
                ))}
              </div>
            ) : shares.length > 0 ? (
              <div className="border border-outline-variant/30 bg-surface/70 rounded-[16px] overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm font-semibold text-on-surface-variant border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface">
                      <th className="p-4">File Name</th>
                      <th className="p-4">Size</th>
                      <th className="p-4">Downloads</th>
                      <th className="p-4">Protection</th>
                      <th className="p-4">Expires</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 text-on-surface font-medium">
                    {shares.map((share) => (
                      <tr key={share.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 truncate max-w-[200px] font-semibold text-on-surface">
                          {share.file.name}
                        </td>
                        <td className="p-4 text-on-surface-variant">
                          {formatBytes(share.file.size)}
                        </td>
                        <td className="p-4 text-on-surface-variant">
                          {share.downloadCount}
                        </td>
                        <td className="p-4">
                          {share.passwordHash ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] rounded-full font-bold uppercase tracking-wider">
                              <Lock className="w-3 h-3" />
                              Password
                            </span>
                          ) : (
                            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Public</span>
                          )}
                        </td>
                        <td className="p-4 text-on-surface-variant">
                          {share.expiresAt ? (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-outline" />
                              {new Date(share.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Never</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopy(share.id, share.token)}
                              className="p-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-on-surface transition"
                              title="Copy link"
                            >
                              {copiedId === share.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <a
                              href={`/share/${share.token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-on-surface transition inline-block"
                              title="Open Link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleRevoke(share.id)}
                              className="p-2 bg-error-container hover:bg-error/20 text-error rounded-xl transition"
                              title="Revoke Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant gap-3 border border-outline-variant/30 bg-surface/70 rounded-[16px] shadow-sm">
                <Share2 className="w-12 h-12 text-outline stroke-[1.5]" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-on-surface">No shared links</p>
                  <p className="text-xs text-on-surface-variant">You haven't generated any public sharing links yet.</p>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

    </div>
  )
}
