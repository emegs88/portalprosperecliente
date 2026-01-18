/**
 * Serviço do Clube de Benefícios Prospere
 */

import clubLevelsConfig from '@/config/clubLevels.json'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

export interface ClubLevelConfig {
  id: string
  name: string
  displayName: string
  minCreditBRL: number
  maxCreditBRL: number | null
  color: string
  description?: string
  benefits: string[]
}

export interface UserClubStatus {
  currentLevel: ClubLevelConfig
  nextLevel: ClubLevelConfig | null
  currentCredit: number
  progressToNext: number // 0-100
  creditToNext: number
  benefits: string[]
}

/**
 * Obter nível baseado no crédito total
 */
export function getClubLevelByCredit(totalCredit: number): ClubLevelConfig {
  const levels: ClubLevelConfig[] = clubLevelsConfig.levels
  
  // Ordenar do maior para o menor
  const sortedLevels = [...levels].sort((a, b) => (b.minCreditBRL || 0) - (a.minCreditBRL || 0))
  
  for (const level of sortedLevels) {
    if (totalCredit >= level.minCreditBRL) {
      if (level.maxCreditBRL === null || totalCredit < level.maxCreditBRL) {
        return level
      }
    }
  }
  
  // Se não encontrou, retorna o primeiro nível (Bronze)
  return levels[0]
}

/**
 * Obter próximo nível
 */
export function getNextClubLevel(currentLevelId: string): ClubLevelConfig | null {
  const levels: ClubLevelConfig[] = clubLevelsConfig.levels
  const currentIndex = levels.findIndex(l => l.id === currentLevelId)
  
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return null
  }
  
  return levels[currentIndex + 1]
}

/**
 * Calcular progresso para próximo nível
 */
export function calculateProgressToNext(
  currentCredit: number,
  currentLevel: ClubLevelConfig,
  nextLevel: ClubLevelConfig | null
): { progress: number; creditToNext: number } {
  if (!nextLevel) {
    return { progress: 100, creditToNext: 0 }
  }
  
  const range = nextLevel.minCreditBRL - currentLevel.minCreditBRL
  const progress = currentCredit - currentLevel.minCreditBRL
  const progressPercent = Math.min(100, Math.max(0, (progress / range) * 100))
  const creditToNext = Math.max(0, nextLevel.minCreditBRL - currentCredit)
  
  return {
    progress: progressPercent,
    creditToNext,
  }
}

/**
 * Obter status do clube para um usuário
 */
export async function getUserClubStatus(userId: string): Promise<UserClubStatus> {
  // Buscar todas as cotas do usuário
  const quotas = await prisma.quota.findMany({
    where: { userId },
  })
  
  // Calcular crédito total (baseado na regra de elegibilidade)
  const totalCredit = quotas.reduce((sum, q) => sum + q.vlBem, 0)
  
  // Obter nível atual
  const currentLevel = getClubLevelByCredit(totalCredit)
  const nextLevel = getNextClubLevel(currentLevel.id)
  
  // Calcular progresso
  const { progress: progressToNext, creditToNext } = calculateProgressToNext(
    totalCredit,
    currentLevel,
    nextLevel
  )
  
  // Consolidar benefícios (todos os níveis até o atual)
  const allBenefits = new Set<string>()
  const levels: ClubLevelConfig[] = clubLevelsConfig.levels
  const currentIndex = levels.findIndex(l => l.id === currentLevel.id)
  
  for (let i = 0; i <= currentIndex; i++) {
    levels[i].benefits.forEach(benefit => allBenefits.add(benefit))
  }
  
  return {
    currentLevel,
    nextLevel,
    currentCredit: totalCredit,
    progressToNext,
    creditToNext,
    benefits: Array.from(allBenefits),
  }
}

/**
 * Verificar elegibilidade para uma experiência
 */
export async function checkEligibility(
  userId: string,
  experienceId: string
): Promise<{ eligible: boolean; reason?: string; currentLevel: ClubLevelConfig }> {
  const status = await getUserClubStatus(userId)
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId },
    include: { clubLevel: true },
  })
  
  if (!experience) {
    return {
      eligible: false,
      reason: 'Experiência não encontrada',
      currentLevel: status.currentLevel,
    }
  }
  
  if (!experience.clubLevel) {
    return {
      eligible: true,
      currentLevel: status.currentLevel,
    }
  }
  
  // Verificar se o nível do usuário é suficiente
  const requiredLevel = getClubLevelByCredit(experience.clubLevel.minCreditBRL)
  const userLevel = status.currentLevel
  
  const levels: ClubLevelConfig[] = clubLevelsConfig.levels
  const requiredIndex = levels.findIndex(l => l.id === requiredLevel.id)
  const userIndex = levels.findIndex(l => l.id === userLevel.id)
  
  if (userIndex >= requiredIndex) {
    return {
      eligible: true,
      currentLevel: status.currentLevel,
    }
  }
  
  return {
    eligible: false,
    reason: `Nível ${requiredLevel.displayName} necessário. Seu nível atual: ${userLevel.displayName}`,
    currentLevel: status.currentLevel,
  }
}

/**
 * Obter todas as experiências disponíveis para um usuário
 */
export async function getAvailableExperiences(userId: string) {
  const status = await getUserClubStatus(userId)
  const experiences = await prisma.experience.findMany({
    where: {
      status: 'active',
      OR: [
        { clubLevelId: null },
        {
          clubLevel: {
            minCreditBRL: { lte: status.currentCredit },
          },
        },
      ],
    },
    include: {
      clubLevel: true,
      _count: {
        select: { reservations: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  // Adicionar informação de elegibilidade
  return experiences.map(exp => {
    const eligible = !exp.clubLevel || 
      status.currentCredit >= exp.clubLevel.minCreditBRL
    
    return {
      ...exp,
      eligible,
      availableSlots: exp.maxGuests 
        ? Math.max(0, exp.maxGuests - (exp._count.reservations || 0))
        : null,
    }
  })
}
