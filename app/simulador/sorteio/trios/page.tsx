'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TrioBuilder } from '@/components/simulador/sorteio/TrioBuilder'
import { QuickNav } from '@/components/navigation/QuickNav'
import { loadSession, saveSession } from '@/lib/simulador/sorteio/storage'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import { allTriosComplete } from '@/lib/simulador/sorteio/validation'
import { Trio } from '@/types/simulador/sorteio'

export default function TriosPage() {
  const router = useRouter()
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [trios, setTrios] = useState<Trio[]>([])
  const [config, setConfig] = useState(loadConfig())

  useEffect(() => {
    const session = loadSession()
    if (session) {
      setSelectedNumbers(session.selectedNumbers)
      setTrios(session.trios || [])
    }
    setConfig(loadConfig())
  }, [])

  const handleTriosChange = (newTrios: Trio[]) => {
    setTrios(newTrios)
    const session = loadSession()
    if (session) {
      saveSession({ ...session, trios: newTrios })
    }
  }

  const handleContinue = () => {
    const triosNumbers = trios.map(t => t.numbers)
    if (trios.length === 0 || !allTriosComplete(triosNumbers, config.trio.size)) {
      return
    }

    router.push('/simulador/sorteio/sorteio')
  }

  const triosNumbers = trios.map(t => t.numbers)
  const canContinue = trios.length >= config.trio.minTrios && 
    allTriosComplete(triosNumbers, config.trio.size)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Monte seus Trios
        </h1>
        <p className="text-gray-400">
          Arraste números para montar seus trios da sorte
        </p>
      </div>

        <TrioBuilder
          selectedNumbers={selectedNumbers}
          trios={trios}
          onTriosChange={handleTriosChange}
        />

      <QuickNav
        onNext={canContinue ? handleContinue : undefined}
        nextLabel="Avançar para Sorteio"
        backLabel="Voltar à Seleção"
        showHome={true}
      />
    </div>
  )
}
