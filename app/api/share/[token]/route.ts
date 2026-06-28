import { NextRequest, NextResponse } from 'next/server'
import { ShareService } from '@/lib/services/share.service'
import { StorageService } from '@/lib/services/storage.service'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET: Retrieves public metadata or streams the shared file contents
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { searchParams } = req.nextUrl
    const info = searchParams.get('info') === 'true'
    const password = searchParams.get('password') || undefined

    // 1. Fetch metadata without verification first to see if link exists
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: { file: true },
    })

    if (!shareLink || shareLink.file.isDeleted) {
      return NextResponse.json({ error: 'Share link not found or invalid' }, { status: 404 })
    }

    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return NextResponse.json({ error: 'Share link has expired', code: 'EXPIRED' }, { status: 410 })
    }

    // 2. Return metadata if requesting info
    if (info) {
      return NextResponse.json({
        success: true,
        metadata: {
          name: shareLink.file.name,
          size: shareLink.file.size,
          mimeType: shareLink.file.mimeType,
          passwordRequired: !!shareLink.passwordHash,
          expiresAt: shareLink.expiresAt,
          createdAt: shareLink.createdAt,
        },
      })
    }

    // 3. Otherwise, verify and stream the file
    let file
    try {
      file = await ShareService.verifyAndGetShareLink(token, password)
    } catch (verifyError: any) {
      if (verifyError.message === 'PASSWORD_REQUIRED') {
        return NextResponse.json({ error: 'Password required to download this file', code: 'PASSWORD_REQUIRED' }, { status: 401 })
      }
      if (verifyError.message === 'INCORRECT_PASSWORD') {
        return NextResponse.json({ error: 'Incorrect password', code: 'INCORRECT_PASSWORD' }, { status: 401 })
      }
      throw verifyError
    }

    // Download & stream the file
    const { stream, name, mimeType, size } = await StorageService.downloadFile(file.id)

    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', size.toString())
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`)
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    return new Response(stream, {
      status: 200,
      headers,
    })

  } catch (error: any) {
    console.error('[ShareTokenAPI] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST: Verifies password protection before initiating download
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await req.json()
    const { password } = body

    try {
      await ShareService.verifyAndGetShareLink(token, password)
      return NextResponse.json({ success: true, message: 'Password verified' })
    } catch (verifyError: any) {
      if (verifyError.message === 'PASSWORD_REQUIRED') {
        return NextResponse.json({ error: 'Password required', code: 'PASSWORD_REQUIRED' }, { status: 401 })
      }
      if (verifyError.message === 'INCORRECT_PASSWORD') {
        return NextResponse.json({ error: 'Incorrect password', code: 'INCORRECT_PASSWORD' }, { status: 401 })
      }
      return NextResponse.json({ error: verifyError.message || 'Verification failed' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('[ShareTokenAPI] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
