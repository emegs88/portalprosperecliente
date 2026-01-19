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
import { executeSimulation } from '@/lib/domain/simulation/services/simulatorAdapter'
import { simulationParamsSchema } from '@/lib/domain/simulation/validators/simulationSchema'
import { getIndicesForSimulation } from '@/lib/domain/simulation/services/getIndicesForSimulation'
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
 * Executar uma simulação completa
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

    // Obter índices (CDI, INCC, Poupança)
    const indices = await getIndicesForSimulation(validated.params.prazo)

    // Executar simulação usando adapter
    const result = await executeSimulation(
      validated.params.quotas,
      validated.params,
      indices
    )

    // Criar run no banco
    const run = await prisma.simulationRun.create({
      data: {
        simulationId: validated.simulationId,
        name: validated.name || `Execução ${new Date().toLocaleString('pt-BR')}`,
        params: JSON.stringify(validated.params),
        quotaIds: JSON.stringify(validated.params.quotas.map(q => q.id)),
        isSimulation: true,
        patrimonioFinal: result.patrimonioFinal,
        totalPagoParcelas: result.totalPagoParcelas,
        totalPagoBolso: result.totalPagoBolso,
        totalRecebidoVendas: result.totalRecebidoVendas,
        caixaFinalInvestido: result.caixaFinalInvestido,
        custoPatrimonio: result.custoPatrimonio,
        roi: result.roi,
        multiplicadorPatrimonial: result.multiplicadorPatrimonial,
        custoPorReal: result.custoPorReal,
        numContemplacoes: result.numContemplacoes,
        numVendas: result.numVendas,
        cotasAtivasFinal: result.cotasAtivasFinal,
        comparacaoCdi: result.comparacaoCdi ? JSON.stringify(result.comparacaoCdi) : null,
        comparacaoPoupanca: result.comparacaoPoupanca ? JSON.stringify(result.comparacaoPoupanca) : null,
        resumoTexto: result.resumoTexto,
      },
    })

    // Salvar snapshots mensais em batch
    if (result.snapshots.length > 0) {
      await prisma.monthlySnapshot.createMany({
        data: result.snapshots.map((snapshot) => ({
          simulationRunId: run.id,
          mes: snapshot.mes,
          mesLabel: snapshot.mesLabel,
          parcelasPagas: snapshot.parcelasPagas,
          valorParcelas: snapshot.valorParcelas,
          contemplacoes: snapshot.contemplacoes,
          vendas: snapshot.vendas,
          valorVendas: snapshot.valorVendas,
          caixa: snapshot.caixa,
          caixaInvestido: snapshot.caixaInvestido,
          patrimonio: snapshot.patrimonio,
          creditoAtualizado: snapshot.creditoAtualizado || 0,
          totalPago: snapshot.totalPago,
          totalPagoBolso: snapshot.totalPagoBolso,
          cdiAcumulado: snapshot.cdiAcumulado,
          poupancaAcumulado: snapshot.poupancaAcumulado,
        })),
      })
    }

    // Salvar events em batch
    if (result.events.length > 0) {
      await prisma.eventLog.createMany({
        data: result.events.map((event) => ({
          simulationRunId: run.id,
          tipo: event.tipo,
          mes: event.mes,
          cotaId: event.cotaId,
          cotaGrupo: event.cotaGrupo,
          cotaNumero: event.cotaNumero,
          valor: event.valor,
          descricao: event.descricao,
          destino: event.destino || null,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          isSimulation: true,
        })),
      })
    }

    return NextResponse.json(
      {
        run,
        result,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
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
