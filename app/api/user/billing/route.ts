import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { SubscriptionService } from '@/lib/services/subscription.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription, quota } = await SubscriptionService.getUserPlan(session.user.id)
    
    return NextResponse.json({
      subscription,
      quota,
    })
  } catch (error) {
    console.error('Error fetching billing info:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
