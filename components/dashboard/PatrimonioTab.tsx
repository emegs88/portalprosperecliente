'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
} from 'recharts'
import { TrendingUp, DollarSign, Calendar, PieChart } from 'lucide-react'

interface PatrimonioData {
  patrimonioBase: number
  aporteMensal: number
  valorPago: number
  totalCotas: number
}

interface INCCData {
  data: string
  valor: number
  variacaoMensal?: number
}

export default function PatrimonioTab() {
  const [patrimonio, setPatrimonio] = useState<PatrimonioData | null>(null)
  const [inccHistorico, setInccHistorico] = useState<INCCData[]>([])
  const [projecao, setProjecao] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Parâmetros da simulação
  const [horizonte, setHorizonte] = useState(120) // meses
  const [cenario, setCenario] = useState<'conservador' | 'realista' | 'otimista'>('realista')
  const [aporteAdicional, setAporteAdicional] = useState(0)

  useEffect(() => {
    fetchPatrimonio()
    fetchINCC()
  }, [])

  useEffect(() => {
    if (patrimonio && inccHistorico.length > 0) {
      calcularProjecao()
    }
  }, [patrimonio, inccHistorico, horizonte, cenario, aporteAdicional])

  const fetchPatrimonio = async () => {
    try {
      const res = await fetch('/api/patrimonio')
      const data = await res.json()
      setPatrimonio(data)
    } catch (error) {
      console.error('Erro ao buscar patrimônio:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchINCC = async () => {
    try {
      const res = await fetch('/api/incc')
      const data = await res.json()
      setInccHistorico(data.historico || [])
    } catch (error) {
      console.error('Erro ao buscar INCC:', error)
    }
  }

  const calcularProjecao = () => {
    if (!patrimonio) return

    const cenarios = {
      conservador: { incc: 4.5, aporte: 0.9 },
      realista: { incc: 6.5, aporte: 1.0 },
      otimista: { incc: 8.5, aporte: 1.1 },
    }

    const config = cenarios[cenario]
    const taxaINCCMensal = (config.incc / 100) / 12
    const aporteTotal = (patrimonio.aporteMensal * config.aporte) + aporteAdicional

    const projecao = []
    let patrimonioAtual = patrimonio.patrimonioBase
    let aporteAcumulado = 0
    let creditoAtual = patrimonio.patrimonioBase

    for (let i = 1; i <= horizonte; i++) {
      creditoAtual = creditoAtual * (1 + taxaINCCMensal)
      aporteAcumulado += aporteTotal
      patrimonioAtual = creditoAtual + aporteAcumulado

      projecao.push({
        mes: i,
        mesLabel: i <= 12 ? `M${i}` : i % 12 === 0 ? `${Math.floor(i / 12)}A` : '',
        patrimonio: patrimonioAtual,
        credito: creditoAtual,
        aporte: aporteAcumulado,
        ganho: patrimonioAtual - patrimonio.patrimonioBase - aporteAcumulado,
      })
    }

    setProjecao(projecao)
  }

  if (loading) {
    return <div className="text-white">Carregando...</div>
  }

  if (!patrimonio) {
    return (
      <Card className="bg-black/50 border-red-600/20">
        <CardContent className="p-6 text-center text-white">
          <p>Nenhum dado disponível. Importe um PDF para começar.</p>
        </CardContent>
      </Card>
    )
  }

  const patrimonioFinal = projecao[projecao.length - 1]?.patrimonio || patrimonio.patrimonioBase
  const ganhoProjetado = patrimonioFinal - patrimonio.patrimonioBase - (projecao.reduce((sum, p) => sum + (patrimonio.aporteMensal + aporteAdicional), 0) || 0)

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Patrimônio Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-500">
              {formatCurrency(patrimonio.valorPago)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Valor já pago (parcelas)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-red-600/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Patrimônio Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(patrimonio.patrimonioBase)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Soma dos valores do bem</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Aporte Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {formatCurrency(patrimonio.aporteMensal)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Parcelas mensais totais</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Patrimônio Final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">
              {formatCurrency(patrimonioFinal)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Projetado para {Math.floor(horizonte / 12)} anos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ganho Projetado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">
              {formatCurrency(ganhoProjetado)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ganho líquido estimado</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white">Parâmetros da Simulação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Cenário</Label>
              <Select value={cenario} onValueChange={(value: any) => setCenario(value)}>
                <SelectTrigger className="bg-black border-red-600/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservador">Conservador (4.5% INCC)</SelectItem>
                  <SelectItem value="realista">Realista (6.5% INCC)</SelectItem>
                  <SelectItem value="otimista">Otimista (8.5% INCC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Horizonte: {horizonte} meses ({Math.floor(horizonte / 12)} anos)</Label>
              <Slider
                value={[horizonte]}
                onValueChange={([value]) => setHorizonte(value)}
                min={12}
                max={240}
                step={6}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Aporte Adicional Mensal (R$)</Label>
              <Input
                type="number"
                value={aporteAdicional}
                onChange={(e) => setAporteAdicional(Number(e.target.value))}
                className="bg-black border-red-600/20 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Principal: Evolução do Patrimônio */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Evolução Patrimonial Projetada</CardTitle>
          <p className="text-sm text-gray-400">Projeção com INCC e aportes mensais</p>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projecao.filter((_, i) => i % 6 === 0 || i === projecao.length - 1)}>
                <defs>
                  <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#999"
                  tickFormatter={(value) => value <= 12 ? `M${value}` : `${Math.floor(value / 12)}A`}
                />
                <YAxis 
                  stroke="#999"
                  tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
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
                <Legend />
                <Area
                  type="monotone"
                  dataKey="patrimonio"
                  fill="url(#colorPatrimonio)"
                  stroke="#DC2626"
                  strokeWidth={3}
                  name="Patrimônio Total"
                />
                <Line
                  type="monotone"
                  dataKey="credito"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Crédito (com INCC)"
                />
                <Line
                  type="monotone"
                  dataKey="aporte"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Aporte Acumulado"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico: Histórico INCC */}
      {inccHistorico.length > 0 && (
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Histórico INCC - Últimos 12 Meses</CardTitle>
            <p className="text-sm text-gray-400">Índice Nacional de Custo da Construção</p>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inccHistorico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="data" stroke="#999" />
                  <YAxis 
                    stroke="#999"
                    tickFormatter={(value) => `${value.toFixed(2)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F1F1F',
                      border: '1px solid #DC2626',
                      color: '#fff',
                    }}
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                  />
                  <Bar dataKey="valor" fill="#DC2626" name="INCC Mensal (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparação de Cenários */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Comparação de Cenários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projecao.filter((_, i) => i % 12 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#999"
                  tickFormatter={(value) => `${Math.floor(value / 12)}A`}
                />
                <YAxis 
                  stroke="#999"
                  tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F1F1F',
                    border: '1px solid #DC2626',
                    color: '#fff',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="patrimonio"
                  stroke="#DC2626"
                  strokeWidth={3}
                  name="Cenário Atual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
