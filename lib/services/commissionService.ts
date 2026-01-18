/**
 * Serviço de Cálculo de Comissão
 */

import commissionPlan from '@/config/commissionPlan.json'
import { commissionPlanSchema, type CommissionPlan, type CommissionLevel } from '@/lib/validations/commissionSchema'

// Validar e carregar plano
const plan: CommissionPlan = commissionPlanSchema.parse(commissionPlan)

export interface CommissionCalculationParams {
  creditBRL: number
  productId: string
  levelId: string
  hasPartner: boolean
  hasLeader: boolean
}

export interface CommissionResult {
  totalCommission: number
  sellerCommission: number
  leaderCommission: number
  partnerCommission: number
  override?: number
  bonus?: number
  metaBonus?: number
  breakdown: {
    baseCommission: number
    productMultiplier: number
    levelBonus?: number
    overrideAmount?: number
    metaBonusAmount?: number
  }
}

/**
 * Calcular comissão baseada no plano
 */
export function calculateCommission(params: CommissionCalculationParams): CommissionResult {
  const { creditBRL, productId, levelId, hasPartner, hasLeader } = params

  // Buscar nível
  const level = plan.levels.find(l => l.id === levelId)
  if (!level) {
    throw new Error(`Nível não encontrado: ${levelId}`)
  }

  // Buscar produto
  const product = plan.products.find(p => p.id === productId)
  const productMultiplier = product?.commissionMultiplier || 1.0

  // Calcular comissão base
  let baseCommission = 0
  if (plan.defaults.baseCommissionType === 'percentOfCredit') {
    baseCommission = creditBRL * (plan.defaults.baseCommissionValue / 100)
  } else {
    baseCommission = plan.defaults.baseCommissionValue
  }

  // Aplicar multiplicador do produto
  const totalCommission = baseCommission * productMultiplier

  // Calcular split
  let sellerPercent = level.split.seller
  let leaderPercent = level.split.leader
  let partnerPercent = level.split.partner || 0

  // Redistribuir se não houver parceiro
  if (!hasPartner && partnerPercent > 0) {
    const total = sellerPercent + leaderPercent + partnerPercent
    sellerPercent = (sellerPercent / total) * 100
    leaderPercent = (leaderPercent / total) * 100
    partnerPercent = 0
  }

  // Redistribuir se não houver líder
  if (!hasLeader && leaderPercent > 0) {
    sellerPercent += leaderPercent
    leaderPercent = 0
  }

  // Calcular comissões
  const sellerCommission = totalCommission * (sellerPercent / 100)
  const leaderCommission = hasLeader ? totalCommission * (leaderPercent / 100) : 0
  const partnerCommission = hasPartner ? totalCommission * (partnerPercent / 100) : 0

  // Calcular bônus do nível
  let levelBonus = 0
  if (level.bonus.type === 'fixed') {
    levelBonus = level.bonus.valueBRL || 0
  } else if (level.bonus.type === 'percentOfCommission') {
    levelBonus = totalCommission * ((level.bonus.value || 0) / 100)
  }

  // Calcular override (se for líder/gerente/diretor)
  let override = 0
  if (level.override && hasLeader) {
    if (level.override.type === 'percentOfCredit') {
      override = creditBRL * (level.override.value / 100)
    }
  }

  // Calcular bônus de meta (baseado no crédito)
  let metaBonus = 0
  const sortedMetaBonuses = [...plan.metaBonuses].sort((a, b) => b.thresholdMonthlyCreditBRL - a.thresholdMonthlyCreditBRL)
  for (const meta of sortedMetaBonuses) {
    if (creditBRL >= meta.thresholdMonthlyCreditBRL) {
      metaBonus = meta.bonusBRL
      break
    }
  }

  return {
    totalCommission: totalCommission + levelBonus + override + metaBonus,
    sellerCommission,
    leaderCommission,
    partnerCommission,
    override: override > 0 ? override : undefined,
    bonus: levelBonus > 0 ? levelBonus : undefined,
    metaBonus: metaBonus > 0 ? metaBonus : undefined,
    breakdown: {
      baseCommission,
      productMultiplier,
      levelBonus: levelBonus > 0 ? levelBonus : undefined,
      overrideAmount: override > 0 ? override : undefined,
      metaBonusAmount: metaBonus > 0 ? metaBonus : undefined,
    },
  }
}

/**
 * Obter todos os níveis
 */
export function getLevels(): CommissionLevel[] {
  return plan.levels
}

/**
 * Obter plano completo
 */
export function getPlan(): CommissionPlan {
  return plan
}

/**
 * Obter nível por ID
 */
export function getLevelById(levelId: string): CommissionLevel | undefined {
  return plan.levels.find(l => l.id === levelId)
}

/**
 * Calcular bônus de meta acumulados
 */
export function calculateMetaBonuses(totalCreditBRL: number): number {
  let totalBonus = 0
  const sortedMetaBonuses = [...plan.metaBonuses].sort((a, b) => a.thresholdMonthlyCreditBRL - b.thresholdMonthlyCreditBRL)
  
  for (const meta of sortedMetaBonuses) {
    if (totalCreditBRL >= meta.thresholdMonthlyCreditBRL) {
      totalBonus += meta.bonusBRL
    }
  }

  return totalBonus
}
