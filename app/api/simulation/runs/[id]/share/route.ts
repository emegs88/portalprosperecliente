/**
 * API para gerar link compartilhável (read-only) de uma simulação
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const shareSchema = z.object({
  runId: z.string(),
})

/**
 * POST /api/simulation/runs/[id]/share
 * Criar link compartilhável read-only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const runId = params.id

    // Verificar se a run pertence ao usuário
    const run = await prisma.simulationRun.findFirst({
      where: {
        id: runId,
        simulation: {
          userId: session.user.id,
        },
        isSimulation: true,
      },
      include: {
        simulation: true,
      },
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Simulation run not found' },
        { status: 404 }
      )
    }

    // Gerar token único para compartilhamento
    const shareToken = Buffer.from(`${runId}-${Date.now()}`).toString('base64url')
    
    // Salvar token no projeto (ou criar tabela ShareToken no futuro)
    // Por enquanto, usar metadata do projeto
    await prisma.simulation.update({
      where: { id: run.simulationId },
      data: {
        // TODO: Adicionar campo shareToken ao schema
      },
    })

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/simulador/shared/${shareToken}`

    return NextResponse.json({
      shareUrl,
      shareToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
    })
  } catch (error: any) {
    console.error('Error creating share link:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
