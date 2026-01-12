import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // Forçar renderização dinâmica

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
      // Se der erro no banco, retornar dados vazios
      return NextResponse.json({
        totalCotas: 0,
        totalCredito: 0,
        parcelaMensalTotal: 0,
        totalReceber: 0,
        administradora: null,
        cotasMaisAdiantadas: [],
        cotasMaiorPotencial: [],
        cotasEmAtraso: [],
        distribuicaoStatus: {
          contempladas: 0,
          naoContempladas: 0,
          emAtraso: 0,
          emDia: 0,
        },
        distribuicaoTipoBem: {
          imovel: 0,
          outros: 0,
        },
        percentPagoMedio: 0,
        patrimonioAcumulado: [],
        fluxoCaixaMensal: [],
      })
    }

    // Buscar perfil do cliente para pegar administradora
    let clientProfile = null
    try {
      clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: session.user.id }
      })
    } catch (e) {
      // Ignora erro
    }

    // Buscar import batches (extratos importados) do usuário
    let importacoes: Array<{
      id: string
      filename: string
      sourceType: string
      status: string
      createdAt: Date
      parsedAt: Date | null
    }> = []
    try {
      importacoes = await prisma.importBatch.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          filename: true,
          sourceType: true,
          status: true,
          createdAt: true,
          parsedAt: true,
        },
      })
    } catch (e) {
      // Ignora erro
    }

    // Se não há cotas, retornar dados vazios do próprio usuário
    if (quotas.length === 0) {
      return NextResponse.json({
        totalCotas: 0,
        totalCredito: 0,
        parcelaMensalTotal: 0,
        totalReceber: 0,
        administradora: (clientProfile as any)?.administradora || null,
        cotasMaisAdiantadas: [],
        cotasMaiorPotencial: [],
        cotasEmAtraso: [],
        distribuicaoStatus: {
          contempladas: 0,
          naoContempladas: 0,
          emAtraso: 0,
          emDia: 0,
        },
        distribuicaoTipoBem: {
          imovel: 0,
          outros: 0,
        },
        percentPagoMedio: 0,
        patrimonioAcumulado: [],
        fluxoCaixaMensal: [],
      })
    }

    // Pegar administradora da primeira cota ou do perfil
    const administradora = quotas.length > 0 && quotas[0].administradora
      ? quotas[0].administradora
      : (clientProfile as any)?.administradora || null

    const totalCotas = quotas.length || 0
    // Total Crédito = Soma dos valores do bem (vlBem)
    const totalCredito = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlBem, 0) : 0
    // Parcela Mensal Total = Soma das parcelas mensais (vlParcela)
    const parcelaMensalTotal = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlParcela, 0) : 0
    // Patrimônio = Valor investido em parcelas (parcelas pagas * valor da parcela)
    const totalReceber = quotas.length > 0 
      ? quotas.reduce((sum, q) => sum + (q.pclsPagas * q.vlParcela), 0) 
      : 0

    // Análises mais relevantes para consórcios
    const cotasMaisAdiantadas = quotas.length > 0
      ? [...quotas]
          .sort((a, b) => b.percentPago - a.percentPago)
          .slice(0, 5)
          .map((q) => ({
            grupo: q.grupo,
            cota: q.cota,
            vlBem: q.vlBem,
            vlReceber: q.vlReceber,
            percentPago: q.percentPago,
            pclsPagas: q.pclsPagas,
            pclsPagar: q.pclsPagar,
            contemplacao: q.contemplacao,
            situacaoCobranca: q.situacaoCobranca,
            pclsEmAtraso: q.pclsEmAtraso,
          }))
      : []

    const cotasMaiorPotencial = quotas.length > 0
      ? [...quotas]
          .sort((a, b) => b.vlReceber - a.vlReceber)
          .slice(0, 5)
          .map((q) => ({
            grupo: q.grupo,
            cota: q.cota,
            vlBem: q.vlBem,
            vlReceber: q.vlReceber,
            percentPago: q.percentPago,
          }))
      : []

    const cotasEmAtraso = quotas.filter(q => q.pclsEmAtraso > 0)
      .sort((a, b) => b.pclsEmAtraso - a.pclsEmAtraso)
      .slice(0, 5)
      .map((q) => ({
        grupo: q.grupo,
        cota: q.cota,
        vlBem: q.vlBem,
        pclsEmAtraso: q.pclsEmAtraso,
        vlParcela: q.vlParcela,
        percentPago: q.percentPago,
      }))

    const distribuicaoStatus = {
      contempladas: quotas.filter(q => {
        const contemplacao = q.contemplacao || ''
        return contemplacao.toLowerCase().includes('contemplada') && 
               !contemplacao.toLowerCase().includes('não') &&
               !contemplacao.toLowerCase().includes('nao')
      }).length,
      naoContempladas: quotas.filter(q => {
        const contemplacao = q.contemplacao || ''
        return !contemplacao.toLowerCase().includes('contemplada') ||
               contemplacao.toLowerCase().includes('não') ||
               contemplacao.toLowerCase().includes('nao')
      }).length,
      emAtraso: quotas.filter(q => q.pclsEmAtraso > 0).length,
      emDia: quotas.filter(q => q.pclsEmAtraso === 0).length,
    }
    
    // Distribuição por tipo de bem
    const distribuicaoTipoBem = {
      imovel: quotas.filter(q => (q as any).tipoBem === 'IMOVEL').length,
      outros: quotas.filter(q => (q as any).tipoBem === 'OUTROS' || !(q as any).tipoBem).length,
    }

    // Evolução de pagamento (simulada baseada no % pago médio)
    const percentPagoMedio = quotas.length > 0
      ? quotas.reduce((sum, q) => sum + q.percentPago, 0) / quotas.length
      : 0

    // Fluxo de Caixa - APENAS dados reais do extrato
    // Baseado no extrato: todas as cotas são "Não Contemplada"
    const fluxoCaixaMensal = quotas.length > 0
      ? (() => {
          // Cotas realmente contempladas (do extrato) - verificar exatamente "Contemplada"
          const cotasContempladas = quotas.filter(q => {
            const contemplacao = q.contemplacao || ''
            return contemplacao.toLowerCase().includes('contemplada') && 
                   !contemplacao.toLowerCase().includes('não') &&
                   !contemplacao.toLowerCase().includes('nao')
          })
          
          // Total de cotas contempladas
          const totalCotasVendidas = cotasContempladas.length
          
          // Entrada total esperada de cotas contempladas (valor da parcela mensal)
          const entradaTotal = cotasContempladas.reduce((sum, q) => sum + q.vlParcela, 0)
          
          // Saída total atual (parcelas já pagas * valor parcela) - dados reais do extrato
          // Soma todas as cotas: cada cota tem pclsPagas * vlParcela
          const saidaTotal = quotas.reduce((sum, q) => {
            const parcelasPagas = q.pclsPagas || 0
            return sum + (parcelasPagas * q.vlParcela)
          }, 0)
          
          // Saldo atual
          const saldoAtual = entradaTotal - saidaTotal
          
          // Retorna apenas dados reais, sem projeções mensais inventadas
          return [{
            mes: 1,
            mesLabel: 'Atual',
            cotasVendidas: totalCotasVendidas,
            entrada: entradaTotal,
            saida: saidaTotal,
            saldo: saldoAtual,
            acumulado: saldoAtual,
          }]
        })()
      : []

    // Patrimônio acumulado baseado APENAS nos dados reais do extrato
    // Patrimônio = soma de todas as parcelas pagas (pclsPagas * vlParcela)
    const totalParcelasPagas = quotas.length > 0
      ? quotas.reduce((sum, q) => {
          // Soma todas as parcelas pagas reais do extrato
          const parcelasPagasTotal = q.pclsPagas || 0
          return sum + (parcelasPagasTotal * q.vlParcela)
        }, 0)
      : 0

    // Patrimônio acumulado - apenas dados reais do extrato
    // Mostra apenas o valor atual (parcelas pagas), sem projeções futuras
    const patrimonioAcumulado = quotas.length > 0
      ? [
          {
            mes: 'Atual',
            atual: totalParcelasPagas, // Valor real das parcelas pagas
            projetado: totalParcelasPagas, // Mesmo valor (sem projeção inventada)
          }
        ]
      : []

    return NextResponse.json({
      totalCotas,
      totalCredito,
      parcelaMensalTotal,
      totalReceber,
      administradora,
      cotasMaisAdiantadas: cotasMaisAdiantadas || [],
      cotasMaiorPotencial: cotasMaiorPotencial || [],
      cotasEmAtraso: cotasEmAtraso || [],
      distribuicaoStatus,
      distribuicaoTipoBem,
      percentPagoMedio,
      patrimonioAcumulado: patrimonioAcumulado || [],
      fluxoCaixaMensal: fluxoCaixaMensal || [],
      importacoes: importacoes || [],
      // Mantido para compatibilidade
      topCotas: cotasMaisAdiantadas || [],
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    // Retornar dados vazios em caso de erro (não dados mock de outro cliente)
    return NextResponse.json({
      totalCotas: 0,
      totalCredito: 0,
      parcelaMensalTotal: 0,
      totalReceber: 0,
      administradora: null,
      cotasMaisAdiantadas: [],
      cotasMaiorPotencial: [],
      cotasEmAtraso: [],
      distribuicaoStatus: {
        contempladas: 0,
        naoContempladas: 0,
        emAtraso: 0,
        emDia: 0,
      },
      distribuicaoTipoBem: {
        imovel: 0,
        outros: 0,
      },
      percentPagoMedio: 0,
      patrimonioAcumulado: [],
      fluxoCaixaMensal: [],
      importacoes: [],
    })
  }
}
