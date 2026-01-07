import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Função para ler cookie mock (inline para evitar problemas de importação no middleware)
function readAuthCookieFromRequest(request: NextRequest): { role: string } | null {
  try {
    const cookieValue = request.cookies.get('prospere_auth')?.value
    if (!cookieValue) return null
    return JSON.parse(decodeURIComponent(cookieValue))
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas (sempre permitidas)
  const publicRoutes = ['/', '/login', '/cadastro', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/api/auth')
  )

  // Rotas protegidas
  const protectedRoutes = ['/dashboard', '/admin', '/cliente']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Se for rota pública, permitir acesso
  if (isPublicRoute || (!isProtectedRoute && pathname !== '/erro-sem-permissao')) {
    return NextResponse.next()
  }

  // Rota /erro-sem-permissao só pode ser acessada por usuários autenticados
  if (pathname === '/erro-sem-permissao') {
    // Verificar se está autenticado antes de permitir ver a página de erro
    let isAuthenticated = false
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
      })
      if (token) {
        isAuthenticated = true
      }
    } catch {
      const mockAuth = readAuthCookieFromRequest(request)
      if (mockAuth) {
        isAuthenticated = true
      }
    }

    if (!isAuthenticated) {
      // Se não autenticado, redirecionar para login
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Tentar autenticação via NextAuth primeiro
  let userRole: string | null = null
  let isAuthenticated = false

  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (token) {
      isAuthenticated = true
      userRole = (token.role as string) || null
    }
  } catch (error) {
    // NextAuth não disponível, tentar cookie mock
  }

  // Se NextAuth não funcionou, tentar cookie mock
  if (!isAuthenticated) {
    const mockAuth = readAuthCookieFromRequest(request)
    if (mockAuth) {
      isAuthenticated = true
      userRole = mockAuth.role === 'CLIENTE' ? 'client' : mockAuth.role.toLowerCase()
    }
  }

  // Se não autenticado e tentando acessar rota protegida, redirecionar para login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar permissões por role
  // Normalizar role para lowercase (client, admin)
  const normalizedRole = userRole?.toLowerCase()

  // Rota /dashboard ou /cliente - CLIENT e ADMIN podem acessar
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/cliente')) {
    if (normalizedRole === 'client' || normalizedRole === 'admin' || normalizedRole === 'cliente') {
      return NextResponse.next()
    }
    // Se não tem role válido, redirecionar para erro
    const errorUrl = new URL('/erro-sem-permissao', request.url)
    return NextResponse.redirect(errorUrl)
  }

  // Rota /admin - só ADMIN pode acessar
  if (pathname.startsWith('/admin')) {
    if (normalizedRole === 'admin') {
      return NextResponse.next()
    }
    // CLIENT tentando acessar admin -> bloquear e redirecionar para erro
    if (normalizedRole === 'client' || normalizedRole === 'cliente') {
      const errorUrl = new URL('/erro-sem-permissao', request.url)
      return NextResponse.redirect(errorUrl)
    }
    // Role desconhecido
    const errorUrl = new URL('/erro-sem-permissao', request.url)
    return NextResponse.redirect(errorUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/cliente/:path*',
    '/erro-sem-permissao',
  ],
}
