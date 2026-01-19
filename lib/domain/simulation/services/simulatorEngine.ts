/**
 * Motor de Simulação de Acúmulo de Patrimônio via Consórcio
 * 
 * Simula mês a mês a evolução do patrimônio considerando:
 * - Pagamento de parcelas (com correção por índice)
 * - Contemplações periódicas
 * - Vendas de cotas contempladas
 * - Aplicação do caixa (CDI, Poupança, ou reinvestimento)
 * - Correção do crédito por índice (INCC/IPCA)
 */

export interface Cota {
  id: string
  grupo: string
  cota: string
  versao: string
  vlBem: number
  vlParcela: number
  vlReceber: number
  percentPago: number
  contemplacao: string
  pclsPagar: number
  pclsPagas: number
}

export interface SimulationParams {
  cotasSelecionadas: string[]
  mesesSimulacao: number
  intervaloContemplacao: number
  percentVendaContemplada: number
  taxaIntermediacao: number
  taxaAdministracao?: number
  fundoReserva?: number
  inccConfig: {
    fonte: 'manual' | 'api'
    valorMensal: number
  }
  cdiConfig: {
    fonte: 'manual' | 'api'
    valorMensal: number
  }
  poupancaConfig?: {
    fonte: 'manual' | 'api'
    valorAnual: number
  }
  estrategiaPosVenda: 'vender' | 'investir' | 'comprarImovel'
  mesCorte?: number
  correcaoParcela: boolean
  correcaoCredito: boolean
  indiceCorrecao: 'INCC' | 'IPCA'
}

export interface IndicesData {
  incc: number[] // Array mensal de INCC
  cdi: number[] // Array mensal de CDI
  poupanca?: number[] // Array mensal de Poupança
}

export interface Evento {
  tipo: 'pagamento' | 'contemplacao' | 'venda' | 'aplicacao' | 'reinvestimento'
  mes: number
  cotaId?: string
  cotaGrupo?: string
  cotaNumero?: string
  valor: number
  descricao: string
  destino?: string
}

export interface ResultadoMensal {
  mes: number
  mesLabel: string
  parcelasPagas: number
  valorParcelas: number
  contemplacoes: number
  vendas: number
  valorVendas: number
  caixa: number
  caixaInvestido: number
  patrimonio: number
  creditoAtualizado: number
  totalPago: number
  totalPagoBolso: number
  eventos: Evento[]
}

export interface VendaResult {
  valorBruto: number
  taxaIntermediacao: number
  valorLiquido: number
  cotaId: string
}

export interface Comparacao {
  cdiFinal: number
  poupancaFinal: number
  diferencaCdi: number
  diferencaPoupanca: number
  percentDiferencaCdi: number
  percentDiferencaPoupanca: number
}

export interface SimulationResult {
  patrimonioFinal: number
  totalPagoParcelas: number
  totalPagoBolso: number
  totalRecebidoVendas: number
  caixaFinalInvestido: number
  custoPatrimonio: number
  roi: number
  multiplicadorPatrimonial: number
  custoPorReal: number
  numContemplacoes: number
  numVendas: number
  cotasAtivasFinal: number
  resultadosMensais: ResultadoMensal[]
  eventos: Evento[]
  comparacao: Comparacao
  resumoTexto: string
}

/**
 * Função principal de simulação
 */
export function simulatePatrimonioAccumulation(
  cotas: Cota[],
  params: SimulationParams,
  indices: IndicesData
): SimulationResult {
  // Filtrar cotas selecionadas
  const cotasSelecionadas = cotas.filter(c => params.cotasSelecionadas.includes(c.id))
  const totalCotas = cotasSelecionadas.length
  
  if (totalCotas === 0) {
    throw new Error('Nenhuma cota selecionada')
  }

  // Estado inicial
  let patrimonio = 0
  let caixa = 0
  let caixaInvestido = 0
  let totalPago = 0
  let totalPagoBolso = 0
  let totalRecebido = 0
  let cotasAtivas = cotasSelecionadas.filter(c => 
    !c.contemplacao.includes('Contemplada') && !c.contemplacao.includes('CONTEMPLADA')
  )
  let cotasContempladas: Cota[] = []
  let eventos: Evento[] = []
  let resultadosMensais: ResultadoMensal[] = []
  
  // Calcular valores base
  const vlParcelaBase = cotasSelecionadas.reduce((sum, c) => sum + c.vlParcela, 0) / totalCotas
  const vlBemBase = cotasSelecionadas.reduce((sum, c) => sum + c.vlBem, 0) / totalCotas
  let creditoAcumulado = cotasSelecionadas.reduce((sum, c) => sum + c.vlBem, 0)

  // Simular mês a mês
  for (let mes = 1; mes <= params.mesesSimulacao; mes++) {
    // Calcular índices do mês
    const inccMes = indices.incc[Math.min(mes - 1, indices.incc.length - 1)] || indices.incc[0] || params.inccConfig.valorMensal
    const cdiMes = indices.cdi[Math.min(mes - 1, indices.cdi.length - 1)] || indices.cdi[0] || params.cdiConfig.valorMensal
    const poupancaMes = indices.poupanca 
      ? (indices.poupanca[Math.min(mes - 1, indices.poupanca.length - 1)] || indices.poupanca[0] || (params.poupancaConfig?.valorAnual || 0) / 12)
      : (params.poupancaConfig?.valorAnual || 6.17) / 12

    // 1. Atualizar crédito se correção ativada
    if (params.correcaoCredito) {
      creditoAcumulado = creditoAcumulado * (1 + inccMes / 100)
    }

    // 2. Pagar parcelas
    const vlParcelaMes = params.correcaoParcela
      ? vlParcelaBase * Math.pow(1 + inccMes / 100, mes - 1)
      : vlParcelaBase
    
    const valorParcelas = vlParcelaMes * cotasAtivas.length
    totalPago += valorParcelas
    
    // Abater do caixa se houver (estratégia "pagar")
    if (params.estrategiaPosVenda === 'vender' && caixa > 0) {
      const abatimento = Math.min(caixa, valorParcelas)
      totalPagoBolso += valorParcelas - abatimento
      caixa -= abatimento
    } else {
      totalPagoBolso += valorParcelas
    }
    
    eventos.push({
      tipo: 'pagamento',
      mes,
      valor: -valorParcelas,
      descricao: `Pagamento de ${cotasAtivas.length} parcelas`,
    })

    // 3. Contemplações (se for o mês)
    let contemplacoesMes = 0
    if (mes % params.intervaloContemplacao === 0 && cotasAtivas.length > 0) {
      // Simular contemplação (10% das cotas ou 1 cota, o que for maior)
      const numContemplacoes = Math.max(1, Math.floor(cotasAtivas.length * 0.1))
      const contempladas = cotasAtivas.slice(0, numContemplacoes)
      
      cotasAtivas = cotasAtivas.slice(numContemplacoes)
      cotasContempladas.push(...contempladas)
      contemplacoesMes = contempladas.length

      eventos.push({
        tipo: 'contemplacao',
        mes,
        valor: 0,
        descricao: `${contempladas.length} cota(s) contemplada(s)`,
      })

      // 4. Vender cotas contempladas
      for (const cota of contempladas) {
        const vlBemAtualizado = params.correcaoCredito 
          ? cota.vlBem * Math.pow(1 + inccMes / 100, mes)
          : cota.vlBem
        
        const valorVendaBruto = vlBemAtualizado * (params.percentVendaContemplada / 100)
        const taxaIntermediacaoValor = valorVendaBruto * (params.taxaIntermediacao / 100)
        const valorLiquido = valorVendaBruto - taxaIntermediacaoValor
        
        totalRecebido += valorLiquido
        caixa += valorLiquido

        eventos.push({
          tipo: 'venda',
          mes,
          cotaId: cota.id,
          cotaGrupo: cota.grupo,
          cotaNumero: cota.cota,
          valor: valorLiquido,
          descricao: `Venda cota ${cota.grupo}-${cota.cota}`,
          destino: params.estrategiaPosVenda,
        })
      }
    }

    // 5. Aplicar estratégia pós-venda no caixa
    if (params.estrategiaPosVenda === 'investir' && caixa > 0) {
      // Aplicar em CDI
      const rendimento = caixa * (cdiMes / 100)
      caixaInvestido += rendimento
      caixa = caixa * (1 + cdiMes / 100)
      
      eventos.push({
        tipo: 'aplicacao',
        mes,
        valor: rendimento,
        descricao: `Rendimento CDI ${cdiMes.toFixed(2)}%`,
        destino: 'CDI',
      })
    } else if (params.estrategiaPosVenda === 'comprarImovel' && caixa > 0) {
      // Converter caixa em patrimônio (valorização imobiliária)
      const valorizacao = caixa * (inccMes / 100)
      patrimonio += caixa
      caixa = 0
      
      eventos.push({
        tipo: 'reinvestimento',
        mes,
        valor: valorizacao,
        descricao: `Compra imóvel (valorização INCC ${inccMes.toFixed(2)}%)`,
        destino: 'imovel',
      })
    }

    // 6. Atualizar patrimônio
    const patrimonioCotas = cotasAtivas.reduce((sum, c) => {
      const vlBemAtualizado = params.correcaoCredito
        ? c.vlBem * Math.pow(1 + inccMes / 100, mes)
        : c.vlBem
      return sum + vlBemAtualizado * (c.percentPago / 100)
    }, 0)
    
    patrimonio = patrimonioCotas + caixa + caixaInvestido

    // 7. Salvar resultado mensal
    resultadosMensais.push({
      mes,
      mesLabel: `Mês ${mes}`,
      parcelasPagas: cotasAtivas.length,
      valorParcelas,
      contemplacoes: contemplacoesMes,
      vendas: contemplacoesMes,
      valorVendas: contemplacoesMes > 0 ? totalRecebido : 0,
      caixa,
      caixaInvestido,
      patrimonio,
      creditoAtualizado: creditoAcumulado,
      totalPago,
      totalPagoBolso,
      eventos: eventos.filter(e => e.mes === mes),
    })
  }

  // Calcular resultados finais
  const custoPatrimonio = totalPagoBolso
  const roi = custoPatrimonio > 0 ? ((patrimonio - custoPatrimonio) / custoPatrimonio) * 100 : 0
  const multiplicadorPatrimonial = custoPatrimonio > 0 ? patrimonio / custoPatrimonio : 0
  const custoPorReal = patrimonio > 0 ? custoPatrimonio / patrimonio : 0

  // Comparação com CDI e Poupança
  const comparacao = calcularComparacao(
    resultadosMensais,
    params,
    indices
  )

  // Gerar resumo textual
  const resumoTexto = gerarResumoTexto({
    patrimonio,
    custoPatrimonio,
    roi,
    comparacao,
    numContemplacoes: cotasContempladas.length,
    numVendas: cotasContempladas.length,
    meses: params.mesesSimulacao,
  })

  return {
    patrimonioFinal: patrimonio,
    totalPagoParcelas: totalPago,
    totalPagoBolso: custoPatrimonio,
    totalRecebidoVendas: totalRecebido,
    caixaFinalInvestido: caixaInvestido,
    custoPatrimonio,
    roi,
    multiplicadorPatrimonial,
    custoPorReal,
    numContemplacoes: cotasContempladas.length,
    numVendas: cotasContempladas.length,
    cotasAtivasFinal: cotasAtivas.length,
    resultadosMensais,
    eventos,
    comparacao,
    resumoTexto,
  }
}

/**
 * Calcular comparação com CDI e Poupança
 */
function calcularComparacao(
  resultados: ResultadoMensal[],
  params: SimulationParams,
  indices: IndicesData
): Comparacao {
  let cdiAcumulado = 0
  let poupancaAcumulado = 0

  for (const resultado of resultados) {
    const mes = resultado.mes - 1
    const cdiMes = indices.cdi[Math.min(mes, indices.cdi.length - 1)] || params.cdiConfig.valorMensal
    const poupancaMes = indices.poupanca 
      ? (indices.poupanca[Math.min(mes, indices.poupanca.length - 1)] || (params.poupancaConfig?.valorAnual || 6.17) / 12)
      : (params.poupancaConfig?.valorAnual || 6.17) / 12

    // Aplicar aporte mensal (parcelas pagas)
    const aporte = resultado.valorParcelas
    cdiAcumulado = (cdiAcumulado + aporte) * (1 + cdiMes / 100)
    poupancaAcumulado = (poupancaAcumulado + aporte) * (1 + poupancaMes / 100)
  }

  const patrimonioFinal = resultados[resultados.length - 1]?.patrimonio || 0
  
  return {
    cdiFinal: cdiAcumulado,
    poupancaFinal: poupancaAcumulado,
    diferencaCdi: patrimonioFinal - cdiAcumulado,
    diferencaPoupanca: patrimonioFinal - poupancaAcumulado,
    percentDiferencaCdi: cdiAcumulado > 0 ? ((patrimonioFinal - cdiAcumulado) / cdiAcumulado) * 100 : 0,
    percentDiferencaPoupanca: poupancaAcumulado > 0 ? ((patrimonioFinal - poupancaAcumulado) / poupancaAcumulado) * 100 : 0,
  }
}

/**
 * Gerar resumo textual executivo
 */
function gerarResumoTexto(data: {
  patrimonio: number
  custoPatrimonio: number
  roi: number
  comparacao: Comparacao
  numContemplacoes: number
  numVendas: number
  meses: number
}): string {
  // Importar formatCurrency dinamicamente
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }
  
  return `
Você construiu um patrimônio de ${formatCurrency(data.patrimonio)} pagando efetivamente ${formatCurrency(data.custoPatrimonio)}.

Estratégia utilizada: Consórcio com ${data.numContemplacoes} contemplações e ${data.numVendas} vendas realizadas.

Tempo de construção: ${data.meses} meses (${(data.meses / 12).toFixed(1)} anos)

Resultados:
- Total Pago do Bolso: ${formatCurrency(data.custoPatrimonio)}
- Patrimônio Final: ${formatCurrency(data.patrimonio)}
- Ganho de Patrimônio: ${formatCurrency(data.patrimonio - data.custoPatrimonio)}
- ROI: ${data.roi.toFixed(2)}%
- Multiplicador Patrimonial: ${((data.patrimonio / data.custoPatrimonio) || 0).toFixed(2)}x

Comparação:
- vs CDI: ${data.comparacao.diferencaCdi >= 0 ? '+' : ''}${formatCurrency(data.comparacao.diferencaCdi)} (${data.comparacao.percentDiferencaCdi >= 0 ? '+' : ''}${data.comparacao.percentDiferencaCdi.toFixed(2)}%)
- vs Poupança: ${data.comparacao.diferencaPoupanca >= 0 ? '+' : ''}${formatCurrency(data.comparacao.diferencaPoupanca)} (${data.comparacao.percentDiferencaPoupanca >= 0 ? '+' : ''}${data.comparacao.percentDiferencaPoupanca.toFixed(2)}%)

Eficiência do modelo: ${data.roi > 50 ? 'Excelente' : data.roi > 20 ? 'Boa' : data.roi > 0 ? 'Razoável' : 'A melhorar'}
`.trim()
}
