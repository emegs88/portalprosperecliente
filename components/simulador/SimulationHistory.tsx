'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Calendar, TrendingUp, GitCompare, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface SimulationRun {
  id: string
  name?: string
  executedAt: string
  patrimonioFinal: number
  totalPagoParcelas: number
  totalPagoBolso: number
  roi: number
  custoPatrimonio: number
  multiplicadorPatrimonial: number
}

interface SimulationHistoryProps {
  projectId: string
}

export function SimulationHistory({ projectId }: SimulationHistoryProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [runs, setRuns] = useState<SimulationRun[]>([])
  const [selectedRuns, setSelectedRuns] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState<any>(null)

  useEffect(() => {
    loadRuns()
  }, [projectId])

  useEffect(() => {
    if (selectedRuns.length === 2) {
      loadComparison()
    } else {
      setComparisonData(null)
    }
  }, [selectedRuns])

  const loadRuns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/simulation/runs?simulationId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setRuns(data.runs || [])
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar histórico',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadComparison = async () => {
    try {
      const [run1Id, run2Id] = selectedRuns
      const [run1Response, run2Response] = await Promise.all([
        fetch(`/api/simulation/runs/${run1Id}`),
        fetch(`/api/simulation/runs/${run2Id}`),
      ])

      if (run1Response.ok && run2Response.ok) {
        const run1 = await run1Response.json()
        const run2 = await run2Response.json()

        const snapshots1 = run1.snapshots || []
        const snapshots2 = run2.snapshots || []

        // Combinar snapshots para gráfico comparativo
        const maxLength = Math.max(snapshots1.length, snapshots2.length)
        const chartData = Array.from({ length: maxLength }, (_, i) => ({
          mes: i + 1,
          mesLabel: `Mês ${i + 1}`,
          patrimonio1: snapshots1[i]?.patrimonio || 0,
          patrimonio2: snapshots2[i]?.patrimonio || 0,
          totalPago1: snapshots1[i]?.totalPago || 0,
          totalPago2: snapshots2[i]?.totalPago || 0,
        }))

        setComparisonData({
          run1: {
            ...run1.run,
            name: run1.run.name || `Execução ${new Date(run1.run.executedAt).toLocaleDateString('pt-BR')}`,
          },
          run2: {
            ...run2.run,
            name: run2.run.name || `Execução ${new Date(run2.run.executedAt).toLocaleDateString('pt-BR')}`,
          },
          chartData,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar comparação:', error)
    }
  }

  const toggleRun = (runId: string) => {
    if (selectedRuns.includes(runId)) {
      setSelectedRuns(selectedRuns.filter(id => id !== runId))
    } else if (selectedRuns.length < 2) {
      setSelectedRuns([...selectedRuns, runId])
    } else {
      toast({
        title: 'Selecione no máximo 2 execuções para comparar',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <Card className="bg-[#0B1220] border-gray-700">
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma execução encontrada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Histórico de Execuções
          </h2>
          <p className="text-gray-400 text-sm">
            Selecione até 2 execuções para comparar
          </p>
        </div>
        {selectedRuns.length === 2 && (
          <Button
            variant="outline"
            onClick={() => setSelectedRuns([])}
          >
            Limpar Seleção
          </Button>
        )}
      </div>

      {/* Lista de Execuções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {runs.map((run) => {
          const isSelected = selectedRuns.includes(run.id)
          return (
            <Card
              key={run.id}
              className={`bg-[#0B1220] border-gray-700 cursor-pointer transition-all ${
                isSelected ? 'border-blue-500 bg-blue-500/10' : 'hover:border-gray-600'
              }`}
              onClick={() => toggleRun(run.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">
                    {run.name || `Execução ${new Date(run.executedAt).toLocaleDateString('pt-BR')}`}
                  </CardTitle>
                  {isSelected && (
                    <Badge className="bg-blue-600">Selecionado</Badge>
                  )}
                </div>
                <CardDescription className="text-gray-400 text-xs">
                  {new Date(run.executedAt).toLocaleString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Patrimônio Final</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(run.patrimonioFinal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Pago</span>
                    <span className="text-white">
                      {formatCurrency(run.totalPagoBolso)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ROI</span>
                    <span className={`font-semibold ${
                      run.roi >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(run.roi)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Multiplicador</span>
                    <span className="text-blue-400 font-semibold">
                      {run.multiplicadorPatrimonial.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Comparação */}
      {comparisonData && selectedRuns.length === 2 && (
        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Comparação de Execuções
            </CardTitle>
            <CardDescription className="text-gray-400">
              Comparando: {comparisonData.run1.name} vs {comparisonData.run2.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tabela Comparativa */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-400">Indicador</th>
                    <th className="text-right py-2 text-gray-400">{comparisonData.run1.name}</th>
                    <th className="text-right py-2 text-gray-400">{comparisonData.run2.name}</th>
                    <th className="text-right py-2 text-gray-400">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 text-white">Patrimônio Final</td>
                    <td className="py-2 text-right text-white">
                      {formatCurrency(comparisonData.run1.patrimonioFinal)}
                    </td>
                    <td className="py-2 text-right text-white">
                      {formatCurrency(comparisonData.run2.patrimonioFinal)}
                    </td>
                    <td className={`py-2 text-right font-semibold ${
                      comparisonData.run2.patrimonioFinal - comparisonData.run1.patrimonioFinal >= 0
                        ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(comparisonData.run2.patrimonioFinal - comparisonData.run1.patrimonioFinal)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 text-white">Total Pago do Bolso</td>
                    <td className="py-2 text-right text-white">
                      {formatCurrency(comparisonData.run1.totalPagoBolso)}
                    </td>
                    <td className="py-2 text-right text-white">
                      {formatCurrency(comparisonData.run2.totalPagoBolso)}
                    </td>
                    <td className="py-2 text-right text-gray-400">
                      {formatCurrency(comparisonData.run2.totalPagoBolso - comparisonData.run1.totalPagoBolso)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 text-white">ROI</td>
                    <td className={`py-2 text-right font-semibold ${
                      comparisonData.run1.roi >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(comparisonData.run1.roi)}
                    </td>
                    <td className={`py-2 text-right font-semibold ${
                      comparisonData.run2.roi >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(comparisonData.run2.roi)}
                    </td>
                    <td className={`py-2 text-right font-semibold ${
                      comparisonData.run2.roi - comparisonData.run1.roi >= 0
                        ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercent(comparisonData.run2.roi - comparisonData.run1.roi)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 text-white">Multiplicador</td>
                    <td className="py-2 text-right text-blue-400 font-semibold">
                      {comparisonData.run1.multiplicadorPatrimonial.toFixed(2)}x
                    </td>
                    <td className="py-2 text-right text-blue-400 font-semibold">
                      {comparisonData.run2.multiplicadorPatrimonial.toFixed(2)}x
                    </td>
                    <td className="py-2 text-right text-gray-400">
                      {(comparisonData.run2.multiplicadorPatrimonial - comparisonData.run1.multiplicadorPatrimonial).toFixed(2)}x
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-white">Custo do Patrimônio</td>
                    <td className="py-2 text-right text-white">
                      {formatCurrency(comparisonData.run1.custoPatrimonio)}
                    </td>
                    <td className="py-2 text-right text-white">
                      {formatCurrency(comparisonData.run2.custoPatrimonio)}
                    </td>
                    <td className="py-2 text-right text-gray-400">
                      {formatCurrency(comparisonData.run2.custoPatrimonio - comparisonData.run1.custoPatrimonio)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Gráfico Comparativo */}
            <div>
              <h3 className="text-white font-semibold mb-4">Evolução do Patrimônio</h3>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="mesLabel" stroke="#999" tick={{ fill: '#999', fontSize: 12 }} />
                    <YAxis stroke="#999" tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="patrimonio1"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name={comparisonData.run1.name}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="patrimonio2"
                      stroke="#10B981"
                      strokeWidth={3}
                      name={comparisonData.run2.name}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
