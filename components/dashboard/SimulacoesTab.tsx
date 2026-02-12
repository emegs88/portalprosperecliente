'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Activity,
  Wallet,
  Target,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  Calculator,
  Receipt,
  ShoppingCart,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  Shield,
  Info,
  CircleDollarSign,
  Crown,
} from 'lucide-react'

interface SimulationParams {
  mesesSimulacao: number
  percentVendaContemplada: number
  taxaIntermediacao: number
  taxaIncc: number
  taxaCdi: number
  aplicarCdi: boolean
}

interface Quota {
  id: string
  grupo: string
  cota: string
  vlBem: number
  vlParcela: number
  vlReceber: number
  pclsPagas: number
  pclsPagar: number
  contemplacao: string
  percentPago: number
}

// ─── Animated Number ──────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, className = '' }: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 600
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    prevValue.current = value
  }, [value])

  return (
    <span className={className}>
      {prefix}{displayed.toFixed(decimals)}{suffix}
    </span>
  )
}

// ─── Animated Currency ────────────────────────────────
function AnimatedCurrency({ value, className = '' }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 700
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    prevValue.current = value
  }, [value])

  return <span className={className}>{formatCurrency(displayed)}</span>
}

// ─── ROI Gauge ──────────────────────────────────
function ROIGauge({ value, size = 120 }: { value: number; size?: number }) {
  const normalizedValue = Math.min(Math.max(value, -100), 300)
  // Map -100..300 to 0..100
  const percent = ((normalizedValue + 100) / 400) * 100
  const radius = (size / 2) - 8
  const circumference = Math.PI * radius // Semi-circle
  const offset = circumference - (percent / 100) * circumference

  const getColor = () => {
    if (value >= 100) return { stroke: '#10B981', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.3)', label: 'Excelente' }
    if (value >= 50) return { stroke: '#3B82F6', text: 'text-blue-400', glow: 'rgba(59,130,246,0.3)', label: 'Muito Bom' }
    if (value >= 0) return { stroke: '#F59E0B', text: 'text-amber-400', glow: 'rgba(245,158,11,0.3)', label: 'Positivo' }
    return { stroke: '#EF4444', text: 'text-red-400', glow: 'rgba(239,68,68,0.3)', label: 'Negativo' }
  }

  const color = getColor()

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${8} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${8} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2}`}
          fill="none"
          stroke={color.stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${color.glow})` }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <div className={`text-2xl font-black tabular-nums ${color.text}`}>
          {value >= 0 ? '+' : ''}{value.toFixed(1)}%
        </div>
        <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{color.label}</div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ─────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#0F1629]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 shadow-2xl shadow-black/50 min-w-[180px]">
      <p className="text-gray-400 text-[10px] font-medium mb-2 uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}40` }} />
              <span className="text-gray-400 text-[11px]">{entry.name}</span>
            </div>
            <span className="text-white text-[11px] font-bold tabular-nums">
              {typeof entry.value === 'number' && Math.abs(entry.value) > 100
                ? formatCurrency(entry.value)
                : typeof entry.value === 'number'
                  ? `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(2)}%`
                  : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── KPI Card ──────────────────────────────────────────
function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  variant,
  trend,
}: {
  label: string
  value: string | React.ReactNode
  sub?: string
  icon?: any
  variant: 'green' | 'red' | 'blue' | 'purple' | 'amber'
  trend?: 'up' | 'down'
}) {
  const styles = {
    green: { bg: 'from-emerald-500/15 via-emerald-500/8 to-[#0E1628]', border: 'border-emerald-400/20', icon: 'bg-emerald-500/20 text-emerald-300', glow: 'shadow-emerald-500/10' },
    red: { bg: 'from-red-500/15 via-red-500/8 to-[#0E1628]', border: 'border-red-400/20', icon: 'bg-red-500/20 text-red-300', glow: 'shadow-red-500/10' },
    blue: { bg: 'from-blue-500/15 via-blue-500/8 to-[#0E1628]', border: 'border-blue-400/20', icon: 'bg-blue-500/20 text-blue-300', glow: 'shadow-blue-500/10' },
    purple: { bg: 'from-purple-500/15 via-purple-500/8 to-[#0E1628]', border: 'border-purple-400/20', icon: 'bg-purple-500/20 text-purple-300', glow: 'shadow-purple-500/10' },
    amber: { bg: 'from-amber-500/15 via-amber-500/8 to-[#0E1628]', border: 'border-amber-400/20', icon: 'bg-amber-500/20 text-amber-300', glow: 'shadow-amber-500/10' },
  }
  const s = styles[variant]

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-4 shadow-lg ${s.glow} group hover:scale-[1.02] transition-all duration-300`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-radial from-white/[0.02] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && (
          <div className={`w-7 h-7 rounded-lg ${s.icon} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        {trend && (
          <div className={`ml-auto ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-white truncate">{value}</div>
      {sub && <p className="text-gray-500 text-[10px] mt-1 truncate">{sub}</p>}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────
function ProgressBar({ value, max, color = 'blue' }: { value: number; max: number; color?: string }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-400',
    green: 'from-emerald-500 to-emerald-400',
    red: 'from-red-500 to-red-400',
    purple: 'from-purple-500 to-purple-400',
    amber: 'from-amber-500 to-amber-400',
  }
  return (
    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
      <div
        className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function SimulacoesTab() {
  const { toast } = useToast()
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [selectedQuotas, setSelectedQuotas] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showAllQuotas, setShowAllQuotas] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<number>(60)
  const [showConfig, setShowConfig] = useState(true)
  const [params, setParams] = useState<SimulationParams>({
    mesesSimulacao: 60,
    percentVendaContemplada: 30,
    taxaIntermediacao: 0,
    taxaIncc: 0.5,
    taxaCdi: 1,
    aplicarCdi: false,
  })

  const [results, setResults] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchQuotas()
  }, [])

  // Debounce para cálculos
  useEffect(() => {
    if (quotas.length > 0 && selectedQuotas.size > 0 && !loading) {
      const timer = setTimeout(() => {
        calculateSimulation()
      }, 200)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotas.length, selectedQuotas.size, JSON.stringify(params)])

  const fetchQuotas = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cotas', { next: { revalidate: 60 } })
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
      const data = await res.json()
      const q = data.quotas || []
      setQuotas(q)
      if (q.length > 0) {
        setSelectedQuotas(new Set(q.map((x: Quota) => x.id)))
      }
    } catch (error: any) {
      console.error('Error fetching quotas:', error)
      toast({ variant: 'destructive', title: 'Erro ao carregar cotas', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const toggleQuota = (quotaId: string) => {
    const s = new Set(selectedQuotas)
    s.has(quotaId) ? s.delete(quotaId) : s.add(quotaId)
    setSelectedQuotas(s)
  }

  const calculateSimulation = useCallback(() => {
    if (quotas.length === 0 || selectedQuotas.size === 0) { setResults(null); return }

    try {
      setCalculating(true)
      const sel = quotas.filter(q => selectedQuotas.has(q.id))
      const totalCotas = sel.length
      const vlParcelaTotal = sel.reduce((s, q) => s + q.vlParcela, 0)
      const vlBemTotal = sel.reduce((s, q) => s + q.vlBem, 0)
      const vlParcelaBase = vlParcelaTotal / totalCotas || 0
      const vlBem = vlBemTotal / totalCotas || 0

      // Parcelas com INCC
      let totalPagoParcelas = 0
      const parcelasMensais: number[] = []
      for (let mes = 1; mes <= params.mesesSimulacao; mes++) {
        const vlParcelaMes = vlParcelaBase * Math.pow(1 + params.taxaIncc / 100, mes - 1)
        parcelasMensais.push(vlParcelaMes * totalCotas)
        totalPagoParcelas += vlParcelaMes * totalCotas
      }

      // Venda de cota contemplada
      const valorVenda = vlBem * (params.percentVendaContemplada / 100) * totalCotas
      const taxaIntermediacaoValor = valorVenda * (params.taxaIntermediacao / 100)
      const valorLiquidoRecebido = valorVenda - taxaIntermediacaoValor

      let valorFinal = valorLiquidoRecebido
      if (params.aplicarCdi) {
        valorFinal = valorLiquidoRecebido * Math.pow(1 + params.taxaCdi / 100, params.mesesSimulacao)
      }

      const lucroLiquido = valorFinal - totalPagoParcelas
      const roi = totalPagoParcelas > 0 ? (lucroLiquido / totalPagoParcelas) * 100 : 0
      const multiplicador = totalPagoParcelas > 0 ? valorFinal / totalPagoParcelas : 0

      // Dados por cota individual
      const cotasDetail = sel.map(q => {
        let totalPagoCota = 0
        for (let m = 1; m <= params.mesesSimulacao; m++) {
          totalPagoCota += q.vlParcela * Math.pow(1 + params.taxaIncc / 100, m - 1)
        }
        const vendaCota = q.vlBem * (params.percentVendaContemplada / 100)
        const taxaCota = vendaCota * (params.taxaIntermediacao / 100)
        const liquidoCota = vendaCota - taxaCota
        const lucroCota = liquidoCota - totalPagoCota
        const roiCota = totalPagoCota > 0 ? (lucroCota / totalPagoCota) * 100 : 0

        return {
          ...q,
          totalPagoCota,
          vendaCota,
          taxaCota,
          liquidoCota,
          lucroCota,
          roiCota,
        }
      })

      // Dados para gráficos
      const dadosEvolucao: any[] = []
      let totalPagoAcum = 0
      let cdiAcumulado = 0
      let poupancaAcumulado = 0

      for (let i = 0; i < parcelasMensais.length; i++) {
        totalPagoAcum += parcelasMensais[i]
        const progressoMes = (i + 1) / params.mesesSimulacao
        const patrimonioMes = totalPagoAcum + (lucroLiquido * progressoMes)
        cdiAcumulado = (cdiAcumulado + parcelasMensais[i]) * (1 + params.taxaCdi / 100)
        poupancaAcumulado = (poupancaAcumulado + parcelasMensais[i]) * (1 + 0.5 / 100)

        const rentC = totalPagoAcum > 0 ? ((patrimonioMes - totalPagoAcum) / totalPagoAcum) * 100 : 0
        const rentCDI = totalPagoAcum > 0 ? ((cdiAcumulado - totalPagoAcum) / totalPagoAcum) * 100 : 0
        const rentP = totalPagoAcum > 0 ? ((poupancaAcumulado - totalPagoAcum) / totalPagoAcum) * 100 : 0

        dadosEvolucao.push({
          mes: i + 1,
          mesLabel: `${i + 1}`,
          mesLabelFull: `Mês ${i + 1}`,
          totalPago: totalPagoAcum,
          patrimonio: patrimonioMes,
          cdi: cdiAcumulado,
          poupanca: poupancaAcumulado,
          rentConsorcio: parseFloat(rentC.toFixed(2)),
          rentCDI: parseFloat(rentCDI.toFixed(2)),
          rentPoupanca: parseFloat(rentP.toFixed(2)),
          lucro: patrimonioMes - totalPagoAcum,
        })
      }

      const rentFinalConsorcio = dadosEvolucao.length > 0 ? dadosEvolucao[dadosEvolucao.length - 1].rentConsorcio : 0
      const rentFinalCDI = dadosEvolucao.length > 0 ? dadosEvolucao[dadosEvolucao.length - 1].rentCDI : 0
      const percentDoCDI = rentFinalCDI > 0 ? (rentFinalConsorcio / rentFinalCDI) * 100 : 0

      setResults({
        totalPagoParcelas, valorVenda, taxaIntermediacaoValor,
        valorLiquidoRecebido, valorFinal, lucroLiquido, roi, multiplicador,
        dadosEvolucao, totalCotas, rentFinalConsorcio, rentFinalCDI,
        percentDoCDI, cdiAcumulado, poupancaAcumulado, vlBemTotal,
        cotasDetail, vlParcelaTotal,
      })
    } catch (error: any) {
      console.error('Error calculating simulation:', error)
      toast({ variant: 'destructive', title: 'Erro ao calcular simulação', description: error.message })
    } finally {
      setCalculating(false)
    }
  }, [quotas, selectedQuotas, params, toast])

  const filteredChartData = useMemo(() => {
    if (!results?.dadosEvolucao) return []
    return results.dadosEvolucao.slice(0, chartPeriod)
  }, [results, chartPeriod])

  // ─── Loading ───────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <div className="h-5 w-48 bg-[rgba(255,255,255,0.06)] rounded-lg animate-pulse" />
            <div className="h-3 w-32 bg-[rgba(255,255,255,0.04)] rounded-lg animate-pulse mt-2" />
          </div>
        </div>
        {/* Skeleton cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="h-64 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (quotas.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-white text-lg font-bold mb-2">Nenhuma cota encontrada</p>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Importe cotas na aba &quot;Importações&quot; para começar a simular.
          </p>
        </div>
      </div>
    )
  }

  // Cotas para exibir
  const visibleQuotas = showAllQuotas ? quotas : quotas.slice(0, 8)
  const hasMoreQuotas = quotas.length > 8

  // Valor médio por cota selecionada
  const selectedArr = quotas.filter(q => selectedQuotas.has(q.id))
  const avgVlBem = selectedArr.length > 0 ? selectedArr.reduce((s, q) => s + q.vlBem, 0) / selectedArr.length : 0
  const avgVlParcela = selectedArr.length > 0 ? selectedArr.reduce((s, q) => s + q.vlParcela, 0) / selectedArr.length : 0

  return (
    <div className="space-y-6">
      {/* ─── Header Premium ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F1A2E] via-[#162040] to-[#0F1A2E] border border-blue-500/20 p-6 shadow-lg shadow-blue-500/5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMC41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-80" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/[0.06] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-blue-400/20 shadow-lg shadow-blue-500/10">
              <Calculator className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Simulador de Venda
                <Sparkles className="w-4 h-4 text-yellow-400/80" />
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {selectedQuotas.size} cotas · Crédito {formatCurrency(selectedArr.reduce((s, q) => s + q.vlBem, 0))}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              showConfig
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                : 'bg-white/[0.06] text-gray-300 border border-white/10 hover:bg-white/[0.1] hover:border-white/20'
            }`}
          >
            <Calculator className="w-4 h-4" />
            {showConfig ? 'Ocultar Configurações' : 'Configurar'}
          </button>
        </div>
      </div>

      {showConfig && (
        <>
          {/* ─── Seleção de Cotas (Chips Elegantes) ──────────── */}
          <Card className="bg-[#0E1628] border-white/10 overflow-hidden shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-md shadow-blue-500/10">
                    <ShoppingCart className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-sm font-semibold">Selecionar Cotas</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      {selectedQuotas.size}/{quotas.length} selecionadas
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedQuotas(new Set(quotas.map(q => q.id)))}
                    className="text-[10px] font-medium text-blue-400 hover:text-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/10 transition-all"
                  >
                    Todas
                  </button>
                  <span className="text-gray-700 text-[10px]">|</span>
                  <button
                    onClick={() => setSelectedQuotas(new Set())}
                    className="text-[10px] font-medium text-gray-500 hover:text-gray-400 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                  >
                    Nenhuma
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5">
                {visibleQuotas.map((q) => {
                  const isSelected = selectedQuotas.has(q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggleQuota(q.id)}
                      className={`
                        group relative flex items-center gap-2 px-3 py-2 rounded-xl border text-xs
                        transition-all duration-200 ease-out
                        ${isSelected
                          ? 'bg-blue-500/15 border-blue-400/30 text-white shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                          : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-gray-200 hover:bg-white/[0.05]'
                        }
                      `}
                    >
                      <div className={`
                        w-3.5 h-3.5 rounded-md flex items-center justify-center shrink-0 transition-all
                        ${isSelected
                          ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                          : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]'
                        }
                      `}>
                        {isSelected && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-[11px] ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                            {q.grupo}-{q.cota}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] tabular-nums ${isSelected ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatCurrency(q.vlBem)}
                          </span>
                          <span className="text-[8px] text-gray-700">·</span>
                          <span className={`text-[9px] tabular-nums ${isSelected ? 'text-gray-500' : 'text-gray-700'}`}>
                            {formatCurrency(q.vlParcela)}/m
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {hasMoreQuotas && (
                <button
                  onClick={() => setShowAllQuotas(!showAllQuotas)}
                  className="flex items-center gap-1.5 text-blue-400 text-[11px] mt-3 hover:text-blue-300 transition-colors mx-auto font-medium"
                >
                  {showAllQuotas ? (
                    <>Mostrar menos <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Ver todas {quotas.length} cotas <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </CardContent>
          </Card>

          {/* ─── Painel de Configuração ──────────────────────── */}
          <div className="space-y-4">
            {/* ── % Venda sobre Crédito ── HERO SLIDER ── */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-400/25 bg-gradient-to-br from-[#12102A] via-[#0E1628] to-[#0E1628] shadow-xl shadow-purple-500/5">
              {/* Animated gradient background */}
              <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/[0.1] rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/[0.07] rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />
                <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-fuchsia-500/[0.04] rounded-full blur-[50px] -translate-x-1/2 -translate-y-1/2" />
              </div>

              <div className="relative p-5 sm:p-6">
                {/* Top row */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-fuchsia-500/20 flex items-center justify-center shadow-md shadow-purple-500/15 border border-purple-400/15">
                        <Percent className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Percentual de Venda</p>
                        <p className="text-gray-400 text-[10px]">sobre o valor do crédito</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-5xl font-black bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent tabular-nums tracking-tight leading-none">
                        {params.percentVendaContemplada}
                      </span>
                      <span className="text-xl font-black text-purple-400">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 tabular-nums">
                      = {formatCurrency(avgVlBem * params.percentVendaContemplada / 100)}/cota
                    </p>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative px-1">
                  <Slider
                    value={[params.percentVendaContemplada]}
                    onValueChange={(v) => setParams({ ...params, percentVendaContemplada: v[0] })}
                    min={0}
                    max={99}
                    step={1}
                  />
                </div>

                {/* Quick-select buttons */}
                <div className="flex items-center justify-between mt-4 gap-1.5">
                  {[
                    { v: 0, label: '0%' },
                    { v: 15, label: '15%' },
                    { v: 20, label: '20%' },
                    { v: 30, label: '30%' },
                    { v: 50, label: '50%' },
                    { v: 70, label: '70%' },
                    { v: 99, label: '99%' },
                  ].map(mark => (
                    <button
                      key={mark.v}
                      onClick={() => setParams({ ...params, percentVendaContemplada: mark.v })}
                      className={`
                        flex-1 text-[10px] tabular-nums py-2 rounded-lg transition-all duration-200 font-bold
                        ${params.percentVendaContemplada === mark.v
                          ? 'bg-purple-500/30 text-purple-200 shadow-[0_0_14px_rgba(168,85,247,0.2)] border border-purple-400/30 scale-105'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15'}
                      `}
                    >
                      {mark.label}
                    </button>
                  ))}
                </div>

                {/* Contextual info */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                  <div className={`text-[11px] px-3 py-1.5 rounded-lg font-bold shadow-md ${
                    params.percentVendaContemplada <= 15 ? 'bg-red-500/20 text-red-300 border border-red-400/20 shadow-red-500/10' :
                    params.percentVendaContemplada <= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/20 shadow-amber-500/10' :
                    params.percentVendaContemplada <= 70 ? 'bg-blue-500/20 text-blue-300 border border-blue-400/20 shadow-blue-500/10' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 shadow-emerald-500/10'
                  }`}>
                    {params.percentVendaContemplada <= 15 ? '⚠ Abaixo do mercado' :
                     params.percentVendaContemplada <= 40 ? '💰 Faixa conservadora' :
                     params.percentVendaContemplada <= 70 ? '📊 Faixa moderada' :
                     '🚀 Faixa agressiva'}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Mercado opera entre 20% e 50%
                  </span>
                </div>
              </div>
            </div>

            {/* ── Parâmetros Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Parcelas até contemplar */}
              <div className="bg-[#0E1628] border border-blue-500/15 rounded-2xl p-4 hover:border-blue-400/25 transition-all duration-300 group shadow-lg shadow-blue-500/[0.03]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/25 transition-colors shadow-md shadow-blue-500/10">
                      <Clock className="w-4 h-4 text-blue-300" />
                    </div>
                    <Label className="text-gray-200 text-xs font-semibold">Parcelas</Label>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-2xl tabular-nums">{params.mesesSimulacao}</span>
                    <span className="text-blue-400 text-[10px] font-medium">meses</span>
                  </div>
                </div>
                <Slider
                  value={[params.mesesSimulacao]}
                  onValueChange={(v) => setParams({ ...params, mesesSimulacao: v[0] })}
                  min={6}
                  max={120}
                  step={6}
                />
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[9px] text-gray-500 tabular-nums">6m</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-blue-400 font-bold tabular-nums">
                      {(params.mesesSimulacao / 12).toFixed(1)} anos
                    </span>
                    <span className="text-[9px] text-gray-500">·</span>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      {formatCurrency(avgVlParcela * params.mesesSimulacao)}/cota
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-500 tabular-nums">120m</span>
                </div>
              </div>

              {/* Taxa Intermediação */}
              <div className="bg-[#0E1628] border border-amber-500/15 rounded-2xl p-4 hover:border-amber-400/25 transition-all duration-300 group shadow-lg shadow-amber-500/[0.03]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/25 transition-colors shadow-md shadow-amber-500/10">
                      <CircleDollarSign className="w-4 h-4 text-amber-300" />
                    </div>
                    <Label className="text-gray-200 text-xs font-semibold">Intermediação</Label>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-2xl tabular-nums">{params.taxaIntermediacao.toFixed(1)}</span>
                    <span className="text-amber-400 text-[10px] font-medium">%</span>
                  </div>
                </div>
                <Slider
                  value={[params.taxaIntermediacao]}
                  onValueChange={(v) => setParams({ ...params, taxaIntermediacao: v[0] })}
                  min={0}
                  max={10}
                  step={0.5}
                />
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[9px] text-gray-500 tabular-nums">0%</span>
                  <span className="text-[11px] text-amber-400 font-bold tabular-nums">
                    {params.taxaIntermediacao > 0
                      ? `−${formatCurrency(avgVlBem * (params.percentVendaContemplada / 100) * (params.taxaIntermediacao / 100))}/cota`
                      : 'Sem custo'}
                  </span>
                  <span className="text-[9px] text-gray-500 tabular-nums">10%</span>
                </div>
              </div>

              {/* INCC Mensal */}
              <div className="bg-[#0E1628] border border-emerald-500/15 rounded-2xl p-4 hover:border-emerald-400/25 transition-all duration-300 group shadow-lg shadow-emerald-500/[0.03]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors shadow-md shadow-emerald-500/10">
                      <TrendingUp className="w-4 h-4 text-emerald-300" />
                    </div>
                    <Label className="text-gray-200 text-xs font-semibold">INCC Mensal</Label>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-2xl tabular-nums">{params.taxaIncc.toFixed(2)}</span>
                    <span className="text-emerald-400 text-[10px] font-medium">%</span>
                  </div>
                </div>
                <Slider
                  value={[params.taxaIncc]}
                  onValueChange={(v) => setParams({ ...params, taxaIncc: v[0] })}
                  min={0}
                  max={2}
                  step={0.05}
                />
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[9px] text-gray-500 tabular-nums">0%</span>
                  <span className="text-[11px] text-emerald-400 font-bold tabular-nums">
                    ≈ {((1 + params.taxaIncc / 100) ** 12 * 100 - 100).toFixed(1)}% a.a.
                  </span>
                  <span className="text-[9px] text-gray-500 tabular-nums">2%</span>
                </div>
              </div>

              {/* CDI */}
              <div className={`border rounded-2xl p-4 transition-all duration-300 ${
                params.aplicarCdi
                  ? 'bg-gradient-to-br from-purple-500/10 via-[#0E1628] to-blue-500/5 border-purple-400/25 shadow-lg shadow-purple-500/5'
                  : 'bg-[#0E1628] border-white/10 hover:border-white/15'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-md ${
                      params.aplicarCdi ? 'bg-purple-500/25 shadow-purple-500/10' : 'bg-gray-500/15 shadow-none'
                    }`}>
                      <Activity className={`w-4 h-4 transition-colors ${params.aplicarCdi ? 'text-purple-300' : 'text-gray-500'}`} />
                    </div>
                    <Label className={`text-xs font-semibold transition-colors ${params.aplicarCdi ? 'text-gray-200' : 'text-gray-400'}`}>
                      Rendimento CDI
                    </Label>
                  </div>
                  <Switch
                    checked={params.aplicarCdi}
                    onCheckedChange={(c) => setParams({ ...params, aplicarCdi: c })}
                  />
                </div>
                {params.aplicarCdi ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-[10px]">Taxa mensal</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-white font-black text-2xl tabular-nums">{params.taxaCdi.toFixed(2)}</span>
                        <span className="text-purple-400 text-[10px] font-medium">%</span>
                      </div>
                    </div>
                    <Slider
                      value={[params.taxaCdi]}
                      onValueChange={(v) => setParams({ ...params, taxaCdi: v[0] })}
                      min={0.5}
                      max={2}
                      step={0.05}
                    />
                    <p className="text-[11px] text-purple-400 mt-2.5 text-center font-bold tabular-nums">
                      ≈ {((1 + params.taxaCdi / 100) ** 12 * 100 - 100).toFixed(1)}% ao ano
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Ative para simular rendimento CDI sobre o valor recebido na venda da cota contemplada
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── RESULTADOS ─────────────────────────────────── */}
      {results && selectedQuotas.size > 0 && (
        <>
          {/* ── Hero Result ── */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0E1628] via-[#101D32] to-[#0E1628] shadow-xl">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/[0.06] rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/[0.05] rounded-full blur-[80px]" />
            </div>

            <div className="relative p-6">
              {/* Visual Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* Investimento */}
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-400/20 mb-3 shadow-md shadow-red-500/10">
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-300" />
                    <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Você investe</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                    <AnimatedCurrency value={results.totalPagoParcelas} />
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {params.mesesSimulacao} parcelas · {formatCurrency(results.vlParcelaTotal)}/mês
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-gradient-to-r from-red-500/30 to-blue-500/30" />
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/10 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="h-px w-8 bg-gradient-to-r from-blue-500/30 to-emerald-500/30" />
                  </div>
                </div>

                {/* Retorno */}
                <div className="text-center sm:text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/20 mb-3 shadow-md shadow-emerald-500/10">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Você recebe</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                    <AnimatedCurrency value={results.valorFinal} />
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Venda {params.percentVendaContemplada}% do crédito
                    {params.taxaIntermediacao > 0 ? ` · −${params.taxaIntermediacao}% interm.` : ''}
                  </p>
                </div>
              </div>

              {/* ROI Gauge + KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-4 border-t border-[rgba(255,255,255,0.04)]">
                {/* ROI Gauge */}
                <div className="flex justify-center sm:col-span-1">
                  <ROIGauge value={results.roi} size={140} />
                </div>

                {/* KPI Grid */}
                <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Lucro</span>
                    </div>
                    <p className={`text-lg font-black tabular-nums ${results.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      <AnimatedCurrency value={results.lucroLiquido} />
                    </p>
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Crown className="w-3 h-3 text-purple-400" />
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Multiplicador</span>
                    </div>
                    <p className="text-lg font-black text-white tabular-nums">
                      <AnimatedNumber value={results.multiplicador} decimals={2} suffix="x" />
                    </p>
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">% do CDI</span>
                    </div>
                    <p className={`text-lg font-black tabular-nums ${results.percentDoCDI >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <AnimatedNumber value={results.percentDoCDI} decimals={0} suffix="%" />
                    </p>
                    <ProgressBar value={Math.min(results.percentDoCDI, 200)} max={200} color={results.percentDoCDI >= 100 ? 'green' : 'amber'} />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Custo / R$1</span>
                    </div>
                    <p className="text-lg font-black text-white tabular-nums">
                      R$ <AnimatedNumber value={results.totalPagoParcelas > 0 ? results.totalPagoParcelas / results.valorFinal : 0} decimals={2} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Comparativo Consórcio vs Renda Fixa ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KPICard
              label="Consórcio"
              value={<AnimatedCurrency value={results.valorFinal} />}
              sub={`ROI ${results.roi >= 0 ? '+' : ''}${results.roi.toFixed(1)}%`}
              icon={Award}
              variant={results.lucroLiquido >= 0 ? 'green' : 'red'}
              trend={results.lucroLiquido >= 0 ? 'up' : 'down'}
            />
            <KPICard
              label="Se investisse em CDI"
              value={<AnimatedCurrency value={results.cdiAcumulado} />}
              sub={`Rent. ${results.rentFinalCDI >= 0 ? '+' : ''}${results.rentFinalCDI.toFixed(1)}%`}
              icon={Activity}
              variant="amber"
              trend="up"
            />
            <KPICard
              label="Se investisse em Poupança"
              value={<AnimatedCurrency value={results.poupancaAcumulado} />}
              sub="0.5% a.m."
              icon={Wallet}
              variant="purple"
              trend="up"
            />
          </div>

          {/* ─── Tabela Lucro por Cota ───────────────────────── */}
          <Card className="bg-[#0E1628] border-white/10 shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-sm font-semibold">Análise por Cota</CardTitle>
                    <CardDescription className="text-gray-500 text-[11px]">
                      ROI individual de cada cota selecionada
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left text-gray-500 text-[9px] uppercase tracking-wider py-2.5 pr-2 font-semibold">Cota</th>
                      <th className="text-right text-gray-500 text-[9px] uppercase tracking-wider py-2.5 px-2 font-semibold">Crédito</th>
                      <th className="text-right text-gray-500 text-[9px] uppercase tracking-wider py-2.5 px-2 font-semibold">Venda</th>
                      <th className="text-right text-gray-500 text-[9px] uppercase tracking-wider py-2.5 px-2 font-semibold hidden sm:table-cell">Total Pago</th>
                      <th className="text-right text-gray-500 text-[9px] uppercase tracking-wider py-2.5 px-2 font-semibold">Lucro</th>
                      <th className="text-right text-gray-500 text-[9px] uppercase tracking-wider py-2.5 pl-2 font-semibold">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.cotasDetail?.slice(0, showAllQuotas ? undefined : 8).map((c: any, idx: number) => (
                      <tr key={c.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.015)] transition-colors group/row" style={{ animationDelay: `${idx * 30}ms` }}>
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-blue-500/30 to-blue-500/5 group-hover/row:from-blue-500/50 transition-colors" />
                            <div>
                              <span className="text-white font-bold text-[11px]">{c.grupo}-{c.cota}</span>
                              <p className="text-[9px] text-gray-600 tabular-nums">{formatCurrency(c.vlParcela)}/mês</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-300 text-[11px] tabular-nums">{formatCurrency(c.vlBem)}</td>
                        <td className="py-2.5 px-2 text-right text-blue-400 text-[11px] font-medium tabular-nums">{formatCurrency(c.vendaCota)}</td>
                        <td className="py-2.5 px-2 text-right text-red-400/80 text-[11px] tabular-nums hidden sm:table-cell">{formatCurrency(c.totalPagoCota)}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`text-[11px] font-bold tabular-nums ${c.lucroCota >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {c.lucroCota >= 0 ? '+' : ''}{formatCurrency(c.lucroCota)}
                          </span>
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg tabular-nums ${
                            c.roiCota >= 50 ? 'bg-emerald-500/10 text-emerald-400' :
                            c.roiCota >= 0 ? 'bg-blue-500/10 text-blue-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {c.roiCota >= 0 ? '+' : ''}{c.roiCota.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[rgba(255,255,255,0.08)]">
                      <td className="py-3 pr-2">
                        <span className="text-white font-bold text-[11px]">TOTAL</span>
                        <span className="text-gray-500 text-[9px] ml-1.5">{results.totalCotas} cotas</span>
                      </td>
                      <td className="py-3 px-2 text-right text-white font-bold text-[11px] tabular-nums">{formatCurrency(results.vlBemTotal)}</td>
                      <td className="py-3 px-2 text-right text-blue-400 font-bold text-[11px] tabular-nums">{formatCurrency(results.valorVenda)}</td>
                      <td className="py-3 px-2 text-right text-red-400 font-bold text-[11px] tabular-nums hidden sm:table-cell">{formatCurrency(results.totalPagoParcelas)}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-[11px] font-black tabular-nums ${results.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {results.lucroLiquido >= 0 ? '+' : ''}{formatCurrency(results.lucroLiquido)}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <span className={`text-[11px] font-black px-2.5 py-1.5 rounded-lg tabular-nums ${
                          results.roi >= 50 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' :
                          results.roi >= 0 ? 'bg-blue-500/15 text-blue-400 border border-blue-500/10' :
                          'bg-red-500/15 text-red-400 border border-red-500/10'
                        }`}>
                          {results.roi >= 0 ? '+' : ''}{results.roi.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {results.cotasDetail?.length > 8 && !showAllQuotas && (
                <button
                  onClick={() => setShowAllQuotas(true)}
                  className="flex items-center gap-1.5 text-blue-400 text-[11px] mt-3 hover:text-blue-300 transition-colors mx-auto font-medium"
                >
                  Ver todas {results.cotasDetail.length} cotas <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </CardContent>
          </Card>

          {/* ─── Charts ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6">
            {/* Gráfico Rentabilidade */}
            <Card className="bg-[#0E1628] border-white/10 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-sm font-semibold">Rentabilidade Acumulada</CardTitle>
                      <CardDescription className="text-gray-500 text-[11px]">Consórcio vs CDI vs Poupança</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-[rgba(255,255,255,0.03)] rounded-xl p-1 border border-[rgba(255,255,255,0.04)]">
                    {[
                      { label: '12M', value: 12 },
                      { label: '24M', value: 24 },
                      { label: '36M', value: 36 },
                      { label: '60M', value: 60 },
                      { label: 'Max', value: params.mesesSimulacao },
                    ].map(p => (
                      <button
                        key={p.label}
                        onClick={() => setChartPeriod(Math.min(p.value, params.mesesSimulacao))}
                        className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-all duration-200 ${
                          chartPeriod === Math.min(p.value, params.mesesSimulacao)
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-500 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ height: '360px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData}>
                      <defs>
                        <linearGradient id="gradRent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="mesLabel"
                        stroke="transparent"
                        tick={{ fill: '#374151', fontSize: 9 }}
                        tickLine={false}
                        interval={Math.max(1, Math.floor(filteredChartData.length / 10))}
                        tickFormatter={(v) => `${v}m`}
                      />
                      <YAxis
                        stroke="transparent"
                        tick={{ fill: '#374151', fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                      <Area
                        type="monotone"
                        dataKey="rentConsorcio"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fill="url(#gradRent)"
                        name="Consórcio"
                        dot={false}
                        activeDot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line type="monotone" dataKey="rentCDI" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="6 3" name="CDI" dot={false} />
                      <Line type="monotone" dataKey="rentPoupanca" stroke="#6B7280" strokeWidth={1} strokeDasharray="4 4" name="Poupança" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-blue-500 rounded-full" />
                    <span className="text-[10px] text-gray-500 font-medium">Consórcio</span>
                    <span className={`text-[10px] font-bold tabular-nums ${results.rentFinalConsorcio >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {results.rentFinalConsorcio >= 0 ? '+' : ''}{results.rentFinalConsorcio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-amber-500 rounded-full" />
                    <span className="text-[10px] text-gray-500 font-medium">CDI</span>
                    <span className="text-[10px] font-bold text-amber-400 tabular-nums">
                      +{results.rentFinalCDI.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-gray-500 rounded-full opacity-50" />
                    <span className="text-[10px] text-gray-500 font-medium">Poupança</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico Evolução Patrimonial */}
            <Card className="bg-[#0E1628] border-white/10 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-sm font-semibold">Evolução Patrimonial</CardTitle>
                    <CardDescription className="text-gray-500 text-[11px]">Patrimônio acumulado vs Total investido</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full" style={{ height: '340px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={filteredChartData}>
                      <defs>
                        <linearGradient id="gradPatr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.15}/>
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradInv2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="mesLabel"
                        stroke="transparent"
                        tick={{ fill: '#374151', fontSize: 9 }}
                        tickLine={false}
                        interval={Math.max(1, Math.floor(filteredChartData.length / 10))}
                        tickFormatter={(v) => `${v}m`}
                      />
                      <YAxis
                        stroke="transparent"
                        tick={{ fill: '#374151', fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="totalPago" fill="url(#gradInv2)" name="Investido" radius={[2, 2, 0, 0]} maxBarSize={8} />
                      <Area type="monotone" dataKey="patrimonio" stroke="#10B981" strokeWidth={2.5} fill="url(#gradPatr)" name="Patrimônio" dot={false} activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="cdi" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="6 3" name="CDI" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-[10px] text-gray-500 font-medium">Patrimônio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-red-500/50" />
                    <span className="text-[10px] text-gray-500 font-medium">Investido</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-amber-500 rounded-full opacity-70" />
                    <span className="text-[10px] text-gray-500 font-medium">CDI</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
