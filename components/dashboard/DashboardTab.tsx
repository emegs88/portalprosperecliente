'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/lib/utils'
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
import { TrendingUp, DollarSign, PieChart as PieChartIcon, ShoppingCart, ArrowUpDown, Building2, Lightbulb, AlertCircle, Target, TrendingDown, FileText, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

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
  importacoes?: Array<{
    id: string
    filename: string
    sourceType: string
    status: string
    createdAt: string
    parsedAt: string | null
  }>
}

const COLORS = ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA']

export default function DashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tipoAnalise, setTipoAnalise] = useState<'todas' | 'oportunidades' | 'alertas' | 'metas'>('todas')
  
  // Estados para interatividade do gráfico "Cotas Mais Adiantadas"
  const [todasCotas, setTodasCotas] = useState<Array<{
    grupo: string
    cota: string
    vlBem: number
    vlReceber: number
    percentPago: number
    pclsPagas: number
    pclsPagar: number
    contemplacao: string
  }>>([])
  const [cotasSelecionadas, setCotasSelecionadas] = useState<Set<string>>(new Set())
  const [intervaloInicio, setIntervaloInicio] = useState(0)
  const [intervaloFim, setIntervaloFim] = useState(5)
  const [sorteioAtivo, setSorteioAtivo] = useState(false)
  const [frequenciaSorteio, setFrequenciaSorteio] = useState(6) // meses
  const [lanceAtivo, setLanceAtivo] = useState(false)
  const [valorLance, setValorLance] = useState(1000)
  const [mostrarControles, setMostrarControles] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/dashboard')
        
        if (!res.ok) {
          throw new Error(`Erro ${res.status}`)
        }
        
        const data = await res.json()
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
    importacoes: [],
  })
      }
    }
    
    loadData()
  }, [])

  // Buscar todas as cotas para o filtro
  useEffect(() => {
    const fetchTodasCotas = async () => {
      try {
        const res = await fetch('/api/cotas')
        const data = await res.json()
        const cotasFormatadas = (data.quotas || []).map((q: any) => ({
          grupo: q.grupo,
          cota: q.cota,
          vlBem: q.vlBem,
          vlReceber: q.vlReceber,
          percentPago: q.percentPago,
          pclsPagas: q.pclsPagas,
          pclsPagar: q.pclsPagar,
          contemplacao: q.contemplacao || '',
        }))
        setTodasCotas(cotasFormatadas)
        
        // Inicializar seleção com as 5 primeiras (ordenadas por % pago)
        if (cotasFormatadas.length > 0) {
          const ordenadas = [...cotasFormatadas].sort((a, b) => b.percentPago - a.percentPago).slice(0, 5)
          setCotasSelecionadas(new Set(ordenadas.map(q => `${q.grupo}-${q.cota}`)))
          setIntervaloFim(Math.min(5, cotasFormatadas.length - 1))
        }
      } catch (error) {
        console.error('Erro ao buscar todas as cotas:', error)
      }
    }
    fetchTodasCotas()
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
    importacoes,
  } = safeData

  // Dados para gráfico de pizza
  const cotasArray = Array.isArray(cotasMaisAdiantadas) ? cotasMaisAdiantadas : []
  const pieData = cotasArray.slice(0, 5).map((q, idx) => ({
    name: `${q.grupo}-${q.cota}`,
    value: q.vlBem,
    color: COLORS[idx % COLORS.length],
  }))

  // Calcular dados do gráfico interativo "Cotas Mais Adiantadas"
  const calcularDadosGraficoInterativo = () => {
    if (todasCotas.length === 0) return safeData.cotasMaisAdiantadas || []
    
    // Filtrar por intervalo ou seleção
    let cotasFiltradas = todasCotas
    if (cotasSelecionadas.size > 0) {
      cotasFiltradas = todasCotas.filter(q => cotasSelecionadas.has(`${q.grupo}-${q.cota}`))
    } else {
      cotasFiltradas = todasCotas.slice(intervaloInicio, intervaloFim + 1)
    }
    
    // Ordenar por % pago (mais adiantadas primeiro)
    cotasFiltradas = [...cotasFiltradas].sort((a, b) => b.percentPago - a.percentPago)
    
    // Aplicar simulações (sorteios e lances)
    return cotasFiltradas.map(q => {
      let percentPagoAjustado = q.percentPago
      let vlReceberAjustado = q.vlReceber
      
      // Simular sorteio (aumenta % pago)
      if (sorteioAtivo && q.percentPago < 100) {
        const mesesRestantes = (q.pclsPagar - q.pclsPagas)
        const percentualMensal = 100 / q.pclsPagar
        const aumentoPorSorteio = percentualMensal * frequenciaSorteio
        percentPagoAjustado = Math.min(100, percentPagoAjustado + aumentoPorSorteio)
      }
      
      // Simular lance fixo (reduz valor a receber)
      if (lanceAtivo && q.percentPago < 100) {
        const reducaoLance = (valorLance / q.vlBem) * 100
        vlReceberAjustado = Math.max(0, vlReceberAjustado - valorLance)
        percentPagoAjustado = Math.min(100, percentPagoAjustado + reducaoLance)
      }
      
      return {
        ...q,
        percentPago: percentPagoAjustado,
        vlReceber: vlReceberAjustado,
      }
    })
  }
  
  const dadosGraficoInterativo = calcularDadosGraficoInterativo()

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
        <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-red-600/30 hover:border-red-600/50 transition-all hover:shadow-lg hover:shadow-primary/20 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total de Cotas
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <div className="overflow-hidden">
              <p className="text-3xl md:text-2xl lg:text-3xl font-bold text-primary mb-1 leading-tight break-words">
                {safeData.totalCotas.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Cotas ativas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Total Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <div className="overflow-hidden">
              <p className="text-2xl md:text-xl lg:text-2xl font-bold text-blue-400 mb-1 leading-tight break-words">
                {formatCurrencyCompact(safeData.totalCredito).replace('R$', '').trim()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Valor total do bem</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent border-green-500/30 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/20 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Parcela Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <div className="overflow-hidden">
              <p className="text-2xl md:text-xl lg:text-2xl font-bold text-green-400 mb-1 leading-tight break-words">
                {formatCurrencyCompact(safeData.parcelaMensalTotal).replace('R$', '').trim()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Aporte mensal total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/30 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/20 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <div className="overflow-hidden">
              <p className="text-2xl md:text-xl lg:text-2xl font-bold text-yellow-400 mb-1 leading-tight break-words">
                {formatCurrencyCompact(safeData.totalReceber).replace('R$', '').trim()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Valor investido em parcelas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/30 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              % Pago Médio
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <div className="overflow-hidden">
              <p className="text-3xl md:text-2xl lg:text-3xl font-bold text-purple-400 mb-1 leading-tight">
                {typeof percentPagoMedio === 'number' ? formatPercent(percentPagoMedio).replace('%', '') : '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Percentual médio pago</p>
            </div>
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
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
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
                      style={{ fontSize: '11px' }}
                      tick={{ fill: '#999' }}
                      width={70}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                        return value.toString()
                      }}
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
              <div className="flex-1">
                <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                  🎯 Cotas Mais Adiantadas
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMostrarControles(!mostrarControles)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">Maior % pago - Próximas da contemplação</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {mostrarControles && (
              <div className="mb-4 p-4 bg-black/30 rounded-lg border border-red-600/20 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtro de Cotas */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Filtro por Intervalo</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12">Início:</span>
                      <Slider
                        value={[intervaloInicio]}
                        onValueChange={(value) => {
                          setIntervaloInicio(value[0])
                          setCotasSelecionadas(new Set())
                        }}
                        max={Math.max(0, todasCotas.length - 1)}
                        min={0}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-white w-8">{intervaloInicio}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12">Fim:</span>
                      <Slider
                        value={[intervaloFim]}
                        onValueChange={(value) => {
                          setIntervaloFim(value[0])
                          setCotasSelecionadas(new Set())
                        }}
                        max={Math.max(0, todasCotas.length - 1)}
                        min={intervaloInicio}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-white w-8">{intervaloFim}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Mostrando {Math.max(0, intervaloFim - intervaloInicio + 1)} cotas
                    </p>
                  </div>
                  
                  {/* Simulação de Sorteios */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={sorteioAtivo}
                        onCheckedChange={(checked) => setSorteioAtivo(checked as boolean)}
                        id="sorteio-ativo"
                      />
                      <Label htmlFor="sorteio-ativo" className="text-white text-sm cursor-pointer">
                        Simular Sorteios
                      </Label>
                    </div>
                    {sorteioAtivo && (
                      <div className="ml-6 space-y-2">
                        <Label className="text-xs text-gray-400">
                          Frequência: {frequenciaSorteio} meses
                        </Label>
                        <Slider
                          value={[frequenciaSorteio]}
                          onValueChange={(value) => setFrequenciaSorteio(value[0])}
                          min={1}
                          max={24}
                          step={1}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Simulação de Lances Fixos */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={lanceAtivo}
                        onCheckedChange={(checked) => setLanceAtivo(checked as boolean)}
                        id="lance-ativo"
                      />
                      <Label htmlFor="lance-ativo" className="text-white text-sm cursor-pointer">
                        Lance Fixo Mensal
                      </Label>
                    </div>
                    {lanceAtivo && (
                      <div className="ml-6 space-y-2">
                        <Label className="text-xs text-gray-400">Valor do Lance (R$)</Label>
                        <Input
                          type="number"
                          value={valorLance}
                          onChange={(e) => setValorLance(Number(e.target.value))}
                          className="bg-black/50 border-red-600/20 text-white h-8"
                          min={0}
                          step={100}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {(dadosGraficoInterativo.length > 0 || (safeData.cotasMaisAdiantadas && safeData.cotasMaisAdiantadas.length > 0)) ? (
              <div className="w-full" style={{ minHeight: '400px', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={dadosGraficoInterativo.length > 0 ? dadosGraficoInterativo : (safeData.cotasMaisAdiantadas || [])}
                    margin={{ top: 20, right: 20, left: 10, bottom: 60 }}
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
                        const dados = dadosGraficoInterativo.length > 0 ? dadosGraficoInterativo : (safeData.cotasMaisAdiantadas || [])
                        const item = dados?.[index]
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

      {/* Seção de Análises e Melhorias */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-white">Análises e Melhorias</CardTitle>
            </div>
            <Select value={tipoAnalise} onValueChange={(value: any) => setTipoAnalise(value)}>
              <SelectTrigger className="w-[200px] bg-black/50 border-red-600/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-red-600/20">
                <SelectItem value="todas" className="text-white hover:bg-red-600/20">Todas as Análises</SelectItem>
                <SelectItem value="oportunidades" className="text-white hover:bg-red-600/20">Oportunidades</SelectItem>
                <SelectItem value="alertas" className="text-white hover:bg-red-600/20">Alertas</SelectItem>
                <SelectItem value="metas" className="text-white hover:bg-red-600/20">Metas e Projeções</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Análises de Oportunidades */}
            {(tipoAnalise === 'todas' || tipoAnalise === 'oportunidades') && (
              <>
                {percentPagoMedio && percentPagoMedio < 20 && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Oportunidade: Cotas no Início</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          Você está no início das cotas ({formatPercent(percentPagoMedio)} pagas). 
                          Considere simular cenários de venda e acumulação de patrimônio.
                        </p>
                        <p className="text-xs text-gray-400">💡 Acesse a aba "Simulações" para analisar estratégias de venda e investimento.</p>
                      </div>
                    </div>
                  </div>
                )}

                {cotasEmAtraso && cotasEmAtraso.length > 0 && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Atenção: Cotas em Atraso</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          Você tem {cotasEmAtraso.length} cota(s) com parcelas em atraso. 
                          Regularize para evitar multas e manter a contemplação em dia.
                        </p>
                        <div className="mt-2 space-y-1">
                          {cotasEmAtraso.slice(0, 3).map((cota, idx) => (
                            <p key={idx} className="text-xs text-gray-400">
                              • {cota.grupo} {cota.cota}: {cota.pclsEmAtraso} parcela(s) em atraso
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {cotasMaiorPotencial && cotasMaiorPotencial.length > 0 && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Cotas com Maior Potencial</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          {cotasMaiorPotencial.length} cota(s) com maior valor relativo a receber. 
                          Considere estratégias específicas para essas cotas.
                        </p>
                        <div className="mt-2 space-y-1">
                          {cotasMaiorPotencial.slice(0, 3).map((cota, idx) => (
                            <p key={idx} className="text-xs text-gray-400">
                              • {cota.grupo} {cota.cota}: {formatCurrency(cota.vlReceber)} a receber ({formatPercent(cota.percentPago)} pago)
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {parcelaMensalTotal > 0 && totalCredito > 0 && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Sugestão: Simule Acumulação de Patrimônio</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          Com {totalCotas} cota(s) e parcela mensal de {formatCurrency(parcelaMensalTotal)}, 
                          você pode simular estratégias de acumulação vendendo cotas periodicamente.
                        </p>
                        <p className="text-xs text-gray-400">💡 Na aba "Simulações" → "Acumulação", configure contemplações periódicas e veja o patrimônio final.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Alertas */}
            {(tipoAnalise === 'todas' || tipoAnalise === 'alertas') && (
              <>
                {cotasEmAtraso && cotasEmAtraso.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">⚠️ Ação Necessária: Regularizar Atrasos</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          {cotasEmAtraso.length} cota(s) precisa(m) de atenção imediata para evitar penalidades.
                        </p>
                        <div className="mt-2 space-y-1">
                          {cotasEmAtraso.slice(0, 5).map((cota, idx) => (
                            <p key={idx} className="text-xs text-red-300">
                              • {cota.grupo} {cota.cota}: {cota.pclsEmAtraso} parcela(s) atrasada(s) - Valor: {formatCurrency(cota.vlParcela * cota.pclsEmAtraso)}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {percentPagoMedio && percentPagoMedio > 80 && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Cotas Próximas do Final</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          Você já pagou {formatPercent(percentPagoMedio)} das cotas em média. 
                          Considere estratégias para as cotas que estão sendo finalizadas.
                        </p>
                        <p className="text-xs text-gray-400">💡 Analise opções de venda ou contemplação nas cotas mais adiantadas.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Metas e Projeções */}
            {(tipoAnalise === 'todas' || tipoAnalise === 'metas') && (
              <>
                {patrimonioAcumulado && patrimonioAcumulado.length > 0 && (
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-cyan-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Projeção de Patrimônio</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          Baseado nas suas cotas, seu patrimônio projetado (considerando INCC) é de aproximadamente{' '}
                          {formatCurrency(patrimonioAcumulado[patrimonioAcumulado.length - 1]?.projetado || 0)}.
                        </p>
                        <p className="text-xs text-gray-400">💡 Acesse "Patrimônio" para ver projeções detalhadas e simulações.</p>
                      </div>
                    </div>
                  </div>
                )}

                {totalCredito > 0 && (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-indigo-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Meta: Valor Total de Crédito</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          Você tem um potencial de crédito total de {formatCurrency(totalCredito)}. 
                          Com planejamento estratégico, você pode otimizar o uso desses recursos.
                        </p>
                        <p className="text-xs text-gray-400">
                          💡 Use o simulador de acumulação para ver como maximizar seu patrimônio com vendas periódicas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {distribuicaoStatus && distribuicaoStatus.contempladas > 0 && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="h-5 w-5 text-emerald-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Cotas Contempladas</h4>
                        <p className="text-gray-300 text-sm mb-2">
                          Você tem {distribuicaoStatus.contempladas} cota(s) contemplada(s). 
                          Analise estratégias de venda ou manter aplicado rendendo.
                        </p>
                        <p className="text-xs text-gray-400">
                          💡 Na aba "Simulações" → "Cota Contemplada", veja simulações de manter o crédito aplicado.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Mensagem quando não há análises do tipo selecionado */}
            {((tipoAnalise === 'oportunidades' && !percentPagoMedio && !cotasEmAtraso?.length && !cotasMaiorPotencial?.length) ||
              (tipoAnalise === 'alertas' && !cotasEmAtraso?.length && (!percentPagoMedio || percentPagoMedio <= 80)) ||
              (tipoAnalise === 'metas' && !patrimonioAcumulado?.length && !totalCredito)) && (
              <div className="p-8 text-center text-gray-400">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma análise disponível para o filtro selecionado.</p>
                <p className="text-sm mt-2">Selecione "Todas as Análises" para ver todos os insights.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seção de Extratos Importados */}
      {importacoes && importacoes.length > 0 && (
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Extratos Importados
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Histórico dos extratos que foram cadastrados/importados
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-red-600/30">
                    <th className="text-left p-3 text-white text-sm font-semibold">Nome do Arquivo</th>
                    <th className="text-left p-3 text-white text-sm font-semibold">Tipo</th>
                    <th className="text-left p-3 text-white text-sm font-semibold">Status</th>
                    <th className="text-left p-3 text-white text-sm font-semibold">Data de Importação</th>
                  </tr>
                </thead>
                <tbody>
                  {importacoes.map((importacao) => (
                    <tr key={importacao.id} className="border-b border-gray-700/30 hover:bg-red-600/10">
                      <td className="p-3 text-gray-300 text-sm">{importacao.filename}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                          {importacao.sourceType}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            importacao.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : importacao.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : importacao.status === 'processing'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {importacao.status === 'completed'
                            ? 'Concluído'
                            : importacao.status === 'failed'
                            ? 'Falhou'
                            : importacao.status === 'processing'
                            ? 'Processando'
                            : importacao.status === 'pending_review'
                            ? 'Pendente'
                            : importacao.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 text-sm">
                        {importacao.parsedAt
                          ? new Date(importacao.parsedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : new Date(importacao.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
  )
}
