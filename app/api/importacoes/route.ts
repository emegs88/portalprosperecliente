import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar todos os import batches do usuário
    const importBatches = await prisma.importBatch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        quotas: {
          select: {
            id: true,
          },
        },
        importTotals: true,
      },
    })

    // Formatar dados para retornar
    const importacoes = importBatches.map(batch => ({
      id: batch.id,
      filename: batch.filename,
      sourceType: batch.sourceType,
      status: batch.status,
      createdAt: batch.createdAt,
      parsedAt: batch.parsedAt,
      totalCotas: batch.quotas.length,
      errors: batch.errorsJson ? JSON.parse(batch.errorsJson) : null,
      totals: batch.importTotals ? {
        totalCotas: batch.importTotals.totalCotas,
        totalVlBem: batch.importTotals.totalVlBem,
        totalVlParcela: batch.importTotals.totalVlParcela,
        totalVlReceber: batch.importTotals.totalVlReceber,
      } : null,
    }))

    return NextResponse.json({ importacoes })
  } catch (error: any) {
    console.error('Erro ao buscar importações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar importações', importacoes: [] },
      { status: 500 }
    )
  }
}
