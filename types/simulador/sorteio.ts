export interface SimulationMode {
  id: 'rapido' | 'completo' | 'sala'
  name: string
  description: string
  enabled: boolean
}

export interface SelectedNumber {
  value: number
  selected: boolean
  inTrio: boolean
}

export interface Trio {
  id: string
  numbers: number[]
  isComplete: boolean
  matches?: number
}

export interface DrawResult {
  drawn: number[]
  timestamp: number
  seed?: number
}

export interface MatchResult {
  trioId: string
  trio: number[]
  matches: number
  matchedNumbers: number[]
  isWinner: boolean
}

export interface DrawHistory {
  timestamp: number
  drawn: number[]
  results: MatchResult[]
}

export interface SessionStats {
  totalDraws: number
  bestResult: number
  lastDraw: number[] | null
  history: DrawHistory[]
}

export interface Session {
  selectedNumbers: number[]
  trios: Trio[]
  history: DrawHistory[]
  stats: SessionStats
  mode?: 'rapido' | 'completo' | 'sala'
}
