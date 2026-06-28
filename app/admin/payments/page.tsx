'use client'

import { useEffect, useState } from 'react'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
      </div>

      <div className="bg-[#1E293B] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No payments found.</td>
                </tr>
              ) : payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {payment.transactionId || payment.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{payment.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{payment.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-blue-400 font-medium">
                    {payment.plan?.name}
                  </td>
                  <td className="px-6 py-4 text-white font-bold">
                    {payment.currency === 'INR' ? '₹' : '$'}{payment.amount}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                      payment.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
