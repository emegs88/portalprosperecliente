'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResultPanel } from '@/components/simulador/sorteio/ResultPanel'
import { SessionStats } from '@/components/simulador/sorteio/SessionStats'
import { QuickNav } from '@/components/navigation/QuickNav'
import { loadSession } from '@/lib/simulador/sorteio/storage'
import { MatchResult } from '@/types/simulador/sorteio'

export default function ResultadoPage() {
  const router = useRouter()
  const [drawn, setDrawn] = useState<number[]>([])
  const [results, setResults] = useState<MatchResult[]>([])

  useEffect(() => {
    const session = loadSession()
    if (!session || !session.stats.lastDraw) {
      router.push('/simulador/sorteio/configuracao')
      return
    }

    const lastHistory = session.history[session.history.length - 1]
    if (lastHistory) {
      setDrawn(lastHistory.drawn)
      setResults(lastHistory.results)
    } else {
      // Fallback: usar stats
      setDrawn(session.stats.lastDraw)
      // Tentar reconstruir results do último histórico
      const lastDrawHistory = session.stats.history[session.stats.history.length - 1]
      if (lastDrawHistory) {
        setResults(lastDrawHistory.results)
      }
    }
  }, [router])

  const handleSimulateAgain = () => {
    router.push('/simulador/sorteio/selecao')
  }

  if (drawn.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Resultado do Sorteio
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resultado Principal */}
        <div className="lg:col-span-2">
          <ResultPanel
            drawn={drawn}
            results={results}
            onSimulateAgain={handleSimulateAgain}
          />
        </div>

        {/* Estatísticas */}
        <div className="lg:col-span-1">
          <SessionStats />
        </div>
      </div>

      <QuickNav
        onNext={handleSimulateAgain}
        nextLabel="Simular Novamente"
        backLabel="Ver Histórico"
        showHome={true}
      />
    </div>
  )
}
