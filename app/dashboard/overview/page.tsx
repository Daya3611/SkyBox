import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import OverviewClient from './overview-client'


export const runtime = 'nodejs'

export default async function OverviewPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <OverviewClient user={session.user} />
}
