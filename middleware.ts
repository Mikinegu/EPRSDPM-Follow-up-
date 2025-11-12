import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookieName, verifySessionToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(getSessionCookieName())?.value ?? ''

  if (pathname.startsWith('/admin/login')) {
    if (sessionCookie && (await verifySessionToken(sessionCookie))) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    return NextResponse.next()
  }

  if (sessionCookie && (await verifySessionToken(sessionCookie))) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/admin/login', request.url)
  if (pathname !== '/admin') {
    loginUrl.searchParams.set('redirectTo', pathname)
  }

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}

