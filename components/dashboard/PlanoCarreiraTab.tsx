'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  calculateCommission,
  getLevels,
  getPlan,
  type CommissionResult,
} from '@/lib/services/commissionService'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { TrendingUp, Award, Users, Target } from 'lucide-react'

export function PlanoCarreiraTab() {
  const plan = getPlan()
  const levels = getLevels()
  
  // Estado do simulador
  const [simulation, setSimulation] = useState({
    creditBRL: 200000,
    productId: 'imovel',
    levelId: 'consultor',
    hasPartner: false,
    hasLeader: true,
  })
  
  const [result, setResult] = useState<CommissionResult | null>(null)

  const calculate = () => {
    try {
      const calc = calculateCommission(simulation)
      setResult(calc)
    } catch (error: any) {
      console.error('Erro ao calcular comissão:', error)
      alert(error.message || 'Erro ao calcular comissão')
    }
  }

  // Dados para gráfico de split
  const splitData = result ? [
    { name: 'Vendedor', value: result.sellerCommission, color: '#10B981' },
    { name: 'Líder', value: result.leaderCommission, color: '#3B82F6' },
    { name: 'Parceiro', value: result.partnerCommission, color: '#F59E0B' },
  ].filter(item => item.value > 0) : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Plano de Carreira e Comissão
        </h2>
        <p className="text-gray-400 text-lg">
          Você evolui por performance e consistência. Cada nível aumenta: comissão, bônus, acesso a leads e participação em projetos.
        </p>
      </div>

      {/* Níveis de Carreira */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Níveis de Carreira
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => (
            <Card
              key={level.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-blue-500/50 transition-all"
            >
              <CardHeader>
                <CardTitle className="text-white text-lg">{level.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  {level.description || 'Sem descrição'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Requisitos */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Requisitos:</p>
                  {level.requirements.monthlySalesCount && (
                    <p className="text-white text-sm">
                      {level.requirements.monthlySalesCount} venda(s)/mês
                    </p>
                  )}
                  {level.requirements.monthlyCreditBRL && (
                    <p className="text-white text-sm">
                      {formatCurrency(level.requirements.monthlyCreditBRL)}/mês
                    </p>
                  )}
                  {level.requirements.teamActive && (
                    <p className="text-white text-sm">
                      {level.requirements.teamActive} pessoa(s) na equipe
                    </p>
                  )}
                  {level.requirements.teamMonthlyCreditBRL && (
                    <p className="text-white text-sm">
                      {formatCurrency(level.requirements.teamMonthlyCreditBRL)} equipe/mês
                    </p>
                  )}
                </div>

                {/* Split */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Split de Comissão:</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-400">
                      Vendedor: {formatPercent(level.split.seller)}
                    </p>
                    <p className="text-blue-400">
                      Líder: {formatPercent(level.split.leader)}
                    </p>
                    {level.split.partner && (
                      <p className="text-yellow-400">
                        Parceiro: {formatPercent(level.split.partner)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bônus */}
                {level.bonus && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Bônus:</p>
                    {level.bonus.type === 'fixed' && level.bonus.valueBRL && (
                      <p className="text-purple-400 font-bold">
                        {formatCurrency(level.bonus.valueBRL)}/mês
                      </p>
                    )}
                    {level.bonus.type === 'percentOfCommission' && level.bonus.value && (
                      <p className="text-purple-400 font-bold">
                        +{formatPercent(level.bonus.value)} da comissão
                      </p>
                    )}
                  </div>
                )}

                {/* Override */}
                {level.override && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Override:</p>
                    <p className="text-orange-400 font-bold">
                      {formatPercent(level.override.value)} do crédito da equipe
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Simulador de Comissão */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Simulador de Comissão
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Parâmetros</CardTitle>
              <CardDescription className="text-gray-400">
                Configure os parâmetros para calcular a comissão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Valor do Crédito (R$)</Label>
                <Input
                  type="number"
                  value={simulation.creditBRL}
                  onChange={(e) =>
                    setSimulation({ ...simulation, creditBRL: Number(e.target.value) })
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Produto</Label>
                <Select
                  value={simulation.productId}
                  onValueChange={(value) =>
                    setSimulation({ ...simulation, productId: value })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (x{product.commissionMultiplier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Nível do Vendedor</Label>
                <Select
                  value={simulation.levelId}
                  onValueChange={(value) =>
                    setSimulation({ ...simulation, levelId: value })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasLeader"
                  checked={simulation.hasLeader}
                  onCheckedChange={(checked) =>
                    setSimulation({ ...simulation, hasLeader: checked as boolean })
                  }
                />
                <Label htmlFor="hasLeader" className="text-gray-300 cursor-pointer">
                  Tem Líder
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPartner"
                  checked={simulation.hasPartner}
                  onCheckedChange={(checked) =>
                    setSimulation({ ...simulation, hasPartner: checked as boolean })
                  }
                />
                <Label htmlFor="hasPartner" className="text-gray-300 cursor-pointer">
                  Tem Parceiro
                </Label>
              </div>

              <Button onClick={calculate} className="w-full">
                Calcular Comissão
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Resultado</CardTitle>
              <CardDescription className="text-gray-400">
                Distribuição da comissão calculada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Total */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Comissão Total</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(result.totalCommission)}
                    </p>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">Vendedor:</span>
                      <span className="text-white font-bold">
                        {formatCurrency(result.sellerCommission)}
                      </span>
                    </div>
                    {result.leaderCommission > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400">Líder:</span>
                        <span className="text-white font-bold">
                          {formatCurrency(result.leaderCommission)}
                        </span>
                      </div>
                    )}
                    {result.partnerCommission > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400">Parceiro:</span>
                        <span className="text-white font-bold">
                          {formatCurrency(result.partnerCommission)}
                        </span>
                      </div>
                    )}
                    {result.override && (
                      <div className="flex justify-between items-center">
                        <span className="text-orange-400">Override:</span>
                        <span className="text-white font-bold">
                          {formatCurrency(result.override)}
                        </span>
                      </div>
                    )}
                    {result.bonus && (
                      <div className="flex justify-between items-center">
                        <span className="text-purple-400">Bônus do Nível:</span>
                        <span className="text-white font-bold">
                          {formatCurrency(result.bonus)}
                        </span>
                      </div>
                    )}
                    {result.metaBonus && (
                      <div className="flex justify-between items-center">
                        <span className="text-pink-400">Bônus de Meta:</span>
                        <span className="text-white font-bold">
                          {formatCurrency(result.metaBonus)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Gráfico de Split */}
                  {splitData.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-400 mb-3">
                        Distribuição do Split
                      </p>
                      <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={splitData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {splitData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F3F4F6',
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Detalhamento */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-sm font-medium text-gray-400 mb-2">
                      Detalhamento
                    </p>
                    <div className="space-y-1 text-sm text-gray-400">
                      <p>Base: {formatCurrency(result.breakdown.baseCommission)}</p>
                      <p>Multiplicador Produto: x{result.breakdown.productMultiplier}</p>
                      {result.breakdown.levelBonus && (
                        <p>Bônus Nível: {formatCurrency(result.breakdown.levelBonus)}</p>
                      )}
                      {result.breakdown.overrideAmount && (
                        <p>Override: {formatCurrency(result.breakdown.overrideAmount)}</p>
                      )}
                      {result.breakdown.metaBonusAmount && (
                        <p>Bônus Meta: {formatCurrency(result.breakdown.metaBonusAmount)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Configure os parâmetros e clique em "Calcular Comissão"
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
