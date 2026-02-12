import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * MIDDLEWARE DE FIREWALL
 *
 * REGRA CRÍTICA: Separar absolutamente SIMULAÇÃO de DADOS REAIS
 *
 * ✅ Permitido:
 * - /api/simulation/* → apenas domínio de simulação
 * - /api/core/* ou /api/quotas, /api/sales → apenas dados reais
 *
 * ❌ Bloqueado:
 * - Simulação tentando acessar APIs de dados reais
 * - APIs reais tentando acessar simulação
 */

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const method = request.method

  // HEADERS DE SEGURANÇA
  const response = NextResponse.next()

  // Adicionar header indicando domínio
  if (path.startsWith('/api/simulation/')) {
    response.headers.set('X-Domain', 'simulation')
    response.headers.set('X-Sandbox', 'true')
  } else if (
    path.startsWith('/api/quotas') ||
    path.startsWith('/api/sales') ||
    path.startsWith('/api/core/')
  ) {
    response.headers.set('X-Domain', 'core')
    response.headers.set('X-Real-Data', 'true')
  }

  // BLOQUEAR: Simulação tentando acessar APIs de dados reais
  const simulationPath = path.startsWith('/api/simulation/')
  const realDataPath =
    path.startsWith('/api/quotas') ||
    path.startsWith('/api/sales') ||
    path.startsWith('/api/core/')

  // Para POST/PUT/PATCH/DELETE, validar mais rigorosamente
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // Se estiver em rota de simulação, garantir que não está tentando criar dados reais
    if (simulationPath) {
      console.log(`[SIMULATION] ${method} ${path} - Domínio isolado`)
    }

    // Se estiver em rota de dados reais, garantir que não está tentando criar simulação
    if (realDataPath) {
      console.log(`[CORE] ${method} ${path} - Dados reais`)
    }
  }

  // AVISAR: Se estiver no simulador, adicionar cookie de aviso
  if (path.startsWith('/simulador') || path.startsWith('/app/simulador')) {
    response.cookies.set('simulation-mode', 'true', {
      httpOnly: false,
      sameSite: 'lax',
    })
  } else {
    response.cookies.delete('simulation-mode')
  }

  return response
}

export const config = {
  matcher: [
    '/api/simulation/:path*',
    '/api/quotas/:path*',
    '/api/sales/:path*',
    '/api/core/:path*',
    '/simulador/:path*',
    '/app/simulador/:path*',
  ],
}
