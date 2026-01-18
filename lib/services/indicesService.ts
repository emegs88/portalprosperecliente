/**
 * Serviço para buscar índices financeiros (CDI, INCC, Poupança)
 * Com cache e fallback manual
 */

export interface IndicesCache {
  cdi: {
    monthly: number[]
    lastUpdate: number
  }
  incc: {
    monthly: number[]
    lastUpdate: number
  }
  poupanca: {
    monthly: number[]
    lastUpdate: number
  }
}

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Buscar CDI mensal (últimos 120 meses)
 * Fonte: Banco Central - API SGS
 */
export async function fetchCDI(period: 'monthly' | 'annual' = 'monthly'): Promise<number[]> {
  try {
    // TODO: Implementar chamada real à API do Banco Central
    // Por enquanto, retorna valores simulados baseados em média histórica
    const cacheKey = `cdi_${period}`
    const cached = getCachedIndices(cacheKey)
    if (cached) return cached

    // Simulação - valores médios mensais do CDI (últimos anos)
    const cdiValues = Array.from({ length: 120 }, () => {
      // CDI mensal varia entre 0.8% e 1.2% ao mês
      return 0.8 + Math.random() * 0.4
    })

    setCachedIndices(cacheKey, cdiValues)
    return cdiValues
  } catch (error) {
    console.error('Erro ao buscar CDI:', error)
    // Fallback: retorna média histórica
    return Array(120).fill(1.0) // 1% ao mês
  }
}

/**
 * Buscar INCC mensal (últimos 120 meses)
 * Fonte: IBGE - API de Índices
 */
export async function fetchINCC(period: 'monthly' = 'monthly'): Promise<number[]> {
  try {
    const cacheKey = `incc_${period}`
    const cached = getCachedIndices(cacheKey)
    if (cached) return cached

    // Simulação - valores médios mensais do INCC (últimos anos)
    const inccValues = Array.from({ length: 120 }, () => {
      // INCC mensal varia entre 0.3% e 0.8% ao mês
      return 0.3 + Math.random() * 0.5
    })

    setCachedIndices(cacheKey, inccValues)
    return inccValues
  } catch (error) {
    console.error('Erro ao buscar INCC:', error)
    // Fallback: retorna média histórica
    return Array(120).fill(0.5) // 0.5% ao mês
  }
}

/**
 * Buscar Poupança mensal (últimos 120 meses)
 * Poupança = 70% da Selic (com teto de 0.5% ao mês)
 */
export async function fetchPoupanca(period: 'monthly' | 'annual' = 'monthly'): Promise<number[]> {
  try {
    const cacheKey = `poupanca_${period}`
    const cached = getCachedIndices(cacheKey)
    if (cached) return cached

    // Buscar Selic e calcular Poupança
    // Por enquanto, simulação
    const poupancaValues = Array.from({ length: 120 }, () => {
      // Poupança mensal varia entre 0.4% e 0.5% ao mês
      return 0.4 + Math.random() * 0.1
    })

    setCachedIndices(cacheKey, poupancaValues)
    return poupancaValues
  } catch (error) {
    console.error('Erro ao buscar Poupança:', error)
    // Fallback: retorna média histórica
    return Array(120).fill(0.45) // 0.45% ao mês
  }
}

/**
 * Cache helpers (localStorage)
 */
function getCachedIndices(key: string): number[] | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(`indices_${key}`)
    if (!cached) return null
    
    const data = JSON.parse(cached)
    const now = Date.now()
    
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`indices_${key}`)
      return null
    }
    
    return data.values
  } catch {
    return null
  }
}

function setCachedIndices(key: string, values: number[]): void {
  if (typeof window === 'undefined') return
  
  try {
    const data = {
      values,
      timestamp: Date.now(),
    }
    localStorage.setItem(`indices_${key}`, JSON.stringify(data))
  } catch {
    // Ignorar erros de localStorage
  }
}

/**
 * Limpar cache
 */
export function clearIndicesCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('indices_')) {
        localStorage.removeItem(key)
      }
    })
  } catch {
    // Ignorar erros
  }
}
