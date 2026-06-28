import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import StorageClient from './storage-client'


export const metadata = {
  title: 'Storage & Analytics | SkyBox',
}

export default async function StoragePage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  return <StorageClient user={session.user} />
}
