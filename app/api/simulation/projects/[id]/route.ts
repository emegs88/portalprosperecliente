/**
 * API de Projeto Individual de Simulação (SANDBOX)
 * 
 * ⚠️ REGRA CRÍTICA: NUNCA escrever em dados reais
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { simulationParamsSchema } from '@/lib/domain/simulation/validators/simulationSchema'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  params: simulationParamsSchema.optional(),
  isFavorite: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
})

/**
 * GET /api/simulation/projects/[id]
 * Obter projeto específico
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

    const project = await prisma.simulation.findFirst({
      where: {
        id,
        userId: session.user.id,
        isSimulation: true, // Flag de segurança
      },
      include: {
        runs: {
          orderBy: { executedAt: 'desc' },
          take: 5, // Últimas 5 execuções
          select: {
            id: true,
            name: true,
            executedAt: true,
            patrimonioFinal: true,
            totalPagoBolso: true,
            roi: true,
          },
        },
        _count: {
          select: { runs: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Simulation project not found' },
        { status: 404 }
      )
    }

    // Parse params JSON
    const projectWithParsedParams = {
      ...project,
      params: JSON.parse(project.params),
    }

    return NextResponse.json({ project: projectWithParsedParams })
  } catch (error: any) {
    console.error('Error fetching simulation project:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/simulation/projects/[id]
 * Atualizar projeto
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const validated = updateProjectSchema.parse(body)

    // Verificar se o projeto pertence ao usuário
    const existing = await prisma.simulation.findFirst({
      where: {
        id,
        userId: session.user.id,
        isSimulation: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Simulation project not found' },
        { status: 404 }
      )
    }

    // Validar params se fornecido
    if (validated.params) {
      simulationParamsSchema.parse(validated.params)
    }

    const updateData: any = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.params !== undefined) updateData.params = JSON.stringify(validated.params)
    if (validated.isFavorite !== undefined) updateData.isFavorite = validated.isFavorite
    if (validated.isTemplate !== undefined) updateData.isTemplate = validated.isTemplate

    const project = await prisma.simulation.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ project })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating simulation project:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/simulation/projects/[id]
 * Deletar projeto (cascata deleta runs, snapshots, events)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verificar se o projeto pertence ao usuário
    const existing = await prisma.simulation.findFirst({
      where: {
        id,
        userId: session.user.id,
        isSimulation: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Simulation project not found' },
        { status: 404 }
      )
    }

    // Deletar (cascata automática via Prisma)
    await prisma.simulation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting simulation project:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
