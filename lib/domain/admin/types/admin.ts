/**
 * Types TypeScript para domínio ADMIN
 */

export interface DashboardKPIs {
  totalVendas: number
  vendasMes: number
  totalComissoes: number
  comissoesPendentes: number
  totalReservas: number
  reservasPendentes: number
  totalClientes: number
  clientesNovos: number
  patrimonioTotal: number
  patrimonioMes: number
}

export interface FunilVendas {
  leads: number
  propostas: number
  ativas: number
  contempladas: number
  concluidas: number
  taxaConversao: {
    leadParaProposta: number
    propostaParaAtiva: number
    ativaParaContemplada: number
  }
}

export interface VendorRanking {
  userId: string
  userName: string
  totalVendas: number
  totalCredit: number
  totalCommission: number
  vendasMes: number
  posicao: number
}

export interface PartnerRanking {
  userId: string
  userName: string
  totalVendas: number
  totalCommission: number
  posicao: number
}

export interface ExperienceStats {
  experienceId: string
  experienceName: string
  totalReservas: number
  totalConvidados: number
  taxadeOcupacao: number
  cancelamentos: number
  noShows: number
}

export interface ReportParams {
  type: 'sales' | 'commissions' | 'experiences' | 'clients' | 'general'
  startDate?: Date
  endDate?: Date
  filters?: Record<string, any>
  format: 'pdf' | 'excel' | 'csv'
}
