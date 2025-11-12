const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8 // 8 hours
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

let cachedKey: CryptoKey | null = null

function getCrypto() {
  if (typeof crypto !== 'undefined') {
    return crypto
  }
  throw new Error('Web Crypto API is not available in this runtime')
}

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getSecret() {
  return getRequiredEnv('ADMIN_SESSION_SECRET')
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername = getRequiredEnv('ADMIN_USERNAME')
  const expectedPassword = getRequiredEnv('ADMIN_PASSWORD')

  return username === expectedUsername && password === expectedPassword
}

async function getSigningKey() {
  if (cachedKey) return cachedKey

  const secret = getSecret()
  const cryptoObj = getCrypto()

  cachedKey = await cryptoObj.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )

  return cachedKey
}

function toBase64Url(input: Uint8Array | ArrayBuffer) {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input
  let base64: string

  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64')
  } else {
    let binary = ''
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    base64 = btoa(binary)
  }

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'))
  }

  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

function encodeStringToBase64Url(input: string) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  return toBase64Url(textEncoder.encode(input))
}

function decodeBase64UrlToString(input: string) {
  const bytes = fromBase64Url(input)
  return textDecoder.decode(bytes)
}

export async function createSessionToken(username: string) {
  const payload = JSON.stringify({
    username,
    iat: Date.now(),
  })
  const encodedPayload = encodeStringToBase64Url(payload)

  const cryptoObj = getCrypto()
  const key = await getSigningKey()
  const signatureBuffer = await cryptoObj.subtle.sign('HMAC', key, textEncoder.encode(encodedPayload))
  const signature = toBase64Url(signatureBuffer)
  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token: string) {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return false

  try {
    const cryptoObj = getCrypto()
    const key = await getSigningKey()
    const signatureBytes = fromBase64Url(signature)

    const verified = await cryptoObj.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      textEncoder.encode(encodedPayload),
    )

    if (!verified) return false

    const payload = JSON.parse(decodeBase64UrlToString(encodedPayload))
    if (!payload?.username || !payload?.iat) return false

    const maxAgeMs = SESSION_MAX_AGE_SECONDS * 1000
    if (Date.now() - payload.iat > maxAgeMs) return false

    return true
  } catch {
    return false
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

