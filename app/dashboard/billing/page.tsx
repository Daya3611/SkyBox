import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import BillingClient from './billing-client'

export default async function BillingPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <BillingClient user={session.user} />
}
