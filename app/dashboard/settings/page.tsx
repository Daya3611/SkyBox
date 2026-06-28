import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import SettingsClient from './settings-client'

export const runtime = 'nodejs'

export default async function SettingsPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  return <SettingsClient user={session.user} />
}
