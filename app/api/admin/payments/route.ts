import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payments = await prisma.payment.findMany({
      include: {
        user: true,
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching admin payments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
