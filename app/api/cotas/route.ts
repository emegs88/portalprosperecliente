import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAllQuotas } from '@/prisma/fixtures/ancora-report-real'

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
        orderBy: { vlBem: 'desc' },
      })
    } catch (dbError) {
      // Se der erro no banco, retorna dados mock
      console.log('Banco não configurado, usando dados mock')
      const mockQuotas = generateAllQuotas().slice(0, 42).map((q, idx) => ({
        id: `mock-${idx}`,
        grupo: q.grupo,
        cota: q.cota,
        versao: q.versao,
        vlBem: q.vlBem,
        vlParcela: q.vlParcela,
        vlReceber: q.vlReceber,
        vlQuitacao: q.vlQuitacao,
        percentPago: q.percentPago,
        contemplacao: q.contemplacao,
        situacaoCobranca: q.situacaoCobranca,
        dataVenda: q.dataVenda,
        pclsPagar: q.pclsPagar,
        pclsPagas: q.pclsPagas,
      }))
      return NextResponse.json({ quotas: mockQuotas })
    }

    return NextResponse.json({ quotas })
  } catch (error) {
    console.error('Erro ao buscar cotas:', error)
    return NextResponse.json({ quotas: [] })
  }
}
