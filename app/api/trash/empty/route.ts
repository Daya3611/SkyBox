import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { FileService } from '@/lib/services/file.service'

export const runtime = 'nodejs'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await FileService.emptyTrash(session.user.id)

    return NextResponse.json({ success: true, message: 'Trash emptied successfully' })
  } catch (error: any) {
    console.error('[EmptyTrashAPI] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
