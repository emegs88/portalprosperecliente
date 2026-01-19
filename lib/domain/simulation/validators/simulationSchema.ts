/**
 * Zod schemas para validação de simulações (SANDBOX)
 */

import { z } from 'zod'

export const simulatorTypeSchema = z.enum([
  'IMOVEIS',
  'VEICULOS',
  'FROTA',
  'LANCE',
  'ACUMULO',
  'SORTEIO',
])

export const estrategiaVendaSchema = z.enum([
  'IMMEDIATA',
  'MANTER',
  'REINVESTIR',
])

export const eventTypeSchema = z.enum([
  'PAGAMENTO',
  'CONTEMPLACAO',
  'VENDA',
  'APLICACAO',
  'REINVESTIMENTO',
])

export const simulationQuotaSchema = z.object({
  id: z.string(),
  grupo: z.string(),
  cota: z.string(),
  versao: z.string(),
  vlBem: z.number().positive(),
  vlParcela: z.number().positive(),
  percentPago: z.number().min(0).max(100),
  contemplacao: z.string(),
  contemplada: z.boolean().optional(),
  vlReceber: z.number().optional(),
})

export const trancheSchema = z.object({
  id: z.string(),
  nome: z.string(),
  vlBem: z.number().positive(),
  garantia: z.number().min(0),
  prazo: z.number().positive(),
})

export const simulationParamsSchema = z.object({
  simulatorType: simulatorTypeSchema,
  quotas: z.array(simulationQuotaSchema).min(1),
  prazo: z.number().int().positive().max(600), // Máximo 50 anos
  taxaContemplacao: z.number().min(0).max(1).optional(),
  estrategiaVenda: estrategiaVendaSchema.optional(),
  aplicarCDI: z.boolean().optional(),
  tranches: z.array(trancheSchema).optional(),
  garantia: z.number().min(0).optional(),
  lanceEmbutido: z.boolean().optional(),
  valorLance: z.number().min(0).optional(),
  percentTaxaIntermediacao: z.number().min(0).max(100).optional(),
  percentDescontoVenda: z.number().min(0).max(100).optional(),
  taxaCDI: z.number().min(0).optional(),
})

export const monthlySnapshotSchema = z.object({
  mes: z.number().int().positive(),
  mesLabel: z.string(),
  parcelasPagas: z.number().int().min(0),
  valorParcelas: z.number().min(0),
  contemplacoes: z.number().int().min(0),
  vendas: z.number().int().min(0),
  valorVendas: z.number().min(0),
  caixa: z.number().min(0),
  caixaInvestido: z.number().min(0),
  patrimonio: z.number().min(0),
  creditoAtualizado: z.number().optional(),
  totalPago: z.number().min(0),
  totalPagoBolso: z.number().min(0),
  cdiAcumulado: z.number().optional(),
  poupancaAcumulado: z.number().optional(),
})

export const simulationEventSchema = z.object({
  tipo: eventTypeSchema,
  mes: z.number().int().positive(),
  cotaId: z.string().optional(),
  cotaGrupo: z.string().optional(),
  cotaNumero: z.string().optional(),
  valor: z.number().min(0),
  descricao: z.string(),
  destino: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const comparacaoSchema = z.object({
  patrimonioFinal: z.number().min(0),
  totalInvestido: z.number().min(0),
  rendimento: z.number(),
  percentRendimento: z.number(),
  custoOportunidade: z.number(),
})

export const simulationResultSchema = z.object({
  patrimonioFinal: z.number().min(0),
  totalPagoParcelas: z.number().min(0),
  totalPagoBolso: z.number().min(0),
  totalRecebidoVendas: z.number().min(0),
  caixaFinalInvestido: z.number().min(0),
  custoPatrimonio: z.number(),
  roi: z.number(),
  multiplicadorPatrimonial: z.number().min(0),
  custoPorReal: z.number().min(0),
  numContemplacoes: z.number().int().min(0),
  numVendas: z.number().int().min(0),
  cotasAtivasFinal: z.number().int().min(0),
  snapshots: z.array(monthlySnapshotSchema),
  events: z.array(simulationEventSchema),
  comparacaoCdi: comparacaoSchema.optional(),
  comparacaoPoupanca: comparacaoSchema.optional(),
  resumoTexto: z.string().optional(),
})
