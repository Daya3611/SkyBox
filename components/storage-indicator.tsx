'use client'

import React, { useEffect, useState } from 'react'
import { HardDrive } from 'lucide-react'
import { formatBytes } from '@/lib/utils/client-utils'

interface StorageStats {
  usedBytes: number
  totalBytes: number
  usagePercentage: number
  totalFiles: number
}

export default function StorageIndicator() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/storage/stats')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setStats(data.stats)
          }
        }
      } catch (err) {
        console.error('Failed to fetch storage stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl space-y-3 animate-pulse">
        <div className="h-3 bg-outline-variant/30 rounded w-2/3" />
        <div className="h-1.5 bg-outline-variant/30 rounded" />
        <div className="h-2 bg-outline-variant/30 rounded w-1/2" />
      </div>
    )
  }

  const used = stats?.usedBytes || 0
  const total = stats?.totalBytes || 10 * 1024 * 1024 * 1024 // Default 10GB
  const percentage = stats?.usagePercentage || 0
  const fileCount = stats?.totalFiles || 0

  return (
    <div className="px-2 py-3 space-y-3 text-on-surface">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <HardDrive className="w-[14px] h-[14px] text-primary" strokeWidth={2} />
          Storage Usage
        </span>
        <span className="text-primary">{percentage.toFixed(1)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-[6px] bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex flex-col gap-0.5 text-[11px] text-on-surface-variant font-medium">
        <span>
          {formatBytes(used)} of {formatBytes(total)} used
        </span>
        <span className="text-[10px] text-outline">
          {fileCount} active {fileCount === 1 ? 'file' : 'files'}
        </span>
      </div>
    </div>
  )
}
