'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TrioBuilder } from '@/components/simulador/sorteio/TrioBuilder'
import { Disclaimer } from '@/components/simulador/sorteio/Disclaimer'
import { ArrowRight, ArrowLeft } from 'lucide-react'
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
    if (trios.length === 0 || !allTriosComplete(trios, config.trio.size)) {
      return
    }

    router.push('/simulador/sorteio/sorteio')
  }

  const canContinue = trios.length >= config.trio.minTrios && 
    allTriosComplete(trios, config.trio.size)

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Monte seus Trios
            </h1>
            <p className="text-gray-400 mt-2">
              Arraste números para montar seus trios da sorte
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/simulador/sorteio/selecao')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Disclaimer />

        <TrioBuilder
          selectedNumbers={selectedNumbers}
          trios={trios}
          onTriosChange={handleTriosChange}
        />

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/simulador/sorteio/selecao')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Avançar para Sorteio
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
