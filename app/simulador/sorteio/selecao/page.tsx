'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NumberGrid } from '@/components/simulador/sorteio/NumberGrid'
import { SelectedChips } from '@/components/simulador/sorteio/SelectedChips'
import { QuickNav } from '@/components/navigation/QuickNav'
import { loadSession, saveSession } from '@/lib/simulador/sorteio/storage'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import { isValidSelection } from '@/lib/simulador/sorteio/validation'

export default function SelecaoPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<number[]>([])
  const [config, setConfig] = useState(loadConfig())

  useEffect(() => {
    const session = loadSession()
    if (session) {
      setSelected(session.selectedNumbers)
    }
    setConfig(loadConfig())
  }, [])

  const handleSelect = (num: number) => {
    const newSelected = [...selected, num]
    if (isValidSelection(newSelected, config.selection.maxSelected)) {
      setSelected(newSelected)
      updateSession(newSelected)
    }
  }

  const handleDeselect = (num: number) => {
    const newSelected = selected.filter(n => n !== num)
    setSelected(newSelected)
    updateSession(newSelected)
  }

  const handleClear = () => {
    setSelected([])
    updateSession([])
  }

  const handleSelectRandom = () => {
    const available: number[] = []
    for (let i = config.range.min; i <= config.range.max; i++) {
      if (!selected.includes(i)) {
        available.push(i)
      }
    }

    const needed = config.selection.maxSelected - selected.length
    if (needed <= 0 || available.length === 0) return

    const toSelect = Math.min(needed, available.length)
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    const newSelected = [...selected, ...shuffled.slice(0, toSelect)]
    
    setSelected(newSelected)
    updateSession(newSelected)
  }

  const updateSession = (numbers: number[]) => {
    const session = loadSession()
    if (session) {
      saveSession({ ...session, selectedNumbers: numbers })
    }
  }

  const handleContinue = () => {
    if (selected.length === 0) return
    router.push('/simulador/sorteio/trios')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Seleção de Números
        </h1>
        <p className="text-gray-400">
          Selecione os números que deseja usar nos seus trios
        </p>
      </div>

        <SelectedChips
          numbers={selected}
          onRemove={handleDeselect}
          onClear={handleClear}
        />

        <NumberGrid
          selected={selected}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
          onSelectAll={handleSelectRandom}
          onClear={handleClear}
        />

      <QuickNav
        onNext={handleContinue}
        nextLabel="Avançar para Trios"
        backLabel="Voltar à Configuração"
        showHome={true}
      />
    </div>
  )
}
