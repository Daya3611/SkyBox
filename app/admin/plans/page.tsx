'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, X } from 'lucide-react'

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    storageLimitGB: 5,
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const openCreateModal = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      storageLimitGB: 5,
      isActive: true
    })
    setIsModalOpen(true)
  }

  const openEditModal = (plan: any) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      storageLimitGB: Math.round(plan.storageLimit / (1024 * 1024 * 1024)),
      isActive: plan.isActive
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    const payload = {
      id: editingPlan?.id,
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      storageLimit: Number(formData.storageLimitGB) * 1024 * 1024 * 1024,
      isActive: formData.isActive
    }

    try {
      const res = await fetch('/api/admin/plans', {
        method: editingPlan ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchPlans()
      } else {
        const data = await res.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error(error)
      alert('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (plan: any) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan.id,
          isActive: !plan.isActive
        })
      })
      if (res.ok) {
        fetchPlans()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
        <h1 className="text-2xl font-bold text-on-surface">Subscription Plans</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl hover:opacity-90 transition font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {loading ? (
        <div className="text-on-surface-variant animate-pulse">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-surface-container border ${plan.isDefault ? 'border-primary' : 'border-outline-variant/30'} rounded-2xl p-6 flex flex-col shadow-sm`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-surface-container-high rounded-xl text-primary shadow-sm">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-on-surface">{plan.name}</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-on-surface">₹{plan.price}</span>
                <span className="text-on-surface-variant text-sm font-medium"> / month</span>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Storage Limit</span>
                  <span className="text-on-surface font-semibold">{formatBytes(plan.storageLimit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Status</span>
                  <span className={`font-semibold ${plan.isActive ? 'text-primary' : 'text-error'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {plan.isDefault && (
                  <div className="inline-block mt-2 px-2 py-1 bg-primary/20 text-primary text-xs rounded font-medium">
                    Default Plan
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <button 
                  onClick={() => openEditModal(plan)}
                  className="flex-1 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl transition text-sm font-semibold"
                >
                  Edit
                </button>
                {!plan.isDefault && (
                  <button 
                    onClick={() => handleToggleStatus(plan)}
                    className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-xl transition text-sm font-semibold"
                  >
                    {plan.isActive ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-outline-variant/30">
              <h2 className="text-lg font-bold text-on-surface">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Plan Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="e.g. Pro Max"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Description (Optional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-surface border border-outline-variant/50 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none h-20"
                  placeholder="Features included..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Price (₹ / month)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Storage Limit (GB)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.storageLimitGB}
                    onChange={(e) => setFormData({...formData, storageLimitGB: Number(e.target.value)})}
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl px-3 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary focus:ring-offset-background bg-surface"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-on-surface">
                  Plan is Active (Available for purchase)
                </label>
              </div>

              <div className="pt-4 flex gap-3 border-t border-outline-variant/30 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary hover:opacity-90 text-on-primary rounded-xl transition font-medium disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
