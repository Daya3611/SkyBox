import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { FileService } from '@/lib/services/file.service'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * PATCH: Renames a folder
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, isFavorite, isDeleted } = body
    const userId = session.user.id

    // Verify ownership
    let folder = await prisma.folder.findFirst({
      where: { id, userId },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    if (name && name.trim() !== '') {
      await FileService.renameFolder(id, userId, name.trim())
    }

    // 2. Handle Restore
    if (isDeleted === false && folder.isDeleted) {
      await FileService.restoreFolder(id, userId)
      folder = await prisma.folder.findFirst({ where: { id, userId } })
    }

    // 3. Handle Favorite Toggle
    if (isFavorite !== undefined) {
      await FileService.toggleFavoriteFolder(id, userId, isFavorite)
      folder = await prisma.folder.findFirst({ where: { id, userId } })
    }

    const updatedFolder = await prisma.folder.findFirst({ where: { id, userId } })
    return NextResponse.json({ success: true, folder: updatedFolder })

  } catch (error: any) {
    console.error('[FolderAPI] PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE: Cascade deletes a folder and all nested files
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const folder = await prisma.folder.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    const { searchParams } = req.nextUrl
    const hard = searchParams.get('hard') === 'true'

    // Perform delete
    if (hard) {
      await FileService.deleteFolderCascade(id, session.user.id)
    } else {
      await FileService.softDeleteFolder(id, session.user.id)
    }

    return NextResponse.json({ success: true, message: hard ? 'Folder permanently deleted' : 'Folder moved to trash' })

  } catch (error: any) {
    console.error('[FolderAPI] DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
