'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, Play, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface SimulationConfigWizardProps {
  projectId: string
  initialParams?: any
  onSave: (params: any) => Promise<void>
  onExecute: (params: any) => Promise<void>
  executing: boolean
}

type Step = 'quotas' | 'params' | 'review'

interface SimulationQuota {
  id: string
  grupo: string
  cota: string
  versao: string
  vlBem: number
  vlParcela: number
  percentPago: number
  contemplacao: string
  contemplada?: boolean
}

export function SimulationConfigWizard({
  projectId,
  initialParams,
  onSave,
  onExecute,
  executing,
}: SimulationConfigWizardProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('quotas')
  const [loading, setLoading] = useState(true)
  const [quotas, setQuotas] = useState<SimulationQuota[]>([])
  const [selectedQuotaIds, setSelectedQuotaIds] = useState<Set<string>>(new Set())
  const [params, setParams] = useState({
    prazo: 120,
    taxaContemplacao: 0.05,
    estrategiaVenda: 'IMMEDIATA' as 'IMMEDIATA' | 'MANTER' | 'REINVESTIR',
    aplicarCDI: true,
    percentTaxaIntermediacao: 3,
    percentDescontoVenda: 85,
    taxaCDI: 0.9,
  })

  useEffect(() => {
    loadQuotas()
    if (initialParams) {
      setParams(prev => ({
        ...prev,
        ...initialParams,
      }))
      if (initialParams.quotas) {
        setSelectedQuotaIds(new Set(initialParams.quotas.map((q: any) => q.id)))
      }
    }
  }, [projectId, initialParams])

  const loadQuotas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cotas')
      if (response.ok) {
        const data = await response.json()
        const quotasData = (data.quotas || []).map((q: any) => ({
          id: q.id,
          grupo: q.grupo,
          cota: q.cota,
          versao: q.versao || '00',
          vlBem: q.vlBem,
          vlParcela: q.vlParcela,
          percentPago: q.percentPago || 0,
          contemplacao: q.contemplacao,
          contemplada: q.contemplacao?.toUpperCase().includes('CONTEMPLADA'),
        }))
        setQuotas(quotasData)
      }
    } catch (error) {
      console.error('Erro ao carregar cotas:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cotas',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedQuotas = useMemo(() => {
    return quotas.filter(q => selectedQuotaIds.has(q.id))
  }, [quotas, selectedQuotaIds])

  const toggleQuota = (id: string) => {
    const newSet = new Set(selectedQuotaIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedQuotaIds(newSet)
  }

  const selectAll = () => {
    setSelectedQuotaIds(new Set(quotas.map(q => q.id)))
  }

  const deselectAll = () => {
    setSelectedQuotaIds(new Set())
  }

  const handleNext = () => {
    if (step === 'quotas' && selectedQuotaIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Selecione pelo menos uma cota',
      })
      return
    }
    
    if (step === 'quotas') {
      setStep('params')
    } else if (step === 'params') {
      setStep('review')
    }
  }

  const handleBack = () => {
    if (step === 'params') {
      setStep('quotas')
    } else if (step === 'review') {
      setStep('params')
    }
  }

  const handleSave = async () => {
    await onSave({
      ...params,
      quotas: selectedQuotas,
    })
  }

  const handleExecute = async () => {
    await onExecute({
      ...params,
      quotas: selectedQuotas,
    })
  }

  const totalCredit = selectedQuotas.reduce((sum, q) => sum + q.vlBem, 0)
  const totalInstallment = selectedQuotas.reduce((sum, q) => sum + q.vlParcela, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const steps = [
    { id: 'quotas', label: 'Selecionar Cotas', progress: step === 'quotas' ? 100 : step === 'params' ? 50 : step === 'review' ? 33 : 0 },
    { id: 'params', label: 'Parâmetros', progress: step === 'params' ? 100 : step === 'review' ? 66 : 0 },
    { id: 'review', label: 'Revisar', progress: step === 'review' ? 100 : 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center">
              <div className={`flex-1 ${i < steps.length - 1 ? 'mr-2' : ''}`}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === s.id ? 'bg-blue-600 text-white' :
                    ['quotas', 'params', 'review'].indexOf(step) > ['quotas', 'params', 'review'].indexOf(s.id) 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {['quotas', 'params', 'review'].indexOf(step) > ['quotas', 'params', 'review'].indexOf(s.id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`ml-2 ${step === s.id ? 'text-white' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Progress value={
          step === 'quotas' ? 33 :
          step === 'params' ? 66 :
          100
        } className="h-2" />
      </div>

      {/* Step 1: Seleção de Cotas */}
      {step === 'quotas' && (
        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Selecionar Cotas</CardTitle>
            <CardDescription className="text-gray-400">
              Escolha as cotas para incluir na simulação ({selectedQuotaIds.size} de {quotas.length} selecionadas)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                Selecionar Todas
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAll}>
                Desmarcar Todas
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {quotas.map((quota) => (
                <div
                  key={quota.id}
                  onClick={() => toggleQuota(quota.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedQuotaIds.has(quota.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={selectedQuotaIds.has(quota.id)}
                      onCheckedChange={() => toggleQuota(quota.id)}
                    />
                    <span className="font-bold text-white">
                      {quota.grupo}-{quota.cota}
                    </span>
                    {quota.contemplada && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        Contemplada
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Crédito: {formatCurrency(quota.vlBem)}</p>
                    <p>Parcela: {formatCurrency(quota.vlParcela)}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedQuotaIds.size > 0 && (
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Crédito Total</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalCredit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Parcela Total</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalInstallment)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Parâmetros */}
      {step === 'params' && (
        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Parâmetros da Simulação</CardTitle>
            <CardDescription className="text-gray-400">
              Configure os parâmetros da simulação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">
                Prazo (meses): {params.prazo}
              </Label>
              <Slider
                value={[params.prazo]}
                onValueChange={(value) => setParams({ ...params, prazo: value[0] })}
                min={12}
                max={240}
                step={6}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Taxa de Contemplação Mensal (%): {params.taxaContemplacao}%
              </Label>
              <Slider
                value={[params.taxaContemplacao * 100]}
                onValueChange={(value) => setParams({ ...params, taxaContemplacao: value[0] / 100 })}
                min={1}
                max={20}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Estratégia de Venda</Label>
              <div className="flex gap-2">
                <Button
                  variant={params.estrategiaVenda === 'IMMEDIATA' ? 'default' : 'outline'}
                  onClick={() => setParams({ ...params, estrategiaVenda: 'IMMEDIATA' })}
                >
                  Vender Imediatamente
                </Button>
                <Button
                  variant={params.estrategiaVenda === 'MANTER' ? 'default' : 'outline'}
                  onClick={() => setParams({ ...params, estrategiaVenda: 'MANTER' })}
                >
                  Manter
                </Button>
                <Button
                  variant={params.estrategiaVenda === 'REINVESTIR' ? 'default' : 'outline'}
                  onClick={() => setParams({ ...params, estrategiaVenda: 'REINVESTIR' })}
                >
                  Reinvestir
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Taxa de Intermediação (%): {params.percentTaxaIntermediacao}%
              </Label>
              <Slider
                value={[params.percentTaxaIntermediacao]}
                onValueChange={(value) => setParams({ ...params, percentTaxaIntermediacao: value[0] })}
                min={0}
                max={10}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                % de Venda do Crédito: {params.percentDescontoVenda}%
              </Label>
              <Slider
                value={[params.percentDescontoVenda]}
                onValueChange={(value) => setParams({ ...params, percentDescontoVenda: value[0] })}
                min={50}
                max={100}
                step={5}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={params.aplicarCDI}
                onCheckedChange={(checked) => setParams({ ...params, aplicarCDI: checked as boolean })}
              />
              <Label className="text-gray-300 cursor-pointer">
                Aplicar rendimento CDI
              </Label>
            </div>

            {params.aplicarCDI && (
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Taxa CDI Mensal (%): {params.taxaCDI}%
                </Label>
                <Slider
                  value={[params.taxaCDI]}
                  onValueChange={(value) => setParams({ ...params, taxaCDI: value[0] })}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Revisar */}
      {step === 'review' && (
        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Revisar Configuração</CardTitle>
            <CardDescription className="text-gray-400">
              Revise os parâmetros antes de executar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">Cotas Selecionadas</h4>
              <p className="text-gray-400">
                {selectedQuotaIds.size} cotas selecionadas
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Crédito Total: {formatCurrency(totalCredit)} | Parcela Total: {formatCurrency(totalInstallment)}
              </p>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-semibold mb-2">Parâmetros</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Prazo</p>
                  <p className="text-white">{params.prazo} meses</p>
                </div>
                <div>
                  <p className="text-gray-400">Taxa Contemplação</p>
                  <p className="text-white">{params.taxaContemplacao * 100}% ao mês</p>
                </div>
                <div>
                  <p className="text-gray-400">Estratégia</p>
                  <p className="text-white">{params.estrategiaVenda}</p>
                </div>
                <div>
                  <p className="text-gray-400">% Venda</p>
                  <p className="text-white">{params.percentDescontoVenda}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 'quotas' || executing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          {step !== 'review' ? (
            <Button onClick={handleNext} disabled={selectedQuotaIds.size === 0 && step === 'quotas'}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleSave} disabled={executing}>
                Salvar Configuração
              </Button>
              <Button onClick={handleExecute} disabled={executing || selectedQuotaIds.size === 0}>
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Executar Simulação
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
