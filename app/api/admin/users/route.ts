import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { AdminService } from '@/lib/services/admin.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await AdminService.getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
