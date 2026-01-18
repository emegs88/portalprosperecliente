import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const batches = await prisma.importBatch.findMany({
      where: { userId: session.user.id },
      include: {
        totals: true,
        _count: {
          select: { quotas: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const formattedBatches = batches.map(batch => ({
      id: batch.id,
      sourceType: batch.sourceType,
      filename: batch.filename,
      status: batch.status,
      createdAt: batch.createdAt.toISOString(),
      parsedAt: batch.parsedAt?.toISOString(),
      quotasCount: batch._count.quotas,
      totals: batch.totals ? {
        totalCotas: batch.totals.totalCotas,
        totalVlBem: batch.totals.totalVlBem,
        totalVlParcela: batch.totals.totalVlParcela,
      } : undefined,
    }))

    return NextResponse.json({ batches: formattedBatches })
  } catch (error) {
    console.error('Import history error:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar histórico' },
      { status: 500 }
    )
  }
}
