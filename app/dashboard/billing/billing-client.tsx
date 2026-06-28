'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import { CreditCard, Zap, CheckCircle2 } from 'lucide-react'

export default function BillingClient({ user }: { user: any }) {
  const [billing, setBilling] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billRes, plansRes] = await Promise.all([
          fetch('/api/user/billing'),
          fetch('/api/plans') // Need to create this public route
        ])
        
        if (billRes.ok) {
          setBilling(await billRes.json())
        }
        if (plansRes.ok) {
          setPlans(await plansRes.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-on-background">
      <Sidebar onCreateFolderClick={() => {}} onUploadClick={() => {}} userRole={user.role} />

      <main className="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden">
        <Header user={user} />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest scrollbar-thin">
          <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-on-surface">Billing & Plans</h1>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-surface-container-high rounded-xl"></div>
                <div className="h-64 bg-surface-container-high rounded-xl"></div>
              </div>
            ) : (
              <>
                {/* Current Plan Overview */}
                <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-6 flex flex-col md:flex-row gap-8 justify-between items-start">
                  <div>
                    <h2 className="text-sm font-medium text-on-surface-variant mb-1">Current Plan</h2>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold text-on-surface">
                        {billing?.subscription?.plan?.name || 'FREE'}
                      </span>
                      <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-sm mb-6">
                      You are currently using {formatBytes(billing?.quota?.usedStorage || 0)} out of {formatBytes(billing?.quota?.allocatedStorage || 5368709120)}.
                    </p>
                    
                    {/* Storage Progress */}
                    <div className="w-full max-w-md">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-medium">Storage Usage</span>
                        <span>{Math.round(((billing?.quota?.usedStorage || 0) / (billing?.quota?.allocatedStorage || 1)) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${Math.min(100, ((billing?.quota?.usedStorage || 0) / (billing?.quota?.allocatedStorage || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-high p-6 rounded-xl min-w-[250px]">
                    <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Payment Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Price</span>
                        <span className="font-medium">₹{billing?.subscription?.plan?.price || 0} / mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Renewal Date</span>
                        <span className="font-medium">
                          {billing?.subscription?.renewalDate 
                            ? new Date(billing.subscription.renewalDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upgrade Options */}
                <div>
                  <h2 className="text-xl font-semibold text-on-surface mb-6 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500" />
                    Upgrade your storage
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                      const isCurrent = plan.id === billing?.subscription?.planId
                      return (
                        <div key={plan.id} className={`bg-surface-container rounded-2xl p-6 border transition-all ${isCurrent ? 'border-primary shadow-lg shadow-primary/10' : 'border-outline-variant/30 hover:border-primary/50'}`}>
                          {isCurrent && (
                            <div className="text-xs font-bold text-primary mb-2 tracking-wider uppercase">Current Plan</div>
                          )}
                          <h3 className="text-2xl font-bold text-on-surface mb-2">{plan.name}</h3>
                          <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-3xl font-black text-on-surface">₹{plan.price}</span>
                            <span className="text-on-surface-variant">/month</span>
                          </div>
                          
                          <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              <span className="font-medium text-on-surface">{formatBytes(plan.storageLimit)} Storage</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              Telegram Backend
                            </li>
                            <li className="flex items-center gap-3 text-sm text-on-surface-variant">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              Unlimited Bandwidth
                            </li>
                          </ul>

                          <button 
                            disabled={isCurrent}
                            className={`w-full py-3 rounded-xl font-semibold transition ${
                              isCurrent 
                                ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' 
                                : 'bg-primary text-on-primary hover:bg-primary/90'
                            }`}
                          >
                            {isCurrent ? 'Current Plan' : 'Upgrade'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
