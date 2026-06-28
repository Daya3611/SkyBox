'use server'

import { signIn } from '@/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { z } from 'zod'

const SignUpSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
})

/**
 * Server Action: Registers a new user
 */
export async function signUp(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validatedFields = SignUpSchema.safeParse({ name, email, password })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please correct the errors below.',
    }
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        message: 'An account with this email already exists.',
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
      },
    })

    // Create a default home folder for the user (optional but nice)
    await prisma.folder.create({
      data: {
        userId: user.id,
        name: 'My Drive',
      },
    }).catch(() => {}) // non-critical, catch silently

    return {
      success: true,
      message: 'Registration successful! You can now log in.',
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      message: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Server Action: Authenticates a user
 */
export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { message: 'Email and password are required.' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Invalid email or password.' }
        default:
          return { message: 'Authentication failed. Please check your credentials.' }
      }
    }
    // CRITICAL: NextAuth v5 uses redirect error codes to perform server redirects.
    // We MUST rethrow this error to let Next.js handle the redirect properly.
    throw error
  }
}
