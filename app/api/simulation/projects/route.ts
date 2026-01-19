/**
 * API de Projetos de Simulação (SANDBOX)
 * 
 * ⚠️ REGRA CRÍTICA: NUNCA escrever em dados reais
 * ✅ Apenas trabalha com simulation_projects, simulation_runs, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { simulationParamsSchema } from '@/lib/domain/simulation/validators/simulationSchema'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  simulatorType: z.enum(['IMOVEIS', 'VEICULOS', 'FROTA', 'LANCE', 'ACUMULO', 'SORTEIO']),
  params: simulationParamsSchema,
  isFavorite: z.boolean().optional().default(false),
  isTemplate: z.boolean().optional().default(false),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  params: simulationParamsSchema.optional(),
  isFavorite: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
})

/**
 * GET /api/simulation/projects
 * Listar projetos de simulação do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const simulatorType = searchParams.get('simulatorType')
    const isFavorite = searchParams.get('isFavorite')

    const where: any = {
      userId: session.user.id,
      isSimulation: true, // Flag de segurança
    }

    if (simulatorType) {
      where.simulatorType = simulatorType
    }

    if (isFavorite === 'true') {
      where.isFavorite = true
    }

    const projects = await prisma.simulation.findMany({
      where,
      orderBy: [
        { isFavorite: 'desc' },
        { updatedAt: 'desc' },
      ],
      include: {
        _count: {
          select: { runs: true },
        },
      },
    })

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('Error fetching simulation projects:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/simulation/projects
 * Criar novo projeto de simulação
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createProjectSchema.parse(body)

    // Validar params com schema de simulação
    simulationParamsSchema.parse(validated.params)

    const project = await prisma.simulation.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        description: validated.description,
        simulatorType: validated.simulatorType,
        params: JSON.stringify(validated.params),
        isFavorite: validated.isFavorite || false,
        isTemplate: validated.isTemplate || false,
        isSimulation: true, // Flag de segurança
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating simulation project:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
