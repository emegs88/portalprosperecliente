'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  LineChart,
  AreaChart,
  Area,
  Line,
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
import { Heart, TrendingUp, DollarSign, Gift, Sparkles } from 'lucide-react'

interface ProspereVidaData {
  cashbackAcumulado: number
  cashbackMensal: number
  totalParcelasPagas: number
  aporteMensalTotal: number
  mesesProjecao: number
  taxaCashback: number
  projecao: Array<{
    mes: number
    mesLabel: string
    cashbackMensal: number
    caixaDoadoAcumulado: number
    aporteMensal: number
  }>
  totalCotas: number
}

export function ProspereVidaTab() {
  const [data, setData] = useState<ProspereVidaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProspereVida()
  }, [])

  const fetchProspereVida = async () => {
    try {
      const res = await fetch('/api/prospere-vida')
      const dados = await res.json()
      setData(dados)
    } catch (error) {
      console.error('Erro ao buscar dados Prospere Vida:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-white text-center py-12">
        <div className="animate-pulse">Carregando...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="bg-black/50 border-red-600/20">
        <CardContent className="p-6 text-center text-white">
          <p>Nenhum dado disponível. Importe um PDF para começar.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com Logo e Descrição */}
      <Card className="bg-gradient-to-br from-red-600/20 to-red-800/10 border-red-600/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-600/20 rounded-full">
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Prospere Vida</h2>
              <p className="text-gray-300 text-sm">
                Cashback de {data.taxaCashback}% das suas parcelas revertido para ações sociais
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Cada parcela paga gera um cashback de {data.taxaCashback}% que é destinado a ações sociais da Prospere. 
            Seu impacto positivo na comunidade cresce junto com seu patrimônio!
          </p>
        </CardContent>
      </Card>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Caixa Doado Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {formatCurrency(data.cashbackAcumulado)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatPercent(data.taxaCashback / 100)} das parcelas pagas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cashback Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">
              {formatCurrency(data.cashbackMensal)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatPercent(data.taxaCashback / 100)} do aporte mensal
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Projeção 10 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">
              {formatCurrency(data.projecao[data.projecao.length - 1]?.caixaDoadoAcumulado || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Caixa total projetado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Total Parcelas Pagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-500">
              {formatCurrency(data.totalParcelasPagas)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Base para cálculo do cashback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal: Evolução do Caixa Doado */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Evolução do Caixa Doado (Atual + Projeção)
          </CardTitle>
          <p className="text-sm text-gray-400">
            Projeção dos próximos {data.mesesProjecao} meses baseada no aporte mensal atual
          </p>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.projecao}>
                <defs>
                  <linearGradient id="colorCaixaDoado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCashbackMensal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="mesLabel" 
                  stroke="#999"
                  tick={{ fill: '#999' }}
                />
                <YAxis 
                  stroke="#999"
                  tick={{ fill: '#999' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F1F1F',
                    border: '1px solid #DC2626',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Caixa Doado Acumulado' || name === 'Cashback Mensal') {
                      return formatCurrency(value)
                    }
                    return value
                  }}
                  labelStyle={{ color: '#DC2626', fontWeight: 'bold' }}
                />
                <Legend 
                  wrapperStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="caixaDoadoAcumulado"
                  fill="url(#colorCaixaDoado)"
                  stroke="#DC2626"
                  strokeWidth={3}
                  name="Caixa Doado Acumulado"
                />
                <Bar
                  dataKey="cashbackMensal"
                  fill="url(#colorCashbackMensal)"
                  name="Cashback Mensal"
                  radius={[8, 8, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico: Comparação Atual vs Projetado */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Impacto Social Projetado</CardTitle>
          <p className="text-sm text-gray-400">
            Visualize a diferença entre o caixa doado atual e a projeção futura
          </p>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  {
                    label: 'Atual',
                    valor: data.cashbackAcumulado,
                    cor: '#DC2626',
                  },
                  {
                    label: `Em ${data.mesesProjecao} meses`,
                    valor: data.projecao[data.projecao.length - 1]?.caixaDoadoAcumulado || 0,
                    cor: '#10B981',
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="label" 
                  stroke="#999"
                  tick={{ fill: '#999' }}
                />
                <YAxis 
                  stroke="#999"
                  tick={{ fill: '#999' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F1F1F',
                    border: '1px solid #DC2626',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar 
                  dataKey="valor" 
                  fill="#DC2626"
                  radius={[8, 8, 0, 0]}
                  name="Caixa Doado"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white">Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-600/10 rounded-lg border border-red-600/20">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-500" />
                Cashback Automático
              </h3>
              <p className="text-gray-300 text-sm">
                A cada parcela paga, {data.taxaCashback}% do valor é automaticamente revertido para o 
                caixa de ações sociais da Prospere. Sem custo adicional para você!
              </p>
            </div>
            <div className="p-4 bg-green-600/10 rounded-lg border border-green-600/20">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-500" />
                Impacto Social
              </h3>
              <p className="text-gray-300 text-sm">
                O valor acumulado é utilizado para apoiar projetos sociais, comunidades carentes e 
                iniciativas de desenvolvimento sustentável, criando um ciclo positivo de prosperidade.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Projeção e Crescimento
            </h3>
            <p className="text-gray-300 text-sm">
              Com base no seu aporte mensal atual de {formatCurrency(data.aporteMensalTotal)}, 
              você contribuirá com aproximadamente {formatCurrency(data.cashbackMensal)} por mês 
              para ações sociais. Em {data.mesesProjecao} meses, o total acumulado será de 
              aproximadamente {formatCurrency(data.projecao[data.projecao.length - 1]?.caixaDoadoAcumulado || 0)}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
