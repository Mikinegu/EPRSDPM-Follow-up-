import { NextResponse } from 'next/server'
import { createSessionToken, getSessionCookieName, getSessionCookieOptions, validateAdminCredentials } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
    }

    const valid = validateAdminCredentials(username, password)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createSessionToken(username)
    const response = NextResponse.json({ success: true })
    response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions())

    return response
  } catch (error) {
    console.error('Error during admin login:', error)
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 })
  }
}

