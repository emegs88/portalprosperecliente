import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mockDashboardData } from './mock-data'

export const dynamic = 'force-dynamic' // Forçar renderização dinâmica

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    console.log('📊 Dashboard API - Sessão:', session?.user?.email, 'ID:', session?.user?.id)

    if (!session?.user?.id) {
      console.error('❌ Dashboard API - Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar todas as cotas do usuário - com tratamento de erro
    let quotas = []
    try {
      quotas = await prisma.quota.findMany({
        where: { userId: session.user.id },
        orderBy: { vlBem: 'desc' },
      })
      console.log(`✅ Dashboard API - Encontradas ${quotas.length} cotas para o usuário`)
    } catch (dbError) {
      console.error('❌ Dashboard API - Erro no banco:', dbError)
      // Se der erro no banco, retorna dados mock para desenvolvimento
      console.log('⚠️ Dashboard API - Usando dados mock')
      return NextResponse.json(mockDashboardData)
    }

    // Se não há cotas, retornar dados mock
    if (quotas.length === 0) {
      console.log('⚠️ Dashboard API - Nenhuma cota encontrada, usando dados mock')
      return NextResponse.json(mockDashboardData)
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

    // Pegar administradora da primeira cota ou do perfil
    const administradora = quotas.length > 0 && quotas[0].administradora
      ? quotas[0].administradora
      : (clientProfile as any)?.administradora || null

    const totalCotas = quotas.length || 0
    const totalCredito = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlBem, 0) : 0
    const parcelaMensalTotal = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlParcela, 0) : 0
    const totalReceber = quotas.length > 0 ? quotas.reduce((sum, q) => sum + q.vlReceber, 0) : 0

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
      // Mantido para compatibilidade
      topCotas: cotasMaisAdiantadas || [],
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    // Retorna dados mock em caso de erro para não quebrar a UI
    return NextResponse.json(mockDashboardData)
  }
}
