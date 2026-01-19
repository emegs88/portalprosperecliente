/**
 * Zod schemas para validação de comissões
 */

import { z } from 'zod'

export const commissionRoleSchema = z.enum(['seller', 'leader', 'partner'])

export const commissionStatusSchema = z.enum([
  'pending',
  'confirmed',
  'paid',
  'cancelled',
])

export const payoutStatusSchema = z.enum([
  'pending',
  'generated',
  'approved',
  'paid',
  'failed',
])

export const reconciliationStatusSchema = z.enum([
  'pending',
  'reviewed',
  'approved',
])

export const commissionSplitSchema = z.object({
  seller: z.number().min(0).max(100),
  leader: z.number().min(0).max(100).optional(),
  partner: z.number().min(0).max(100).optional(),
})

export const bonusRulesSchema = z.object({
  minCredit: z.number().positive().optional(),
  bonusRate: z.number().min(0).max(100).optional(),
  minSales: z.number().int().positive().optional(),
  bonusAmount: z.number().positive().optional(),
})

export const commissionRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  levelId: z.string().optional(),
  productType: z.string().optional(),
  baseRate: z.number().min(0).max(100),
  splitRules: commissionSplitSchema,
  bonusRules: bonusRulesSchema.optional(),
  overrideRules: z.record(z.any()).optional(),
  validFrom: z.date(),
  validUntil: z.date().optional(),
  isActive: z.boolean(),
})

export const commissionEntrySchema = z.object({
  id: z.string(),
  saleId: z.string(),
  userId: z.string(),
  role: commissionRoleSchema,
  ruleId: z.string().optional(),
  baseAmount: z.number().positive(),
  rate: z.number().min(0).max(100),
  amount: z.number().min(0),
  override: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  total: z.number().min(0),
  status: commissionStatusSchema,
  paidAt: z.date().optional(),
  payoutId: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const reconciliationRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  saleId: z.string().optional(),
  creditAmount: z.number().positive(),
  commissionAmount: z.number().min(0),
  date: z.date(),
  clientName: z.string().optional(),
  sellerName: z.string().optional(),
  matched: z.boolean(),
  commissionEntryId: z.string().optional(),
  error: z.string().optional(),
})

export const reconciliationResultSchema = z.object({
  reconciliationId: z.string(),
  totalRows: z.number().int().positive(),
  matched: z.number().int().min(0),
  unmatched: z.number().int().min(0),
  unmatchedRows: z.array(reconciliationRowSchema),
  errors: z.array(z.string()),
})
