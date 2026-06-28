import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AdminClient from './admin-client'

export const runtime = 'nodejs'

export default async function AdminPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  // Double check admin role access control
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <AdminClient user={session.user} />
}
