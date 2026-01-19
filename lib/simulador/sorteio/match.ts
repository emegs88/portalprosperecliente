import { MatchResult } from '@/types/simulador/sorteio'

/**
 * Calcular acertos de um trio
 */
export function calculateMatches(
  trio: number[],
  drawn: number[]
): number {
  return trio.filter(n => drawn.includes(n)).length
}

/**
 * Comparar trios com números sorteados
 */
export function compareTrios(
  trios: Array<{ id: string; numbers: number[] }>,
  drawn: number[]
): MatchResult[] {
  return trios.map(trio => {
    const matches = calculateMatches(trio.numbers, drawn)
    const matchedNumbers = trio.numbers.filter(n => drawn.includes(n))

    return {
      trioId: trio.id,
      trio: trio.numbers,
      matches,
      matchedNumbers,
      isWinner: matches === trio.numbers.length,
    }
  })
}

/**
 * Encontrar trios ganhadores
 */
export function findWinners(
  results: MatchResult[],
  requiredMatches: number
): MatchResult[] {
  return results.filter(r => r.matches >= requiredMatches)
}
