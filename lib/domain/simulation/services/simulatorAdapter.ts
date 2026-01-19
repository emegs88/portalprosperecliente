/**
 * Adapter para converter entre types antigos do motor e novos types do domínio
 * 
 * TODO: Refatorar motor completamente para usar novos types
 */

import type {
  SimulationQuota,
  SimulationParams as NewSimulationParams,
  MonthlySnapshot as NewMonthlySnapshot,
  SimulationEvent as NewSimulationEvent,
  SimulationResult as NewSimulationResult,
  Comparacao as NewComparacao,
} from '../types/simulation'

import {
  simulatePatrimonioAccumulation,
  type Cota,
  type SimulationParams as OldSimulationParams,
  type IndicesData,
  type SimulationResult as OldSimulationResult,
} from './simulatorEngine'

/**
 * Converter SimulationQuota (novo) para Cota (antigo)
 */
function convertQuotaToOld(quota: SimulationQuota): Cota {
  return {
    id: quota.id,
    grupo: quota.grupo,
    cota: quota.cota,
    versao: quota.versao,
    vlBem: quota.vlBem,
    vlParcela: quota.vlParcela,
    vlReceber: quota.vlReceber || quota.vlBem,
    percentPago: quota.percentPago,
    contemplacao: quota.contemplacao,
    pclsPagar: 0, // Não usado no motor antigo
    pclsPagas: 0, // Não usado no motor antigo
  }
}

/**
 * Converter NewSimulationParams para OldSimulationParams
 */
function convertParamsToOld(newParams: NewSimulationParams): OldSimulationParams {
  // Converter estrategiaVenda
  let estrategiaPosVenda: 'vender' | 'investir' | 'comprarImovel' = 'investir'
  if (newParams.estrategiaVenda === 'IMMEDIATA') {
    estrategiaPosVenda = 'vender'
  } else if (newParams.estrategiaVenda === 'REINVESTIR') {
    estrategiaPosVenda = 'investir'
  } else if (newParams.estrategiaVenda === 'MANTER') {
    estrategiaPosVenda = 'comprarImovel'
  }

  return {
    cotasSelecionadas: newParams.quotas.map(q => q.id),
    mesesSimulacao: newParams.prazo,
    intervaloContemplacao: 3, // Default trimestral
    percentVendaContemplada: newParams.percentDescontoVenda || 85,
    taxaIntermediacao: newParams.percentTaxaIntermediacao || 3,
    estrategiaPosVenda,
    correcaoParcela: true, // Default
    correcaoCredito: true, // Default
    indiceCorrecao: 'INCC', // Default
    inccConfig: {
      fonte: 'manual',
      valorMensal: 0.5, // Default
    },
    cdiConfig: {
      fonte: newParams.aplicarCDI ? 'api' : 'manual',
      valorMensal: newParams.taxaCDI || 0.9, // Default
    },
  }
}

/**
 * Converter Evento (antigo) para SimulationEvent (novo)
 */
function convertEventToNew(evento: any, mes: number): NewSimulationEvent {
  const tipoMap: Record<string, 'PAGAMENTO' | 'CONTEMPLACAO' | 'VENDA' | 'APLICACAO' | 'REINVESTIMENTO'> = {
    'pagamento': 'PAGAMENTO',
    'contemplacao': 'CONTEMPLACAO',
    'venda': 'VENDA',
    'aplicacao': 'APLICACAO',
    'reinvestimento': 'REINVESTIMENTO',
  }

  return {
    tipo: tipoMap[evento.tipo] || 'PAGAMENTO',
    mes: evento.mes || mes,
    cotaId: evento.cotaId,
    cotaGrupo: evento.cotaGrupo,
    cotaNumero: evento.cotaNumero,
    valor: Math.abs(evento.valor),
    descricao: evento.descricao,
    destino: evento.destino,
    metadata: {},
  }
}

/**
 * Converter ResultadoMensal (antigo) para MonthlySnapshot (novo)
 */
function convertSnapshotToNew(snapshot: any): NewMonthlySnapshot {
  return {
    mes: snapshot.mes,
    mesLabel: snapshot.mesLabel || `Mês ${snapshot.mes}`,
    parcelasPagas: snapshot.parcelasPagas || 0,
    valorParcelas: snapshot.valorParcelas || 0,
    contemplacoes: snapshot.contemplacoes || 0,
    vendas: snapshot.vendas || 0,
    valorVendas: snapshot.valorVendas || 0,
    caixa: snapshot.caixa || 0,
    caixaInvestido: snapshot.caixaInvestido || 0,
    patrimonio: snapshot.patrimonio || 0,
    creditoAtualizado: snapshot.creditoAtualizado,
    totalPago: snapshot.totalPago || 0,
    totalPagoBolso: snapshot.totalPagoBolso || 0,
    cdiAcumulado: snapshot.cdiAcumulado,
    poupancaAcumulado: snapshot.poupancaAcumulado,
  }
}

/**
 * Converter Comparacao (antigo) para Comparacao (novo)
 */
function convertComparacaoToNew(comparacao: any): NewComparacao {
  return {
    patrimonioFinal: comparacao.cdiFinal || 0, // Aproximação
    totalInvestido: comparacao.poupancaFinal || 0, // Aproximação
    rendimento: comparacao.diferencaCdi || 0,
    percentRendimento: comparacao.percentDiferencaCdi || 0,
    custoOportunidade: comparacao.diferencaPoupanca || 0,
  }
}

/**
 * Executar simulação usando motor antigo e converter resultado
 */
export async function executeSimulation(
  quotas: SimulationQuota[],
  params: NewSimulationParams,
  indices: { incc: number[]; cdi: number[]; poupanca?: number[] }
): Promise<NewSimulationResult> {
  // Converter para formato antigo
  const cotasAntigas = quotas.map(convertQuotaToOld)
  const paramsAntigos = convertParamsToOld(params)
  const indicesData: IndicesData = {
    incc: indices.incc,
    cdi: indices.cdi,
    poupanca: indices.poupanca,
  }

  // Executar motor antigo
  const resultadoAntigo = simulatePatrimonioAccumulation(
    cotasAntigas,
    paramsAntigos,
    indicesData
  )

  // Converter resultado para formato novo
  const eventos: NewSimulationEvent[] = []
  resultadoAntigo.resultadosMensais.forEach((resultado) => {
    resultado.eventos.forEach((evento) => {
      eventos.push(convertEventToNew(evento, resultado.mes))
    })
  })

  const snapshots: NewMonthlySnapshot[] = resultadoAntigo.resultadosMensais.map(
    convertSnapshotToNew
  )

  const comparacaoCdi: NewComparacao | undefined = resultadoAntigo.comparacao
    ? convertComparacaoToNew(resultadoAntigo.comparacao)
    : undefined

  const comparacaoPoupanca: NewComparacao | undefined = resultadoAntigo.comparacao
    ? {
        ...convertComparacaoToNew(resultadoAntigo.comparacao),
        patrimonioFinal: resultadoAntigo.comparacao.poupancaFinal,
        totalInvestido: resultadoAntigo.comparacao.cdiFinal,
        rendimento: resultadoAntigo.comparacao.diferencaPoupanca,
        percentRendimento: resultadoAntigo.comparacao.percentDiferencaPoupanca,
      }
    : undefined

  return {
    patrimonioFinal: resultadoAntigo.patrimonioFinal,
    totalPagoParcelas: resultadoAntigo.totalPagoParcelas,
    totalPagoBolso: resultadoAntigo.totalPagoBolso,
    totalRecebidoVendas: resultadoAntigo.totalRecebidoVendas,
    caixaFinalInvestido: resultadoAntigo.caixaFinalInvestido,
    custoPatrimonio: resultadoAntigo.custoPatrimonio,
    roi: resultadoAntigo.roi,
    multiplicadorPatrimonial: resultadoAntigo.multiplicadorPatrimonial,
    custoPorReal: resultadoAntigo.custoPorReal,
    numContemplacoes: resultadoAntigo.numContemplacoes,
    numVendas: resultadoAntigo.numVendas,
    cotasAtivasFinal: resultadoAntigo.cotasAtivasFinal,
    snapshots,
    events: eventos,
    comparacaoCdi,
    comparacaoPoupanca,
    resumoTexto: resultadoAntigo.resumoTexto,
  }
}
