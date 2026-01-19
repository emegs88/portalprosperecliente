import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 30 // Revalidar a cada 30 segundos

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const quotas = await prisma.quota.findMany({
      where: { userId: session.user.id },
      select: {
        vlBem: true,
        vlParcela: true,
        vlReceber: true,
        pclsPagas: true,
        pclsPagar: true,
        percentPago: true,
        contemplacao: true,
        vlQuitacao: true,
      },
    })

    // Otimização: cálculos em uma única passada
    const stats = quotas.reduce((acc, q) => {
      acc.totalCredit += q.vlBem || 0
      acc.monthlyInstallment += q.vlParcela || 0
      acc.totalToReceive += q.vlReceber || 0
      acc.totalParcelaPagas += q.pclsPagas || 0
      acc.totalParcelaPagar += q.pclsPagar || 0
      acc.totalPercentPago += q.percentPago || 0
      acc.totalQuitacao += q.vlQuitacao || 0
      
      const isContemplada = q.contemplacao?.toUpperCase().includes('CONTEMPLADA') || false
      if (isContemplada) {
        acc.cotasContempladas++
        acc.patrimonioAcumulado += q.vlReceber || 0
      } else {
        acc.patrimonioAcumulado += (q.vlBem || 0) * ((q.percentPago || 0) / 100)
      }
      
      return acc
    }, {
      totalCredit: 0,
      monthlyInstallment: 0,
      totalToReceive: 0,
      totalParcelaPagas: 0,
      totalParcelaPagar: 0,
      cotasContempladas: 0,
      totalPercentPago: 0,
      patrimonioAcumulado: 0,
      totalQuitacao: 0,
    })

    const totalCotas = quotas.length
    const totalPercentPago = totalCotas > 0 ? stats.totalPercentPago / totalCotas : 0

    return NextResponse.json({
      totalCotas,
      totalCredit: stats.totalCredit,
      monthlyInstallment: stats.monthlyInstallment,
      totalToReceive: stats.totalToReceive,
      totalParcelaPagas: stats.totalParcelaPagas,
      totalParcelaPagar: stats.totalParcelaPagar,
      cotasContempladas: stats.cotasContempladas,
      totalPercentPago,
      patrimonioAcumulado: stats.patrimonioAcumulado,
      totalQuitacao: stats.totalQuitacao,
      cotasNaoContempladas: totalCotas - stats.cotasContempladas,
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
