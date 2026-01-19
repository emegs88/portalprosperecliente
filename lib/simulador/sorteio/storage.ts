import { Session, DrawHistory, SessionStats } from '@/types/simulador/sorteio'

const SESSION_STORAGE_KEY = 'prospere_draw_sim_session'

/**
 * Salvar sessão no LocalStorage
 */
export function saveSession(session: Session): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('Error saving session:', error)
  }
}

/**
 * Carregar sessão do LocalStorage
 */
export function loadSession(): Session | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) {
      return null
    }

    return JSON.parse(stored) as Session
  } catch (error) {
    console.error('Error loading session:', error)
    return null
  }
}

/**
 * Limpar sessão
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(SESSION_STORAGE_KEY)
}

/**
 * Inicializar sessão vazia
 */
export function initSession(mode?: 'rapido' | 'completo' | 'sala'): Session {
  return {
    selectedNumbers: [],
    trios: [],
    history: [],
    stats: {
      totalDraws: 0,
      bestResult: 0,
      lastDraw: null,
      history: [],
    },
    mode,
  }
}

/**
 * Adicionar resultado ao histórico
 */
export function addToHistory(
  session: Session,
  drawn: number[],
  results: Array<{ trioId: string; trio: number[]; matches: number; matchedNumbers: number[]; isWinner: boolean }>
): Session {
  const newHistory: DrawHistory = {
    timestamp: Date.now(),
    drawn,
    results,
  }

  const bestResult = Math.max(
    session.stats.bestResult,
    ...results.map(r => r.matches)
  )

  return {
    ...session,
    history: [...session.history, newHistory].slice(-10), // Manter apenas últimos 10
    stats: {
      totalDraws: session.stats.totalDraws + 1,
      bestResult,
      lastDraw: drawn,
      history: [...session.stats.history, newHistory].slice(-10),
    },
  }
}
