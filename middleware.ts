import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - any file with an extension (e.g. .png, .jpg, etc.)
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
}
