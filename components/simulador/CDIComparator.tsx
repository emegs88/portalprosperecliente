'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, Calculator, Loader2 } from 'lucide-react'

interface CDIComparatorProps {
  monthlyFlow: number[] // Fluxo mensal de aportes
  months: number
  cdiMonthly?: number // Taxa CDI mensal (se não fornecido, busca automático)
  poupancaMonthly?: number // Taxa Poupança mensal
}

export function CDIComparator({
  monthlyFlow,
  months,
  cdiMonthly = 0.9,
  poupancaMonthly = 0.45,
}: CDIComparatorProps) {
  const [loading, setLoading] = useState(false)
  const [manualCDI, setManualCDI] = useState(cdiMonthly)
  const [manualPoupanca, setManualPoupanca] = useState(poupancaMonthly)
  const [useManual, setUseManual] = useState(false)
  const [comparisonData, setComparisonData] = useState<any>(null)

  useEffect(() => {
    calculateComparison()
  }, [monthlyFlow, months, manualCDI, manualPoupanca, useManual])

  const calculateComparison = async () => {
    try {
      setLoading(true)
      
      let cdi = manualCDI
      let poupanca = manualPoupanca

      // Se não usar manual, buscar da API
      if (!useManual && months <= 120) {
        try {
          const response = await fetch(`/api/indices/cdi?period=monthly`)
          if (response.ok) {
            const data = await response.json()
            // Usar média dos últimos meses disponíveis
            const cdiValues = data.values || []
            if (cdiValues.length > 0) {
              const avg = cdiValues.slice(-months).reduce((a: number, b: number) => a + b, 0) / Math.min(months, cdiValues.length)
              cdi = avg || manualCDI
            }
          }
        } catch (error) {
          console.error('Erro ao buscar CDI:', error)
        }

        try {
          const response = await fetch(`/api/indices/poupanca?period=monthly`)
          if (response.ok) {
            const data = await response.json()
            const poupancaValues = data.poupanca || []
            if (Array.isArray(poupancaValues) && poupancaValues.length > 0) {
              const avg = poupancaValues.slice(-months).reduce((a: number, b: number) => a + b, 0) / Math.min(months, poupancaValues.length)
              poupanca = avg || manualPoupanca
            }
          }
        } catch (error) {
          console.error('Erro ao buscar Poupança:', error)
        }
      }

      // Calcular acumulação mês a mês
      const data = []
      let cdiAccumulated = 0
      let poupancaAccumulated = 0
      let totalInvested = 0

      for (let month = 0; month < months; month++) {
        const aporte = monthlyFlow[month] || monthlyFlow[monthlyFlow.length - 1] || 0
        totalInvested += aporte

        // CDI: juros compostos no acumulado + novo aporte
        cdiAccumulated = cdiAccumulated * (1 + cdi / 100) + aporte

        // Poupança: juros compostos no acumulado + novo aporte
        poupancaAccumulated = poupancaAccumulated * (1 + poupanca / 100) + aporte

        data.push({
          mes: month + 1,
          mesLabel: `Mês ${month + 1}`,
          totalInvestido: totalInvested,
          cdi: cdiAccumulated,
          poupanca: poupancaAccumulated,
          aporte,
        })
      }

      const finalCDI = cdiAccumulated
      const finalPoupanca = poupancaAccumulated

      setComparisonData({
        data,
        finalCDI,
        finalPoupanca,
        totalInvested,
        cdiUsed: cdi,
        poupancaUsed: poupanca,
        rendimentoCDI: finalCDI - totalInvested,
        rendimentoPoupanca: finalPoupanca - totalInvested,
        roiCDI: totalInvested > 0 ? ((finalCDI / totalInvested - 1) * 100) : 0,
        roiPoupanca: totalInvested > 0 ? ((finalPoupanca / totalInvested - 1) * 100) : 0,
      })
    } catch (error) {
      console.error('Erro ao calcular comparação:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !comparisonData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <Card className="bg-[#0B1220] border-gray-700">
        <CardContent className="py-12 text-center">
          <p className="text-gray-400">Configure os parâmetros para ver a comparação</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#0B1220] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Comparador CDI vs Poupança
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comparação usando o mesmo fluxo de aportes mensais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuração Manual */}
          <div className="flex items-center gap-4">
            <Label className="text-gray-300 flex items-center gap-2">
              <input
                type="checkbox"
                checked={useManual}
                onChange={(e) => setUseManual(e.target.checked)}
                className="rounded"
              />
              Usar valores manuais
            </Label>
            {useManual && (
              <div className="flex gap-4">
                <div>
                  <Label className="text-gray-400 text-xs">CDI Mensal (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={manualCDI}
                    onChange={(e) => setManualCDI(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#070B14] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">Poupança Mensal (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={manualPoupanca}
                    onChange={(e) => setManualPoupanca(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#070B14] border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cards de Resultado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-600/20 border-blue-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-400">CDI ({formatPercent(comparisonData.cdiUsed)} ao mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(comparisonData.finalCDI)}
                </div>
                <div className="text-xs text-gray-400">
                  Rendimento: {formatCurrency(comparisonData.rendimentoCDI)}
                </div>
                <div className="text-xs text-blue-400 mt-1">
                  ROI: {formatPercent(comparisonData.roiCDI)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-600/20 border-green-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-400">Poupança ({formatPercent(comparisonData.poupancaUsed)} ao mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(comparisonData.finalPoupanca)}
                </div>
                <div className="text-xs text-gray-400">
                  Rendimento: {formatCurrency(comparisonData.rendimentoPoupanca)}
                </div>
                <div className="text-xs text-green-400 mt-1">
                  ROI: {formatPercent(comparisonData.roiPoupanca)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-400">Total Investido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(comparisonData.totalInvested)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {months} meses
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Comparativo */}
      <Card className="bg-[#0B1220] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Evolução: CDI vs Poupança</CardTitle>
          <CardDescription className="text-gray-400">
            Comparação da evolução do patrimônio investindo o mesmo valor mensal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparisonData.data}>
                <defs>
                  <linearGradient id="colorCDI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPoupanca" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="mesLabel" stroke="#999" tick={{ fill: '#999', fontSize: 12 }} />
                <YAxis stroke="#999" tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cdi"
                  fill="url(#colorCDI)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="CDI"
                />
                <Area
                  type="monotone"
                  dataKey="poupanca"
                  fill="url(#colorPoupanca)"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Poupança"
                />
                <Line
                  type="monotone"
                  dataKey="totalInvestido"
                  stroke="#9CA3AF"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Total Investido"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
