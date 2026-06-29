import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Large files (> 50MB)
    const largeFiles = await prisma.file.findMany({
      where: { userId, isDeleted: false, size: { gt: 50 * 1024 * 1024 } },
      orderBy: { size: 'desc' },
      take: 20,
      select: { id: true, name: true, size: true, mimeType: true },
    })

    // 2. Old Downloads (older than 6 months)
    const oldFilesDate = new Date()
    oldFilesDate.setMonth(oldFilesDate.getMonth() - 6)
    
    const oldFiles = await prisma.file.findMany({
      where: { userId, isDeleted: false, lastAccessedAt: { lt: oldFilesDate } },
      orderBy: { lastAccessedAt: 'asc' },
      take: 20,
      select: { id: true, name: true, size: true, lastAccessedAt: true },
    })

    // 3. Duplicate files (files with Wsame checksum)
    const filesWithChecksum = await prisma.file.groupBy({
      by: ['checksum'],
      where: { userId, isDeleted: false, checksum: { not: null } },
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } }
    })

    const duplicateChecksums = filesWithChecksum.map((f: any) => f.checksum).filter(Boolean) as string[]
    
    let duplicateFiles: any[] = []
    if (duplicateChecksums.length > 0) {
      duplicateFiles = await prisma.file.findMany({
        where: { userId, isDeleted: false, checksum: { in: duplicateChecksums } },
        orderBy: { checksum: 'asc' },
        select: { id: true, name: true, size: true, checksum: true }
      })
    }

    // 4. Empty folders
    // Folders with no files and no subfolders
    const allFolders = await prisma.folder.findMany({
      where: { userId, isDeleted: false },
      include: {
        _count: {
          select: { files: { where: { isDeleted: false } }, children: { where: { isDeleted: false } } }
        }
      }
    })

    const emptyFolders = allFolders.filter(f => f._count.files === 0 && f._count.children === 0)
      .map(f => ({ id: f.id, name: f.name }))

    return NextResponse.json({
      success: true,
      data: {
        largeFiles,
        oldFiles,
        duplicateFiles,
        emptyFolders,
      }
    })

  } catch (error: any) {
    console.error('[StorageCleanupAPI] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
