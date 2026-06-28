import { prisma } from '@/lib/db'
import { TelegramService } from './telegram.service'
import { computeChecksum } from '../utils/checksum'

const MAX_CHUNK_SIZE = 40 * 1024 * 1024 // 40MB chunk size (safe below Telegram's 50MB limit)

export class StorageService {
  /**
   * Orchestrates the upload of a file. Splits it into chunks if it exceeds MAX_CHUNK_SIZE.
   */
  static async uploadFile(
    userId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folderId: string | null = null
  ) {
    const size = buffer.length
    const checksum = computeChecksum(buffer)
    const originalName = filename

    console.log(`[StorageService] Processing upload for "${filename}" (${size} bytes) by user: ${userId}`)

    // Create the File record first in a pending state
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        folderId,
        name: filename,
        originalName,
        mimeType,
        size,
        checksum,
      },
    })

    try {
      if (size <= MAX_CHUNK_SIZE) {
        // Single file upload
        const result = await TelegramService.uploadFile(buffer, filename, mimeType)
        
        // Update file record with Telegram info
        const updatedFile = await prisma.file.update({
          where: { id: fileRecord.id },
          data: {
            telegramFileId: result.fileId,
            telegramMessageId: result.messageId,
          },
        })

        // Log Activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: 'UPLOAD_FILE',
            metadata: JSON.stringify({ fileId: fileRecord.id, name: filename, size }),
          },
        })

        // Update Storage Quota
        const { SubscriptionService } = await import('./subscription.service')
        await SubscriptionService.updateStorageUsage(userId, size)

        return updatedFile
      } else {
        // Multi-chunk upload
        const totalChunks = Math.ceil(size / MAX_CHUNK_SIZE)
        console.log(`[StorageService] File "${filename}" exceeds 40MB. Splitting into ${totalChunks} chunks...`)

        const chunksData = []

        for (let i = 0; i < totalChunks; i++) {
          const start = i * MAX_CHUNK_SIZE
          const end = Math.min(start + MAX_CHUNK_SIZE, size)
          const chunkBuffer = buffer.subarray(start, end)
          const chunkName = `${filename}.part${i + 1}`

          console.log(`[StorageService] Uploading chunk ${i + 1}/${totalChunks} (${chunkBuffer.length} bytes)...`)
          const result = await TelegramService.uploadFile(chunkBuffer, chunkName, 'application/octet-stream')

          chunksData.push({
            fileId: fileRecord.id,
            telegramFileId: result.fileId,
            telegramMessageId: result.messageId,
            chunkIndex: i,
            chunkSize: chunkBuffer.length,
          })
        }

        // Save chunks metadata to database
        await prisma.fileChunk.createMany({
          data: chunksData,
        })

        // Log Activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: 'UPLOAD_FILE_CHUNKED',
            metadata: JSON.stringify({ fileId: fileRecord.id, name: filename, chunks: totalChunks, size }),
          },
        })

        // Update Storage Quota
        const { SubscriptionService } = await import('./subscription.service')
        await SubscriptionService.updateStorageUsage(userId, size)

        return prisma.file.findUniqueOrThrow({
          where: { id: fileRecord.id },
          include: { chunks: true },
        })
      }
    } catch (uploadError) {
      console.error('[StorageService] Error occurred during upload orchestration, cleaning up file record:', uploadError)
      // Attempt cleanup of file record to avoid dangling entries
      await prisma.file.delete({ where: { id: fileRecord.id } }).catch(() => {})
      throw uploadError
    }
  }

  private static async downloadWithRetry(telegramFileId: string, maxRetries = 3): Promise<Buffer> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const buffer = await TelegramService.downloadFileBuffer(telegramFileId)
        return buffer
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error
        }
        console.warn(`[StorageService] Retry ${attempt}/${maxRetries} for telegramFileId ${telegramFileId} due to error: ${error.message}`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
      }
    }
    throw new Error('Unreachable')
  }

  /**
   * Returns a reconstructed stream for a file, handling single or chunked files transparently.
   */
  static async downloadFile(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    })

    if (!file || file.isDeleted) {
      throw new Error('File not found or has been deleted.')
    }

    const nonNullFile = file;

    async function* generateStream(): AsyncGenerator<Uint8Array, void, unknown> {
      if (nonNullFile.telegramFileId) {
        const buffer = await StorageService.downloadWithRetry(nonNullFile.telegramFileId)
        if (buffer.length !== nonNullFile.size) {
           throw new Error(`File size mismatch. Expected ${nonNullFile.size}, got ${buffer.length}`)
        }
        yield buffer
      } else {
        const chunks = nonNullFile.chunks
        const concurrencyLimit = 3
        const chunkPromises: Promise<Buffer>[] = new Array(chunks.length)

        let nextChunkToYield = 0
        let nextChunkToDownload = 0

        while (nextChunkToYield < chunks.length) {
          // Fill up the concurrent window
          while (
            nextChunkToDownload < chunks.length && 
            nextChunkToDownload - nextChunkToYield < concurrencyLimit
          ) {
            const index = nextChunkToDownload
            const chunk = chunks[index]
            console.log(`[StorageService] Pre-fetching chunk ${index + 1}/${chunks.length}...`)
            
            chunkPromises[index] = StorageService.downloadWithRetry(chunk.telegramFileId).then(buffer => {
              // Validate chunk size
              if (buffer.length !== chunk.chunkSize) {
                 throw new Error(`Chunk size mismatch. Expected ${chunk.chunkSize}, got ${buffer.length}`)
              }
              return buffer
            })
            nextChunkToDownload++
          }

          // Yield the next chunk in order
          const buffer = await chunkPromises[nextChunkToYield]
          console.log(`[StorageService] Yielding chunk ${nextChunkToYield + 1}/${chunks.length}...`)
          yield buffer
          
          // Free up memory from the promise array
          // @ts-ignore
          chunkPromises[nextChunkToYield] = null
          nextChunkToYield++
        }
      }
    }

    const iterator = generateStream()
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { value, done } = await iterator.next()
          if (done) {
            controller.close()
          } else {
            controller.enqueue(value)
          }
        } catch (error) {
          console.error(`[StorageService] Stream error for file "${nonNullFile.name}":`, error)
          controller.error(error)
        }
      }
    })

    return {
      stream,
      name: nonNullFile.name,
      mimeType: nonNullFile.mimeType,
      size: nonNullFile.size,
    }
  }

  /**
   * Triggers a soft delete (or hard delete if requested) of the file and removes Telegram messages.
   */
  static async deleteFile(fileId: string, hardDelete = false) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { chunks: true },
    })

    if (!file) return false

    if (!hardDelete) {
      // Soft delete in database
      await prisma.file.update({
        where: { id: fileId },
        data: { isDeleted: true },
      })

      await prisma.activityLog.create({
        data: {
          userId: file.userId,
          action: 'DELETE_FILE_SOFT',
          metadata: JSON.stringify({ fileId, name: file.name }),
        },
      })
      return true
    }

    // Hard delete: remove Telegram channel messages
    console.log(`[StorageService] Permanently deleting "${file.name}" from DB and Telegram...`)
    
    if (file.telegramMessageId) {
      await TelegramService.deleteFile(file.telegramMessageId).catch((err) => {
        console.warn(`[StorageService] Failed to delete message ${file.telegramMessageId} on Telegram:`, err)
      })
    }

    for (const chunk of file.chunks) {
      await TelegramService.deleteFile(chunk.telegramMessageId).catch((err) => {
        console.warn(`[StorageService] Failed to delete chunk message ${chunk.telegramMessageId} on Telegram:`, err)
      })
    }

    // Delete database records
    await prisma.file.delete({
      where: { id: fileId },
    })

    // Update Storage Quota (free up space)
    const { SubscriptionService } = await import('./subscription.service')
    await SubscriptionService.updateStorageUsage(file.userId, -file.size)

    await prisma.activityLog.create({
      data: {
        userId: file.userId,
        action: 'DELETE_FILE_HARD',
        metadata: JSON.stringify({ fileId, name: file.name }),
      },
    })

    return true
  }
}
