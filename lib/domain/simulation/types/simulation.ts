/**
 * Types TypeScript para domínio de SIMULAÇÕES (SANDBOX)
 * NUNCA deve referenciar tipos de domínio CORE REAL
 */

export type SimulatorType = 
  | 'IMOVEIS' 
  | 'VEICULOS' 
  | 'FROTA' 
  | 'LANCE' 
  | 'ACUMULO'
  | 'SORTEIO'

export type EstrategiaVenda = 
  | 'IMMEDIATA' 
  | 'MANTER' 
  | 'REINVESTIR'

export type EventType = 
  | 'PAGAMENTO' 
  | 'CONTEMPLACAO' 
  | 'VENDA' 
  | 'APLICACAO' 
  | 'REINVESTIMENTO'

export interface SimulationQuota {
  /** ID simulado (NÃO FK real) */
  id: string
  grupo: string
  cota: string
  versao: string
  vlBem: number
  vlParcela: number
  percentPago: number
  contemplacao: string
  contemplada?: boolean
  vlReceber?: number
}

export interface Tranche {
  id: string
  nome: string
  vlBem: number
  garantia: number
  prazo: number
}

export interface SimulationParams {
  simulatorType: SimulatorType
  /** IDs simuladas, não reais */
  quotas: SimulationQuota[]
  prazo: number
  taxaContemplacao?: number
  estrategiaVenda?: EstrategiaVenda
  aplicarCDI?: boolean
  
  // Imóveis específicos
  tranches?: Tranche[]
  garantia?: number
  
  // Lance específicos
  lanceEmbutido?: boolean
  valorLance?: number
  
  // Configurações avançadas
  percentTaxaIntermediacao?: number
  percentDescontoVenda?: number
  taxaCDI?: number // Manual se não usar automático
}

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
  creditoAtualizado?: number
  totalPago: number
  totalPagoBolso: number
  cdiAcumulado?: number
  poupancaAcumulado?: number
}

export interface SimulationEvent {
  tipo: EventType
  mes: number
  cotaId?: string
  cotaGrupo?: string
  cotaNumero?: string
  valor: number
  descricao: string
  destino?: string
  metadata?: Record<string, any>
}

export interface Comparacao {
  patrimonioFinal: number
  totalInvestido: number
  rendimento: number
  percentRendimento: number
  custoOportunidade: number
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
  snapshots: MonthlySnapshot[]
  events: SimulationEvent[]
  comparacaoCdi?: Comparacao
  comparacaoPoupanca?: Comparacao
  resumoTexto?: string
}

export interface SimulationProject {
  id: string
  userId: string
  name: string
  description?: string
  simulatorType: SimulatorType
  isFavorite: boolean
  isTemplate: boolean
  params: SimulationParams
  createdAt: Date
  updatedAt: Date
}

export interface SimulationRun {
  id: string
  simulationProjectId: string
  name?: string
  executedAt: Date
  params: SimulationParams
  quotaIds: string[] // IDs simuladas
  result: SimulationResult
}
