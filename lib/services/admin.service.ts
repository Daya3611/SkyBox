import { prisma } from '@/lib/db'

export class AdminService {
  /**
   * Retrieves dashboard statistics for the Super Admin
   */
  static async getDashboardStats() {
    const [
      totalUsers,
      totalFiles,
      totalFolders,
      totalUploadsSize,
      subscriptions,
      payments,
      activePaidUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.file.count({ where: { isDeleted: false } }),
      prisma.folder.count({ where: { isDeleted: false } }),
      prisma.file.aggregate({
        where: { isDeleted: false },
        _sum: { size: true }
      }),
      prisma.userSubscription.findMany({ include: { plan: true } }),
      prisma.payment.findMany({ where: { status: 'SUCCESS' } }),
      prisma.userSubscription.count({
        where: { plan: { name: { not: 'FREE' } }, status: 'ACTIVE' }
      })
    ])

    const freeUsers = totalUsers - activePaidUsers
    
    // Revenue
    const totalRevenue = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)

    // Today's Uploads
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaysUploads = await prisma.file.count({
      where: {
        createdAt: { gte: today },
        isDeleted: false
      }
    })

    const pendingPayments = await prisma.payment.count({ where: { status: 'PENDING' } })
    const failedPayments = await prisma.payment.count({ where: { status: 'FAILED' } })

    return {
      totalUsers,
      activeUsers: totalUsers, // For now, all are active unless suspended
      totalFiles,
      totalFolders,
      totalUploadsSize: totalUploadsSize._sum.size || 0,
      todaysUploads,
      totalRevenue,
      activePaidUsers,
      freeUsers,
      pendingPayments,
      failedPayments
    }
  }

  static async getUsers() {
    return await prisma.user.findMany({
      include: {
        subscription: {
          include: { plan: true }
        },
        storageQuota: true,
        _count: {
          select: { files: true, folders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getPlans() {
    return await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    })
  }

  static async createPlan(data: { name: string, description?: string, price: number, storageLimit: number, isActive?: boolean }) {
    return await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        storageLimit: data.storageLimit,
        isActive: data.isActive ?? true,
      }
    })
  }

  static async updatePlan(id: string, data: { name?: string, description?: string, price?: number, storageLimit?: number, isActive?: boolean }) {
    return await prisma.subscriptionPlan.update({
      where: { id },
      data
    })
  }

  static async changeUserPlan(userId: string, newPlanId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId }
    })

    if (!plan) {
      throw new Error('Plan not found')
    }

    return await prisma.$transaction([
      prisma.userSubscription.upsert({
        where: { userId },
        update: { planId: newPlanId },
        create: { userId, planId: newPlanId }
      }),
      prisma.storageQuota.upsert({
        where: { userId },
        update: { allocatedStorage: plan.storageLimit },
        create: { userId, allocatedStorage: plan.storageLimit }
      }),
      prisma.subscriptionHistory.create({
        data: {
          userId,
          planId: newPlanId,
          action: 'ADMIN_CHANGED_PLAN'
        }
      })
    ])
  }
}
