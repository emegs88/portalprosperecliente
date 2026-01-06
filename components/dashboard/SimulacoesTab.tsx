'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { TrendingUp, DollarSign, Calculator } from 'lucide-react'

interface Quota {
  id: string
  grupo: string
  cota: string
  vlBem: number
  vlParcela: number
  percentPago: number
}

export default function SimulacoesTab() {
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [selectedQuota, setSelectedQuota] = useState<Quota | null>(null)
  const [loading, setLoading] = useState(true)

  // Parâmetros da simulação
  const [valorVenda, setValorVenda] = useState(0)
  const [taxaVenda, setTaxaVenda] = useState(5) // % de taxa de venda
  const [horizonte, setHorizonte] = useState(120)

  useEffect(() => {
    fetch('/api/cotas')
      .then(res => res.json())
      .then(data => {
        setQuotas(data.quotas || [])
        if (data.quotas && data.quotas.length > 0) {
          setSelectedQuota(data.quotas[0])
          setValorVenda(data.quotas[0].vlBem * 1.2) // 20% acima
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedQuota) {
      setValorVenda(selectedQuota.vlBem * 1.2)
    }
  }, [selectedQuota])

  if (loading) {
    return <div className="text-white">Carregando...</div>
  }

  // Cálculo da simulação de venda
  const calcularVenda = () => {
    if (!selectedQuota) return null

    const valorLiquido = valorVenda * (1 - taxaVenda / 100)
    const ganho = valorLiquido - selectedQuota.vlBem
    const roi = (ganho / selectedQuota.vlBem) * 100

    return {
      valorVenda,
      taxaVenda,
      valorLiquido,
      ganho,
      roi,
    }
  }

  // Simulação de fluxo de caixa
  const calcularFluxoCaixa = () => {
    if (!selectedQuota) return []

    const fluxo = []
    const mesesPagos = Math.floor((selectedQuota.percentPago / 100) * horizonte)
    
    for (let i = 1; i <= horizonte; i++) {
      if (i <= mesesPagos) {
        fluxo.push({
          mes: i,
          entrada: 0,
          saida: selectedQuota.vlParcela,
          saldo: -selectedQuota.vlParcela * i,
          tipo: 'Parcela',
        })
      } else {
        fluxo.push({
          mes: i,
          entrada: i === horizonte ? valorVenda * (1 - taxaVenda / 100) : 0,
          saida: selectedQuota.vlParcela,
          saldo: (valorVenda * (1 - taxaVenda / 100)) - (selectedQuota.vlParcela * horizonte),
          tipo: i === horizonte ? 'Venda' : 'Parcela',
        })
      }
    }

    return fluxo
  }

  const vendaSimulada = calcularVenda()
  const fluxoCaixa = calcularFluxoCaixa()
  const saldoFinal = fluxoCaixa[fluxoCaixa.length - 1]?.saldo || 0

  return (
    <div className="space-y-6">
      {/* Seleção de Cota */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador de Venda de Cota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Selecione a Cota</Label>
              <Select
                value={selectedQuota?.id || ''}
                onValueChange={(value) => {
                  const quota = quotas.find(q => q.id === value)
                  setSelectedQuota(quota || null)
                }}
              >
                <SelectTrigger className="bg-black border-red-600/20 text-white">
                  <SelectValue placeholder="Selecione uma cota" />
                </SelectTrigger>
                <SelectContent>
                  {quotas.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.grupo} {q.cota} - {formatCurrency(q.vlBem)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedQuota && (
              <div className="p-4 bg-black/30 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm text-white">
                  <div>
                    <span className="text-gray-400">Valor do Bem:</span>
                    <p className="font-bold">{formatCurrency(selectedQuota.vlBem)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Parcela Mensal:</span>
                    <p className="font-bold">{formatCurrency(selectedQuota.vlParcela)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">% Pago:</span>
                    <p className="font-bold">{formatPercent(selectedQuota.percentPago)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedQuota && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Valor de Venda (R$)</Label>
                  <Input
                    type="number"
                    value={valorVenda}
                    onChange={(e) => setValorVenda(Number(e.target.value))}
                    className="bg-black border-red-600/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Taxa de Venda: {taxaVenda}%</Label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={taxaVenda}
                    onChange={(e) => setTaxaVenda(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {vendaSimulada && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/30 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Valor Líquido</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(vendaSimulada.valorLiquido)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Ganho</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(vendaSimulada.ganho)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">ROI</p>
                    <p className="text-xl font-bold text-green-500">
                      {vendaSimulada.roi.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Saldo Final</p>
                    <p className="text-xl font-bold text-blue-500">
                      {formatCurrency(saldoFinal)}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Gráfico: Fluxo de Caixa */}
      {selectedQuota && fluxoCaixa.length > 0 && (
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Fluxo de Caixa Projetado</CardTitle>
            <p className="text-sm text-gray-400">Entradas, saídas e saldo acumulado</p>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fluxoCaixa.filter((_, i) => i % 12 === 0 || i === fluxoCaixa.length - 1)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#999"
                    tickFormatter={(value) => `${Math.floor(value / 12)}A`}
                  />
                  <YAxis 
                    stroke="#999"
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
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
                  <Bar dataKey="entrada" fill="#10B981" name="Entrada" />
                  <Bar dataKey="saida" fill="#DC2626" name="Saída" />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Saldo Acumulado"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
