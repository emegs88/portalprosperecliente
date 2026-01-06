import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mockDashboardData } from './mock-data'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar todas as cotas do usuário - com tratamento de erro
    let quotas = []
    try {
      quotas = await prisma.quota.findMany({
        where: { userId: session.user.id },
        orderBy: { vlBem: 'desc' },
      })
    } catch (dbError) {
      // Se der erro no banco, retorna dados mock para desenvolvimento
      console.log('Banco de dados não configurado, usando dados mock')
      return NextResponse.json(mockDashboardData)
    }

    const totalCotas = quotas.length || 0
    const totalCredito = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlBem, 0) : 0
    const parcelaMensalTotal = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlParcela, 0) : 0
    const totalReceber = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlReceber, 0) : 0

    // Top 5 cotas - sempre retorna array
    const topCotas = quotas.length > 0 
      ? quotas.slice(0, 5).map((q) => ({
          grupo: q.grupo,
          cota: q.cota,
          vlBem: q.vlBem,
          percentPago: q.percentPago,
        }))
      : []

    // Patrimônio acumulado (simulado - MVP) - sempre retorna array
    const patrimonioAcumulado = totalCredito > 0
      ? Array.from({ length: 12 }, (_, i) => ({
          mes: `Mês ${i + 1}`,
          atual: totalCredito * (i + 1) * 0.1,
          projetado: totalCredito * (i + 1) * 0.15,
        }))
      : []

    return NextResponse.json({
      totalCotas,
      totalCredito,
      parcelaMensalTotal,
      totalReceber,
      topCotas: topCotas || [],
      patrimonioAcumulado: patrimonioAcumulado || [],
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    // Retorna dados vazios em caso de erro
    return NextResponse.json({
      totalCotas: 0,
      totalCredito: 0,
      parcelaMensalTotal: 0,
      totalReceber: 0,
      topCotas: [],
      patrimonioAcumulado: [],
    })
  }
}
