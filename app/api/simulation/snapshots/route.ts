/**
 * API de Snapshots Mensais de Simulação (SANDBOX)
 * 
 * ⚠️ REGRA CRÍTICA: NUNCA escrever em dados reais
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/simulation/snapshots
 * Listar snapshots mensais de uma execução
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const runId = searchParams.get('runId')

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      )
    }

    // Verificar se o run pertence ao usuário
    const run = await prisma.simulationRun.findFirst({
      where: {
        id: runId,
        simulation: {
          userId: session.user.id,
          isSimulation: true,
        },
        isSimulation: true,
      },
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Simulation run not found' },
        { status: 404 }
      )
    }

    const snapshots = await prisma.monthlySnapshot.findMany({
      where: {
        simulationRunId: runId,
      },
      orderBy: { mes: 'asc' },
    })

    return NextResponse.json({ snapshots })
  } catch (error: any) {
    console.error('Error fetching snapshots:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
