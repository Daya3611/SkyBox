import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Total storage and files
    const totalStats = await prisma.file.aggregate({
      where: { userId, isDeleted: false },
      _sum: { size: true },
      _count: { id: true },
    })

    const totalFolders = await prisma.folder.count({
      where: { userId, isDeleted: false },
    })

    // 2. Trash size
    const trashStats = await prisma.file.aggregate({
      where: { userId, isDeleted: true },
      _sum: { size: true },
      _count: { id: true },
    })

    // 3. Storage by MimeType (Group By)
    const mimeStats = await prisma.file.groupBy({
      by: ['mimeType'],
      where: { userId, isDeleted: false },
      _sum: { size: true },
      _count: { id: true },
    })

    // 4. Largest Files
    const largestFiles = await prisma.file.findMany({
      where: { userId, isDeleted: false },
      orderBy: { size: 'desc' },
      take: 10,
      select: { id: true, name: true, size: true, mimeType: true, createdAt: true },
    })

    // 5. Recently Deleted
    const recentlyDeleted = await prisma.file.findMany({
      where: { userId, isDeleted: true },
      orderBy: { deletedAt: 'desc' },
      take: 10,
      select: { id: true, name: true, size: true, mimeType: true, deletedAt: true },
    })

    // Parse mime types into categories
    const categories: Record<string, { size: number; count: number }> = {
      Images: { size: 0, count: 0 },
      Videos: { size: 0, count: 0 },
      Documents: { size: 0, count: 0 },
      Audio: { size: 0, count: 0 },
      Archives: { size: 0, count: 0 },
      Applications: { size: 0, count: 0 },
      Other: { size: 0, count: 0 },
    }

    mimeStats.forEach(stat => {
      const mime = stat.mimeType
      const size = stat._sum.size || 0
      const count = stat._count.id
      
      if (mime.startsWith('image/')) { categories.Images.size += size; categories.Images.count += count; }
      else if (mime.startsWith('video/')) { categories.Videos.size += size; categories.Videos.count += count; }
      else if (mime.startsWith('audio/')) { categories.Audio.size += size; categories.Audio.count += count; }
      else if (mime.includes('document') || mime.includes('pdf') || mime.includes('msword') || mime.includes('text')) { categories.Documents.size += size; categories.Documents.count += count; }
      else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('gzip')) { categories.Archives.size += size; categories.Archives.count += count; }
      else if (mime.includes('application/')) { categories.Applications.size += size; categories.Applications.count += count; }
      else { categories.Other.size += size; categories.Other.count += count; }
    })

    // Fetch actual StorageQuota
    const storageQuota = await prisma.storageQuota.findUnique({
      where: { userId }
    })
    const quota = storageQuota?.allocatedStorage || (5 * 1024 * 1024 * 1024) // Fallback to 5GB if not found

    return NextResponse.json({
      success: true,
      data: {
        totalSize: totalStats._sum.size || 0,
        totalFiles: totalStats._count.id,
        totalFolders,
        trashSize: trashStats._sum.size || 0,
        trashCount: trashStats._count.id,
        quota,
        categories,
        largestFiles,
        recentlyDeleted
      }
    })

  } catch (error: any) {
    console.error('[StorageStatsAPI] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
