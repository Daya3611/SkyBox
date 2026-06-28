import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

export class ShareService {
  /**
   * Generates a public share link for a file
   */
  static async createShareLink(
    fileId: string,
    userId: string,
    expiresAt: Date | null = null,
    password?: string
  ) {
    // 1. Verify file ownership
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    })

    if (!file) {
      throw new Error('File not found or access denied.')
    }

    // 2. Generate secure token
    const token = randomBytes(16).toString('hex')

    // 3. Hash password if provided
    let passwordHash = null
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    // 4. Create database entry
    const shareLink = await prisma.shareLink.create({
      data: {
        fileId,
        token,
        passwordHash,
        expiresAt,
      },
    })

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CREATE_SHARE_LINK',
        metadata: JSON.stringify({ fileId, shareLinkId: shareLink.id }),
      },
    })

    return shareLink
  }

  /**
   * Verifies if a share link is valid and checks password protection
   */
  static async verifyAndGetShareLink(token: string, password?: string) {
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: {
          include: {
            chunks: {
              orderBy: { chunkIndex: 'asc' },
            },
          },
        },
      },
    })

    if (!shareLink || shareLink.file.isDeleted) {
      throw new Error('Share link is invalid or the file has been deleted.')
    }

    // Check expiration
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      throw new Error('This share link has expired.')
    }

    // Check password protection
    if (shareLink.passwordHash) {
      if (!password) {
        throw new Error('PASSWORD_REQUIRED')
      }
      const isPasswordMatch = await bcrypt.compare(password, shareLink.passwordHash)
      if (!isPasswordMatch) {
        throw new Error('INCORRECT_PASSWORD')
      }
    }

    // Increment download statistics
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    })

    return shareLink.file
  }

  /**
   * Revokes a share link
   */
  static async revokeShareLink(shareLinkId: string, userId: string) {
    const link = await prisma.shareLink.findFirst({
      where: {
        id: shareLinkId,
        file: {
          userId,
        },
      },
    })

    if (!link) {
      throw new Error('Share link not found or access denied.')
    }

    await prisma.shareLink.delete({
      where: { id: shareLinkId },
    })

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'REVOKE_SHARE_LINK',
        metadata: JSON.stringify({ shareLinkId, fileId: link.fileId }),
      },
    })

    return true
  }

  /**
   * Lists active share links for a user
   */
  static async getActiveShares(userId: string) {
    return prisma.shareLink.findMany({
      where: {
        file: {
          userId,
          isDeleted: false,
        },
      },
      include: {
        file: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}
