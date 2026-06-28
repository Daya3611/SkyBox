import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { FileService } from '@/lib/services/file.service'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const folderId = searchParams.get('folderId')

    if (!folderId) {
      return NextResponse.json({ breadcrumbs: [] })
    }

    const breadcrumbs = await FileService.getBreadcrumbs(folderId, session.user.id)
    return NextResponse.json({ success: true, breadcrumbs })
  } catch (error: any) {
    console.error('[BreadcrumbsAPI] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
