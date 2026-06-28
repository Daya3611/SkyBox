const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID

export interface TelegramUploadResult {
  fileId: string
  messageId: number
}

/**
 * Service to interact with the Telegram Bot API for file storage
 */
export class TelegramService {
  private static getBotUrl(method: string): string {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured in environment variables.')
    }
    return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`
  }

  /**
   * Uploads a binary file buffer to the private Telegram channel
   */
  static async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<TelegramUploadResult> {
    if (!TELEGRAM_CHANNEL_ID) {
      throw new Error('TELEGRAM_CHANNEL_ID is not configured.')
    }

    const url = this.getBotUrl('sendDocument')
    const formData = new FormData()
    formData.append('chat_id', TELEGRAM_CHANNEL_ID)

    // Convert Buffer to Blob for the fetch FormData upload
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
    formData.append('document', blob, filename)

    console.log(`[TelegramService] Uploading ${filename} (${buffer.length} bytes) to Telegram channel...`)

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TelegramService] Upload failed:', errorText)
      throw new Error(`Telegram upload failed: ${response.statusText} (${errorText})`)
    }

    const data = await response.json()
    if (!data.ok) {
      console.error('[TelegramService] API returned success=false:', data)
      throw new Error(`Telegram API Error: ${data.description || 'Unknown error'}`)
    }

    const fileId = data.result.document.file_id
    const messageId = data.result.message_id

    console.log(`[TelegramService] Uploaded successfully. FileID: ${fileId.substring(0, 15)}... MessageID: ${messageId}`)

    return { fileId, messageId }
  }

  /**
   * Resolves the Telegram file ID to a binary stream
   */
  static async downloadFileBuffer(fileId: string): Promise<Buffer> {
    const apiUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org'
    const getFileUrl = `${apiUrl}/bot${TELEGRAM_BOT_TOKEN}/getFile`
    const response = await fetch(`${getFileUrl}?file_id=${fileId}`, { cache: 'no-store' })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Failed to resolve Telegram file path: ${response.statusText} (${err})`)
    }

    const data = await response.json()
    if (!data.ok) {
      throw new Error(`Telegram getFile API Error: ${data.description || 'Unknown error'}`)
    }

    const filePath = data.result.file_path
    if (!filePath) {
      throw new Error('Telegram did not return a file path for download.')
    }

    const downloadUrl = `${apiUrl}/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`
    console.log(`[TelegramService] Downloading file from path: ${filePath}`)

    const fileResponse = await fetch(downloadUrl, { cache: 'no-store' })
    if (!fileResponse.ok) {
      throw new Error(`Failed to download binary from Telegram: ${fileResponse.statusText}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Deletes a message containing a file from the Telegram channel
   */
  static async deleteFile(messageId: number): Promise<boolean> {
    if (!TELEGRAM_CHANNEL_ID) {
      throw new Error('TELEGRAM_CHANNEL_ID is not configured.')
    }

    const url = this.getBotUrl('deleteMessage')
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        message_id: messageId,
      }),
    })

    if (!response.ok) {
      console.warn(`[TelegramService] Failed to delete message ${messageId}:`, await response.text())
      return false
    }

    const data = await response.json()
    return data.ok === true
  }
}
