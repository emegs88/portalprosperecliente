/**
 * API de Execução de Simulação (SANDBOX)
 * 
 * ⚠️ REGRA CRÍTICA: NUNCA escrever em dados reais
 * ✅ Apenas executa simulação e salva em simulation_runs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { simulatePatrimonioAccumulation } from '@/lib/domain/simulation/services/simulatorEngine'
import { simulationParamsSchema } from '@/lib/domain/simulation/validators/simulationSchema'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 segundos para simulações longas

const executeSchema = z.object({
  simulationId: z.string(),
  name: z.string().optional(),
  params: simulationParamsSchema,
})

/**
 * POST /api/simulation/runs/execute
 * Executar uma simulação
 * 
 * TODO: Integrar com motor de simulação refatorado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = executeSchema.parse(body)

    // Verificar se o projeto pertence ao usuário
    const project = await prisma.simulation.findFirst({
      where: {
        id: validated.simulationId,
        userId: session.user.id,
        isSimulation: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Simulation project not found' },
        { status: 404 }
      )
    }

    // TODO: Executar simulação usando motor refatorado
    // Por enquanto, criar run vazia (motor será integrado no próximo commit)
    const run = await prisma.simulationRun.create({
      data: {
        simulationId: validated.simulationId,
        name: validated.name || `Execução ${new Date().toLocaleString('pt-BR')}`,
        params: JSON.stringify(validated.params),
        quotaIds: JSON.stringify(validated.params.quotas.map(q => q.id)),
        isSimulation: true,
        // Valores iniciais (serão preenchidos pelo motor)
        patrimonioFinal: 0,
        totalPagoParcelas: 0,
        totalPagoBolso: 0,
        totalRecebidoVendas: 0,
        caixaFinalInvestido: 0,
        custoPatrimonio: 0,
        roi: 0,
        multiplicadorPatrimonial: 0,
        custoPorReal: 0,
        numContemplacoes: 0,
        numVendas: 0,
        cotasAtivasFinal: 0,
      },
    })

    // TODO: Executar simulação assíncrona
    // Por enquanto, retornar run criada
    // No próximo commit, vamos integrar o motor de simulação

    return NextResponse.json(
      {
        run,
        message: 'Simulation run created. Motor integration pending.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error executing simulation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
