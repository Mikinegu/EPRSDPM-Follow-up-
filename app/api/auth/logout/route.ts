import { NextResponse } from 'next/server'
import { getSessionCookieName } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: getSessionCookieName(),
    value: '',
    path: '/',
    expires: new Date(0),
  })

  return response
}

