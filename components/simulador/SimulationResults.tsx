'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Download, FileDown, TrendingUp, DollarSign, Target, Award, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface SimulationResultsProps {
  runId: string
  projectId: string
  onRunChange: (runId: string) => void
  runs: Array<{
    id: string
    name?: string
    executedAt: string
    patrimonioFinal: number
    roi: number
  }>
}

export function SimulationResults({
  runId,
  projectId,
  onRunChange,
  runs,
}: SimulationResultsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [runData, setRunData] = useState<any>(null)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    if (runId) {
      loadRunData()
    }
  }, [runId])

  const loadRunData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/simulation/runs/${runId}`)
      if (response.ok) {
        const data = await response.json()
        setRunData(data.run)
        setSnapshots(data.snapshots || [])
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados da execução:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar resultados',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      toast({
        title: 'Gerando PDF...',
      })
      
      // Importar dinamicamente para evitar problemas de SSR
      const { generateSimulationPDF } = await import('@/lib/services/pdfExporter')
      
      const projectResponse = await fetch(`/api/simulation/projects/${projectId}`)
      if (!projectResponse.ok) throw new Error('Erro ao carregar projeto')
      const projectData = await projectResponse.json()
      
      const pdfBlob = await generateSimulationPDF(
        {
          name: projectData.project.name,
          simulatorType: projectData.project.simulatorType,
          description: projectData.project.description,
        },
        runData,
        snapshots,
        events
      )
      
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `simulacao_${runId}_${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: 'PDF gerado!',
        description: 'Download iniciado',
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar PDF',
        description: error instanceof Error ? error.message : 'Tente novamente',
      })
    }
  }

  const handleExportExcel = async () => {
    try {
      toast({
        title: 'Gerando Excel...',
      })
      // Criar CSV dos snapshots
      const headers = ['Mês', 'Mês Label', 'Parcelas Pagas', 'Valor Parcelas', 'Contemplações', 'Vendas', 'Valor Vendas', 'Caixa', 'Caixa Investido', 'Patrimônio', 'Total Pago', 'Total Pago do Bolso']
      const rows = snapshots.map(s => [
        s.mes,
        s.mesLabel,
        s.parcelasPagas,
        s.valorParcelas,
        s.contemplacoes,
        s.vendas,
        s.valorVendas,
        s.caixa,
        s.caixaInvestido,
        s.patrimonio,
        s.totalPago,
        s.totalPagoBolso,
      ])
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `simulacao_${runId}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'CSV exportado!',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar CSV',
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

  if (!runData) {
    return (
      <Card className="bg-[#0B1220] border-gray-700">
        <CardContent className="py-12 text-center">
          <p className="text-gray-400">Nenhum dado encontrado</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = snapshots.map(s => ({
    mes: s.mes,
    mesLabel: s.mesLabel,
    patrimonio: s.patrimonio || 0,
    totalPago: s.totalPago || 0,
    totalPagoBolso: s.totalPagoBolso || 0,
    caixa: s.caixa || 0,
    valorVendas: s.valorVendas || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Header com seleção de execução */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Resultados da Simulação</h2>
          <p className="text-gray-400 text-sm">
            Executada em {new Date(runData.executedAt).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          {runs.length > 1 && (
            <Select value={runId} onValueChange={onRunChange}>
              <SelectTrigger className="w-[200px] bg-[#0B1220] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0B1220] border-gray-700">
                {runs.map((run) => (
                  <SelectItem key={run.id} value={run.id} className="text-white">
                    {run.name || `Execução ${new Date(run.executedAt).toLocaleDateString('pt-BR')}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileDown className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Patrimônio Final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(runData.patrimonioFinal || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Total Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(runData.totalPagoParcelas || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total Pago do Bolso: {formatCurrency(runData.totalPagoBolso || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatPercent(runData.roi || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Multiplicador: {((runData.patrimonioFinal || 0) / (runData.totalPagoBolso || 1)).toFixed(2)}x
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Custo do Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(runData.custoPatrimonio || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Por R$1 de patrimônio: R$ {((runData.totalPagoBolso || 0) / (runData.patrimonioFinal || 1)).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico: Evolução do Patrimônio */}
      <Card className="bg-[#0B1220] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Evolução do Patrimônio</CardTitle>
          <CardDescription className="text-gray-400">
            Evolução mensal do patrimônio acumulado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="mesLabel" stroke="#999" tick={{ fill: '#999', fontSize: 12 }} />
                <YAxis stroke="#999" tick={{ fill: '#999', fontSize: 12 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                />
                <Area
                  type="monotone"
                  dataKey="patrimonio"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorPatrimonio)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico: Total Pago vs Patrimônio */}
      <Card className="bg-[#0B1220] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Total Pago vs Patrimônio</CardTitle>
          <CardDescription className="text-gray-400">
            Comparação entre total investido e patrimônio acumulado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
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
                  dataKey="totalPago"
                  fill="#EF4444"
                  fillOpacity={0.3}
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Total Pago"
                />
                <Line
                  type="monotone"
                  dataKey="patrimonio"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Patrimônio"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Eventos */}
      {events.length > 0 && (
        <Card className="bg-[#0B1220] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Fluxo de Eventos</CardTitle>
            <CardDescription className="text-gray-400">
              Eventos da simulação (pagamentos, contemplações, vendas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-400">Mês</th>
                    <th className="text-left py-2 text-gray-400">Tipo</th>
                    <th className="text-left py-2 text-gray-400">Cota</th>
                    <th className="text-right py-2 text-gray-400">Valor</th>
                    <th className="text-left py-2 text-gray-400">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 50).map((event, idx) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="py-2 text-white">{event.mes}</td>
                      <td className="py-2">
                        <Badge className={
                          event.tipo === 'CONTEMPLACAO' ? 'bg-green-500/20 text-green-400' :
                          event.tipo === 'VENDA' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {event.tipo}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-400">
                        {event.cotaGrupo && event.cotaNumero ? `${event.cotaGrupo}-${event.cotaNumero}` : '-'}
                      </td>
                      <td className="py-2 text-right text-white">
                        {formatCurrency(event.valor || 0)}
                      </td>
                      <td className="py-2 text-gray-400">{event.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length > 50 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Mostrando 50 de {events.length} eventos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
