/**
 * Gerador de números aleatórios simples (seed opcional)
 */
class SimpleRNG {
  private seed: number

  constructor(seed?: number) {
    this.seed = seed || Date.now()
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

/**
 * Sortear números únicos
 */
export function drawNumbers(
  count: number,
  min: number,
  max: number,
  exclude: number[] = [],
  seed?: number
): number[] {
  if (count <= 0 || min > max) {
    return []
  }

  const available = Array.from({ length: max - min + 1 }, (_, i) => i + min)
    .filter(n => !exclude.includes(n))

  if (available.length < count) {
    throw new Error(`Não há números suficientes disponíveis (necessário: ${count}, disponível: ${available.length})`)
  }

  const rng = seed ? new SimpleRNG(seed) : null
  const drawn: number[] = []

  while (drawn.length < count && available.length > 0) {
    const index = rng
      ? Math.floor(rng.next() * available.length)
      : Math.floor(Math.random() * available.length)
    
    drawn.push(available[index])
    available.splice(index, 1)
  }

  return drawn.sort((a, b) => a - b)
}

/**
 * Gerar seed a partir de timestamp
 */
export function generateSeed(): number {
  return Date.now()
}

/**
 * Validar range de números
 */
export function validateRange(min: number, max: number): boolean {
  return min >= 0 && max > min && max <= 999
}
