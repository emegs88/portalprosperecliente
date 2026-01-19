'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SelectedChipsProps {
  numbers: number[]
  onRemove: (number: number) => void
  onClear?: () => void
  maxDisplay?: number
}

export function SelectedChips({ numbers, onRemove, onClear, maxDisplay = 20 }: SelectedChipsProps) {
  const displayNumbers = numbers.slice(0, maxDisplay)
  const remaining = numbers.length - maxDisplay

  if (numbers.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">
          Números Selecionados ({numbers.length})
        </h3>
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs"
          >
            Limpar todos
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayNumbers.map((num) => (
          <div
            key={num}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1 rounded-full",
              "bg-blue-600 text-white text-sm font-medium",
              "focus-within:ring-2 focus-within:ring-blue-500"
            )}
          >
            <span>{num.toString().padStart(2, '0')}</span>
            <button
              onClick={() => onRemove(num)}
              className="ml-1 hover:bg-blue-700 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={`Remover número ${num.toString().padStart(2, '0')}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm">
            +{remaining} mais
          </div>
        )}
      </div>
    </div>
  )
}
