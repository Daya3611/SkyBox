import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ShareService } from '@/lib/services/share.service'

export const runtime = 'nodejs'

/**
 * POST: Generates a public share link
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fileId, expiresAt, password } = body

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    const parsedExpiry = expiresAt ? new Date(expiresAt) : null

    const shareLink = await ShareService.createShareLink(
      fileId,
      session.user.id,
      parsedExpiry,
      password
    )

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
        passwordProtected: !!shareLink.passwordHash,
      },
    }, { status: 201 })

  } catch (error: any) {
    console.error('[ShareAPI] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET: Lists active shares for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shares = await ShareService.getActiveShares(session.user.id)
    return NextResponse.json({ success: true, shares })
  } catch (error: any) {
    console.error('[ShareAPI] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE: Revokes an active share link
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { shareLinkId } = body

    if (!shareLinkId) {
      return NextResponse.json({ error: 'Share Link ID is required' }, { status: 400 })
    }

    await ShareService.revokeShareLink(shareLinkId, session.user.id)
    return NextResponse.json({ success: true, message: 'Share link revoked successfully' })
  } catch (error: any) {
    console.error('[ShareAPI] DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
