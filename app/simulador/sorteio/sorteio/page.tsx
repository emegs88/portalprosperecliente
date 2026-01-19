'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DrawMachine } from '@/components/simulador/sorteio/DrawMachine'
import { QuickNav } from '@/components/navigation/QuickNav'
import { loadSession, saveSession } from '@/lib/simulador/sorteio/storage'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import { addToHistory } from '@/lib/simulador/sorteio/storage'
import { compareTrios } from '@/lib/simulador/sorteio/match'
import { Trio } from '@/types/simulador/sorteio'

export default function SorteioPage() {
  const router = useRouter()
  const [trios, setTrios] = useState<Trio[]>([])
  const [config, setConfig] = useState(loadConfig())

  useEffect(() => {
    const session = loadSession()
    if (session) {
      setTrios(session.trios || [])
    }
    setConfig(loadConfig())
  }, [])

  const handleDrawComplete = (drawn: number[], seed: number) => {
    const session = loadSession()
    if (!session) {
      router.push('/simulador/sorteio/configuracao')
      return
    }

    // Comparar trios com números sorteados
    const results = compareTrios(
      trios.map(t => ({ id: t.id, numbers: t.numbers })),
      drawn
    )

    // Atualizar trios com matches
    const updatedTrios = trios.map(t => {
      const result = results.find(r => r.trioId === t.id)
      return {
        ...t,
        matches: result?.matches || 0,
      }
    })

    // Adicionar ao histórico
    const updatedSession = addToHistory(session, drawn, results)

    // Salvar sessão
    saveSession({ ...updatedSession, trios: updatedTrios })

    // Navegar para resultado
    router.push('/simulador/sorteio/resultado')
  }

  if (trios.length === 0) {
    router.push('/simulador/sorteio/trios')
    return null
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Máquina de Sorteio
        </h1>
        <p className="text-gray-400">
          Clique em "Iniciar Sorteio" para sortear {config.draw.count} número{config.draw.count !== 1 ? 's' : ''}
        </p>
      </div>

      <DrawMachine
        onComplete={handleDrawComplete}
        count={config.draw.count}
        min={config.range.min}
        max={config.range.max}
      />

      <QuickNav
        backLabel="Voltar aos Trios"
        showHome={true}
      />
    </div>
  )
}
