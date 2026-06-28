import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import SharedClient from './shared-client'

export const runtime = 'nodejs'

export default async function SharedPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <SharedClient user={session.user} />
}
