'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadConfig } from '@/lib/simulador/sorteio/config'

interface NumberGridProps {
  selected: number[]
  onSelect: (number: number) => void
  onDeselect: (number: number) => void
  onSelectAll?: () => void
  onClear?: () => void
}

export function NumberGrid({ selected, onSelect, onDeselect, onSelectAll, onClear }: NumberGridProps) {
  const [search, setSearch] = useState('')
  const [config, setConfig] = useState(loadConfig())

  useEffect(() => {
    setConfig(loadConfig())
  }, [])

  const numbers = useMemo(() => {
    const arr: number[] = []
    for (let i = config.range.min; i <= config.range.max; i++) {
      arr.push(i)
    }
    return arr
  }, [config.range])

  const filteredNumbers = useMemo(() => {
    if (!search) return numbers

    const searchNum = parseInt(search)
    if (isNaN(searchNum)) return numbers

    return numbers.filter(n => {
      const str = n.toString().padStart(2, '0')
      return str.includes(search)
    })
  }, [numbers, search])

  const isSelected = (num: number) => selected.includes(num)
  const isMaxSelected = selected.length >= config.selection.maxSelected

  const handleToggle = (num: number) => {
    if (isSelected(num)) {
      onDeselect(num)
    } else {
      if (!isMaxSelected) {
        onSelect(num)
      }
    }
  }

  const handleRandom = () => {
    const available = numbers.filter(n => !selected.includes(n))
    const needed = config.selection.maxSelected - selected.length
    
    if (needed <= 0 || available.length === 0) return

    const toSelect = Math.min(needed, available.length)
    const shuffled = [...available].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < toSelect; i++) {
      onSelect(shuffled[i])
    }
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      {config.selection.enableSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar número (ex: 07)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Buscar número"
          />
        </div>
      )}

      {/* Ações rápidas */}
      <div className="flex gap-2 flex-wrap">
        {onSelectAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRandom}
            disabled={isMaxSelected}
          >
            Selecionar aleatório
          </Button>
        )}
        {onClear && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-10 sm:grid-cols-10 gap-2">
        {filteredNumbers.map((num) => {
          const selected_ = isSelected(num)
          const highlighted = search && num.toString().padStart(2, '0').includes(search)

          return (
            <button
              key={num}
              onClick={() => handleToggle(num)}
              disabled={!selected_ && isMaxSelected}
              className={cn(
                "w-full aspect-square rounded-lg border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                selected_
                  ? "bg-blue-600 border-blue-500 text-white font-bold"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600",
                highlighted && !selected_ && "ring-2 ring-yellow-500 ring-offset-2 ring-offset-gray-900"
              )}
              aria-label={`Número ${num.toString().padStart(2, '0')}${selected_ ? ' selecionado' : ''}`}
              aria-pressed={selected_}
            >
              {num.toString().padStart(2, '0')}
            </button>
          )
        })}
      </div>

      {/* Contador */}
      <div className="text-sm text-gray-400 text-center">
        Selecionados: {selected.length} / {config.selection.maxSelected}
        {selected.length >= config.selection.maxSelected && (
          <span className="text-yellow-500 ml-2">(Máximo atingido)</span>
        )}
      </div>
    </div>
  )
}
