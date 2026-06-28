import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import DashboardClient from './dashboard-client'

export const runtime = 'nodejs'

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <DashboardClient user={session.user} />
}
