'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, Percent, Award } from 'lucide-react'

export function PatrimonioTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setData(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Carregando dados...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Erro ao carregar dados</div>
      </div>
    )
  }

  // Calcular ganho
  const totalPagoAproximado = (data.totalParcelaPagas || 0) * (data.monthlyInstallment || 0)
  const ganhoPatrimonio = (data.patrimonioAcumulado || 0) - totalPagoAproximado
  const roi = totalPagoAproximado > 0 
    ? ((data.patrimonioAcumulado || 0) / totalPagoAproximado - 1) * 100 
    : 0

  // Dados para gráfico de evolução (simulado baseado em parcelas pagas)
  const evolucaoData = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const parcelaMes = (data.monthlyInstallment || 0) * mes
    const percentMes = ((data.totalPercentPago || 0) / 12) * mes
    const patrimonioMes = (data.totalCredit || 0) * (percentMes / 100) + 
      (data.totalToReceive || 0) * (mes >= 6 ? 0.5 : 0) // Simula contemplação no mês 6
    return {
      mes,
      mesLabel: `Mês ${mes}`,
      totalPago: parcelaMes,
      patrimonio: patrimonioMes,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Patrimônio Acumulado</h2>
        <p className="text-gray-400">
          Acompanhe a evolução do seu patrimônio no consórcio
        </p>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Patrimônio Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400 break-words">
              {formatCurrencyCompact(data.patrimonioAcumulado || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Valor atual do patrimônio
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ganho de Patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold break-words ${ganhoPatrimonio >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrencyCompact(ganhoPatrimonio)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Diferença vs total pago
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercent(roi)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Total Pago (Aprox.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white break-words">
              {formatCurrencyCompact(totalPagoAproximado)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Parcelas pagas × Parcela mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolução do Patrimônio
          </CardTitle>
          <p className="text-sm text-gray-400">
            Projeção mensal do patrimônio acumulado
          </p>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolucaoData}>
                <defs>
                  <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorTotalPago" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="mesLabel" 
                  stroke="#999"
                  tick={{ fill: '#999', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#999"
                  tick={{ fill: '#999', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'patrimonio' ? 'Patrimônio' : 'Total Pago'
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
                  dataKey="patrimonio"
                  fill="url(#colorPatrimonio)"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Patrimônio Acumulado"
                />
                <Area
                  type="monotone"
                  dataKey="totalPago"
                  fill="url(#colorTotalPago)"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Total Pago"
                />
                <Line
                  type="monotone"
                  dataKey="patrimonio"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ fill: '#059669', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalPago"
                  stroke="#DC2626"
                  strokeWidth={3}
                  dot={{ fill: '#DC2626', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Detalhado */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-white text-xl">Resumo do Patrimônio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total de Cotas</p>
                <p className="text-2xl font-bold text-white">{data.totalCotas || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Cotas Contempladas</p>
                <p className="text-2xl font-bold text-green-400">{data.cotasContempladas || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">% Médio Pago</p>
                <p className="text-2xl font-bold text-white">{formatPercent(data.totalPercentPago || 0)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Crédito Total</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(data.totalCredit || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Valor a Receber</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(data.totalToReceive || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Parcela Mensal</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(data.monthlyInstallment || 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
