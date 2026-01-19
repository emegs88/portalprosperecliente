/**
 * API de Execução Individual de Simulação (SANDBOX)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/simulation/runs/[id]
 * Obter execução específica com snapshots e events
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const run = await prisma.simulationRun.findFirst({
      where: {
        id,
        simulation: {
          userId: session.user.id,
          isSimulation: true,
        },
        isSimulation: true,
      },
      include: {
        simulation: {
          select: {
            id: true,
            name: true,
            simulatorType: true,
          },
        },
        snapshots: {
          orderBy: { mes: 'asc' },
        },
        events: {
          orderBy: [{ mes: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Simulation run not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const runWithParsed = {
      ...run,
      params: JSON.parse(run.params),
      quotaIds: JSON.parse(run.quotaIds || '[]'),
      comparacaoCdi: run.comparacaoCdi ? JSON.parse(run.comparacaoCdi) : null,
      comparacaoPoupanca: run.comparacaoPoupanca ? JSON.parse(run.comparacaoPoupanca) : null,
    }

    return NextResponse.json({ run: runWithParsed })
  } catch (error: any) {
    console.error('Error fetching simulation run:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
