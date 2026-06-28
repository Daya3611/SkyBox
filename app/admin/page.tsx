'use client'

import { useEffect, useState } from 'react'
import { Users, HardDrive, CreditCard, Activity, RefreshCw } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading || !stats) {
    return <div className="text-white animate-pulse">Loading dashboard statistics...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
        <h1 className="text-2xl font-bold text-on-surface">Dashboard Overview</h1>
        <button onClick={fetchStats} className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors shadow-sm">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="text-blue-500" />
        <StatCard title="Active Paid Users" value={stats.activePaidUsers} icon={Users} color="text-emerald-500" />
        <StatCard title="Total Files" value={stats.totalFiles} icon={HardDrive} color="text-amber-500" />
        <StatCard title="Storage Used" value={formatBytes(stats.totalUploadsSize)} icon={Activity} color="text-purple-500" />

        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue}`} icon={CreditCard} color="text-emerald-400" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={CreditCard} color="text-amber-400" />
        <StatCard title="Failed Payments" value={stats.failedPayments} icon={CreditCard} color="text-red-500" />
        <StatCard title="Today's Uploads" value={stats.todaysUploads} icon={HardDrive} color="text-blue-400" />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 flex flex-col shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-on-surface-variant font-medium text-sm">{title}</h3>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold text-on-surface">{value}</span>
      </div>
    </div>
  )
}
