import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const folders = await prisma.folder.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, folders })
  } catch (error: any) {
    console.error('[FlatFoldersAPI] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
