'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { StatCard } from './StatCard'
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/lib/utils'
import { DashboardSkeleton } from './LoadingSkeleton'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, Percent, Calendar, Award, Target } from 'lucide-react'

export function DashboardTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/dashboard', {
        next: { revalidate: 30 },
      })
      
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      setData(data)
    } catch (err: any) {
      console.error('Error fetching dashboard:', err)
      setError(err.message || 'Erro ao carregar dados')
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados do dashboard. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Memoizar cálculos pesados
  const calculations = useMemo(() => {
    if (!data) return null

    const pieData = [
      { name: 'Contempladas', value: data.cotasContempladas || 0, color: '#10B981' },
      { name: 'Não Contempladas', value: (data.totalCotas || 0) - (data.cotasContempladas || 0), color: '#EF4444' },
    ]

    const totalPagoAproximado = (data.totalParcelaPagas || 0) * (data.monthlyInstallment || 0)
    const ganhoPatrimonio = (data.patrimonioAcumulado || 0) - totalPagoAproximado
    const roi = totalPagoAproximado > 0 
      ? ((data.patrimonioAcumulado || 0) / totalPagoAproximado - 1) * 100 
      : 0

    return { pieData, totalPagoAproximado, ganhoPatrimonio, roi }
  }, [data])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <Card className="bg-[#0B1220] border-[rgba(239,68,68,0.3)] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)]">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-[#EF4444] font-medium">Erro ao carregar dados</p>
            <p className="text-[#9CA3AF] text-sm">{error || 'Dados não disponíveis'}</p>
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { pieData, ganhoPatrimonio, roi } = calculations!

  return (
    <div className="space-y-8">
      {/* Header com frase da marca */}
      <div className="bg-[#0B1220] border border-[rgba(59,130,246,0.35)] border-l-4 rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)]">
        <h1 className="text-3xl font-bold text-[#FFFFFF] mb-2">
          Você não precisa de sorte. Precisa de estratégia.
        </h1>
        <p className="text-[#9CA3AF] text-lg">
          Acompanhe sua jornada para construir patrimônio através do consórcio
        </p>
      </div>

      {/* Cards Principais - Primeira Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Cotas"
          value={data.totalCotas || 0}
          description={`${data.cotasContempladas || 0} contempladas • ${data.cotasNaoContempladas || 0} não contempladas`}
          icon={Target}
          variant="default"
        />

        <StatCard
          title="Crédito Total"
          value={formatCurrencyCompact(data.totalCredit || 0)}
          description="Valor total dos bens"
          icon={DollarSign}
          variant="default"
        />

        <StatCard
          title="Parcela Mensal"
          value={formatCurrencyCompact(data.monthlyInstallment || 0)}
          description="Aporte mensal total"
          icon={Calendar}
          variant="default"
        />

        <StatCard
          title="Total a Receber"
          value={formatCurrencyCompact(data.totalToReceive || 0)}
          description="Valor das cotas contempladas"
          icon={Award}
          variant="default"
        />
      </div>

      {/* Segunda Linha - Métricas de Estratégia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patrimônio Acumulado"
          value={formatCurrencyCompact(data.patrimonioAcumulado || 0)}
          description="Valor acumulado atual"
          icon={Target}
          variant="default"
        />

        <StatCard
          title="Ganho de Patrimônio"
          value={formatCurrencyCompact(ganhoPatrimonio)}
          description="Diferença vs total pago"
          icon={TrendingUp}
          variant={ganhoPatrimonio >= 0 ? 'positive' : 'negative'}
        />

        <StatCard
          title="ROI"
          value={formatPercent(roi)}
          description="Retorno sobre investimento"
          icon={Percent}
          variant={roi >= 0 ? 'positive' : 'negative'}
        />

        <StatCard
          title="% Médio Pago"
          value={formatPercent(data.totalPercentPago || 0)}
          description="Percentual médio pago"
          icon={Percent}
          variant="default"
        />
      </div>

      {/* Seção: Pilares da Estratégia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)] hover:translate-y-[-2px] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_48px_rgba(0,0,0,0.65)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-200">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-[#FFFFFF] text-lg font-bold">Sem juros</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              Consórcio é investimento sem juros. Você paga apenas a administração e constrói patrimônio.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)] hover:translate-y-[-2px] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_48px_rgba(0,0,0,0.65)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-200">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-[#FFFFFF] text-lg font-bold">Planejamento inteligente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              Estratégia definida: {formatPercent(data.totalPercentPago || 0)} já pagos. {formatCurrencyCompact(data.patrimonioAcumulado || 0)} de patrimônio acumulado.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)] hover:translate-y-[-2px] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_48px_rgba(0,0,0,0.65)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-200">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-[#FFFFFF] text-lg font-bold">Cartas contempladas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              {data.cotasContempladas || 0} de {data.totalCotas || 0} cotas já contempladas. Total a receber: {formatCurrencyCompact(data.totalToReceive || 0)}.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)] hover:translate-y-[-2px] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_48px_rgba(0,0,0,0.65)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-200">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-[#FFFFFF] text-lg font-bold">Investimento patrimonial</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-[#9CA3AF] text-sm leading-relaxed">
              ROI de {formatPercent(roi)}. Patrimônio atual: {formatCurrencyCompact(data.patrimonioAcumulado || 0)}.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza: Distribuição de Cotas */}
        <Card className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)]">
          <CardHeader>
            <CardTitle className="text-[#FFFFFF] text-lg">Distribuição de Cotas</CardTitle>
            <p className="text-[#9CA3AF] text-sm">
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
                      backgroundColor: '#0B1220', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                    labelStyle={{ color: '#FFFFFF', marginBottom: '8px' }}
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
        <Card className="bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)]">
          <CardHeader>
            <CardTitle className="text-[#FFFFFF] text-lg">Resumo Financeiro</CardTitle>
            <p className="text-[#9CA3AF] text-sm">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
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
                      backgroundColor: '#0B1220', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                    labelStyle={{ color: '#FFFFFF', marginBottom: '8px' }}
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
