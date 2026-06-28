'use client'

import { useEffect, useState } from 'react'
import { X, Save, Database, FolderOpen, Calendar, Shield } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [updatingPlan, setUpdatingPlan] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, plansRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/plans')
      ])
      
      if (usersRes.ok) setUsers(await usersRes.json())
      if (plansRes.ok) setPlans(await plansRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleRowClick = (user: any) => {
    setSelectedUser(user)
    setSelectedPlanId(user.subscription?.plan?.id || '')
  }

  const handleUpdatePlan = async () => {
    if (!selectedUser || !selectedPlanId) return
    
    setUpdatingPlan(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId })
      })

      if (res.ok) {
        await fetchData()
        setSelectedUser(null)
      } else {
        const data = await res.json()
        alert(`Error updating plan: ${data.error}`)
      }
    } catch (err) {
      console.error(err)
      alert('Network error')
    } finally {
      setUpdatingPlan(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
        <h1 className="text-2xl font-bold text-on-surface">Users</h1>
      </div>

      <div className="bg-surface-container border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface">
            <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 font-medium">Name / Email</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Storage Used</th>
                <th className="px-6 py-4 font-medium">Files / Folders</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant animate-pulse">Loading users...</td>
                </tr>
              ) : users.map((user) => {
                const used = user.storageQuota?.usedStorage || 0
                const allocated = user.storageQuota?.allocatedStorage || 1
                const percent = Math.min(100, Math.round((used / allocated) * 100))
                
                return (
                  <tr 
                    key={user.id} 
                    onClick={() => handleRowClick(user)}
                    className="hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-sm">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-on-surface font-medium">{user.name || 'Unknown'}</p>
                          <p className="text-xs text-on-surface-variant">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.subscription?.plan?.name === 'FREE' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/20 text-primary'
                      }`}>
                        {user.subscription?.plan?.name || 'FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">{formatBytes(used)} / {formatBytes(allocated)}</span>
                        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${percent > 90 ? 'bg-error' : percent > 75 ? 'bg-amber-500' : 'bg-primary'}`} 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {user._count.files} / {user._count.folders}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs border border-outline-variant px-2 py-1 rounded font-medium text-on-surface-variant">{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/30 bg-surface">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
                  {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">{selectedUser.name || 'Unknown User'}</h2>
                  <p className="text-sm text-on-surface-variant">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <Database className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Storage</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {formatBytes(selectedUser.storageQuota?.usedStorage || 0)} used
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    of {formatBytes(selectedUser.storageQuota?.allocatedStorage || 1)}
                  </span>
                </div>
                
                <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <FolderOpen className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Items</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {selectedUser._count.files} Files
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {selectedUser._count.folders} Folders
                  </span>
                </div>

                <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Joined</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Role</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Subscription Management */}
              <div className="border-t border-outline-variant/30 pt-6">
                <h3 className="text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">Subscription Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">Change User Plan</label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/50 rounded-xl px-3 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
                    >
                      <option value="" disabled>Select a plan...</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - {formatBytes(plan.storageLimit)} (₹{plan.price}/mo)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleUpdatePlan}
                    disabled={updatingPlan || selectedPlanId === selectedUser.subscription?.plan?.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-medium shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {updatingPlan ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
