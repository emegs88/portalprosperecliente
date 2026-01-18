'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface SimulationParams {
  mesesSimulacao: number
  percentVendaContemplada: number
  taxaIntermediacao: number
  taxaIncc: number
  taxaCdi: number
  aplicarCdi: boolean
}

interface Quota {
  id: string
  grupo: string
  cota: string
  vlBem: number
  vlParcela: number
  vlReceber: number
  pclsPagas: number
  contemplacao: string
}

export function SimulacoesTab() {
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [selectedQuotas, setSelectedQuotas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState<SimulationParams>({
    mesesSimulacao: 60,
    percentVendaContemplada: 100,
    taxaIntermediacao: 0,
    taxaIncc: 0.5,
    taxaCdi: 1,
    aplicarCdi: false,
  })

  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    fetchQuotas()
  }, [])

  useEffect(() => {
    if (quotas.length > 0 && selectedQuotas.size > 0) {
      calculateSimulation()
    }
  }, [quotas, selectedQuotas, params])

  const fetchQuotas = async () => {
    try {
      const res = await fetch('/api/cotas')
      if (res.ok) {
        const data = await res.json()
        setQuotas(data.quotas || [])
        // Selecionar todas as cotas por padrão
        if (data.quotas && data.quotas.length > 0) {
          setSelectedQuotas(new Set(data.quotas.map((q: Quota) => q.id)))
        }
      }
    } catch (error) {
      console.error('Error fetching quotas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuota = (quotaId: string) => {
    const newSelected = new Set(selectedQuotas)
    if (newSelected.has(quotaId)) {
      newSelected.delete(quotaId)
    } else {
      newSelected.add(quotaId)
    }
    setSelectedQuotas(newSelected)
  }

  const selectAll = () => {
    setSelectedQuotas(new Set(quotas.map(q => q.id)))
  }

  const deselectAll = () => {
    setSelectedQuotas(new Set())
  }

  const calculateSimulation = () => {
    if (quotas.length === 0 || selectedQuotas.size === 0) {
      setResults(null)
      return
    }

    const selectedQuotasData = quotas.filter(q => selectedQuotas.has(q.id))
    const totalCotas = selectedQuotasData.length
    const vlParcelaTotal = selectedQuotasData.reduce((sum, q) => sum + q.vlParcela, 0)
    const vlBemTotal = selectedQuotasData.reduce((sum, q) => sum + q.vlBem, 0)
    const vlParcelaBase = vlParcelaTotal / totalCotas || 0
    const vlBem = vlBemTotal / totalCotas || 0

    // Calcular parcelas com INCC
    let totalPagoParcelas = 0
    const parcelasMensais: number[] = []
    
    for (let mes = 1; mes <= params.mesesSimulacao; mes++) {
      const vlParcelaMes = vlParcelaBase * Math.pow(1 + params.taxaIncc / 100, mes - 1)
      parcelasMensais.push(vlParcelaMes * totalCotas)
      totalPagoParcelas += vlParcelaMes * totalCotas
    }

    // Calcular venda de cota contemplada
    const valorVenda = vlBem * (params.percentVendaContemplada / 100) * totalCotas
    const taxaIntermediacaoValor = valorVenda * (params.taxaIntermediacao / 100)
    const valorLiquidoRecebido = valorVenda - taxaIntermediacaoValor

    // Aplicar CDI se ativado
    let valorFinal = valorLiquidoRecebido
    if (params.aplicarCdi) {
      valorFinal = valorLiquidoRecebido * Math.pow(1 + params.taxaCdi / 100, params.mesesSimulacao)
    }

    // Calcular lucro
    const lucroLiquido = valorFinal - totalPagoParcelas
    const ganhoCapital = lucroLiquido
    const roi = totalPagoParcelas > 0 ? (lucroLiquido / totalPagoParcelas) * 100 : 0

    // Dados para gráficos
    const dadosEvolucao = parcelasMensais.map((parcela, index) => ({
      mes: index + 1,
      mesLabel: `Mês ${index + 1}`,
      totalPago: parcelasMensais.slice(0, index + 1).reduce((a, b) => a + b, 0),
      valorRecebido: index === params.mesesSimulacao - 1 ? valorFinal : 0,
    }))

    setResults({
      totalPagoParcelas,
      valorVenda,
      taxaIntermediacaoValor,
      valorLiquidoRecebido,
      valorFinal,
      lucroLiquido,
      ganhoCapital,
      roi,
      parcelasPagas: params.mesesSimulacao,
      dadosEvolucao,
      totalCotas,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Carregando cotas...</div>
      </div>
    )
  }

  if (quotas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-center">
          <p className="mb-4">Nenhuma cota encontrada.</p>
          <p className="text-gray-400">Importe cotas na aba "Importações" primeiro.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Simulador de Venda de Cota</h2>
        <p className="text-gray-400">
          Selecione as cotas e simule a venda para ver os resultados financeiros
        </p>
      </div>

      <Tabs defaultValue="configuracao" className="w-full">
        <TabsList className="bg-gray-800 grid grid-cols-3">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao" className="mt-6 space-y-6">
          {/* Seleção de Cotas */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Selecionar Cotas</CardTitle>
                  <CardDescription className="text-gray-400">
                    Selecione as cotas para incluir na simulação ({selectedQuotas.size} de {quotas.length} selecionadas)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    Selecionar Todas
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAll}>
                    Desmarcar Todas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {quotas.map((quota) => (
                  <div
                    key={quota.id}
                    onClick={() => toggleQuota(quota.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQuotas.has(quota.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox
                        checked={selectedQuotas.has(quota.id)}
                        onCheckedChange={() => toggleQuota(quota.id)}
                      />
                      <span className="font-bold text-white">
                        {quota.grupo}-{quota.cota}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Valor: {formatCurrency(quota.vlBem)}</p>
                      <p>Parcela: {formatCurrency(quota.vlParcela)}</p>
                      <p className={quota.contemplacao.includes('Contemplada') ? 'text-green-400' : ''}>
                        {quota.contemplacao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parâmetros */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Parâmetros da Simulação</CardTitle>
              <CardDescription className="text-gray-400">
                Configure os parâmetros para simular a venda das cotas selecionadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meses de Simulação */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Meses de Simulação: {params.mesesSimulacao}
                </Label>
                <Slider
                  value={[params.mesesSimulacao]}
                  onValueChange={(value) =>
                    setParams({ ...params, mesesSimulacao: value[0] })
                  }
                  min={12}
                  max={120}
                  step={6}
                  className="w-full"
                />
              </div>

              {/* Percentual de Venda */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  % Venda de Cota Contemplada: {params.percentVendaContemplada}%
                </Label>
                <Slider
                  value={[params.percentVendaContemplada]}
                  onValueChange={(value) =>
                    setParams({ ...params, percentVendaContemplada: value[0] })
                  }
                  min={50}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Taxa de Intermediação */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Taxa de Intermediação: {params.taxaIntermediacao}%
                </Label>
                <Slider
                  value={[params.taxaIntermediacao]}
                  onValueChange={(value) =>
                    setParams({ ...params, taxaIntermediacao: value[0] })
                  }
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Taxa INCC */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Taxa INCC Mensal: {params.taxaIncc}%
                </Label>
                <Slider
                  value={[params.taxaIncc]}
                  onValueChange={(value) =>
                    setParams({ ...params, taxaIncc: value[0] })
                  }
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Aplicar CDI */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aplicarCdi"
                  checked={params.aplicarCdi}
                  onCheckedChange={(checked) =>
                    setParams({ ...params, aplicarCdi: checked as boolean })
                  }
                />
                <Label htmlFor="aplicarCdi" className="text-gray-300 cursor-pointer">
                  Aplicar rendimento CDI
                </Label>
              </div>

              {params.aplicarCdi && (
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Taxa CDI Mensal: {params.taxaCdi}%
                  </Label>
                  <Slider
                    value={[params.taxaCdi]}
                    onValueChange={(value) =>
                      setParams({ ...params, taxaCdi: value[0] })
                    }
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultados" className="mt-6 space-y-6">
          {results && selectedQuotas.size > 0 ? (
            <>
              {/* Comparativo Rápido */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Comparativo Rápido: Total Pago vs Crédito Final
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Visão geral do valor total investido em parcelas (com INCC) versus o valor final do crédito (com rendimento CDI).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-red-600/20 border-red-500/50">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">
                        Total Pago em Parcelas (com INCC)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {formatCurrency(results.totalPagoParcelas)}
                      </div>
                      <p className="text-red-200 text-xs mt-2">
                        Considerando o aumento das parcelas pelo INCC.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-600/20 border-green-500/50">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">
                        Valor Líquido Recebido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        {formatCurrency(results.valorFinal)}
                      </div>
                      <p className="text-green-200 text-xs mt-2">
                        Valor de venda após dedução de intermediação{params.aplicarCdi ? ' e aplicação de CDI' : ''}.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Lucro Líquido Final */}
              <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Lucro Líquido Final</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-400">
                    {formatCurrency(results.lucroLiquido)}
                  </div>
                  <p className="text-gray-300 text-sm mt-2">
                    Diferença entre o valor líquido recebido e o total pago.
                  </p>
                </CardContent>
              </Card>

              {/* Detalhamento dos Resultados */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Detalhamento dos Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Valor de Venda</p>
                      <p className="text-white text-xl font-bold">
                        {formatCurrency(results.valorVenda)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">
                        Intermediação ({params.taxaIntermediacao}%)
                      </p>
                      <p className="text-yellow-400 text-xl font-bold">
                        {formatCurrency(results.taxaIntermediacaoValor)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Valor Líquido Recebido</p>
                      <p className="text-green-400 text-xl font-bold">
                        {formatCurrency(results.valorLiquidoRecebido)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Total Pago em Parcelas</p>
                      <p className="text-white text-xl font-bold">
                        {formatCurrency(results.totalPagoParcelas)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Ganho de Capital</p>
                      <p className="text-blue-400 text-xl font-bold">
                        {formatCurrency(results.ganhoCapital)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">ROI</p>
                      <p className="text-yellow-400 text-xl font-bold">
                        {formatPercent(results.roi)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">
                        Parcelas Pagas até Contemplação
                      </p>
                      <p className="text-white text-xl font-bold">
                        {results.parcelasPagas}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-400 text-sm mb-1">Lucro Líquido</p>
                      <p className="text-green-400 text-xl font-bold">
                        {formatCurrency(results.lucroLiquido)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Selecione pelo menos uma cota na aba Configuração para ver os resultados
            </div>
          )}
        </TabsContent>

        <TabsContent value="graficos" className="mt-6 space-y-6">
          {results && selectedQuotas.size > 0 ? (
            <>
              {/* Gráfico Principal: Evolução */}
              <Card className="bg-black/50 border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    Evolução: Total Pago vs Valor Recebido
                  </CardTitle>
                  <p className="text-sm text-gray-400">
                    Comparação entre o total pago em parcelas (com INCC) e o valor líquido recebido
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="w-full" style={{ height: '500px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={results.dadosEvolucao}>
                        <defs>
                          <linearGradient id="colorTotalPago" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorValorRecebido" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="mesLabel" 
                          stroke="#999"
                          tick={{ fill: '#999', fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#999"
                          tick={{ fill: '#999', fontSize: 12 }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === 'totalPago' ? 'Total Pago' : 'Valor Recebido'
                          ]}
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151', 
                            borderRadius: '8px',
                            color: '#F3F4F6'
                          }}
                          labelStyle={{ color: '#F3F4F6', marginBottom: '8px' }}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#999', paddingTop: '20px' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalPago"
                          stroke="#EF4444"
                          strokeWidth={2}
                          fill="url(#colorTotalPago)"
                          name="Total Pago"
                        />
                        <Area
                          type="monotone"
                          dataKey="valorRecebido"
                          stroke="#10B981"
                          strokeWidth={2}
                          fill="url(#colorValorRecebido)"
                          name="Valor Recebido"
                        />
                        <Line
                          type="monotone"
                          dataKey="totalPago"
                          stroke="#DC2626"
                          strokeWidth={3}
                          dot={{ fill: '#DC2626', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="valorRecebido"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={{ fill: '#059669', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Barras: Comparativo Mensal */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Comparativo Mensal</CardTitle>
                  <p className="text-sm text-gray-400">
                    Acumulação mensal de parcelas pagas
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="w-full" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results.dadosEvolucao}>
                        <defs>
                          <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="mesLabel" 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 11 }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151', 
                            borderRadius: '8px',
                            color: '#F3F4F6'
                          }}
                          labelStyle={{ color: '#F3F4F6' }}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#9CA3AF', paddingTop: '20px' }}
                        />
                        <Bar 
                          dataKey="totalPago" 
                          fill="url(#colorBar)" 
                          name="Total Pago Acumulado"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Selecione pelo menos uma cota na aba Configuração para ver os gráficos
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
