'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, GripVertical, Plus, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import { isValidTrio, hasDuplicatesInTrio } from '@/lib/simulador/sorteio/validation'
import { Trio } from '@/types/simulador/sorteio'

interface TrioBuilderProps {
  selectedNumbers: number[]
  trios: Trio[]
  onTriosChange: (trios: Trio[]) => void
}

function SortableTrioCard({ trio, onUpdate, onRemove, config }: {
  trio: Trio
  onUpdate: (trio: Trio) => void
  onRemove: () => void
  config: any
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `sortable-${trio.id}` })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `dropzone-${trio.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isComplete = isValidTrio(trio.numbers, config.trio.size)
  const hasDupes = hasDuplicatesInTrio(trio.numbers)

  return (
    <div ref={(node) => { setNodeRef(node); setDropRef(node) }} style={style} className="touch-none">
      <Card className={cn(
        "bg-gray-800 border-gray-700",
        isComplete && !hasDupes && "border-green-500 bg-green-500/10",
        hasDupes && "border-red-500 bg-red-500/10",
        isOver && "border-blue-500 bg-blue-500/20"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300"
                aria-label="Reordenar trio"
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <CardTitle className="text-white text-lg">
                Trio {trio.id.split('-')[1] || ''}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isComplete && !hasDupes && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {!isComplete && (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
              {hasDupes && (
                <span className="text-xs text-red-500">Duplicado</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 min-h-[60px]">
            {trio.numbers.map((num, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium"
              >
                {num.toString().padStart(2, '0')}
                <button
                  onClick={() => {
                    const newNumbers = trio.numbers.filter((_, i) => i !== idx)
                    onUpdate({ ...trio, numbers: newNumbers, isComplete: false })
                  }}
                  className="ml-1 hover:bg-blue-700 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label={`Remover número ${num.toString().padStart(2, '0')}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {trio.numbers.length < config.trio.size && (
              <div className={cn(
                "text-sm self-center px-4 py-2 rounded-lg border-2 border-dashed transition-colors",
                isOver ? "border-blue-500 text-blue-400 bg-blue-500/10" : "border-gray-600 text-gray-400"
              )}>
                {isOver ? "Solte aqui" : `${config.trio.size - trio.numbers.length} número(s) restante(s)`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TrioBuilder({ selectedNumbers, trios, onTriosChange }: TrioBuilderProps) {
  const [config, setConfig] = useState(loadConfig())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([])

  useEffect(() => {
    setConfig(loadConfig())
    updateAvailableNumbers()
  }, [selectedNumbers, trios])

  const updateAvailableNumbers = () => {
    const used = new Set(trios.flatMap(t => t.numbers))
    const available = selectedNumbers.filter(n => !used.has(n))
    setAvailableNumbers(available)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeIdStr = active.id.toString()
    const overIdStr = over.id.toString()

    // Verificar se está arrastando um número para um trio
    if (!isNaN(parseInt(activeIdStr)) && overIdStr.startsWith('dropzone-')) {
      const number = parseInt(activeIdStr)
      const trioId = overIdStr.replace('dropzone-', 'trio-')
      const trio = trios.find(t => t.id === trioId)
      
      if (trio && !trio.numbers.includes(number) && trio.numbers.length < config.trio.size) {
        const updatedTrios = trios.map(t =>
          t.id === trioId
            ? {
                ...t,
                numbers: [...t.numbers, number],
                isComplete: t.numbers.length + 1 === config.trio.size,
              }
            : t
        )
        onTriosChange(updatedTrios)
      }
    } else if (activeIdStr.startsWith('sortable-') && overIdStr.startsWith('sortable-')) {
      // Reordenar trios
      const oldIndex = trios.findIndex(t => `sortable-${t.id}` === activeIdStr)
      const newIndex = trios.findIndex(t => `sortable-${t.id}` === overIdStr)
      if (oldIndex !== -1 && newIndex !== -1) {
        onTriosChange(arrayMove(trios, oldIndex, newIndex))
      }
    }

    setActiveId(null)
  }

  const handleAutoMount = () => {
    const newTrios: Trio[] = []
    let available = [...selectedNumbers]

    const trioCount = Math.min(
      Math.floor(available.length / config.trio.size),
      config.trio.maxTrios
    )

    for (let i = 0; i < trioCount; i++) {
      const trioNumbers = available.slice(0, config.trio.size)
      available = available.slice(config.trio.size)

      if (trioNumbers.length === config.trio.size) {
        newTrios.push({
          id: `trio-${i + 1}`,
          numbers: trioNumbers,
          isComplete: true,
        })
      }
    }

    onTriosChange(newTrios)
  }

  const handleNewTrio = () => {
    const newId = `trio-${trios.length + 1}`
    onTriosChange([...trios, {
      id: newId,
      numbers: [],
      isComplete: false,
    }])
  }

  const handleRemoveTrio = (id: string) => {
    onTriosChange(trios.filter(t => t.id !== id))
  }

  const handleUpdateTrio = (updated: Trio) => {
    onTriosChange(trios.map(t => t.id === updated.id ? updated : t))
  }

  const allComplete = trios.every(t => isValidTrio(t.numbers, config.trio.size))

  return (
    <div className="space-y-6">
      {/* Chips de números disponíveis */}
      {availableNumbers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">Números Disponíveis (arraste para os trios)</h3>
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-wrap gap-2">
              {availableNumbers.map(num => (
                <div
                  key={num}
                  data-id={num}
                  draggable
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm font-medium cursor-grab active:cursor-grabbing"
                >
                  {num.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={handleNewTrio}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Trio
        </Button>
        <Button variant="outline" onClick={handleAutoMount} disabled={availableNumbers.length === 0}>
          Auto-montar Trios
        </Button>
        {trios.length > 0 && (
          <Button variant="outline" onClick={() => onTriosChange([])}>
            Limpar Trios
          </Button>
        )}
      </div>

      {/* Trios */}
      {trios.length > 0 ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={trios.map(t => `sortable-${t.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {trios.map((trio) => (
                <TrioBuilder
                  key={trio.id}
                  trio={trio}
                  onUpdate={handleUpdateTrio}
                  onRemove={() => handleRemoveTrio(trio.id)}
                  config={config}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card className="bg-gray-800 border-gray-700 border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">
              Nenhum trio criado ainda. Arraste números ou clique em "Novo Trio".
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <div className="text-sm text-gray-400 text-center">
        {trios.length > 0 && (
          <span>
            {trios.filter(t => isValidTrio(t.numbers, config.trio.size)).length} de {trios.length} trios completo(s)
          </span>
        )}
      </div>
    </div>
  )
}

// Corrigir função TrioBuilder que estava faltando
function TrioBuilder({ trio, onUpdate, onRemove, config }: {
  trio: Trio
  onUpdate: (trio: Trio) => void
  onRemove: () => void
  config: any
}) {
  return (
    <SortableTrioCard
      trio={trio}
      onUpdate={onUpdate}
      onRemove={onRemove}
      config={config}
    />
  )
}
