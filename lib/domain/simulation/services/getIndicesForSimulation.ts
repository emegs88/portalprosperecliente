/**
 * Helper para obter índices para simulação (servidor)
 * Adaptado para uso no backend (sem localStorage)
 */

export interface IndicesForSimulation {
  incc: number[]
  cdi: number[]
  poupanca: number[]
}

/**
 * Obter índices para simulação (máximo de meses necessário)
 * Por enquanto usa valores simulados, depois integrar com API real
 */
export async function getIndicesForSimulation(months: number): Promise<IndicesForSimulation> {
  // Máximo de 120 meses
  const maxMonths = Math.min(months, 120)
  
  // Valores simulados (média histórica)
  // TODO: Integrar com API real do Banco Central/IBGE
  const incc = Array.from({ length: maxMonths }, () => {
    // INCC mensal varia entre 0.3% e 0.8% ao mês
    return 0.3 + Math.random() * 0.5
  })

  const cdi = Array.from({ length: maxMonths }, () => {
    // CDI mensal varia entre 0.8% e 1.2% ao mês
    return 0.8 + Math.random() * 0.4
  })

  const poupanca = Array.from({ length: maxMonths }, () => {
    // Poupança mensal varia entre 0.4% e 0.5% ao mês
    return 0.4 + Math.random() * 0.1
  })

  return { incc, cdi, poupanca }
}
