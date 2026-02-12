'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import { drawNumbers, generateSeed } from '@/lib/simulador/sorteio/draw'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let confetti: any
if (typeof window !== 'undefined') {
  import('canvas-confetti').then(mod => {
    confetti = mod.default
  })
}

interface DrawMachineProps {
  onComplete: (drawn: number[], seed: number) => void
  count: number
  min: number
  max: number
}

export function DrawMachine({ onComplete, count, min, max }: DrawMachineProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawn, setDrawn] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [seed, setSeed] = useState<number>()
  const [config, setConfig] = useState(loadConfig())

  useEffect(() => {
    setConfig(loadConfig())
  }, [])

  const startDraw = () => {
    if (isDrawing) return

    const newSeed = generateSeed()
    setSeed(newSeed)
    setIsDrawing(true)
    setDrawn([])
    setCurrentIndex(0)

    // Sortear todos os números
    const allDrawn = drawNumbers(count, min, max, [], newSeed)

    // Revelar um por um
    const delays = {
      slow: 2000,
      medium: 1000,
      fast: 500,
    }

    const delay = delays[config.animation.speed] || 1000

    allDrawn.forEach((num, index) => {
      setTimeout(() => {
        setDrawn(prev => [...prev, num])
        setCurrentIndex(index + 1)

        // Último número
        if (index === allDrawn.length - 1) {
          setTimeout(() => {
            setIsDrawing(false)
            onComplete(allDrawn, newSeed)
            
            if (config.animation.enableConfetti && confetti) {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              })
            }
          }, delay)
        }
      }, delay * (index + 1))
    })
  }

  const resetDraw = () => {
    setIsDrawing(false)
    setDrawn([])
    setCurrentIndex(0)
    setSeed(undefined)
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Máquina de Sorteio */}
          <div className="relative">
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Globo/Roleta */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 bg-gradient-to-br from-blue-900 to-blue-700 shadow-2xl flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full animate-spin-slow" style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.3) 90deg, transparent 180deg)',
                  }} />
                  
                  {/* Números girando */}
                  {isDrawing && (
                    <div className="absolute inset-0 rounded-full animate-spin-slow">
                      {Array.from({ length: 20 }, (_, i) => (
                        <div
                          key={i}
                          className="absolute text-white font-bold text-lg"
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${i * 18}deg) translateY(-120px) rotate(-${i * 18}deg)`,
                          }}
                        >
                          {Math.floor(Math.random() * 100).toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Números sorteados revelados */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <AnimatePresence mode="wait">
                      {drawn.length > 0 ? (
                        <motion.div
                          key={drawn[drawn.length - 1]}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="text-6xl md:text-8xl font-bold text-white drop-shadow-lg"
                        >
                          {drawn[drawn.length - 1].toString().padStart(2, '0')}
                        </motion.div>
                      ) : (
                        <div className="text-4xl md:text-6xl font-bold text-gray-400">
                          🎰
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            {isDrawing && (
              <div className="mt-8">
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentIndex / count) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-center text-gray-400 mt-2 text-sm">
                  Sorteando... {currentIndex} de {count}
                </p>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex justify-center gap-4">
            {!isDrawing && drawn.length === 0 && (
              <Button
                size="lg"
                onClick={startDraw}
                className="text-lg px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar Sorteio
              </Button>
            )}
            
            {drawn.length > 0 && !isDrawing && (
              <Button
                variant="outline"
                size="lg"
                onClick={resetDraw}
                className="text-lg px-8"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Sortear Novamente
              </Button>
            )}
          </div>

          {/* Números sorteados (todos) */}
          {drawn.length > 0 && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-300 mb-4">
                Números Sorteados
              </h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {drawn.map((num, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg"
                  >
                    {num.toString().padStart(2, '0')}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
