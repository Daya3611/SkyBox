import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import FavoritesClient from './favorites-client'

export const metadata = {
  title: 'Favorites | SkyBox',
}

export default async function FavoritesPage() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect('/auth/signin')
  }

  return <FavoritesClient user={session.user} />
}
