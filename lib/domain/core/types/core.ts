/**
 * Types TypeScript para domínio CORE REAL
 * Dados reais de clientes, cotas, vendas
 */

export interface RealQuota {
  id: string
  userId: string
  clientProfileId?: string
  importBatchId?: string
  administradora?: string
  empresa?: string
  grupo: string
  cota: string
  versao: string
  dataVenda?: string
  situacaoCobranca: string
  contemplacao: string
  percentPago: number
  percentAtraso: number
  percentFundoComum: number
  pclsPagar: number
  pclsPagas: number
  pclsPagasEmDia: number
  pclsPagasAtraso: number
  pclsEmAtraso: number
  vlBem: number
  vlParcela: number
  vlQuitacao: number
  vlReceber: number
  tipoBem?: string
  needsReview: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RealSale {
  id: string
  clientId: string
  sellerId: string
  partnerId?: string
  quotaId?: string
  productType: string
  creditAmount: number
  installmentAmount: number
  term: number
  status: SaleStatus
  saleDate?: Date
  contemplationDate?: Date
  commissionRate?: number
  notes?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export type SaleStatus = 
  | 'proposta' 
  | 'ativa' 
  | 'contemplada' 
  | 'vendida' 
  | 'cancelada'

export interface TimelineEvent {
  id: string
  userId: string
  tipo: TimelineEventType
  data: Date
  mes: number
  ano: number
  descricao: string
  valor?: number
  quotaId?: string
  saleId?: string
  metadata?: Record<string, any>
}

export type TimelineEventType = 
  | 'PAGAMENTO_PARCELA'
  | 'ASSEMBLEIA'
  | 'CONTEMPLACAO'
  | 'VENDA_COTA'
  | 'QUITACAO'
  | 'ATRASO'
  | 'NOVO_CONTRATO'

export interface MonthlyTimeline {
  mes: number
  ano: number
  mesLabel: string
  eventos: TimelineEvent[]
  totalPago: number
  contemplacoes: number
  vendas: number
  patrimonioAcumulado: number
}

export interface ClientSummary {
  totalCotas: number
  cotasContempladas: number
  cotasAtivas: number
  totalCredit: number
  monthlyInstallment: number
  totalPaid: number
  patrimonioAcumulado: number
  percentPagoMedio: number
}
