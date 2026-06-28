import ShareClient from './share-client'

interface SharePageProps {
  params: Promise<{
    token: string
  }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params

  return <ShareClient token={token} />
}
