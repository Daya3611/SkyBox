import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { StorageService } from '@/lib/services/storage.service'
import { FileService } from '@/lib/services/file.service'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET: Downloads a file by streaming its chunks from Telegram
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Authenticate user (or allow public access if checked elsewhere; for this endpoint we require auth)
    // Wait, shared links will use a separate /api/share/[token] endpoint, so this endpoint is fully protected.
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify ownership
    const file = await prisma.file.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!file) {
      return new Response('File not found or access denied', { status: 404 })
    }

    // 2. Fetch stream from StorageService
    const { stream, name, mimeType, size } = await StorageService.downloadFile(id)

    // 3. Return stream with headers for direct file download
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', size.toString())
    // Secure header for downloading UTF-8 filenames safely
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`)
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    // Mark as accessed
    await FileService.markFileAsAccessed(id, session.user.id)

    return new Response(stream, {
      status: 200,
      headers,
    })

  } catch (error: any) {
    console.error('[FileAPI] Download error:', error)
    return new Response(error.message || 'Error downloading file', { status: 500 })
  }
}

/**
 * PATCH: Modifies file metadata (rename, move, restore)
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

    const userId = session.user.id
    const body = await req.json()
    const { name, folderId, isDeleted, isFavorite } = body

    let file = await prisma.file.findFirst({
      where: { id, userId },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // 1. Handle Rename
    if (name && name.trim() !== '') {
      file = await FileService.renameFile(id, userId, name.trim())
    }

    // 2. Handle Move
    if (folderId !== undefined) {
      file = await FileService.moveFile(id, userId, folderId)
    }

    // 3. Handle Restore
    if (isDeleted === false && file.isDeleted) {
      file = await FileService.restoreFile(id, userId)
    }

    // 4. Handle Favorite Toggle
    if (isFavorite !== undefined) {
      file = await FileService.toggleFavoriteFile(id, userId, isFavorite)
    }

    return NextResponse.json({ success: true, file })

  } catch (error: any) {
    console.error('[FileAPI] PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE: Deletes a file (soft delete by default, hard delete removes Telegram storage)
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

    const { searchParams } = req.nextUrl
    const hard = searchParams.get('hard') === 'true'

    // Verify ownership
    const file = await prisma.file.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Perform deletion
    if (hard) {
      await StorageService.deleteFile(id, true)
    } else {
      await FileService.softDeleteFile(id, session.user.id)
    }

    return NextResponse.json({ success: true, message: hard ? 'File permanently deleted' : 'File moved to trash' })

  } catch (error: any) {
    console.error('[FileAPI] DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
