import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // Add caching headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return response
} 