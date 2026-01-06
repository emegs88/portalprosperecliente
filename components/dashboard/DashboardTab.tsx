'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, DollarSign, PieChart as PieChartIcon } from 'lucide-react'

interface DashboardData {
  totalCotas: number
  totalCredito: number
  parcelaMensalTotal: number
  totalReceber: number
  topCotas: Array<{
    grupo: string
    cota: string
    vlBem: number
    percentPago: number
  }>
  patrimonioAcumulado: Array<{
    mes: string
    atual: number
    projetado: number
  }>
}

const COLORS = ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA']

export default function DashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-lg">Carregando dados...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-white">
        <Card className="bg-black/50 border-red-600/20">
          <CardContent className="p-6">
            <p className="text-center">Nenhum dado disponível. Importe um PDF para começar.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Garantir que topCotas seja sempre um array
  const topCotas = data.topCotas || []
  const patrimonioAcumulado = data.patrimonioAcumulado || []

  // Dados para gráfico de pizza
  const pieData = topCotas.map((q, idx) => ({
    name: `${q.grupo}-${q.cota}`,
    value: q.vlBem,
    color: COLORS[idx % COLORS.length],
  }))

  // % Pago médio
  const percentPagoMedio = topCotas.length > 0
    ? topCotas.reduce((sum, q) => sum + q.percentPago, 0) / topCotas.length
    : 0

  return (
    <div className="space-y-6">
      {/* Cards de Resumo - Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-red-600/30 hover:border-red-600/50 transition-all hover:shadow-lg hover:shadow-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total de Cotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary mb-1">{data.totalCotas}</p>
            <p className="text-xs text-gray-500">Cotas ativas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/30 hover:border-blue-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-400 mb-1">
              {formatCurrency(data.totalCredito).replace('R$', '').trim()}
            </p>
            <p className="text-xs text-gray-500">Valor total do bem</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent border-green-500/30 hover:border-green-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xs font-medium text-gray-400 uppercase tracking-wider">
              Parcela Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-400 mb-1">
              {formatCurrency(data.parcelaMensalTotal).replace('R$', '').trim()}
            </p>
            <p className="text-xs text-gray-500">Aporte mensal total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/30 hover:border-yellow-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-400 mb-1">
              {formatCurrency(data.totalReceber).replace('R$', '').trim()}
            </p>
            <p className="text-xs text-gray-500">Valor total a receber</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/30 hover:border-purple-500/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xs font-medium text-gray-400 uppercase tracking-wider">
              % Pago Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-400 mb-1">
              {formatPercent(percentPagoMedio).replace('%', '')}
            </p>
            <p className="text-xs text-gray-500">Percentual médio pago</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos em Grid Fixo e Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Patrimônio Acumulado - Área com gradiente */}
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg font-semibold">
                  Patrimônio Acumulado
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">Projeção com INCC e aportes mensais</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {patrimonioAcumulado.length > 0 ? (
              <div className="w-full" style={{ minHeight: '400px', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={patrimonioAcumulado}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#999' }}
                    />
                    <YAxis 
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#999' }}
                      tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F1F1F',
                        border: '1px solid #DC2626',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '12px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#fff', marginBottom: '8px' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      iconSize={10}
                    />
                    <Area
                      type="monotone"
                      dataKey="atual"
                      stroke="#DC2626"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAtual)"
                      name="Atual"
                    />
                    <Area
                      type="monotone"
                      dataKey="projetado"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorProjetado)"
                      name="Projetado"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-400">
                Nenhum dado para exibir. Importe um PDF para ver os gráficos.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 2: Top Cotas - Barras com efeito premium */}
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg font-semibold">
                  Top 5 Cotas por Valor
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">Maiores valores de bem</p>
              </div>
              <PieChartIcon className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {topCotas.length > 0 ? (
              <div className="w-full" style={{ minHeight: '400px', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCotas}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="cota"
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#999' }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <YAxis
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#999' }}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F1F1F',
                        border: '1px solid #DC2626',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '12px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Cota ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                    />
                    <Bar 
                      dataKey="vlBem" 
                      fill="#DC2626" 
                      name="Valor do Bem"
                      radius={[8, 8, 0, 0]}
                    >
                      {topCotas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-400">
                Nenhum dado para exibir. Importe um PDF para ver os gráficos.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Pizza: Distribuição por Valor */}
      {topCotas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/50 border-red-600/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Distribuição por Valor</CardTitle>
              <p className="text-sm text-gray-400">Top 5 cotas</p>
            </CardHeader>
            <CardContent>
              <div className="w-full" style={{ minHeight: '350px', height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F1F1F',
                        border: '1px solid #DC2626',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Top Cotas - Melhorada */}
          <Card className="bg-black/50 border-red-600/20">
            <CardHeader>
              <CardTitle className="text-white text-lg font-semibold">Top Cotas</CardTitle>
              <p className="text-sm text-gray-400">Cotas com maiores valores e percentuais pagos</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-red-600/30 bg-black/30">
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Grupo</th>
                      <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Cota</th>
                      <th className="text-right p-4 font-semibold text-sm uppercase tracking-wider">Valor do Bem</th>
                      <th className="text-right p-4 font-semibold text-sm uppercase tracking-wider">% Pago</th>
                      <th className="text-right p-4 font-semibold text-sm uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCotas.length > 0 ? (
                      topCotas.map((item, idx) => (
                        <tr 
                          key={idx} 
                          className="border-b border-red-600/10 hover:bg-red-600/5 transition-colors"
                        >
                          <td className="p-4 font-mono text-sm">{item.grupo}</td>
                          <td className="p-4 font-mono text-sm">{item.cota}</td>
                          <td className="p-4 text-right font-semibold">{formatCurrency(item.vlBem)}</td>
                          <td className="p-4 text-right">
                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                              {formatPercent(item.percentPago)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                              Em andamento
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                          Nenhuma cota encontrada. Importe um PDF para começar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
