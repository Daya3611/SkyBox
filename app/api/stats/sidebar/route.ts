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

    // Trash count
    const trashFiles = await prisma.file.count({ where: { userId, isDeleted: true } })
    const trashFolders = await prisma.folder.count({ where: { userId, isDeleted: true } })
    const trashCount = trashFiles + trashFolders

    // Favorites count
    const favFiles = await prisma.file.count({ where: { userId, isFavorite: true, isDeleted: false } })
    const favFolders = await prisma.folder.count({ where: { userId, isFavorite: true, isDeleted: false } })
    const favoritesCount = favFiles + favFolders

    // Recent count (Let's define recent as modified or accessed in the last 7 days)
    const recentCutoff = new Date()
    recentCutoff.setDate(recentCutoff.getDate() - 7)
    const recentCount = await prisma.file.count({
      where: { userId, isDeleted: false, lastAccessedAt: { gte: recentCutoff } }
    })

    // Storage Usage
    const { SubscriptionService } = await import('@/lib/services/subscription.service')
    const { quota } = await SubscriptionService.getUserPlan(userId)
    
    const usedBytes = quota?.usedStorage || 0
    const allocated = quota?.allocatedStorage || (5 * 1024 * 1024 * 1024)
    const storagePercentage = Math.min(Math.round((usedBytes / allocated) * 100), 100)

    return NextResponse.json({
      success: true,
      data: {
        trashCount,
        favoritesCount,
        recentCount,
        storagePercentage
      }
    })

  } catch (error: any) {
    console.error('[SidebarStatsAPI] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
