/**
 * Validação Zod para Plano de Comissão
 */

import { z } from 'zod'

export const commissionLevelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  requirements: z.object({
    monthlySalesCount: z.number().optional(),
    monthlyCreditBRL: z.number().optional(),
    teamActive: z.number().optional(),
    teamMonthlyCreditBRL: z.number().optional(),
  }),
  split: z.object({
    seller: z.number().min(0).max(100),
    leader: z.number().min(0).max(100),
    partner: z.number().min(0).max(100).optional(),
  }).refine(
    (data) => {
      const total = data.seller + data.leader + (data.partner || 0)
      return Math.abs(total - 100) < 0.01 // Permite pequena diferença de arredondamento
    },
    { message: 'Split deve somar 100%' }
  ),
  bonus: z.object({
    type: z.enum(['fixed', 'percentOfCommission']),
    valueBRL: z.number().optional(),
    value: z.number().optional(),
  }),
  override: z.object({
    type: z.enum(['percentOfCredit']),
    value: z.number(),
  }).optional(),
})

export const commissionPlanSchema = z.object({
  defaults: z.object({
    currency: z.string().default('BRL'),
    baseCommissionType: z.enum(['percentOfCredit', 'fixed']),
    baseCommissionValue: z.number(),
    payoutRule: z.string().default('monthly'),
    allowPartner: z.boolean().default(true),
  }),
  levels: z.array(commissionLevelSchema),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      commissionMultiplier: z.number(),
    })
  ),
  metaBonuses: z.array(
    z.object({
      id: z.string(),
      thresholdMonthlyCreditBRL: z.number(),
      bonusBRL: z.number(),
    })
  ),
  notes: z.array(z.string()).optional(),
})

export type CommissionPlan = z.infer<typeof commissionPlanSchema>
export type CommissionLevel = z.infer<typeof commissionLevelSchema>
