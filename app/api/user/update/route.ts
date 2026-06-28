import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { name, currentPassword, newPassword } = body

    // 1. Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Handle Name Update
    if (name && name.trim() !== '') {
      await prisma.user.update({
        where: { id: userId },
        data: { name: name.trim() },
      })
      
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE_PROFILE_NAME',
          metadata: JSON.stringify({ newName: name.trim() }),
        },
      })
    }

    // 3. Handle Password Update
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
      }

      // If user signed up via OAuth, password is null in database
      if (!user.password) {
        return NextResponse.json({ error: 'OAuth users cannot change passwords directly. Please use Google Login.' }, { status: 400 })
      }

      const passwordsMatch = await bcrypt.compare(currentPassword, user.password)
      if (!passwordsMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 })
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10)
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      })

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE_PASSWORD',
        },
      })
    }

    return NextResponse.json({ success: true, message: 'Profile updated' })

  } catch (error: any) {
    console.error('[UserUpdateAPI] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
