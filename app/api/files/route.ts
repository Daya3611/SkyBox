import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { FileService } from '@/lib/services/file.service'

export const runtime = 'nodejs'

/**
 * GET: Lists directory contents or searches files/folders
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const folderId = searchParams.get('folderId') === 'null' ? null : searchParams.get('folderId')
    const search = searchParams.get('search') || undefined
    const extension = searchParams.get('extension') || undefined
    const sort = (searchParams.get('sort') || 'date_desc') as any
    const isDeleted = searchParams.get('isDeleted') === 'true'
    const isFavoriteParam = searchParams.get('isFavorite')
    const isFavorite = isFavoriteParam ? isFavoriteParam === 'true' : undefined

    const contents = await FileService.getDirectoryContents({
      userId: session.user.id,
      folderId,
      search,
      extension,
      sort,
      isDeleted,
      isFavorite,
    })

    return NextResponse.json(contents)
  } catch (error: any) {
    console.error('[FilesAPI] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST: Creates a new folder
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, parentId } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const folder = await FileService.createFolder(
      session.user.id,
      name.trim(),
      parentId || null
    )

    return NextResponse.json({ success: true, folder }, { status: 201 })
  } catch (error: any) {
    console.error('[FilesAPI] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
