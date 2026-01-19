/**
 * API de Execuções de Simulação (SANDBOX)
 * 
 * ⚠️ REGRA CRÍTICA: NUNCA escrever em dados reais
 * ✅ Apenas trabalha com simulation_runs, simulation_snapshots, simulation_events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/simulation/runs
 * Listar execuções de simulação do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const simulationId = searchParams.get('simulationId')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      simulation: {
        userId: session.user.id,
        isSimulation: true,
      },
      isSimulation: true,
    }

    if (simulationId) {
      where.simulationId = simulationId
    }

    const runs = await prisma.simulationRun.findMany({
      where,
      orderBy: { executedAt: 'desc' },
      take: limit,
      include: {
        simulation: {
          select: {
            id: true,
            name: true,
            simulatorType: true,
          },
        },
        _count: {
          select: {
            snapshots: true,
            events: true,
          },
        },
      },
    })

    return NextResponse.json({ runs })
  } catch (error: any) {
    console.error('Error fetching simulation runs:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
