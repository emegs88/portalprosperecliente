'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Target, History, TrendingUp } from 'lucide-react'
import { loadSession } from '@/lib/simulador/sorteio/storage'
import { SessionStats as StatsType } from '@/types/simulador/sorteio'

export function SessionStats() {
  const [stats, setStats] = useState<StatsType | null>(null)

  useEffect(() => {
    const session = loadSession()
    if (session) {
      setStats(session.stats)
    }
  }, [])

  if (!stats) {
    return null
  }

  return (
    <Card className="bg-gray-800 border-gray-700 sticky top-4">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Estatísticas da Sessão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tentativas */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Tentativas</span>
          <Badge variant="secondary" className="text-white">
            {stats.totalDraws}
          </Badge>
        </div>

        {/* Melhor Resultado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-400">Melhor Resultado</span>
          </div>
          <Badge className="bg-yellow-500 text-white">
            {stats.bestResult} acertos
          </Badge>
        </div>

        {/* Último Sorteio */}
        {stats.lastDraw && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-gray-400">Último Sorteio</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {stats.lastDraw.map((num, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-medium"
                >
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Histórico */}
        {stats.history.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm font-medium">Histórico</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.history.slice(-10).reverse().map((entry, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-gray-700/50 rounded text-xs space-y-1"
                >
                  <div className="text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString('pt-BR')}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {entry.drawn.map((num, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium"
                      >
                        {num.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                  <div className="text-gray-300">
                    Melhor: {Math.max(...entry.results.map(r => r.matches))} acertos
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
