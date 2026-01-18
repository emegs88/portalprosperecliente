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

    const quotas = await prisma.quota.findMany({
      where: { userId: session.user.id },
    })

    const totalParcelasPagas = quotas.reduce(
      (sum, q) => sum + q.pclsPagas,
      0
    )
    const aporteMensalTotal = quotas.reduce((sum, q) => sum + q.vlParcela, 0)
    const taxaCashback = 0.5 // 0.5% das parcelas pagas
    const cashbackAcumulado = totalParcelasPagas * aporteMensalTotal * (taxaCashback / 100)
    const cashbackMensal = aporteMensalTotal * (taxaCashback / 100)
    const mesesProjecao = 12
    const totalCotas = quotas.length

    const projecao = Array.from({ length: mesesProjecao }, (_, i) => {
      const mes = i + 1
      const aporteMensal = aporteMensalTotal
      const cashback = aporteMensal * (taxaCashback / 100)
      const acumulado = cashback * mes

      return {
        mes,
        mesLabel: `Mês ${mes}`,
        cashbackMensal: cashback,
        caixaDoadoAcumulado: acumulado,
        aporteMensal,
      }
    })

    return NextResponse.json({
      cashbackAcumulado,
      cashbackMensal,
      totalParcelasPagas,
      aporteMensalTotal,
      mesesProjecao,
      taxaCashback,
      projecao,
      totalCotas,
    })
  } catch (error) {
    console.error('Prospere Vida API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
