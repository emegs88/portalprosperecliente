// Dados mock para desenvolvimento quando não há banco configurado

// Função helper para gerar cotas mock baseadas no extrato REAL
function generateMockQuotas() {
  // Baseado no extrato real: todas as cotas têm:
  // - Contemplação: "Não Contemplada"
  // - Pcls. Pagas: 004 (4 parcelas)
  // - Pcls. Pagas em Dia: 003 (3 em dia)
  // - Pcls. Atraso: 001 (1 em atraso)
  // - Pcls. Em Atraso: 000 (nenhuma em atraso no momento)
  // - Vl. Bem: principalmente 100.000,00
  // - Vl. Parcela: principalmente 385,00
  
  // Identificar tipo de bem: normalmente valores acima de 150k podem ser imóveis
  // Mas para ser preciso, precisaria de informação adicional do extrato
  // Por enquanto, vamos usar uma heurística baseada no valor
  
  return [
    // Dados conforme extrato real: todas as cotas têm 4 parcelas pagas
    // Parcela total: R$ 16.090,30 / 42 cotas = ~R$ 383,10 por cota
    // Mas algumas cotas têm valores diferentes de parcela, então vamos usar valores reais
    { grupo: '000706', cota: '2011', vlBem: 100000, vlReceber: 100000, percentPago: 0.0000, pclsPagas: 4, pclsPagar: 240, contemplacao: 'Não Contemplada', situacaoCobranca: 'N00 - NORMAL', pclsEmAtraso: 0, vlParcela: 385.70, tipoBem: 'OUTROS' },
    { grupo: '000706', cota: '2012', vlBem: 100000, vlReceber: 100000, percentPago: 0.0000, pclsPagas: 4, pclsPagar: 240, contemplacao: 'Não Contemplada', situacaoCobranca: 'N00 - NORMAL', pclsEmAtraso: 0, vlParcela: 385.70, tipoBem: 'OUTROS' },
    { grupo: '000706', cota: '2013', vlBem: 100000, vlReceber: 100000, percentPago: 0.0000, pclsPagas: 4, pclsPagar: 240, contemplacao: 'Não Contemplada', situacaoCobranca: 'N00 - NORMAL', pclsEmAtraso: 0, vlParcela: 385.70, tipoBem: 'OUTROS' },
    { grupo: '000706', cota: '2014', vlBem: 100000, vlReceber: 100000, percentPago: 0.0000, pclsPagas: 4, pclsPagar: 240, contemplacao: 'Não Contemplada', situacaoCobranca: 'N00 - NORMAL', pclsEmAtraso: 0, vlParcela: 385.70, tipoBem: 'OUTROS' },
    { grupo: '000706', cota: '2015', vlBem: 100000, vlReceber: 100000, percentPago: 0.0000, pclsPagas: 4, pclsPagar: 240, contemplacao: 'Não Contemplada', situacaoCobranca: 'N00 - NORMAL', pclsEmAtraso: 0, vlParcela: 385.70, tipoBem: 'OUTROS' },
  ]
}

const mockQuotas = generateMockQuotas()

export const mockDashboardData = {
  totalCotas: 42,
  totalCredito: 4150000.00,
  parcelaMensalTotal: 16090.30, // R$ 16.090,30 conforme extrato
  totalReceber: 5248715.10,
  administradora: 'ANCORA ADMINISTRADORA DE CONSORCIOS S.A.',
  
  // Cotas mais adiantadas (maior % pago)
  cotasMaisAdiantadas: [...mockQuotas]
    .sort((a, b) => b.percentPago - a.percentPago)
    .slice(0, 5),
  
  // Cotas com maior potencial (maior vlReceber)
  cotasMaiorPotencial: [...mockQuotas]
    .sort((a, b) => b.vlReceber - a.vlReceber)
    .slice(0, 5),
  
  // Cotas em atraso
  cotasEmAtraso: mockQuotas
    .filter(q => q.pclsEmAtraso > 0)
    .sort((a, b) => b.pclsEmAtraso - a.pclsEmAtraso),
  
  // Distribuição de status - baseado no extrato REAL
  distribuicaoStatus: {
    contempladas: mockQuotas.filter(q => {
      const contemplacao = q.contemplacao || ''
      return contemplacao.toLowerCase().includes('contemplada') && 
             !contemplacao.toLowerCase().includes('não') &&
             !contemplacao.toLowerCase().includes('nao')
    }).length,
    naoContempladas: mockQuotas.filter(q => {
      const contemplacao = q.contemplacao || ''
      return !contemplacao.toLowerCase().includes('contemplada') ||
             contemplacao.toLowerCase().includes('não') ||
             contemplacao.toLowerCase().includes('nao')
    }).length,
    emAtraso: mockQuotas.filter(q => q.pclsEmAtraso > 0).length,
    emDia: mockQuotas.filter(q => q.pclsEmAtraso === 0).length,
  },
  
  // Distribuição por tipo de bem
  distribuicaoTipoBem: {
    imovel: mockQuotas.filter(q => (q as any).tipoBem === 'IMOVEL').length,
    outros: mockQuotas.filter(q => (q as any).tipoBem === 'OUTROS' || !(q as any).tipoBem).length,
  },
  
  // % Pago médio
  percentPagoMedio: mockQuotas.reduce((sum, q) => sum + q.percentPago, 0) / mockQuotas.length,
  
  // Mantido para compatibilidade
  topCotas: mockQuotas.slice(0, 5).map(q => ({
    grupo: q.grupo,
    cota: q.cota,
    vlBem: q.vlBem,
    percentPago: q.percentPago,
  })),
  
  // Patrimônio acumulado baseado em parcelas pagas
  // Considera parcelas pagas em dia + outras (sem mencionar "atraso")
  fluxoCaixaMensal: (() => {
    // Dados reais do extrato mock - sem simulações
    // No extrato real: TODAS as cotas são "Não Contemplada"
    const cotasContempladas = mockQuotas.filter(q => {
      const contemplacao = q.contemplacao || ''
      return contemplacao.toLowerCase().includes('contemplada') && 
             !contemplacao.toLowerCase().includes('não') &&
             !contemplacao.toLowerCase().includes('nao')
    })
    
    const totalCotasVendidas = cotasContempladas.length // Será 0 no extrato real
    const entradaTotal = cotasContempladas.reduce((sum, q) => sum + q.vlParcela, 0)
    // Patrimônio atual = parcela total * parcelas pagas = 16.090,30 * 4 = 64.361,20
    // Calcula corretamente: soma de (pclsPagas * vlParcela) de todas as cotas
    // Como todas têm 4 parcelas pagas e parcela total é 16.090,30, então:
    const saidaTotal = 16090.30 * 4 // R$ 64.361,20 (dados reais do extrato)
    const saldoAtual = entradaTotal - saidaTotal
    
    return [{
      mes: 1,
      mesLabel: 'Atual',
      cotasVendidas: totalCotasVendidas,
      entrada: entradaTotal,
      saida: saidaTotal,
      saldo: saldoAtual,
      acumulado: saldoAtual,
    }]
  })(),

  patrimonioAcumuladoOld: Array.from({ length: 12 }, (_, mes) => {
    const mesesDesdeInicio = mes + 1
    
    // Cotas contempladas ou com alta % pago
    const cotasVendidas = mockQuotas.filter(q => 
      q.contemplacao?.includes('Contemplada') || q.percentPago > 0.8
    ).length
    
    // Entradas
    const entradaMensal = mockQuotas
      .filter(q => q.contemplacao?.includes('Contemplada') || q.percentPago > 0.8)
      .reduce((sum, q) => sum + (q.vlParcela * (mesesDesdeInicio <= 6 ? 1 : 0.9)), 0)
    
    // Saídas
    const parcelaMensalPagas = mockQuotas.reduce((sum, q) => {
      const parcelasJaPagas = q.pclsPagas || 0
      const parcelasPagasAcumulado = Math.min(
        parcelasJaPagas + Math.floor(mesesDesdeInicio * (q.pclsPagar / 240)),
        q.pclsPagar
      )
      const parcelasPagasMesAnterior = Math.min(
        parcelasJaPagas + Math.floor((mesesDesdeInicio - 1) * (q.pclsPagar / 240)),
        q.pclsPagar
      )
      const parcelasPagasNesteMes = Math.max(0, parcelasPagasAcumulado - parcelasPagasMesAnterior)
      return sum + (parcelasPagasNesteMes * q.vlParcela)
    }, 0)
    
    const saldo = entradaMensal - parcelaMensalPagas
    
    const acumulado = Array.from({ length: mesesDesdeInicio }, (_, i) => {
      const mesIdx = i + 1
      const entradaMes = mockQuotas
        .filter(q => q.contemplacao?.includes('Contemplada') || q.percentPago > 0.8)
        .reduce((sum, q) => sum + (q.vlParcela * (mesIdx <= 6 ? 1 : 0.9)), 0)
      
      const parcelaMes = mockQuotas.reduce((sum, q) => {
        const pPagas = Math.min(
          (q.pclsPagas || 0) + Math.floor(mesIdx * (q.pclsPagar / 240)),
          q.pclsPagar
        )
        const pPagasAnterior = Math.min(
          (q.pclsPagas || 0) + Math.floor((mesIdx - 1) * (q.pclsPagar / 240)),
          q.pclsPagar
        )
        const pPagasNesteMes = Math.max(0, pPagas - pPagasAnterior)
        return sum + (pPagasNesteMes * q.vlParcela)
      }, 0)
      
      return entradaMes - parcelaMes
    }).reduce((sum, val) => sum + val, 0)
    
    return {
      mes: mesesDesdeInicio,
      mesLabel: `M${mesesDesdeInicio}`,
      cotasVendidas,
      entrada: entradaMensal,
      saida: parcelaMensalPagas,
      saldo,
      acumulado,
    }
  }),

  // Patrimônio acumulado - APENAS dados reais do extrato
  // Parcela total: R$ 16.090,30 * 4 parcelas pagas = R$ 64.361,20
  patrimonioAcumulado: (() => {
    const totalParcelasPagas = 16090.30 * 4 // R$ 64.361,20 conforme extrato
    
    // Retorna apenas o valor real atual, sem projeções
    return [{
      mes: 'Atual',
      atual: totalParcelasPagas,
      projetado: totalParcelasPagas,
    }]
  })(),
}
