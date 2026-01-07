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
import { TrendingUp, DollarSign, PieChart as PieChartIcon, ShoppingCart, ArrowUpDown, Building2 } from 'lucide-react'

interface DashboardData {
  totalCotas: number
  totalCredito: number
  parcelaMensalTotal: number
  totalReceber: number
  administradora?: string | null
  cotasMaisAdiantadas?: Array<{
    grupo: string
    cota: string
    vlBem: number
    vlReceber: number
    percentPago: number
    pclsPagas: number
    pclsPagar: number
    contemplacao: string
    situacaoCobranca: string
    pclsEmAtraso: number
  }>
  cotasMaiorPotencial?: Array<{
    grupo: string
    cota: string
    vlBem: number
    vlReceber: number
    percentPago: number
  }>
  cotasEmAtraso?: Array<{
    grupo: string
    cota: string
    vlBem: number
    pclsEmAtraso: number
    vlParcela: number
    percentPago: number
  }>
  distribuicaoStatus?: {
    contempladas: number
    naoContempladas: number
    emAtraso: number
    emDia: number
  }
  distribuicaoTipoBem?: {
    imovel: number
    outros: number
  }
  percentPagoMedio?: number
  patrimonioAcumulado: Array<{
    mes: string
    atual: number
    projetado: number
  }>
  fluxoCaixaMensal?: Array<{
    mes: number
    mesLabel: string
    cotasVendidas: number
    entrada: number
    saida: number
    saldo: number
    acumulado: number
  }>
}

const COLORS = ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA']

export default function DashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 DashboardTab - Buscando dados...')
        const res = await fetch('/api/dashboard')
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('❌ DashboardTab - Erro HTTP:', res.status, errorText)
          throw new Error(`Erro ${res.status}: ${errorText}`)
        }
        
        const data = await res.json()
        console.log('✅ DashboardTab - Dados recebidos:', {
          totalCotas: data.totalCotas,
          totalCredito: data.totalCredito,
        })
        
        setData(data)
        setLoading(false)
      } catch (error) {
        console.error('❌ DashboardTab - Erro ao carregar:', error)
        setLoading(false)
        // Definir dados vazios em caso de erro
        setData({
          totalCotas: 0,
          totalCredito: 0,
          parcelaMensalTotal: 0,
          totalReceber: 0,
          patrimonioAcumulado: [],
          cotasMaisAdiantadas: [],
          cotasMaiorPotencial: [],
          cotasEmAtraso: [],
          distribuicaoStatus: {
            contempladas: 0,
            naoContempladas: 0,
            emAtraso: 0,
            emDia: 0,
          },
          distribuicaoTipoBem: {
            imovel: 0,
            outros: 0,
          },
          percentPagoMedio: 0,
          fluxoCaixaMensal: [],
          administradora: null,
        })
      }
    }
    
    loadData()
  }, [])
  
  // Dados padrão se não houver dados
  const safeData = data || {
    totalCotas: 0,
    totalCredito: 0,
    parcelaMensalTotal: 0,
    totalReceber: 0,
    patrimonioAcumulado: [],
    cotasMaisAdiantadas: [],
    administradora: null,
    cotasMaiorPotencial: [],
    cotasEmAtraso: [],
    distribuicaoStatus: {
      contempladas: 0,
      naoContempladas: 0,
      emAtraso: 0,
      emDia: 0,
    },
    distribuicaoTipoBem: {
      imovel: 0,
      outros: 0,
    },
    percentPagoMedio: 0,
    fluxoCaixaMensal: [],
  }

  // Sempre renderizar - mostrar conteúdo mesmo durante carregamento

  // Extrair dados de safeData
  const {
    totalCotas,
    totalCredito,
    parcelaMensalTotal,
    totalReceber,
    cotasMaisAdiantadas,
    cotasMaiorPotencial,
    cotasEmAtraso,
    distribuicaoStatus,
    distribuicaoTipoBem,
    percentPagoMedio,
    fluxoCaixaMensal,
    patrimonioAcumulado,
    administradora,
  } = safeData

  // Dados para gráfico de pizza
  const cotasArray = Array.isArray(cotasMaisAdiantadas) ? cotasMaisAdiantadas : []
  const pieData = cotasArray.slice(0, 5).map((q, idx) => ({
    name: `${q.grupo}-${q.cota}`,
    value: q.vlBem,
    color: COLORS[idx % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {loading && (
        <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 text-center p-4 rounded mb-4">
          <p>⏳ Carregando dados do dashboard...</p>
        </div>
      )}

      {/* Informação da Administradora */}
      {safeData.administradora && (
        <Card className="bg-black/50 border-red-600/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-400">Administradora de Consórcio</p>
                <p className="text-lg font-bold text-white">{safeData.administradora}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo - Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-red-600/30 hover:border-red-600/50 transition-all hover:shadow-lg hover:shadow-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total de Cotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary mb-1">{safeData.totalCotas}</p>
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
              {formatCurrency(safeData.totalCredito).replace('R$', '').trim()}
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
              {formatCurrency(safeData.parcelaMensalTotal).replace('R$', '').trim()}
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
              {formatCurrency(safeData.totalReceber).replace('R$', '').trim()}
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
              {typeof percentPagoMedio === 'number' ? formatPercent(percentPagoMedio).replace('%', '') : '0%'}
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

        {/* Gráfico 2: Cotas Mais Adiantadas - Análise Inteligente */}
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg font-semibold">
                  🎯 Cotas Mais Adiantadas
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">Maior % pago - Próximas da contemplação</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {safeData.cotasMaisAdiantadas && safeData.cotasMaisAdiantadas.length > 0 ? (
              <div className="w-full" style={{ minHeight: '400px', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={safeData.cotasMaisAdiantadas || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="colorPercentPago" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorValorReceber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                      dataKey="cota"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke="#666"
                      style={{ fontSize: '11px' }}
                      tick={{ fill: '#999' }}
                      tickFormatter={(value, index) => {
                        const item = safeData.cotasMaisAdiantadas?.[index]
                        return item ? `${item.grupo}-${value}` : value
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#666"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#999' }}
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#3B82F6"
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#3B82F6' }}
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
                      formatter={(value: number, name: string) => {
                        if (name === '% Pago') return `${value.toFixed(2)}%`
                        if (name === 'Valor a Receber') return formatCurrency(value)
                        return value
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload
                        if (item && 'grupo' in item && 'cota' in item) {
                          return `Cota ${item.grupo}-${item.cota}`
                        }
                        return `Cota ${label}`
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="square"
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="percentPago" 
                      fill="url(#colorPercentPago)" 
                      name="% Pago"
                      radius={[8, 8, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="vlReceber"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 5 }}
                      name="Valor a Receber"
                    />
                  </ComposedChart>
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

      {/* Gráficos Adicionais: Distribuição e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição de Status */}
          {safeData.distribuicaoStatus && (
            <Card className="bg-black/50 border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">📊 Distribuição de Cotas</CardTitle>
                <p className="text-sm text-gray-400">Visão geral do status</p>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ minHeight: '350px', height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Contempladas', value: safeData.distribuicaoStatus.contempladas, color: '#10B981' },
                          { name: 'Não Contempladas', value: safeData.distribuicaoStatus.naoContempladas, color: '#3B82F6' },
                          { name: 'Pendentes', value: safeData.distribuicaoStatus.emAtraso, color: '#EF4444' },
                          { name: 'Em Dia', value: safeData.distribuicaoStatus.emDia, color: '#F59E0B' },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Contempladas', value: safeData.distribuicaoStatus.contempladas, color: '#10B981' },
                          { name: 'Não Contempladas', value: safeData.distribuicaoStatus.naoContempladas, color: '#3B82F6' },
                          { name: 'Pendentes', value: safeData.distribuicaoStatus.emAtraso, color: '#EF4444' },
                          { name: 'Em Dia', value: safeData.distribuicaoStatus.emDia, color: '#F59E0B' },
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F1F1F',
                          border: '1px solid #DC2626',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distribuição por Tipo de Bem */}
          {safeData.distribuicaoTipoBem && (
            <Card className="bg-black/50 border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">🏢 Distribuição por Tipo de Bem</CardTitle>
                <p className="text-sm text-gray-400">Imóvel vs Outros bens</p>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ minHeight: '350px', height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Imóvel', value: safeData.distribuicaoTipoBem.imovel, color: '#8B5CF6' },
                          { name: 'Outros Bens', value: safeData.distribuicaoTipoBem.outros, color: '#06B6D4' },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Imóvel', value: safeData.distribuicaoTipoBem.imovel, color: '#8B5CF6' },
                          { name: 'Outros Bens', value: safeData.distribuicaoTipoBem.outros, color: '#06B6D4' },
                        ].filter(item => item.value > 0).map((entry, index) => (
                          <Cell key={`cell-tipo-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F1F1F',
                          border: '1px solid #DC2626',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cotas Pendentes */}
          {safeData.cotasEmAtraso && safeData.cotasEmAtraso.length > 0 && (
            <Card className="bg-black/50 border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  ⚠️ Cotas Pendentes
                </CardTitle>
                <p className="text-sm text-gray-400">Requerem atenção</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {safeData.cotasEmAtraso.map((cota, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-red-600/10 border border-red-600/30 rounded-lg hover:bg-red-600/20 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-semibold">
                            {cota.grupo}-{cota.cota}
                          </p>
                          <p className="text-sm text-gray-400">
                            {cota.pclsEmAtraso} parcela(s) pendente(s)
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-red-600/30 text-red-400 rounded-full text-xs font-medium">
                          {cota.pclsEmAtraso} pendente(s)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-red-600/20">
                        <div>
                          <p className="text-xs text-gray-500">Valor do Bem</p>
                          <p className="text-sm text-white font-medium">{formatCurrency(cota.vlBem)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Parcela</p>
                          <p className="text-sm text-white font-medium">{formatCurrency(cota.vlParcela)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela: Cotas Mais Adiantadas - Detalhada */}
          {safeData.cotasMaisAdiantadas && safeData.cotasMaisAdiantadas.length > 0 && (
            <Card className="bg-black/50 border-red-600/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-lg font-semibold">🎯 Cotas Mais Adiantadas - Detalhes</CardTitle>
                <p className="text-sm text-gray-400">Próximas da contemplação - Maior potencial de realização</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="border-b border-red-600/30 bg-black/30">
                        <th className="text-left p-4 font-semibold text-sm uppercase tracking-wider">Grupo-Cota</th>
                        <th className="text-right p-4 font-semibold text-sm uppercase tracking-wider">Valor do Bem</th>
                        <th className="text-right p-4 font-semibold text-sm uppercase tracking-wider">Valor a Receber</th>
                        <th className="text-right p-4 font-semibold text-sm uppercase tracking-wider">% Pago</th>
                        <th className="text-right p-4 font-semibold text-sm uppercase tracking-wider">Parcelas</th>
                        <th className="text-center p-4 font-semibold text-sm uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeData.cotasMaisAdiantadas.map((item, idx) => (
                        <tr 
                          key={idx} 
                          className="border-b border-red-600/10 hover:bg-red-600/5 transition-colors"
                        >
                          <td className="p-4 font-mono text-sm">{item.grupo}-{item.cota}</td>
                          <td className="p-4 text-right font-semibold">{formatCurrency(item.vlBem)}</td>
                          <td className="p-4 text-right font-semibold text-green-400">{formatCurrency(item.vlReceber)}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex-1 max-w-[100px] bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(item.percentPago * 100, 100)}%` }}
                                />
                              </div>
                              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium whitespace-nowrap">
                                {formatPercent(item.percentPago)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right text-sm text-gray-400">
                            {item.pclsPagas} / {item.pclsPagar}
                          </td>
                          <td className="p-4 text-center">
                            {(() => {
                              const contemplacao = item.contemplacao || ''
                              const isContemplada = contemplacao.toLowerCase().includes('contemplada') && 
                                                   !contemplacao.toLowerCase().includes('não') &&
                                                   !contemplacao.toLowerCase().includes('nao')
                              return isContemplada ? (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                  ✓ Contemplada
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                  Não Contemplada
                                </span>
                              )
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      {/* Gráficos de Cotas Vendidas e Fluxo de Caixa */}
      {safeData.fluxoCaixaMensal && safeData.fluxoCaixaMensal.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Cotas Vendidas/Contempladas */}
          <Card className="bg-black/50 border-red-600/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-green-500" />
                    Cotas Contempladas
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Dados do extrato</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {safeData.fluxoCaixaMensal && safeData.fluxoCaixaMensal.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-green-500 mb-2">
                      {safeData.fluxoCaixaMensal[0].cotasVendidas}
                    </p>
                    <p className="text-gray-400">Cota(s) contemplada(s)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-600/20">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Entrada Mensal</p>
                      <p className="text-xl font-semibold text-green-400">
                        {formatCurrency(safeData.fluxoCaixaMensal[0].entrada)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Valor por Cota</p>
                      <p className="text-xl font-semibold text-white">
                        {safeData.fluxoCaixaMensal[0].cotasVendidas > 0 
                          ? formatCurrency(safeData.fluxoCaixaMensal[0].entrada / safeData.fluxoCaixaMensal[0].cotasVendidas)
                          : formatCurrency(0)
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-400">
                  Nenhuma cota contemplada encontrada no extrato.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Fluxo de Caixa Atual */}
          <Card className="bg-black/50 border-red-600/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5 text-blue-500" />
                    Fluxo de Caixa
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Dados do extrato atual</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {safeData.fluxoCaixaMensal && safeData.fluxoCaixaMensal.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Entrada Total</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(safeData.fluxoCaixaMensal[0].entrada)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">De cotas contempladas</p>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Saída Total</p>
                      <p className="text-2xl font-bold text-red-400">
                        {formatCurrency(safeData.fluxoCaixaMensal[0].saida)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Parcelas pagas</p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Patrimônio Atual</p>
                    <p className="text-3xl font-bold text-green-400">
                      {formatCurrency(Math.abs(safeData.fluxoCaixaMensal[0].saida))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total investido em parcelas</p>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-400">
                  Nenhum dado de fluxo de caixa disponível.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
