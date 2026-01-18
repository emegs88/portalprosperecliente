'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/lib/utils'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, Percent, Calendar, Award, Target, Zap } from 'lucide-react'

export function DashboardTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
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

  // Dados para gráfico de pizza
  const pieData = [
    { name: 'Contempladas', value: data.cotasContempladas || 0, color: '#10B981' },
    { name: 'Não Contempladas', value: (data.totalCotas || 0) - (data.cotasContempladas || 0), color: '#EF4444' },
  ]

  // Calcular ganho
  const totalPagoAproximado = (data.totalParcelaPagas || 0) * (data.monthlyInstallment || 0)
  const ganhoPatrimonio = (data.patrimonioAcumulado || 0) - totalPagoAproximado
  const roi = totalPagoAproximado > 0 
    ? ((data.patrimonioAcumulado || 0) / totalPagoAproximado - 1) * 100 
    : 0

  return (
    <div className="space-y-8">
      {/* Header com frase da marca */}
      <div className="bg-gradient-to-r from-red-600/20 via-blue-600/20 to-indigo-600/20 border-l-4 border-red-500 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Você não precisa de sorte. Precisa de estratégia.
        </h1>
        <p className="text-gray-300 text-lg">
          Acompanhe sua jornada para construir patrimônio através do consórcio
        </p>
      </div>

      {/* Cards Principais - Estilo Prospere */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/50 hover:border-blue-400 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Total de Cotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-1">
              {data.totalCotas || 0}
            </div>
            <p className="text-xs text-blue-300/80 mt-1">
              {data.cotasContempladas || 0} contempladas • {data.cotasNaoContempladas || 0} não contempladas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/50 hover:border-green-400 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-200 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Crédito Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white break-words">
              {formatCurrencyCompact(data.totalCredit || 0)}
            </div>
            <p className="text-xs text-green-300/80 mt-1">
              Valor total dos bens
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/50 hover:border-purple-400 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Parcela Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white break-words">
              {formatCurrencyCompact(data.monthlyInstallment || 0)}
            </div>
            <p className="text-xs text-purple-300/80 mt-1">
              Aporte mensal total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/50 hover:border-yellow-400 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white break-words">
              {formatCurrencyCompact(data.totalToReceive || 0)}
            </div>
            <p className="text-xs text-yellow-300/80 mt-1">
              Valor das cotas contempladas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda Linha - Métricas de Estratégia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-500/50 hover:border-red-400 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-200 flex items-center gap-2">
              <Target className="w-5 h-5 text-red-400" />
              Patrimônio Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white break-words">
              {formatCurrencyCompact(data.patrimonioAcumulado || 0)}
            </div>
            <p className="text-xs text-red-300/80 mt-1">
              Valor acumulado atual
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${ganhoPatrimonio >= 0 ? 'from-green-600/20 to-green-800/20 border-green-500/50' : 'from-red-600/20 to-red-800/20 border-red-500/50'} hover:opacity-90 transition-all`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${ganhoPatrimonio >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              <TrendingUp className={`w-5 h-5 ${ganhoPatrimonio >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              Ganho de Patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold break-words ${ganhoPatrimonio >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrencyCompact(ganhoPatrimonio)}
            </div>
            <p className={`text-xs mt-1 ${ganhoPatrimonio >= 0 ? 'text-green-300/80' : 'text-red-300/80'}`}>
              Diferença vs total pago
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${roi >= 0 ? 'from-blue-600/20 to-blue-800/20 border-blue-500/50' : 'from-red-600/20 to-red-800/20 border-red-500/50'} hover:opacity-90 transition-all`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${roi >= 0 ? 'text-blue-200' : 'text-red-200'}`}>
              <Percent className={`w-5 h-5 ${roi >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${roi >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              {formatPercent(roi)}
            </div>
            <p className={`text-xs mt-1 ${roi >= 0 ? 'text-blue-300/80' : 'text-red-300/80'}`}>
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-700/20 to-gray-800/20 border-gray-600/50 hover:border-gray-500 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Percent className="w-5 h-5 text-gray-400" />
              % Médio Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatPercent(data.totalPercentPago || 0)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Percentual médio pago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção: Pilares da Estratégia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-600/10 to-red-800/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Sem juros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              Consórcio é investimento sem juros. Você paga apenas a administração e constrói patrimônio.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Planejamento inteligente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              Estratégia definida: {formatPercent(data.totalPercentPago || 0)} já pagos. {formatCurrencyCompact(data.patrimonioAcumulado || 0)} de patrimônio acumulado.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/10 to-green-800/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Cartas contempladas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              {data.cotasContempladas || 0} de {data.totalCotas || 0} cotas já contempladas. Total a receber: {formatCurrencyCompact(data.totalToReceive || 0)}.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white text-lg font-bold">Investimento patrimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              ROI de {formatPercent(roi)}. Patrimônio atual: {formatCurrencyCompact(data.patrimonioAcumulado || 0)}.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza: Distribuição de Cotas */}
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Distribuição de Cotas</CardTitle>
            <p className="text-sm text-gray-400">
              Cotas contempladas vs não contempladas
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} cotas`, 'Quantidade']}
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#9CA3AF', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras: Resumo Financeiro */}
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Resumo Financeiro</CardTitle>
            <p className="text-sm text-gray-400">
              Principais valores do consórcio
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Crédito', value: data.totalCredit || 0, color: '#3B82F6' },
                  { name: 'Patrimônio', value: data.patrimonioAcumulado || 0, color: '#10B981' },
                  { name: 'A Receber', value: data.totalToReceive || 0, color: '#F59E0B' },
                  { name: 'Parcela Mensal', value: data.monthlyInstallment || 0, color: '#EF4444' },
                ]}>
                  <defs>
                    <linearGradient id="colorBar1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorBar2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorBar3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorBar4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
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
                    dataKey="value" 
                    fill="url(#colorBar1)" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
