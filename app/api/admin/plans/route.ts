import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { AdminService } from '@/lib/services/admin.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const plans = await AdminService.getPlans()
    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching admin plans:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, price, storageLimit, isActive } = body

    if (!name || price === undefined || storageLimit === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const plan = await AdminService.createPlan({
      name,
      description,
      price,
      storageLimit,
      isActive
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, name, description, price, storageLimit, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 })
    }

    const plan = await AdminService.updatePlan(id, {
      name,
      description,
      price,
      storageLimit,
      isActive
    })

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
