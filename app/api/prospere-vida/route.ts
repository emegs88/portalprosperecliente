import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAllQuotas } from '@/prisma/fixtures/ancora-report-real'

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
      // Se der erro no banco, retorna dados mock
      console.log('Banco não configurado, usando dados mock para Prospere Vida')
      const mockQuotas = generateAllQuotas().slice(0, 42)
      quotas = mockQuotas.map((q, idx) => ({
        id: `mock-${idx}`,
        grupo: q.grupo,
        cota: q.cota,
        vlParcela: q.vlParcela,
        pclsPagas: q.pclsPagas,
        pclsPagar: q.pclsPagar,
        vlBem: q.vlBem,
        dataVenda: q.dataVenda,
      }))
    }

    // Calcular cashback: 5% das parcelas pagas
    const TAXA_CASHBACK = 0.05 // 5%
    const MESES_PROJECAO = 10

    // Valor total já pago em parcelas
    const totalParcelasPagas = quotas.reduce((sum, q) => {
      const parcelasPagas = (q as any).pclsPagas || 0
      const vlParcela = q.vlParcela || 0
      return sum + (parcelasPagas * vlParcela)
    }, 0)

    // Cashback acumulado (5% das parcelas já pagas)
    const cashbackAcumulado = totalParcelasPagas * TAXA_CASHBACK

    // Aporte mensal total (soma de todas as parcelas mensais)
    const aporteMensalTotal = quotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)

    // Cashback mensal projetado (5% do aporte mensal)
    const cashbackMensal = aporteMensalTotal * TAXA_CASHBACK

    // Projeção dos próximos 10 meses
    const projecao = []
    let caixaDoadoAcumulado = cashbackAcumulado

    for (let mes = 1; mes <= MESES_PROJECAO; mes++) {
      caixaDoadoAcumulado += cashbackMensal
      projecao.push({
        mes,
        mesLabel: mes <= 12 ? `M${mes}` : `${Math.floor(mes / 12)}A`,
        cashbackMensal,
        caixaDoadoAcumulado,
        aporteMensal: aporteMensalTotal,
      })
    }

    // Dados para o gráfico (incluindo atual)
    const dadosGrafico = [
      {
        mes: 0,
        mesLabel: 'Atual',
        cashbackMensal: 0,
        caixaDoadoAcumulado: cashbackAcumulado,
        aporteMensal: 0,
      },
      ...projecao,
    ]

    return NextResponse.json({
      cashbackAcumulado,
      cashbackMensal,
      totalParcelasPagas,
      aporteMensalTotal,
      mesesProjecao: MESES_PROJECAO,
      taxaCashback: TAXA_CASHBACK * 100, // 5%
      projecao: dadosGrafico,
      totalCotas: quotas.length,
    })
  } catch (error) {
    console.error('Erro ao buscar dados Prospere Vida:', error)
    return NextResponse.json({
      cashbackAcumulado: 0,
      cashbackMensal: 0,
      totalParcelasPagas: 0,
      aporteMensalTotal: 0,
      mesesProjecao: 10,
      taxaCashback: 5,
      projecao: [],
      totalCotas: 0,
    })
  }
}
