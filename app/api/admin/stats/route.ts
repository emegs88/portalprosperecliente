/**
 * API de Estatísticas Administrativas
 * Apenas para usuários com role ADMIN
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats
 * Obter estatísticas gerais da plataforma
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é ADMIN
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Buscar todas as estatísticas em paralelo
    const [
      totalUsers,
      totalClients,
      totalSellers,
      totalQuotas,
      totalSales,
      totalSimulations,
      totalReservations,
      totalCommissions,
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de clientes (usuários com role CLIENTE)
      prisma.user.count({
        where: { role: 'CLIENTE' },
      }),
      
      // Total de vendedores
      prisma.user.count({
        where: { role: { in: ['VENDEDOR', 'LIDER'] } },
      }),
      
      // Total de cotas
      prisma.quota.count(),
      
      // Total de vendas
      prisma.sale.count(),
      
      // Total de simulações
      prisma.simulation.count({
        where: { isSimulation: true },
      }),
      
      // Total de reservas
      prisma.reservation.count(),
      
      // Total de comissões
      prisma.commissionEntry.count(),
    ])

    // Calcular valores totais
    const quotasStats = await prisma.quota.aggregate({
      _sum: {
        vlBem: true,
        vlParcela: true,
        vlReceber: true,
      },
      _avg: {
        vlBem: true,
        vlParcela: true,
      },
    })

    const salesStats = await prisma.sale.aggregate({
      _sum: {
        creditAmount: true,
        installmentAmount: true,
      },
      _avg: {
        creditAmount: true,
        installmentAmount: true,
      },
    })

    const commissionsStats = await prisma.commissionEntry.aggregate({
      _sum: {
        sellerValue: true,
        leaderValue: true,
        partnerValue: true,
        totalValue: true,
      },
    })

    // Estatísticas de simulações
    const simulationStats = await prisma.simulationRun.aggregate({
      where: { isSimulation: true },
      _count: {
        id: true,
      },
      _sum: {
        patrimonioFinal: true,
        totalPagoParcelas: true,
      },
    })

    // Usuários por role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    })

    // Vendas por status
    const salesByStatus = await prisma.sale.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    // Cotas contempladas vs não contempladas
    const cotasContempladas = await prisma.quota.count({
      where: {
        contemplacao: {
          contains: 'CONTEMPLADA',
        },
      },
    })

    const cotasNaoContempladas = totalQuotas - cotasContempladas

    // Últimos 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      newUsersLast30Days,
      newSalesLast30Days,
      newQuotasLast30Days,
      newSimulationsLast30Days,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.sale.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.quota.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.simulation.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          isSimulation: true,
        },
      }),
    ])

    return NextResponse.json({
      overview: {
        totalUsers,
        totalClients,
        totalSellers,
        totalQuotas,
        totalSales,
        totalSimulations,
        totalReservations,
        totalCommissions,
      },
      quotas: {
        total: totalQuotas,
        contempladas: cotasContempladas,
        naoContempladas: cotasNaoContempladas,
        totalCredit: quotasStats._sum.vlBem || 0,
        totalInstallment: quotasStats._sum.vlParcela || 0,
        totalToReceive: quotasStats._sum.vlReceber || 0,
        avgCredit: quotasStats._avg.vlBem || 0,
        avgInstallment: quotasStats._avg.vlParcela || 0,
      },
      sales: {
        total: totalSales,
        totalCredit: salesStats._sum.creditAmount || 0,
        totalInstallment: salesStats._sum.installmentAmount || 0,
        avgCredit: salesStats._avg.creditAmount || 0,
        avgInstallment: salesStats._avg.installmentAmount || 0,
        byStatus: salesByStatus.map(s => ({
          status: s.status,
          count: s._count.id,
        })),
      },
      commissions: {
        total: totalCommissions,
        totalSeller: commissionsStats._sum.sellerValue || 0,
        totalLeader: commissionsStats._sum.leaderValue || 0,
        totalPartner: commissionsStats._sum.partnerValue || 0,
        totalValue: commissionsStats._sum.totalValue || 0,
      },
      simulations: {
        total: totalSimulations,
        totalRuns: simulationStats._count.id || 0,
        totalPatrimonio: simulationStats._sum.patrimonioFinal || 0,
        totalPago: simulationStats._sum.totalPagoParcelas || 0,
      },
      users: {
        byRole: usersByRole.map(u => ({
          role: u.role,
          count: u._count.id,
        })),
      },
      last30Days: {
        newUsers: newUsersLast30Days,
        newSales: newSalesLast30Days,
        newQuotas: newQuotasLast30Days,
        newSimulations: newSimulationsLast30Days,
      },
    })
  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
