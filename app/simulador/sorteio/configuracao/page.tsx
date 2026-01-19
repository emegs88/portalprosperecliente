'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ModeSelector } from '@/components/simulador/sorteio/ModeSelector'
import { QuickNav } from '@/components/navigation/QuickNav'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, Settings } from 'lucide-react'
import { loadConfig, saveConfig } from '@/lib/simulador/sorteio/config'
import { initSession, saveSession } from '@/lib/simulador/sorteio/storage'

export default function ConfiguracaoPage() {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<'rapido' | 'completo' | 'sala'>()
  const [config, setConfig] = useState(loadConfig())
  const [rangeMin, setRangeMin] = useState(config.range.min)
  const [rangeMax, setRangeMax] = useState(config.range.max)
  const [drawCount, setDrawCount] = useState(config.draw.count)
  const [speed, setSpeed] = useState(config.animation.speed)
  const [enableSounds, setEnableSounds] = useState(config.animation.enableSounds)
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  useEffect(() => {
    setConfig(loadConfig())
  }, [])

  const handleContinue = () => {
    if (!selectedMode) return

    // Atualizar config se necessário
    const updatedConfig = {
      ...config,
      range: { min: rangeMin, max: rangeMax },
      draw: { ...config.draw, count: drawCount },
      animation: { ...config.animation, speed, enableSounds },
    }

    saveConfig(updatedConfig)

    // Inicializar sessão
    const session = initSession(selectedMode)
    saveSession(session)

    // Navegar para seleção
    router.push('/simulador/sorteio/selecao')
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Configuração do Simulador
        </h1>
        <p className="text-gray-400">
          Escolha o modo de simulação e personalize as opções
        </p>
      </div>

        {/* Seleção de Modo */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Modo de Simulação</h2>
          <ModeSelector selected={selectedMode} onSelect={setSelectedMode} />
        </div>

        {/* Opções Avançadas */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced" className="border-gray-700">
            <AccordionTrigger className="text-white hover:text-gray-300">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Opções Avançadas
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Range */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Universo de Números</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      value={rangeMin}
                      onChange={(e) => setRangeMin(parseInt(e.target.value) || 0)}
                      className="bg-gray-800 border-gray-700"
                    />
                    <span className="self-center text-gray-400">até</span>
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      value={rangeMax}
                      onChange={(e) => setRangeMax(parseInt(e.target.value) || 99)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                {/* Quantidade Sorteados */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Quantidade Sorteados</Label>
                  <Select
                    value={drawCount.toString()}
                    onValueChange={(v) => setDrawCount(parseInt(v))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 número</SelectItem>
                      <SelectItem value="2">2 números</SelectItem>
                      <SelectItem value="3">3 números</SelectItem>
                      <SelectItem value="4">4 números</SelectItem>
                      <SelectItem value="5">5 números</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Velocidade */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Velocidade do Sorteio</Label>
                  <Select value={speed} onValueChange={(v: any) => setSpeed(v)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Lenta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="fast">Rápida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sons */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Efeitos Sonoros</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="sounds"
                      checked={enableSounds}
                      onCheckedChange={(checked) => setEnableSounds(!!checked)}
                    />
                    <Label htmlFor="sounds" className="text-gray-300 cursor-pointer">
                      Ativar sons
                    </Label>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Navegação */}
        <QuickNav
          onNext={handleContinue}
          nextLabel="Continuar para Seleção"
          backLabel="Voltar ao Início"
          showHome={true}
        />
      </div>
    </div>
  )
}
