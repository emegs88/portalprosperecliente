import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mockDashboardData } from '../dashboard/mock-data'

export const dynamic = 'force-dynamic' // Forçar renderização dinâmica

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    let quotas = []
    try {
      quotas = await prisma.quota.findMany({
        where: { userId: session.user.id },
      })
    } catch (dbError) {
      // Retornar dados mock se banco não configurado
      // Conforme extrato: parcela total R$ 16.090,30, 4 parcelas pagas
      // Patrimônio atual = 16.090,30 * 4 = R$ 64.361,20
      const mockQuotas = [
        { vlBem: 100000, vlParcela: 385.70, percentPago: 0.0000, pclsPagar: 240, pclsPagas: 4 },
        { vlBem: 100000, vlParcela: 385.70, percentPago: 0.0000, pclsPagar: 240, pclsPagas: 4 },
        { vlBem: 100000, vlParcela: 385.70, percentPago: 0.0000, pclsPagar: 240, pclsPagas: 4 },
        { vlBem: 100000, vlParcela: 385.70, percentPago: 0.0000, pclsPagar: 240, pclsPagas: 4 },
        { vlBem: 100000, vlParcela: 385.70, percentPago: 0.0000, pclsPagar: 240, pclsPagas: 4 },
      ]
      const mockPatrimonioBase = mockQuotas.reduce((sum, q) => sum + q.vlBem, 0)
      const mockAporteMensal = mockQuotas.reduce((sum, q) => sum + q.vlParcela, 0)
      // Patrimônio atual = soma de (parcelas pagas * valor parcela) = 4 parcelas * parcela total
      const mockValorPago = 16090.30 * 4 // R$ 64.361,20
      
      return NextResponse.json({
        patrimonioBase: mockPatrimonioBase,
        aporteMensal: mockAporteMensal,
        valorPago: mockValorPago,
        totalCotas: mockDashboardData.totalCotas,
      })
    }

    const patrimonioBase = quotas.reduce((sum, q) => sum + q.vlBem, 0)
    const aporteMensal = quotas.reduce((sum, q) => sum + q.vlParcela, 0)
    // Patrimônio atual = parcelas pagas (pclsPagas * vlParcela)
    const valorPago = quotas.reduce((sum, q) => sum + (q.pclsPagas * q.vlParcela), 0)

    return NextResponse.json({
      patrimonioBase,
      aporteMensal,
      valorPago,
      totalCotas: quotas.length,
    })
  } catch (error) {
    console.error('Erro ao buscar patrimônio:', error)
    return NextResponse.json({
      patrimonioBase: 0,
      aporteMensal: 0,
      valorPago: 0,
      totalCotas: 0,
    })
  }
}
