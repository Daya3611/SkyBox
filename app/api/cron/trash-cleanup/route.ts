import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { StorageService } from '@/lib/services/storage.service'
import { FileService } from '@/lib/services/file.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // 15 days ago
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 15)

    // Find all files deleted more than 15 days ago
    const filesToDelete = await prisma.file.findMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lte: cutoffDate
        }
      },
      select: { id: true, userId: true }
    })

    // Find all folders deleted more than 15 days ago
    const foldersToDelete = await prisma.folder.findMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lte: cutoffDate
        }
      },
      select: { id: true, userId: true }
    })

    let deletedFilesCount = 0
    let deletedFoldersCount = 0

    // Hard delete files
    for (const file of filesToDelete) {
      await StorageService.deleteFile(file.id, true)
      deletedFilesCount++
    }

    // Hard delete folders (cascading DB delete)
    for (const folder of foldersToDelete) {
      // Use deleteMany or individual delete
      await prisma.folder.delete({
        where: { id: folder.id }
      }).catch((err: unknown) => {
        // Might have already been cascade deleted if parent was deleted
      })
      deletedFoldersCount++
    }

    console.log(`[TrashCleanup] Cleaned up ${deletedFilesCount} files and ${deletedFoldersCount} folders.`)

    return NextResponse.json({
      success: true,
      deletedFiles: deletedFilesCount,
      deletedFolders: deletedFoldersCount,
      message: 'Trash cleanup completed successfully'
    })

  } catch (error: any) {
    console.error('[TrashCleanup] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
