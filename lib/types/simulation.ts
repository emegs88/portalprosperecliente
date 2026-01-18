/**
 * Contratos TypeScript para Simulação de Patrimônio
 * VERSÃO TURBO
 */

// ============================================
// PARÂMETROS DE SIMULAÇÃO
// ============================================

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

// ============================================
// COTA
// ============================================

export interface Quota {
  id: string
  userId: string
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
  // Campos opcionais
  dataVenda?: string
  situacaoCobranca?: string
  tipoBem?: string
}

// ============================================
// SNAPSHOT MENSAL
// ============================================

export interface MonthlySnapshot {
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
  // Comparação acumulada
  cdiAcumulado?: number
  poupancaAcumulado?: number
  // Eventos do mês
  eventos: EventLog[]
}

// ============================================
// EVENTO
// ============================================

export type EventType = 
  | 'PAGAMENTO'
  | 'CONTEMPLACAO'
  | 'VENDA'
  | 'APLICACAO'
  | 'REINVESTIMENTO'

export interface EventLog {
  tipo: EventType
  mes: number
  cotaId?: string
  cotaGrupo?: string
  cotaNumero?: string
  valor: number
  descricao: string
  destino?: string // "CDI", "pagar", "imovel", etc
  metadata?: Record<string, any>
}

// ============================================
// RESULTADO DA SIMULAÇÃO
// ============================================

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
  resultadosMensais: MonthlySnapshot[]
  eventos: EventLog[]
  comparacao: Comparacao
  resumoTexto: string
}

// ============================================
// COMPARAÇÃO COM ÍNDICES
// ============================================

export interface Comparacao {
  cdiFinal: number
  poupancaFinal: number
  diferencaCdi: number
  diferencaPoupanca: number
  percentDiferencaCdi: number
  percentDiferencaPoupanca: number
}

// ============================================
// DADOS DE ÍNDICES
// ============================================

export interface IndicesData {
  incc: number[] // Array mensal de INCC
  cdi: number[] // Array mensal de CDI
  poupanca?: number[] // Array mensal de Poupança
}

// ============================================
// SIMULAÇÃO SALVA (DB)
// ============================================

export interface Simulation {
  id: string
  userId: string
  name: string
  description?: string
  isFavorite: boolean
  isTemplate: boolean
  params: SimulationParams
  createdAt: Date
  updatedAt: Date
}

// ============================================
// EXECUÇÃO DE SIMULAÇÃO (DB)
// ============================================

export interface SimulationRun {
  id: string
  simulationId: string
  name?: string
  executedAt: Date
  params: SimulationParams
  quotaIds: string[]
  // Resultados agregados
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
  // Comparação
  comparacaoCdi?: Comparacao
  comparacaoPoupanca?: Comparacao
  resumoTexto?: string
}

// ============================================
// RESPOSTA DA API
// ============================================

export interface SimulationRunResponse extends SimulationRun {
  snapshots: MonthlySnapshot[]
  events: EventLog[]
}

// ============================================
// COMPARAÇÃO DE SIMULAÇÕES
// ============================================

export interface ComparisonResult {
  run1: SimulationRunResponse
  run2: SimulationRunResponse
  diff: {
    patrimonio: number
    custoPatrimonio: number
    roi: number
  }
  chartData: ComparisonChartData[]
}

export interface ComparisonChartData {
  mes: number
  mesLabel: string
  patrimonio1: number
  patrimonio2: number
  totalPago1: number
  totalPago2: number
}
