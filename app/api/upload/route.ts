import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { StorageService } from '@/lib/services/storage.service'

// Disable bodyParser to allow streaming/large file uploads
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided in request.' }, { status: 400 })
    }

    const filename = file.name
    const mimeType = file.type || 'application/octet-stream'
    
    console.log(`[UploadAPI] Request received: User ${userId} is uploading "${filename}" (${file.size} bytes)`)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check Storage Limit
    const { SubscriptionService } = await import('@/lib/services/subscription.service')
    const hasEnoughStorage = await SubscriptionService.checkStorageLimit(userId, buffer.length)
    if (!hasEnoughStorage) {
      return NextResponse.json(
        { error: 'You have reached your storage limit. Upgrade your plan to continue uploading.' }, 
        { status: 400 }
      )
    }

    // 3. Upload file via StorageService (handles chunking automatically)
    const result = await StorageService.uploadFile(
      userId,
      buffer,
      filename,
      mimeType,
      folderId || null
    )

    return NextResponse.json({
      success: true,
      file: result,
    }, { status: 201 })

  } catch (error: any) {
    console.error('[UploadAPI] Error occurred during upload:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error during file upload.'
    }, { status: 500 })
  }
}
