import { handlers } from '@/auth'
export const { GET, POST } = handlers
export const runtime = 'nodejs' // Run in Node.js runtime since we need Prisma/bcrypt
