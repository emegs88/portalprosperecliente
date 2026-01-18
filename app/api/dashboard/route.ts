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

    const totalCotas = quotas.length
    const totalCredit = quotas.reduce((sum, q) => sum + q.vlBem, 0)
    const monthlyInstallment = quotas.reduce((sum, q) => sum + q.vlParcela, 0)
    const totalToReceive = quotas.reduce((sum, q) => sum + q.vlReceber, 0)
    const totalParcelaPagas = quotas.reduce((sum, q) => sum + q.pclsPagas, 0)
    const totalParcelaPagar = quotas.reduce((sum, q) => sum + q.pclsPagar, 0)
    const cotasContempladas = quotas.filter(q => q.contemplacao.includes('Contemplada') || q.contemplacao.includes('CONTEMPLADA')).length
    const totalPercentPago = quotas.length > 0 
      ? quotas.reduce((sum, q) => sum + q.percentPago, 0) / quotas.length 
      : 0
    const patrimonioAcumulado = quotas.reduce((sum, q) => {
      // Patrimônio = valor do bem das cotas não contempladas + valor a receber das contempladas
      if (q.contemplacao.includes('Contemplada') || q.contemplacao.includes('CONTEMPLADA')) {
        return sum + q.vlReceber
      } else {
        return sum + (q.vlBem * (q.percentPago / 100))
      }
    }, 0)
    const totalQuitacao = quotas.reduce((sum, q) => sum + q.vlQuitacao, 0)

    return NextResponse.json({
      totalCotas,
      totalCredit,
      monthlyInstallment,
      totalToReceive,
      totalParcelaPagas,
      totalParcelaPagar,
      cotasContempladas,
      totalPercentPago,
      patrimonioAcumulado,
      totalQuitacao,
      cotasNaoContempladas: totalCotas - cotasContempladas,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
