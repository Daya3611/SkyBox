import { prisma } from '@/lib/db'

export interface FileQueryParams {
  userId: string
  folderId?: string | null
  search?: string
  extension?: string
  sort?: 'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'size_desc' | 'size_asc' | 'recent'
  isDeleted?: boolean
  isFavorite?: boolean
}

export class FileService {
  /**
   * Retrieves folders and files for a given directory or search criteria
   */
  static async getDirectoryContents(params: FileQueryParams) {
    const { userId, folderId = null, search, extension, sort = 'date_desc', isDeleted = false, isFavorite } = params

    // 1. Build search filters
    const fileWhereClause: any = {
      userId,
      isDeleted,
    }

    const folderWhereClause: any = {
      userId,
      isDeleted,
    }

    if (isFavorite !== undefined) {
      fileWhereClause.isFavorite = isFavorite
      folderWhereClause.isFavorite = isFavorite
    }

    if (search) {
      fileWhereClause.name = { contains: search, mode: 'insensitive' }
      folderWhereClause.name = { contains: search, mode: 'insensitive' }
    }

    if (extension) {
      fileWhereClause.name = { endsWith: `.${extension}`, mode: 'insensitive' }
    }

    // Only apply folderId constraint if not searching globally or filtering by favorites/recent
    if (!search && !extension && isFavorite === undefined && sort !== 'recent') {
      fileWhereClause.folderId = folderId
      folderWhereClause.parentId = folderId
    }

    // 2. Define sorting
    let fileOrderBy: any = { createdAt: 'desc' }
    let folderOrderBy: any = { name: 'asc' }

    switch (sort) {
      case 'name_asc':
        fileOrderBy = { name: 'asc' }
        folderOrderBy = { name: 'asc' }
        break
      case 'name_desc':
        fileOrderBy = { name: 'desc' }
        folderOrderBy = { name: 'desc' }
        break
      case 'date_asc':
        fileOrderBy = { createdAt: 'asc' }
        folderOrderBy = { createdAt: 'asc' }
        break
      case 'date_desc':
        fileOrderBy = { createdAt: 'desc' }
        folderOrderBy = { createdAt: 'desc' }
        break
      case 'size_asc':
        fileOrderBy = { size: 'asc' }
        break
      case 'size_desc':
        fileOrderBy = { size: 'desc' }
        break
      case 'recent':
        fileOrderBy = { lastAccessedAt: 'desc' }
        folderOrderBy = { updatedAt: 'desc' }
        break
    }

    // 3. Fetch
    const [folders, files] = await Promise.all([
      // Folders (folders cannot be "soft deleted" in the same way, or they are just cascading deleted)
      prisma.folder.findMany({
        where: folderWhereClause,
        orderBy: folderOrderBy,
      }),
      // Files
      prisma.file.findMany({
        where: fileWhereClause,
        orderBy: fileOrderBy,
      }),
    ])

    return { folders, files }
  }

  /**
   * Fetches the folder hierarchy breadcrumbs from the leaf to the root
   */
  static async getBreadcrumbs(folderId: string | null, userId: string) {
    const breadcrumbs = []
    let currentId = folderId

    while (currentId) {
      const folder = await prisma.folder.findFirst({
        where: { id: currentId, userId },
        select: { id: true, name: true, parentId: true },
      })

      if (!folder) break
      breadcrumbs.unshift({ id: folder.id, name: folder.name })
      currentId = folder.parentId
    }

    return breadcrumbs
  }

  /**
   * Fetches folder tree structure for sidebar
   */
  static async getFolderTree(userId: string) {
    const allFolders = await prisma.folder.findMany({
      where: { userId },
      select: { id: true, name: true, parentId: true },
    })

    // Build recursive folder tree map
    const folderMap = new Map<string, any>()
    allFolders.forEach((f) => {
      folderMap.set(f.id, { ...f, children: [] })
    })

    const roots: any[] = []
    folderMap.forEach((node) => {
      if (node.parentId && folderMap.has(node.parentId)) {
        folderMap.get(node.parentId).children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  /**
   * Creates a folder
   */
  static async createFolder(userId: string, name: string, parentId: string | null = null) {
    const folder = await prisma.folder.create({
      data: {
        userId,
        name,
        parentId,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CREATE_FOLDER',
        metadata: JSON.stringify({ folderId: folder.id, name }),
      },
    })

    return folder
  }

  /**
   * Renames a folder
   */
  static async renameFolder(folderId: string, userId: string, name: string) {
    const folder = await prisma.folder.update({
      where: { id: folderId, userId },
      data: { name },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RENAME_FOLDER',
        metadata: JSON.stringify({ folderId, newName: name }),
      },
    })

    return folder
  }

  /**
   * Deletes a folder and all its content (cascades database delete and triggers Telegram hard delete for nested files)
   */
  static async deleteFolderCascade(folderId: string, userId: string) {
    // 1. Gather all files nested inside this folder and its subfolders recursively
    const filesToDelete: string[] = []
    
    const collectFiles = async (fid: string) => {
      const dbFiles = await prisma.file.findMany({
        where: { folderId: fid, userId },
        select: { id: true },
      })
      dbFiles.forEach((f) => filesToDelete.push(f.id))

      const childFolders = await prisma.folder.findMany({
        where: { parentId: fid, userId },
        select: { id: true },
      })
      for (const child of childFolders) {
        await collectFiles(child.id)
      }
    }

    await collectFiles(folderId)

    // 2. Perform storage service deletion (removes Telegram files)
    const { StorageService } = await import('./storage.service')
    for (const fileId of filesToDelete) {
      await StorageService.deleteFile(fileId, true) // Hard delete from Telegram
    }

    // 3. Delete root folder (cascades database delete for nested folders and files)
    await prisma.folder.delete({
      where: { id: folderId, userId },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DELETE_FOLDER',
        metadata: JSON.stringify({ folderId }),
      },
    })

    return true
  }

  /**
   * Soft deletes a file by marking it as deleted
   */
  static async softDeleteFile(fileId: string, userId: string) {
    const file = await prisma.file.update({
      where: { id: fileId, userId },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'SOFT_DELETE_FILE',
        metadata: JSON.stringify({ fileId, name: file.name }),
      },
    })

    return file
  }

  /**
   * Soft deletes a folder and cascades the soft delete to its nested files and folders
   */
  static async softDeleteFolder(folderId: string, userId: string) {
    const foldersToUpdate: string[] = [folderId]
    const filesToUpdate: string[] = []
    
    const collectContents = async (fid: string) => {
      const dbFiles = await prisma.file.findMany({
        where: { folderId: fid, userId, isDeleted: false },
        select: { id: true },
      })
      dbFiles.forEach((f) => filesToUpdate.push(f.id))

      const childFolders = await prisma.folder.findMany({
        where: { parentId: fid, userId, isDeleted: false },
        select: { id: true },
      })
      for (const child of childFolders) {
        foldersToUpdate.push(child.id)
        await collectContents(child.id)
      }
    }

    await collectContents(folderId)

    const now = new Date()
    
    await prisma.folder.updateMany({
      where: { id: { in: foldersToUpdate }, userId },
      data: { isDeleted: true, deletedAt: now, deletedBy: userId },
    })

    if (filesToUpdate.length > 0) {
      await prisma.file.updateMany({
        where: { id: { in: filesToUpdate }, userId },
        data: { isDeleted: true, deletedAt: now, deletedBy: userId, lastAccessedAt: now },
      })
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'SOFT_DELETE_FOLDER',
        metadata: JSON.stringify({ folderId }),
      },
    })

    return true
  }

  /**
   * Restores a soft-deleted folder and cascades the restore to its nested files and folders
   */
  static async restoreFolder(folderId: string, userId: string) {
    const foldersToUpdate: string[] = [folderId]
    const filesToUpdate: string[] = []
    
    const collectContents = async (fid: string) => {
      const dbFiles = await prisma.file.findMany({
        where: { folderId: fid, userId, isDeleted: true },
        select: { id: true },
      })
      dbFiles.forEach((f) => filesToUpdate.push(f.id))

      const childFolders = await prisma.folder.findMany({
        where: { parentId: fid, userId, isDeleted: true },
        select: { id: true },
      })
      for (const child of childFolders) {
        foldersToUpdate.push(child.id)
        await collectContents(child.id)
      }
    }

    await collectContents(folderId)
    
    await prisma.folder.updateMany({
      where: { id: { in: foldersToUpdate }, userId },
      data: { isDeleted: false, deletedAt: null, deletedBy: null },
    })

    if (filesToUpdate.length > 0) {
      await prisma.file.updateMany({
        where: { id: { in: filesToUpdate }, userId },
        data: { isDeleted: false, deletedAt: null, deletedBy: null, lastAccessedAt: new Date() },
      })
    }

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RESTORE_FOLDER',
        metadata: JSON.stringify({ folderId }),
      },
    })

    return true
  }

  /**
   * Empties the user's trash by permanently deleting all soft-deleted files and folders
   */
  static async emptyTrash(userId: string) {
    const filesToDelete = await prisma.file.findMany({
      where: { userId, isDeleted: true },
      select: { id: true },
    })

    const { StorageService } = await import('./storage.service')
    for (const f of filesToDelete) {
      await StorageService.deleteFile(f.id, true)
    }

    await prisma.folder.deleteMany({
      where: { userId, isDeleted: true },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'EMPTY_TRASH',
        metadata: JSON.stringify({ filesCount: filesToDelete.length }),
      },
    })

    return true
  }

  /**
   * Renames a file
   */
  static async renameFile(fileId: string, userId: string, name: string) {
    const file = await prisma.file.update({
      where: { id: fileId, userId },
      data: { name, lastAccessedAt: new Date() },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RENAME_FILE',
        metadata: JSON.stringify({ fileId, newName: name }),
      },
    })

    return file
  }

  /**
   * Moves a file to another folder
   */
  static async moveFile(fileId: string, userId: string, targetFolderId: string | null) {
    // Verify folder exists and belongs to user if moving to a subfolder
    if (targetFolderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: targetFolderId, userId },
      })
      if (!folder) throw new Error('Target folder not found.')
    }

    const file = await prisma.file.update({
      where: { id: fileId, userId },
      data: { folderId: targetFolderId, lastAccessedAt: new Date() },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'MOVE_FILE',
        metadata: JSON.stringify({ fileId, targetFolderId }),
      },
    })

    return file
  }

  /**
   * Restores a soft-deleted file
   */
  static async restoreFile(fileId: string, userId: string) {
    const file = await prisma.file.update({
      where: { id: fileId, userId },
      data: { isDeleted: false, deletedAt: null, deletedBy: null, lastAccessedAt: new Date() },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RESTORE_FILE',
        metadata: JSON.stringify({ fileId, name: file.name }),
      },
    })

    return file
  }

  /**
   * Toggles favorite status for a file
   */
  static async toggleFavoriteFile(fileId: string, userId: string, isFavorite: boolean) {
    const file = await prisma.file.update({
      where: { id: fileId, userId },
      data: { isFavorite, lastAccessedAt: new Date() },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: isFavorite ? 'FAVORITE_FILE' : 'UNFAVORITE_FILE',
        metadata: JSON.stringify({ fileId, name: file.name }),
      },
    })

    return file
  }

  /**
   * Toggles favorite status for a folder
   */
  static async toggleFavoriteFolder(folderId: string, userId: string, isFavorite: boolean) {
    const folder = await prisma.folder.update({
      where: { id: folderId, userId },
      data: { isFavorite },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: isFavorite ? 'FAVORITE_FOLDER' : 'UNFAVORITE_FOLDER',
        metadata: JSON.stringify({ folderId, name: folder.name }),
      },
    })

    return folder
  }

  /**
   * Updates lastAccessedAt for a file (e.g. when downloaded or previewed)
   */
  static async markFileAsAccessed(fileId: string, userId: string) {
    return prisma.file.update({
      where: { id: fileId, userId },
      data: { lastAccessedAt: new Date() },
    })
  }

  /**
   * Fetches recent uploads
   */
  static async getRecentUploads(userId: string, limit = 5) {
    return prisma.file.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Fetches overall storage usage stats
   */
  static async getStorageStats(userId: string) {
    const aggregations = await prisma.file.aggregate({
      where: { userId, isDeleted: false },
      _sum: {
        size: true,
      },
      _count: {
        id: true,
      },
    })

    const totalSize = aggregations._sum.size || 0
    const totalFiles = aggregations._count.id || 0

    // Provide a default 10GB limit (10 * 1024 * 1024 * 1024 bytes)
    const storageLimit = 10 * 1024 * 1024 * 1024 
    const usagePercentage = Math.min((totalSize / storageLimit) * 100, 100)

    return {
      usedBytes: totalSize,
      totalBytes: storageLimit,
      usagePercentage,
      totalFiles,
    }
  }
}
