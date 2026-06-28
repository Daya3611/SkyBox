import { prisma } from '@/lib/db'

export class SubscriptionService {
  /**
   * Initializes default FREE plan for a new user if they don't have one
   */
  static async initializeDefaultPlan(userId: string) {
    // Check if user already has a subscription
    const existingSub = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (existingSub) return existingSub

    // Get or create FREE plan
    let freePlan = await prisma.subscriptionPlan.findUnique({
      where: { name: 'FREE' },
    })

    if (!freePlan) {
      // 5 GB = 5 * 1024 * 1024 * 1024 = 5368709120
      freePlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'FREE',
          storageLimit: 5368709120,
          price: 0,
          isDefault: true,
        },
      })
    }

    // Create user subscription
    const sub = await prisma.userSubscription.create({
      data: {
        userId,
        planId: freePlan.id,
      },
    })

    // Initialize Storage Quota
    await prisma.storageQuota.create({
      data: {
        userId,
        allocatedStorage: freePlan.storageLimit,
        usedStorage: 0,
      },
    })

    return sub
  }

  /**
   * Get user's active subscription and storage quota
   */
  static async getUserPlan(userId: string) {
    let sub = await prisma.userSubscription.findUnique({
      where: { userId },
      include: { plan: true },
    })

    if (!sub) {
      sub = (await this.initializeDefaultPlan(userId)) as any
      sub = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
      })
    }

    let quota = await prisma.storageQuota.findUnique({
      where: { userId },
    })

    if (!quota && sub?.plan) {
       quota = await prisma.storageQuota.create({
         data: {
           userId,
           allocatedStorage: sub.plan.storageLimit,
           usedStorage: 0
         }
       })
    }

    // Recalculate used storage just in case it got out of sync
    const usedStorageResult = await prisma.file.aggregate({
      where: { userId, isDeleted: false },
      _sum: { size: true },
    })
    
    const actualUsedStorage = usedStorageResult._sum.size || 0

    if (quota && quota.usedStorage !== actualUsedStorage) {
      quota = await prisma.storageQuota.update({
        where: { userId },
        data: { usedStorage: actualUsedStorage },
      })
    }

    return { subscription: sub, quota }
  }

  /**
   * Check if user has enough storage
   */
  static async checkStorageLimit(userId: string, newFileSizeInBytes: number) {
    const { quota } = await this.getUserPlan(userId)
    if (!quota) return false

    if (quota.usedStorage + newFileSizeInBytes > quota.allocatedStorage) {
      return false
    }
    return true
  }

  /**
   * Update Storage Quota safely
   */
  static async updateStorageUsage(userId: string, changeInBytes: number) {
    return await prisma.storageQuota.update({
      where: { userId },
      data: {
        usedStorage: {
          increment: changeInBytes
        }
      }
    })
  }
}
