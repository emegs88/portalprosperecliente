import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export type Role = 'CLIENTE' | 'ADMIN'

export interface AuthData {
  name: string
  email: string
  role: Role
  createdAt: string
}

/**
 * Lê cookie de autenticação mock no client-side
 */
export function readAuthCookie(): AuthData | null {
  if (typeof window === 'undefined') return null

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('prospere_auth='))
      ?.split('=')[1]

    if (!cookieValue) return null

    return JSON.parse(decodeURIComponent(cookieValue))
  } catch {
    return null
  }
}

/**
 * Lê cookie de autenticação mock no server-side (middleware)
 */
export function readAuthCookieFromRequest(request: NextRequest): AuthData | null {
  try {
    const cookieValue = request.cookies.get('prospere_auth')?.value

    if (!cookieValue) return null

    return JSON.parse(decodeURIComponent(cookieValue))
  } catch {
    return null
  }
}

/**
 * Define cookie de autenticação mock (client-side)
 */
export function setAuthCookie(data: { name: string; email: string; role: Role }): void {
  if (typeof window === 'undefined') return

  const authData: AuthData = {
    ...data,
    createdAt: new Date().toISOString(),
  }

  const cookieValue = encodeURIComponent(JSON.stringify(authData))
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1) // 1 ano

  document.cookie = `prospere_auth=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Remove cookie de autenticação mock (client-side)
 */
export function clearAuthCookie(): void {
  if (typeof window === 'undefined') return

  document.cookie = 'prospere_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}
