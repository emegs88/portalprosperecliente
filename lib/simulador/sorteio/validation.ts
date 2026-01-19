/**
 * Validar trio completo
 */
export function isValidTrio(
  trio: number[],
  requiredSize: number
): boolean {
  if (trio.length !== requiredSize) {
    return false
  }

  // Verificar duplicatas
  const unique = new Set(trio)
  return unique.size === requiredSize
}

/**
 * Validar seleção de números
 */
export function isValidSelection(
  selected: number[],
  maxSelected: number
): boolean {
  if (selected.length > maxSelected) {
    return false
  }

  // Verificar duplicatas
  const unique = new Set(selected)
  return unique.size === selected.length
}

/**
 * Validar que não há duplicatas entre trios
 */
export function hasDuplicatesAcrossTrios(trios: number[][]): boolean {
  const allNumbers: number[] = []
  
  for (const trio of trios) {
    for (const num of trio) {
      if (allNumbers.includes(num)) {
        return true
      }
      allNumbers.push(num)
    }
  }

  return false
}

/**
 * Validar que não há duplicatas em um trio
 */
export function hasDuplicatesInTrio(trio: number[]): boolean {
  const unique = new Set(trio)
  return unique.size !== trio.length
}

/**
 * Verificar se todos os trios estão completos
 */
export function allTriosComplete(
  trios: number[][],
  requiredSize: number
): boolean {
  return trios.every(trio => isValidTrio(trio, requiredSize))
}
