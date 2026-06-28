import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import TrashClient from './trash-client'

export const runtime = 'nodejs'

export default async function TrashPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <TrashClient user={session.user} />
}
