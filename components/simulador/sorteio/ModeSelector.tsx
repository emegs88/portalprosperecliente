'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Zap, Target, Users } from 'lucide-react'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import { useEffect, useState } from 'react'

interface ModeSelectorProps {
  selected?: 'rapido' | 'completo' | 'sala'
  onSelect: (mode: 'rapido' | 'completo' | 'sala') => void
}

export function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  const [config, setConfig] = useState(loadConfig())

  useEffect(() => {
    setConfig(loadConfig())
  }, [])

  const modes = [
    {
      id: 'rapido' as const,
      name: 'Rápido',
      description: '1 trio, 1 sorteio. Perfeito para testar rapidamente.',
      icon: Zap,
      enabled: config.modes.rapido.enabled,
    },
    {
      id: 'completo' as const,
      name: 'Completo',
      description: 'Múltiplos trios, histórico completo e estatísticas.',
      icon: Target,
      enabled: config.modes.completo.enabled,
    },
    {
      id: 'sala' as const,
      name: 'Sala Prospere',
      description: 'Modo evento: tela grande, ranking local e experiência premium.',
      icon: Users,
      enabled: config.modes.sala.enabled,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {modes
        .filter(m => m.enabled)
        .map((mode) => {
          const Icon = mode.icon
          const isSelected = selected === mode.id

          return (
            <Card
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className={cn(
                "cursor-pointer transition-all hover:border-blue-500",
                isSelected && "border-blue-500 bg-blue-500/10"
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(mode.id)
                }
              }}
              aria-pressed={isSelected}
              aria-label={`Selecionar modo ${mode.name}`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "w-6 h-6",
                    isSelected ? "text-blue-500" : "text-gray-400"
                  )} />
                  <CardTitle className={cn(
                    "text-lg",
                    isSelected ? "text-white" : "text-gray-300"
                  )}>
                    {mode.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400">
                  {mode.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}
