import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import RecentClient from './recent-client'


export const metadata = {
  title: 'Recent Files | SkyBox',
}

export default async function RecentPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  return <RecentClient user={session.user} />
}
