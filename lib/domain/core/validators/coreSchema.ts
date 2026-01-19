/**
 * Zod schemas para validação de dados CORE REAL
 */

import { z } from 'zod'

export const saleStatusSchema = z.enum([
  'proposta',
  'ativa',
  'contemplada',
  'vendida',
  'cancelada',
])

export const timelineEventTypeSchema = z.enum([
  'PAGAMENTO_PARCELA',
  'ASSEMBLEIA',
  'CONTEMPLACAO',
  'VENDA_COTA',
  'QUITACAO',
  'ATRASO',
  'NOVO_CONTRATO',
])

export const realQuotaSchema = z.object({
  id: z.string(),
  userId: z.string(),
  clientProfileId: z.string().optional(),
  importBatchId: z.string().optional(),
  administradora: z.string().optional(),
  empresa: z.string().optional(),
  grupo: z.string(),
  cota: z.string(),
  versao: z.string(),
  dataVenda: z.string().optional(),
  situacaoCobranca: z.string(),
  contemplacao: z.string(),
  percentPago: z.number().min(0).max(100),
  percentAtraso: z.number().min(0).max(100),
  percentFundoComum: z.number().min(0).max(100),
  pclsPagar: z.number().int().min(0),
  pclsPagas: z.number().int().min(0),
  pclsPagasEmDia: z.number().int().min(0),
  pclsPagasAtraso: z.number().int().min(0),
  pclsEmAtraso: z.number().int().min(0),
  vlBem: z.number().positive(),
  vlParcela: z.number().positive(),
  vlQuitacao: z.number().min(0),
  vlReceber: z.number().min(0),
  tipoBem: z.string().optional(),
  needsReview: z.boolean().optional(),
})

export const realSaleSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  sellerId: z.string(),
  partnerId: z.string().optional(),
  quotaId: z.string().optional(),
  productType: z.string(),
  creditAmount: z.number().positive(),
  installmentAmount: z.number().positive(),
  term: z.number().int().positive(),
  status: saleStatusSchema,
  saleDate: z.date().optional(),
  contemplationDate: z.date().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const timelineEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tipo: timelineEventTypeSchema,
  data: z.date(),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000),
  descricao: z.string(),
  valor: z.number().optional(),
  quotaId: z.string().optional(),
  saleId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const monthlyTimelineSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000),
  mesLabel: z.string(),
  eventos: z.array(timelineEventSchema),
  totalPago: z.number().min(0),
  contemplacoes: z.number().int().min(0),
  vendas: z.number().int().min(0),
  patrimonioAcumulado: z.number().min(0),
})
