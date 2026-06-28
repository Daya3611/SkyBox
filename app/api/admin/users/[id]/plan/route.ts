import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { AdminService } from '@/lib/services/admin.service'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
    }

    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    const result = await AdminService.changeUserPlan(userId, planId)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Error changing user plan:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
