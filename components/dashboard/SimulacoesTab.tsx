'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  LineChart,
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
import { TrendingUp, DollarSign, Calculator, PieChart, BarChart3, Settings, FileText, LineChart as ChartLineIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Quota {
  id: string
  grupo: string
  cota: string
  vlBem: number
  vlParcela: number
  percentPago: number
  pclsPagas: number
  pclsPagar: number
  contemplacao?: string
  vlReceber?: number // Saldo devedor atual do extrato
}

interface INCCData {
  historico: Array<{ data: string; valor: number }>
  media12Meses: number
  ultimoValor: number
}

export default function SimulacoesTab() {
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [selectedQuotaIds, setSelectedQuotaIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Para compatibilidade, manter selectedQuota como primeira selecionada
  const selectedQuotas = quotas.filter(q => selectedQuotaIds.includes(q.id))
  const selectedQuota = selectedQuotas.length > 0 ? selectedQuotas[0] : null

  // Parâmetros da simulação
  const [percentualVenda, setPercentualVenda] = useState(30) // % do valor do crédito
  const [taxaIntermediacao, setTaxaIntermediacao] = useState(5) // % de comissão
  const [mesesContemplacao, setMesesContemplacao] = useState(60) // Meses até contemplação
  const [usarLanceVenda, setUsarLanceVenda] = useState(false) // Lance embutido na venda
  const [percentualLanceVenda, setPercentualLanceVenda] = useState(30) // % do lance
  const [inccData, setInccData] = useState<INCCData | null>(null)

  // Mostrar tela comparativa
  const [mostrarComparativo, setMostrarComparativo] = useState(false)

  // Parâmetros para simulação de acumulação de patrimônio
  const [intervaloContemplacao, setIntervaloContemplacao] = useState(12) // A cada quantos meses contempla uma cota
  const [percentualVendaPatrimonio, setPercentualVendaPatrimonio] = useState(30) // % de venda para acumulação
  const [taxaIntermediacaoPatrimonio, setTaxaIntermediacaoPatrimonio] = useState(5) // % de comissão
  const [taxaCDIInvestimento, setTaxaCDIInvestimento] = useState(11) // % CDI para investimento do valor de venda
  const [mesCorte, setMesCorte] = useState(70) // Mês de corte - após isso não vende mais, só contempla
  const [estrategiaAposCorte, setEstrategiaAposCorte] = useState<'investido' | 'imovel'>('investido') // Estratégia após corte
  const [percentualCompraImovel, setPercentualCompraImovel] = useState(100) // % do patrimônio para compra de imóvel após corte

  useEffect(() => {
    async function loadQuotas() {
      try {
        const res = await fetch('/api/cotas')
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        
        if (data.error) {
          console.error('Erro da API:', data.error)
          setQuotas([])
          setLoading(false)
          return
        }
        
        setQuotas(data.quotas || [])
        if (data.quotas && data.quotas.length > 0) {
          // Verificar se há um ID de cota salvo no sessionStorage (vindo do botão Simular)
          const savedQuotaId = typeof window !== 'undefined' ? sessionStorage.getItem('selectedQuotaId') : null
          if (savedQuotaId && data.quotas.some((q: any) => q.id === savedQuotaId)) {
            setSelectedQuotaIds([savedQuotaId])
            // Limpar o sessionStorage após usar
            sessionStorage.removeItem('selectedQuotaId')
          } else {
            setSelectedQuotaIds([data.quotas[0].id])
          }
        }
        setLoading(false)
        setError(null)
      } catch (error: any) {
        console.error('Erro ao carregar cotas:', error)
        setQuotas([])
        setLoading(false)
        setError(error?.message || 'Erro ao carregar dados')
      }
    }
    
    async function loadINCC() {
      try {
        const res = await fetch('/api/incc?horizonte=12')
        if (res.ok) {
          const data = await res.json()
          setInccData(data)
        }
      } catch (error) {
        console.error('Erro ao carregar INCC:', error)
        // Usar valor padrão se não conseguir buscar
        setInccData({
          historico: [],
          media12Meses: 6.5, // 6.5% ao ano (padrão)
          ultimoValor: 6.5,
        })
      }
    }
    
    loadQuotas()
    loadINCC()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Carregando cotas...</div>
      </div>
    )
  }

  // Se há erro, mostrar mensagem
  if (error) {
    return (
      <Card className="bg-black/50 border-red-600/20">
        <CardContent className="p-6 text-center text-white">
          <p className="mb-4 text-red-500">Erro ao carregar dados</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Se não há cotas, mostrar mensagem
  if (quotas.length === 0) {
    return (
      <Card className="bg-black/50 border-red-600/20">
        <CardContent className="p-6 text-center text-white">
          <p className="mb-4">Nenhuma cota encontrada.</p>
          <p className="text-gray-400 text-sm">Importe um PDF ou Excel para começar.</p>
        </CardContent>
      </Card>
    )
  }

  // Aplica INCC como juros compostos: a cada 12 meses aumenta o valor,
  // e depois de mais 12 meses, aplica juros sobre o valor já corrigido (juros sobre juros)
  const calcularValorComINCC = (valorBase: number, meses: number): number => {
    if (!inccData || meses <= 12) return valorBase
    
    const taxaINCCAnual = (inccData.media12Meses || 6.5) / 100 // Taxa anual INCC em decimal
    let valorCorrigido = valorBase
    const anos = Math.floor(meses / 12)
    
    // Aplicar INCC anualmente como JUROS COMPOSTOS
    // Exemplo: R$ 100.000 com INCC de 6.5% ao ano
    // Ano 1: R$ 100.000 * 1.065 = R$ 106.500
    // Ano 2: R$ 106.500 * 1.065 = R$ 113.422,50 (juros sobre juros)
    // Ano 3: R$ 113.422,50 * 1.065 = R$ 120.794,96 (juros sobre juros acumulados)
    for (let ano = 1; ano <= anos; ano++) {
      valorCorrigido = valorCorrigido * (1 + taxaINCCAnual)
    }
    
    return valorCorrigido
  }

  // Cálculo da simulação de venda - usando INCC após 12 meses (múltiplas cotas)
  const calcularVenda = (): any => {
    if (selectedQuotas.length === 0) {
      return null
    }

    try {
      // Somar valores de todas as cotas selecionadas
      const totalVlBem = selectedQuotas.reduce((sum, q) => sum + (q.vlBem || 0), 0)
      const totalVlParcela = selectedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)
      const totalPclsPagas = selectedQuotas.reduce((sum, q) => sum + (q.pclsPagas || 0), 0)
      
      if (!totalVlBem || !totalVlParcela) {
        return null
      }

      // Calcular valor total das cotas com INCC aplicado após 12 meses
      const vlBemComINCC = calcularValorComINCC(totalVlBem, mesesContemplacao)
      
      // Calcular lance embutido (se aplicável)
      const valorLanceEmbutido = usarLanceVenda 
        ? (vlBemComINCC * percentualLanceVenda) / 100 
        : 0
      
      // Crédito líquido após lance (para cálculo de venda)
      const creditoLiquidoAposLance = vlBemComINCC - valorLanceEmbutido
      
      // Valor de venda = % do crédito líquido (após lance) corrigido pelo INCC
      const valorVenda = (creditoLiquidoAposLance * percentualVenda) / 100
      
      // Comissão de intermediação
      const valorIntermediacao = (valorVenda * taxaIntermediacao) / 100
      
      // Valor líquido recebido
      const valorLiquido = valorVenda - valorIntermediacao

      // Parcelas pagas até contemplação (igual aos meses até contemplação)
      const parcelasPagasAteContemplacao = mesesContemplacao
      
      // Calcular total pago considerando INCC como JUROS COMPOSTOS
      // A cada 12 meses, a parcela aumenta pelo INCC sobre o valor já corrigido
      // Exemplo: Parcela inicial R$ 385, INCC 6.5% ao ano
      // Meses 1-12: R$ 385 cada
      // Mês 13 (ano 2): R$ 385 * 1.065 = R$ 410,03
      // Meses 13-24: R$ 410,03 cada
      // Mês 25 (ano 3): R$ 410,03 * 1.065 = R$ 436,68 (juros sobre juros)
      // Meses 25-36: R$ 436,68 cada
      let totalPago = 0
      let parcelaAtual = totalVlParcela
      const taxaINCCAnual = inccData ? (inccData.media12Meses || 6.5) / 100 : 0.065
      
      for (let mes = 1; mes <= mesesContemplacao; mes++) {
        // Aplicar INCC após cada 12 meses (juros compostos: juros sobre juros)
        // Quando mes % 12 === 1 significa que completou mais um ano (13, 25, 37, etc)
        if (mes > 1 && mes % 12 === 1) {
          // Aplica INCC sobre o valor já corrigido (juros compostos)
          parcelaAtual = parcelaAtual * (1 + taxaINCCAnual)
        }
        totalPago += parcelaAtual
      }
      
      // Ganho de capital = Lucro - Total Pago
      const ganhoCapital = valorLiquido - totalPago
      
      // ROI = (Ganho / Total Pago) * 100
      const roi = totalPago > 0 ? (ganhoCapital / totalPago) * 100 : 0
      
      // Lucro líquido = Ganho de capital (valor líquido - total pago)
      const lucroLiquido = ganhoCapital

      return {
        valorVenda: Number.isFinite(valorVenda) ? valorVenda : 0,
        valorIntermediacao: Number.isFinite(valorIntermediacao) ? valorIntermediacao : 0,
        valorLiquido: Number.isFinite(valorLiquido) ? valorLiquido : 0,
        parcelasPagasAteContemplacao,
        totalPago: Number.isFinite(totalPago) ? totalPago : 0,
        ganhoCapital: Number.isFinite(ganhoCapital) ? ganhoCapital : 0,
        lucroLiquido: Number.isFinite(lucroLiquido) ? lucroLiquido : 0,
        roi: Number.isFinite(roi) ? roi : 0,
        vlBemComINCC: Number.isFinite(vlBemComINCC) ? vlBemComINCC : totalVlBem,
        parcelaFinal: Number.isFinite(parcelaAtual) ? parcelaAtual : totalVlParcela,
        totalCotas: selectedQuotas.length,
        valorLanceEmbutido: Number.isFinite(valorLanceEmbutido) ? valorLanceEmbutido : 0,
        creditoLiquidoAposLance: Number.isFinite(creditoLiquidoAposLance) ? creditoLiquidoAposLance : vlBemComINCC,
      }
    } catch (error) {
      console.error('Erro ao calcular venda:', error)
      return null
    }
  }

  // Simulação de investimentos alternativos
  const calcularInvestimentosAlternativos = (): any => {
    if (selectedQuotas.length === 0) return null
    const totalParcela = selectedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)
    if (!totalParcela) return null

    const vendaSimulada = calcularVenda()
    if (!vendaSimulada || mesesContemplacao <= 0 || mesesContemplacao > 240) return null

    try {
      // Taxas médias anuais (ajustar conforme dados reais)
      const TAXA_CDI_ANUAL = 0.11 // 11% a.a.
      const TAXA_POUPANCA_ANUAL = 0.068 // 6.8% a.a.
      const TAXA_ACOES_ANUAL = 0.15 // 15% a.a. (variável, usar média histórica)

      const aporteMensal = totalParcela

      // CDI
      const taxaCDIMensal = Math.pow(1 + TAXA_CDI_ANUAL, 1/12) - 1
      let acumuladoCDI = 0
      for (let i = 0; i < mesesContemplacao && i < 240; i++) {
        acumuladoCDI = (acumuladoCDI + aporteMensal) * (1 + taxaCDIMensal)
        if (!Number.isFinite(acumuladoCDI)) break
      }

      // Poupança
      const taxaPoupancaMensal = Math.pow(1 + TAXA_POUPANCA_ANUAL, 1/12) - 1
      let acumuladoPoupanca = 0
      for (let i = 0; i < mesesContemplacao && i < 240; i++) {
        acumuladoPoupanca = (acumuladoPoupanca + aporteMensal) * (1 + taxaPoupancaMensal)
        if (!Number.isFinite(acumuladoPoupanca)) break
      }

      // Ações (considerando volatilidade maior)
      const taxaAcoesMensal = Math.pow(1 + TAXA_ACOES_ANUAL, 1/12) - 1
      let acumuladoAcoes = 0
      for (let i = 0; i < mesesContemplacao && i < 240; i++) {
        acumuladoAcoes = (acumuladoAcoes + aporteMensal) * (1 + taxaAcoesMensal)
        if (!Number.isFinite(acumuladoAcoes)) break
      }

      return {
        cdi: {
          valorFinal: Number.isFinite(acumuladoCDI) ? acumuladoCDI : 0,
          ganho: Number.isFinite(acumuladoCDI) ? acumuladoCDI - vendaSimulada.totalPago : 0,
          diferenca: Number.isFinite(acumuladoCDI) ? vendaSimulada.valorLiquido - acumuladoCDI : 0,
        },
        poupanca: {
          valorFinal: Number.isFinite(acumuladoPoupanca) ? acumuladoPoupanca : 0,
          ganho: Number.isFinite(acumuladoPoupanca) ? acumuladoPoupanca - vendaSimulada.totalPago : 0,
          diferenca: Number.isFinite(acumuladoPoupanca) ? vendaSimulada.valorLiquido - acumuladoPoupanca : 0,
        },
        acoes: {
          valorFinal: Number.isFinite(acumuladoAcoes) ? acumuladoAcoes : 0,
          ganho: Number.isFinite(acumuladoAcoes) ? acumuladoAcoes - vendaSimulada.totalPago : 0,
          diferenca: Number.isFinite(acumuladoAcoes) ? vendaSimulada.valorLiquido - acumuladoAcoes : 0,
        },
        consorcio: {
          valorFinal: vendaSimulada.valorLiquido,
          ganho: vendaSimulada.ganhoCapital,
          totalPago: vendaSimulada.totalPago,
        },
      }
    } catch (error) {
      console.error('Erro ao calcular investimentos:', error)
      return null
    }
  }

  // Simulação de fluxo de caixa com INCC aplicado após 12 meses
  const calcularFluxoCaixa = (): any[] => {
    if (selectedQuotas.length === 0) return []
    const totalParcela = selectedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)
    if (!totalParcela) return []

    const vendaSimulada = calcularVenda()
    if (!vendaSimulada || mesesContemplacao <= 0 || mesesContemplacao > 240) return []

    try {
      const fluxo = []
      let saldoAcumulado = 0
      const maxMeses = Math.min(mesesContemplacao, 240)
      let parcelaAtual = totalParcela
      const taxaINCCAnual = inccData ? (inccData.media12Meses || 6.5) / 100 : 0.065

      for (let i = 1; i <= maxMeses; i++) {
        // Aplicar INCC após cada 12 meses como JUROS COMPOSTOS
        // Juros sobre juros: aplica sobre o valor já corrigido anteriormente
        if (i > 1 && i % 12 === 1) {
          parcelaAtual = parcelaAtual * (1 + taxaINCCAnual)
        }

        if (i <= vendaSimulada.parcelasPagasAteContemplacao) {
          saldoAcumulado -= parcelaAtual
          fluxo.push({
            mes: i,
            entrada: 0,
            saida: parcelaAtual,
            saldo: saldoAcumulado,
            tipo: 'Parcela',
            parcelaValor: parcelaAtual,
          })
        } else {
          // Após contemplação, pode ter entrada da venda
          if (i === mesesContemplacao) {
            saldoAcumulado += vendaSimulada.valorLiquido
            fluxo.push({
              mes: i,
              entrada: vendaSimulada.valorLiquido,
              saida: 0,
              saldo: saldoAcumulado,
              tipo: 'Venda',
              parcelaValor: 0,
            })
          } else {
            fluxo.push({
              mes: i,
              entrada: 0,
              saida: 0,
              saldo: saldoAcumulado,
              tipo: 'Aguardando',
              parcelaValor: 0,
            })
          }
        }
      }

      return fluxo
    } catch (error) {
      console.error('Erro ao calcular fluxo de caixa:', error)
      return []
    }
  }

  // Simulação de acumulação de patrimônio com contemplações periódicas e mês de corte
  const calcularAcumulacaoPatrimonio = (): any => {
    if (selectedQuotas.length === 0) return null
    
    try {
      const totalVlBem = selectedQuotas.reduce((sum, q) => sum + (q.vlBem || 0), 0)
      const totalVlParcela = selectedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)
      const totalParcelasPagas = selectedQuotas.reduce((sum, q) => sum + (q.pclsPagas || 0), 0)
      
      if (!totalVlBem || !totalVlParcela || intervaloContemplacao <= 0) {
        return null
      }

      const contemplacoes = []
      const fluxoCaixa = []
      const taxaCDIMensal = Math.pow(1 + (taxaCDIInvestimento / 100), 1/12) - 1
      const taxaINCCAnual = inccData ? (inccData.media12Meses || 6.5) / 100 : 0.065
      const prazoTotal = 240 // Prazo total do consórcio
      
      // OPÇÃO 1: Vender até o corte, usar rendimentos para pagar parcelas
      let opcao1_totalPago = 0
      let opcao1_valorInvestido = 0
      let opcao1_parcelaAtual = totalVlParcela
      let opcao1_contemplacoesVendidas = 0
      
      // OPÇÃO 2: Parcelas após corte + cotas contempladas (crédito aplicado)
      let opcao2_totalPago = 0
      let opcao2_valorCreditoAplicado = 0 // Valor dos créditos contemplados após corte
      let opcao2_parcelaReduzida = totalVlParcela
      let opcao2_parcelaNormal = 0 // Parcela após contemplação
      let opcao2_contemplacoesAplicadas = 0
      let opcao2_parcelasReduzidasPagas = 0
      
      // Distribuir cotas ao longo do tempo
      const numContemplacoes = Math.min(selectedQuotas.length, Math.floor(prazoTotal / intervaloContemplacao))
      const mesesSimulacao = prazoTotal
      let indiceCota = 0
      
      for (let mes = 1; mes <= mesesSimulacao; mes++) {
        // Aplicar INCC nas parcelas reduzidas a cada 12 meses
        if (mes > 1 && mes % 12 === 1) {
          opcao1_parcelaAtual = opcao1_parcelaAtual * (1 + taxaINCCAnual)
          opcao2_parcelaReduzida = opcao2_parcelaReduzida * (1 + taxaINCCAnual)
          if (opcao2_parcelaNormal > 0) {
            opcao2_parcelaNormal = opcao2_parcelaNormal * (1 + taxaINCCAnual)
          }
        }
        
        // Verificar contemplação
        const proximaContemplacao = (indiceCota + 1) * intervaloContemplacao
        if (indiceCota < numContemplacoes && mes === proximaContemplacao) {
          const cota = selectedQuotas[indiceCota % selectedQuotas.length]
          const vlBemCota = cota.vlBem || (totalVlBem / selectedQuotas.length)
          const vlBemComINCC = calcularValorComINCC(vlBemCota, mes)
          
          // OPÇÃO 1: Vender até o corte
          if (mes <= mesCorte) {
            const valorVenda = (vlBemComINCC * percentualVendaPatrimonio) / 100
            const valorIntermediacao = (valorVenda * taxaIntermediacaoPatrimonio) / 100
            const valorLiquidoVenda = valorVenda - valorIntermediacao
            opcao1_valorInvestido += valorLiquidoVenda
            opcao1_contemplacoesVendidas++
            
            contemplacoes.push({
              mes,
              cota: `${cota.grupo || ''} ${cota.cota || ''}`,
              vlBemComINCC,
              valorVenda,
              valorIntermediacao,
              valorLiquidoVenda,
              vendida: true,
              opcao: 'venda',
            })
          } else {
            // OPÇÃO 2: Após corte, contemplar e aplicar crédito
            opcao2_valorCreditoAplicado += vlBemComINCC
            opcao2_contemplacoesAplicadas++
            
            // Calcular nova parcela após contemplação
            // Usa saldo devedor do extrato se disponível, senão calcula
            const vlReceber = cota.vlReceber || vlBemComINCC
            const parcelasReduzidasPagasAteAgora = opcao2_parcelasReduzidasPagas
            // Saldo devedor proporcional: se contemplou antes do prazo atual, reduz proporcionalmente
            const proporcaoPagas = parcelasReduzidasPagasAteAgora / mes
            const saldoDevedor = vlReceber * (1 - proporcaoPagas)
            const prazoRestante = prazoTotal - mes
            // Nova parcela = saldo devedor / prazo restante, com INCC aplicado
            opcao2_parcelaNormal = (saldoDevedor / prazoRestante)
            // Aplicar INCC se já passou mais de 12 meses
            if (mes > 12) {
              const anosDecorridos = Math.floor(mes / 12)
              opcao2_parcelaNormal = opcao2_parcelaNormal * Math.pow(1 + taxaINCCAnual, anosDecorridos)
            }
            
            contemplacoes.push({
              mes,
              cota: `${cota.grupo || ''} ${cota.cota || ''}`,
              vlBemComINCC,
              valorVenda: 0,
              valorIntermediacao: 0,
              valorLiquidoVenda: 0,
              vendida: false,
              opcao: 'aplicacao',
              saldoDevedor,
              novaParcela: opcao2_parcelaNormal,
            })
          }
          indiceCota++
        }
        
        // Pagar parcelas
        // OPÇÃO 1: Aplicar rendimento CDI primeiro, depois pagar parcela
        if (opcao1_valorInvestido > 0) {
          opcao1_valorInvestido = opcao1_valorInvestido * (1 + taxaCDIMensal)
        }
        
        // Pagar parcela (pode usar dinheiro do investido ou do bolso)
        if (opcao1_valorInvestido >= opcao1_parcelaAtual) {
          // Paga com dinheiro do investimento
          opcao1_valorInvestido -= opcao1_parcelaAtual
        } else {
          // Paga parcialmente com investimento, resto do bolso
          const restoPago = opcao1_parcelaAtual - opcao1_valorInvestido
          opcao1_valorInvestido = 0
          opcao1_totalPago += restoPago
        }
        
        // OPÇÃO 2: Pagar parcelas reduzidas até corte, depois parcelas normais
        if (mes <= mesCorte) {
          opcao2_totalPago += opcao2_parcelaReduzida
          opcao2_parcelasReduzidasPagas++
        } else {
          // Após corte, paga parcela normal (se já contemplou)
          if (opcao2_parcelaNormal > 0) {
            opcao2_totalPago += opcao2_parcelaNormal
          } else {
            opcao2_totalPago += opcao2_parcelaReduzida
          }
        }
        
        // Aplicar CDI no crédito aplicado (opção 2)
        if (opcao2_valorCreditoAplicado > 0) {
          opcao2_valorCreditoAplicado = opcao2_valorCreditoAplicado * (1 + taxaCDIMensal)
        }
        
        // Registrar fluxo de caixa
        if (mes % 3 === 0 || contemplacoes.some(c => c.mes === mes)) {
          const contemplacaoMes = contemplacoes.find(c => c.mes === mes)
          fluxoCaixa.push({
            mes,
            opcao1_saida: opcao1_parcelaAtual,
            opcao1_entrada: contemplacaoMes?.vendida ? contemplacaoMes.valorLiquidoVenda : 0,
            opcao1_totalPago,
            opcao1_patrimonio: opcao1_valorInvestido - opcao1_totalPago,
            opcao2_saida: mes <= mesCorte ? opcao2_parcelaReduzida : (opcao2_parcelaNormal || opcao2_parcelaReduzida),
            opcao2_totalPago,
            opcao2_patrimonio: opcao2_valorCreditoAplicado - opcao2_totalPago,
          })
        }
      }
      
      // Patrimônio final
      // Opção 1: Saldo que sobrou do investimento após pagar todas as parcelas
      const opcao1_patrimonioFinal = opcao1_valorInvestido > 0 ? opcao1_valorInvestido : 0
      
      // Opção 2: Baseado na estratégia escolhida
      let opcao2_valorImovel = 0
      let opcao2_patrimonioFinal = 0
      
      if (estrategiaAposCorte === 'investido') {
        // Se mantém investido, patrimônio é o crédito aplicado rendendo CDI menos total pago
        opcao2_patrimonioFinal = opcao2_valorCreditoAplicado - opcao2_totalPago
        opcao2_valorImovel = 0
      } else {
        // Se compra imóvel, usa percentual configurado
        opcao2_valorImovel = opcao2_valorCreditoAplicado * (percentualCompraImovel / 100)
        opcao2_patrimonioFinal = opcao2_valorImovel - opcao2_totalPago
      }
      
      return {
        contemplacoes,
        fluxoCaixa,
        opcao1: {
          patrimonioFinal: opcao1_patrimonioFinal,
          totalPagoFinal: opcao1_totalPago,
          valorInvestidoFinal: opcao1_valorInvestido,
          contemplacoesVendidas: opcao1_contemplacoesVendidas,
        },
        opcao2: {
          patrimonioFinal: opcao2_patrimonioFinal,
          totalPagoFinal: opcao2_totalPago,
          valorCreditoAplicado: opcao2_valorCreditoAplicado,
          contemplacoesAplicadas: opcao2_contemplacoesAplicadas,
          valorParaImovel: estrategiaAposCorte === 'imovel' 
            ? opcao2_valorCreditoAplicado * (percentualCompraImovel / 100)
            : 0,
          estrategia: estrategiaAposCorte,
        },
        mesesSimulacao,
        totalContemplacoes: contemplacoes.length,
      }
    } catch (error) {
      console.error('Erro ao calcular acumulação de patrimônio:', error)
      return null
    }
  }

  // Só calcular se temos uma cota selecionada e dados válidos
  let vendaSimulada = null
  let investimentos = null
  let fluxoCaixa: any[] = []
  let acumulacaoPatrimonio = null

  try {
    if (selectedQuotas.length > 0) {
      vendaSimulada = calcularVenda()
      if (vendaSimulada) {
        investimentos = calcularInvestimentosAlternativos()
        fluxoCaixa = calcularFluxoCaixa()
      }
      acumulacaoPatrimonio = calcularAcumulacaoPatrimonio()
    }
  } catch (error) {
    console.error('Erro ao calcular simulações:', error)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador de Venda de Cota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-black/50 border border-red-600/20">
              <TabsTrigger value="config" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Configuração
              </TabsTrigger>
              <TabsTrigger value="resultados" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Resultados
              </TabsTrigger>
              <TabsTrigger value="graficos" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-white">
                <ChartLineIcon className="h-4 w-4 mr-2" />
                Gráficos
              </TabsTrigger>
              <TabsTrigger value="contemplada" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Cota Contemplada
              </TabsTrigger>
              <TabsTrigger value="patrimonio" className="data-[state=active]:bg-red-600/20 data-[state=active]:text-white">
                <DollarSign className="h-4 w-4 mr-2" />
                Acumulação
              </TabsTrigger>
            </TabsList>

            {/* Aba: Configuração */}
            <TabsContent value="config" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white text-base font-semibold">
                Selecione uma ou mais Cotas para Simulação
              </Label>
              
              {/* Checkbox Selecionar Todas */}
              <div className="flex items-center gap-2 p-2 bg-black/30 border border-red-600/30 rounded-lg mb-2">
                <Checkbox
                  checked={quotas.length > 0 && selectedQuotaIds.length === quotas.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedQuotaIds(quotas.map(q => q.id))
                    } else {
                      setSelectedQuotaIds([])
                    }
                  }}
                  className="border-red-600 data-[state=checked]:bg-red-600"
                />
                <Label className="text-white font-medium cursor-pointer">
                  Selecionar Todas ({quotas.length} cotas)
                </Label>
              </div>

              <div className="max-h-64 overflow-y-auto border border-red-600/30 rounded-lg bg-black/50 p-4 space-y-2">
                {quotas.map((q) => {
                  const isSelected = selectedQuotaIds.includes(q.id)
                  return (
                    <div
                      key={q.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                        ${isSelected 
                          ? 'bg-red-600/20 border-red-600/50' 
                          : 'bg-black/30 border-gray-700/50 hover:border-red-600/30'
                        }
                      `}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedQuotaIds(selectedQuotaIds.filter(id => id !== q.id))
                        } else {
                          setSelectedQuotaIds([...selectedQuotaIds, q.id])
                        }
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedQuotaIds([...selectedQuotaIds, q.id])
                          } else {
                            setSelectedQuotaIds(selectedQuotaIds.filter(id => id !== q.id))
                          }
                        }}
                        className="border-red-600 data-[state=checked]:bg-red-600"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {q.grupo} {q.cota}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Valor: {formatCurrency(q.vlBem)} | Parcela: {formatCurrency(q.vlParcela)} | 
                          Pagas: {q.pclsPagas}/{q.pclsPagar}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {selectedQuotas.length > 0 && (
                <p className="text-sm text-green-400">
                  ✓ {selectedQuotas.length} cota(s) selecionada(s)
                </p>
              )}
            </div>

            {selectedQuotas.length > 0 && (
              <div className="p-4 bg-black/30 border border-red-600/20 rounded-lg">
                <p className="text-white font-semibold mb-3 text-base">Resumo das Cotas Selecionadas:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Total de Cotas:</p>
                    <p className="text-base md:text-lg font-bold text-white">{selectedQuotas.length}</p>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor Total dos Bens:</p>
                    <p className="text-base md:text-lg font-bold text-white break-words overflow-hidden">
                      {formatCurrency(selectedQuotas.reduce((sum, q) => sum + (q.vlBem || 0), 0))}
                    </p>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Parcela Mensal Total:</p>
                    <p className="text-base md:text-lg font-bold text-white break-words overflow-hidden">
                      {formatCurrency(selectedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0))}
                    </p>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Parcelas Pagas (Média):</p>
                    <p className="text-base md:text-lg font-bold text-white">
                      {Math.round(selectedQuotas.reduce((sum, q) => sum + (q.pclsPagas || 0), 0) / selectedQuotas.length)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedQuotas.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 min-w-0 overflow-hidden">
                  <Label className="text-white text-sm">
                    Percentual de Venda: {percentualVenda}%
                  </Label>
                  <Slider
                    value={[percentualVenda]}
                    onValueChange={([value]) => setPercentualVenda(value)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 break-words overflow-hidden">
                    Valor de venda: {vendaSimulada ? formatCurrency(vendaSimulada.valorVenda) : formatCurrency((selectedQuotas[0]?.vlBem || 0) * percentualVenda / 100)}
                  </p>
                </div>

                <div className="space-y-2 min-w-0 overflow-hidden">
                  <Label className="text-white text-sm">
                    Taxa de Intermediação: {taxaIntermediacao}%
                  </Label>
                  <Slider
                    value={[taxaIntermediacao]}
                    onValueChange={([value]) => setTaxaIntermediacao(value)}
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">
                    Comissão do representante
                  </p>
                </div>

                <div className="space-y-2 min-w-0 overflow-hidden">
                  <Label className="text-white text-sm">
                    Meses até Contemplação: {mesesContemplacao}
                  </Label>
                  <Input
                    type="number"
                    value={mesesContemplacao}
                    onChange={(e) => setMesesContemplacao(Number(e.target.value))}
                    className="bg-black border-red-600/20 text-white"
                    min={1}
                    max={240}
                  />
                  <p className="text-xs text-gray-400">
                    Período até venda da cota
                  </p>
                </div>
              </div>

              {/* Opção de Lance Embutido na Venda */}
              <div className="p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Checkbox
                    id="lance-embutido-venda"
                    checked={usarLanceVenda}
                    onCheckedChange={(checked) => setUsarLanceVenda(!!checked)}
                    className="border-purple-600 data-[state=checked]:bg-purple-600 flex-shrink-0"
                  />
                  <Label htmlFor="lance-embutido-venda" className="text-white font-semibold cursor-pointer text-sm md:text-base">
                    Usar Lance Embutido na Venda ({percentualLanceVenda}%)
                  </Label>
                </div>
                {usarLanceVenda && (
                  <div className="mt-3 space-y-3">
                    <div className="space-y-2 min-w-0 overflow-hidden">
                      <Label className="text-white text-sm">
                        Percentual do Lance: {percentualLanceVenda}%
                      </Label>
                      <Slider
                        value={[percentualLanceVenda]}
                        onValueChange={([value]) => setPercentualLanceVenda(value)}
                        min={0}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    {vendaSimulada && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3">
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Crédito com INCC:</p>
                          <p className="text-base md:text-lg text-white font-bold break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.vlBemComINCC || 0)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor do Lance:</p>
                          <p className="text-base md:text-lg text-purple-400 font-bold break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.valorLanceEmbutido || 0)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Crédito Líquido (após lance):</p>
                          <p className="text-base md:text-lg text-blue-400 font-bold break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.creditoLiquidoAposLance || vendaSimulada.vlBemComINCC || 0)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor de Venda (sobre crédito líquido):</p>
                          <p className="text-base md:text-lg text-cyan-400 font-bold break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.valorVenda || 0)}
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      💡 O lance reduz o crédito em {percentualLanceVenda}% antes de calcular o valor de venda (percentual aplicado sobre crédito líquido)
                    </p>
                  </div>
                )}
              </div>

              {/* Informação sobre INCC */}
              {inccData && mesesContemplacao > 12 && (
                <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                  <p className="text-xs md:text-sm text-blue-300 mb-3">
                    <strong>💡 INCC Aplicado como Juros Compostos:</strong> A cada 12 meses, o valor da cota e da parcela são corrigidos pelo INCC ({inccData.media12Meses.toFixed(2)}% ao ano). 
                    Após mais 12 meses, aplica juros sobre o valor já corrigido (juros sobre juros).
                  </p>
                  {vendaSimulada && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor Total Original ({vendaSimulada.totalCotas || 1} cota(s)):</p>
                        <p className="text-base md:text-lg text-white font-bold break-words overflow-hidden">
                          {formatCurrency(selectedQuotas.reduce((sum, q) => sum + (q.vlBem || 0), 0))}
                        </p>
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor Total com INCC:</p>
                        <p className="text-base md:text-lg text-blue-400 font-bold break-words overflow-hidden">{formatCurrency(vendaSimulada.vlBemComINCC || 0)}</p>
                        {usarLanceVenda && vendaSimulada.valorLanceEmbutido > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-400 truncate">Menos Lance ({percentualLanceVenda}%):</p>
                            <p className="text-xs md:text-sm text-purple-400 font-semibold break-words overflow-hidden">-{formatCurrency(vendaSimulada.valorLanceEmbutido)}</p>
                            <p className="text-xs text-gray-400 truncate">Crédito Líquido:</p>
                            <p className="text-sm md:text-base text-blue-300 font-bold break-words overflow-hidden">{formatCurrency(vendaSimulada.creditoLiquidoAposLance || 0)}</p>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Parcela Mensal Total Inicial:</p>
                        <p className="text-base md:text-lg text-white font-bold break-words overflow-hidden">
                          {formatCurrency(selectedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0))}
                        </p>
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Parcela Mensal Total Final (com INCC):</p>
                        <p className="text-base md:text-lg text-blue-400 font-bold break-words overflow-hidden">{formatCurrency(vendaSimulada.parcelaFinal || 0)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {vendaSimulada && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/30 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-400">Valor de Venda</p>
                    <p className="text-xl font-bold text-cyan-500">
                      {formatCurrency(vendaSimulada.valorVenda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Intermediação ({taxaIntermediacao}%)</p>
                    <p className="text-lg font-bold text-orange-500">
                      {formatCurrency(vendaSimulada.valorIntermediacao)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Valor Líquido Recebido</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(vendaSimulada.valorLiquido)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Parcelas Pagas até Contemplação</p>
                    <p className="text-xl font-bold text-blue-500">
                      {vendaSimulada.parcelasPagasAteContemplacao}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Pago em Parcelas</p>
                    <p className="text-xl font-bold text-yellow-500">
                      {formatCurrency(vendaSimulada.totalPago)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Ganho de Capital</p>
                    <p className={`text-xl font-bold ${vendaSimulada.ganhoCapital >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(vendaSimulada.ganhoCapital)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">ROI</p>
                    <p className={`text-xl font-bold ${vendaSimulada.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {vendaSimulada.roi.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Lucro Líquido</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(Math.max(0, vendaSimulada.lucroLiquido))}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
            </TabsContent>

            {/* Aba: Resultados */}
            <TabsContent value="resultados" className="space-y-4 mt-4">
              {selectedQuotas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Selecione pelo menos uma cota na aba "Configuração" para ver os resultados.</p>
                </div>
              ) : !vendaSimulada ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Configure os parâmetros na aba "Configuração" para calcular os resultados.</p>
                </div>
              ) : (
                <>
                  {/* Resumo Comparativo Simples */}
                  <Card className="bg-black/50 border-red-600/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Comparativo Rápido: Total Pago vs Crédito Final
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-2">
                        Visão geral do valor total investido em parcelas (com INCC) versus o valor final do crédito (com rendimento CDI).
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Total Pago em Parcelas */}
                        <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg text-center min-w-0 overflow-hidden">
                          <p className="text-sm text-gray-400 mb-2 truncate">Total Pago em Parcelas (com INCC)</p>
                          <p className="text-2xl md:text-3xl font-bold text-red-400 break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.totalPago)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Considerando o aumento das parcelas pelo INCC.
                          </p>
                        </div>

                        {/* Crédito Final com Rendimento CDI */}
                        <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg text-center min-w-0 overflow-hidden">
                          <p className="text-sm text-gray-400 mb-2 truncate">Valor Líquido Recebido</p>
                          <p className="text-2xl md:text-3xl font-bold text-green-400 break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.valorLiquido)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Valor de venda após dedução de intermediação.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg text-center min-w-0 overflow-hidden">
                        <p className="text-sm text-gray-400 mb-2">Lucro Líquido Final</p>
                        <p className={`text-3xl md:text-4xl font-bold break-words overflow-hidden ${vendaSimulada.lucroLiquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Math.max(0, vendaSimulada.lucroLiquido))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Diferença entre o valor líquido recebido e o total pago.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detalhamento dos Resultados */}
                  <Card className="bg-black/50 border-red-600/20">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Detalhamento dos Resultados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor de Venda</p>
                          <p className="text-lg md:text-xl font-bold text-cyan-500 break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.valorVenda)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Intermediação ({taxaIntermediacao}%)</p>
                          <p className="text-base md:text-lg font-bold text-orange-500 break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.valorIntermediacao)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor Líquido Recebido</p>
                          <p className="text-lg md:text-xl font-bold text-green-500 break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.valorLiquido)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Parcelas Pagas até Contemplação</p>
                          <p className="text-lg md:text-xl font-bold text-blue-500 break-words overflow-hidden">
                            {vendaSimulada.parcelasPagasAteContemplacao}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Total Pago em Parcelas</p>
                          <p className="text-lg md:text-xl font-bold text-yellow-500 break-words overflow-hidden">
                            {formatCurrency(vendaSimulada.totalPago)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Ganho de Capital</p>
                          <p className={`text-lg md:text-xl font-bold break-words overflow-hidden ${vendaSimulada.ganhoCapital >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(vendaSimulada.ganhoCapital)}
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">ROI</p>
                          <p className={`text-lg md:text-xl font-bold break-words overflow-hidden ${vendaSimulada.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {vendaSimulada.roi.toFixed(2)}%
                          </p>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Lucro Líquido</p>
                          <p className="text-lg md:text-xl font-bold text-green-500 break-words overflow-hidden">
                            {formatCurrency(Math.max(0, vendaSimulada.lucroLiquido))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Aba: Gráficos */}
            <TabsContent value="graficos" className="space-y-4 mt-4">
              {selectedQuotas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Selecione pelo menos uma cota na aba "Configuração" para ver os gráficos.</p>
                </div>
              ) : (
                <>
                  {/* Gráfico: Fluxo de Caixa */}
                  {fluxoCaixa.length > 0 && (
                    <Card className="bg-black/50 border-red-600/20">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Fluxo de Caixa Projetado</CardTitle>
                        <p className="text-sm text-gray-400">Entradas, saídas e saldo acumulado até contemplação</p>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full" style={{ height: '400px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={fluxoCaixa.filter((_, i) => i % 6 === 0 || i === fluxoCaixa.length - 1)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis 
                                dataKey="mes" 
                                stroke="#999"
                                tickFormatter={(value) => `${value}m`}
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

                  {/* Comparativo com Investimentos Alternativos */}
                  {investimentos && (
                    <Card className="bg-black/50 border-blue-600/30">
                      <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Comparativo: Consórcio vs Investimentos Alternativos
                        </CardTitle>
                        <p className="text-sm text-gray-400">
                          Comparação do resultado se a parcela mensal total (R$ {formatCurrency(selectedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0))}) 
                          fosse investida em diferentes modalidades pelo período de {mesesContemplacao} meses
                        </p>
                      </CardHeader>
                      <CardContent>
                        {/* Cards Comparativos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {/* Consórcio */}
                          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-red-600/30 min-w-0 overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs md:text-sm text-gray-400 truncate">Consórcio</CardTitle>
                            </CardHeader>
                            <CardContent className="min-w-0 overflow-hidden">
                              <p className="text-xl md:text-2xl font-bold text-primary mb-1 break-words overflow-hidden">
                                {formatCurrency(investimentos.consorcio.valorFinal)}
                              </p>
                              <p className="text-xs text-gray-500">Valor Final</p>
                              <p className="text-base md:text-lg font-semibold text-green-500 mt-2 break-words overflow-hidden">
                                {formatCurrency(investimentos.consorcio.ganho)}
                              </p>
                              <p className="text-xs text-gray-500">Ganho Líquido</p>
                            </CardContent>
                          </Card>

                          {/* CDI */}
                          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30 min-w-0 overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs md:text-sm text-gray-400 truncate">CDI (11% a.a.)</CardTitle>
                            </CardHeader>
                            <CardContent className="min-w-0 overflow-hidden">
                              <p className="text-xl md:text-2xl font-bold text-blue-500 mb-1 break-words overflow-hidden">
                                {formatCurrency(investimentos.cdi.valorFinal)}
                              </p>
                              <p className="text-xs text-gray-500">Valor Final</p>
                              <p className={`text-base md:text-lg font-semibold mt-2 break-words overflow-hidden ${investimentos.cdi.diferenca >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {investimentos.cdi.diferenca >= 0 ? '-' : '+'}
                                {formatCurrency(Math.abs(investimentos.cdi.diferenca))}
                              </p>
                              <p className="text-xs text-gray-500">Diferença vs Consórcio</p>
                            </CardContent>
                          </Card>

                          {/* Poupança */}
                          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30 min-w-0 overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs md:text-sm text-gray-400 truncate">Poupança (6.8% a.a.)</CardTitle>
                            </CardHeader>
                            <CardContent className="min-w-0 overflow-hidden">
                              <p className="text-xl md:text-2xl font-bold text-green-500 mb-1 break-words overflow-hidden">
                                {formatCurrency(investimentos.poupanca.valorFinal)}
                              </p>
                              <p className="text-xs text-gray-500">Valor Final</p>
                              <p className={`text-base md:text-lg font-semibold mt-2 break-words overflow-hidden ${investimentos.poupanca.diferenca >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {investimentos.poupanca.diferenca >= 0 ? '-' : '+'}
                                {formatCurrency(Math.abs(investimentos.poupanca.diferenca))}
                              </p>
                              <p className="text-xs text-gray-500">Diferença vs Consórcio</p>
                            </CardContent>
                          </Card>

                          {/* Ações */}
                          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 min-w-0 overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-xs md:text-sm text-gray-400 truncate">Ações (15% a.a.)</CardTitle>
                            </CardHeader>
                            <CardContent className="min-w-0 overflow-hidden">
                              <p className="text-xl md:text-2xl font-bold text-yellow-500 mb-1 break-words overflow-hidden">
                                {formatCurrency(investimentos.acoes.valorFinal)}
                              </p>
                              <p className="text-xs text-gray-500">Valor Final</p>
                              <p className={`text-base md:text-lg font-semibold mt-2 break-words overflow-hidden ${investimentos.acoes.diferenca >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {investimentos.acoes.diferenca >= 0 ? '-' : '+'}
                                {formatCurrency(Math.abs(investimentos.acoes.diferenca))}
                              </p>
                              <p className="text-xs text-gray-500">Diferença vs Consórcio</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Gráfico Comparativo */}
                        <div className="w-full" style={{ height: '400px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              {
                                nome: 'Consórcio',
                                valor: investimentos.consorcio.valorFinal,
                                ganho: investimentos.consorcio.ganho,
                              },
                              {
                                nome: 'CDI',
                                valor: investimentos.cdi.valorFinal,
                                ganho: investimentos.cdi.ganho,
                              },
                              {
                                nome: 'Poupança',
                                valor: investimentos.poupanca.valorFinal,
                                ganho: investimentos.poupanca.ganho,
                              },
                              {
                                nome: 'Ações',
                                valor: investimentos.acoes.valorFinal,
                                ganho: investimentos.acoes.ganho,
                              },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis dataKey="nome" stroke="#999" />
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
                              <Bar dataKey="valor" fill="#DC2626" name="Valor Final" />
                              <Bar dataKey="ganho" fill="#10B981" name="Ganho Líquido" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Aba: Cota Contemplada */}
            <TabsContent value="contemplada" className="space-y-4 mt-4">
              {selectedQuotas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Selecione pelo menos uma cota na aba "Configuração" para usar o simulador de cota contemplada.</p>
                </div>
              ) : (
                <SimuladorCotaContemplada
                  quotas={selectedQuotas}
                  inccData={inccData}
                />
              )}
            </TabsContent>

            {/* Aba: Acumulação de Patrimônio */}
            <TabsContent value="patrimonio" className="space-y-4 mt-4">
              {selectedQuotas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Selecione pelo menos uma cota na aba "Configuração" para simular a acumulação de patrimônio.</p>
                </div>
              ) : !acumulacaoPatrimonio ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Configure os parâmetros abaixo para calcular a simulação de acumulação de patrimônio.</p>
                </div>
              ) : (
                <>
                  {/* Configurações */}
                  <Card className="bg-black/50 border-red-600/20">
                    <CardHeader>
                      <CardTitle className="text-white">Configurações da Simulação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white text-sm">
                            Intervalo entre Contemplações: {intervaloContemplacao} meses
                          </Label>
                          <Input
                            type="number"
                            value={intervaloContemplacao}
                            onChange={(e) => setIntervaloContemplacao(Math.max(1, Number(e.target.value)))}
                            className="bg-black border-red-600/20 text-white"
                            min={1}
                            max={120}
                          />
                          <p className="text-xs text-gray-400">A cada quantos meses uma cota é contemplada</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">
                            Percentual de Venda: {percentualVendaPatrimonio}%
                          </Label>
                          <Slider
                            value={[percentualVendaPatrimonio]}
                            onValueChange={([value]) => setPercentualVendaPatrimonio(value)}
                            min={10}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-400">% do valor do crédito na venda</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">
                            Taxa de Intermediação: {taxaIntermediacaoPatrimonio}%
                          </Label>
                          <Slider
                            value={[taxaIntermediacaoPatrimonio]}
                            onValueChange={([value]) => setTaxaIntermediacaoPatrimonio(value)}
                            min={0}
                            max={10}
                            step={0.5}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-400">Comissão do representante</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">
                            Taxa CDI para Investimento: {taxaCDIInvestimento}% a.a.
                          </Label>
                          <Slider
                            value={[taxaCDIInvestimento]}
                            onValueChange={([value]) => setTaxaCDIInvestimento(value)}
                            min={8}
                            max={15}
                            step={0.5}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-400">Rendimento do valor de venda</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label className="text-white text-sm">
                            Mês de Corte: {mesCorte} meses
                          </Label>
                          <Input
                            type="number"
                            value={mesCorte}
                            onChange={(e) => setMesCorte(Math.max(1, Number(e.target.value)))}
                            className="bg-black border-red-600/20 text-white"
                            min={1}
                            max={240}
                          />
                          <p className="text-xs text-gray-400">Após este mês, não vende mais cotas, apenas contempla e aplica crédito</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">
                            Estratégia Após Corte (Opção 2)
                          </Label>
                          <RadioGroup
                            value={estrategiaAposCorte}
                            onValueChange={(value) => setEstrategiaAposCorte(value as 'investido' | 'imovel')}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2 p-3 rounded-lg border border-red-600/30 bg-black/30">
                              <RadioGroupItem value="investido" id="investido" className="border-red-600 text-red-600" />
                              <Label htmlFor="investido" className="text-white cursor-pointer flex-1">
                                <div>
                                  <p className="font-medium">Manter Investido (100% CDI)</p>
                                  <p className="text-xs text-gray-400">Crédito fica aplicado rendendo CDI</p>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-lg border border-red-600/30 bg-black/30">
                              <RadioGroupItem value="imovel" id="imovel" className="border-red-600 text-red-600" />
                              <Label htmlFor="imovel" className="text-white cursor-pointer flex-1">
                                <div>
                                  <p className="font-medium">Compra de Imóvel ({percentualCompraImovel}%)</p>
                                  <p className="text-xs text-gray-400">% do crédito aplicado destinado à compra de imóvel</p>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                          {estrategiaAposCorte === 'imovel' && (
                            <div className="mt-2">
                              <Slider
                                value={[percentualCompraImovel]}
                                onValueChange={([value]) => setPercentualCompraImovel(value)}
                                min={0}
                                max={100}
                                step={5}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparação entre Opções */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opção 1: Vender até corte */}
                    <Card className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-600/30">
                      <CardHeader>
                        <CardTitle className="text-white">Opção 1: Vender até Corte</CardTitle>
                        <p className="text-sm text-gray-400">Vende cotas contempladas até o mês {mesCorte} e usa rendimentos para pagar parcelas</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Patrimônio Final (Saldo Investido)</p>
                            <p className="text-2xl md:text-3xl font-bold text-blue-400 break-words overflow-hidden">
                              {formatCurrency(acumulacaoPatrimonio.opcao1.patrimonioFinal)}
                            </p>
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Total Pago do Bolso</p>
                            <p className="text-xl md:text-2xl font-bold text-yellow-400 break-words overflow-hidden">
                              {formatCurrency(acumulacaoPatrimonio.opcao1.totalPagoFinal)}
                            </p>
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Contemplações Vendidas</p>
                            <p className="text-xl md:text-2xl font-bold text-cyan-400">
                              {acumulacaoPatrimonio.opcao1.contemplacoesVendidas}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Opção 2: Manter crédito aplicado */}
                    <Card className="bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-600/30">
                      <CardHeader>
                        <CardTitle className="text-white">
                          Opção 2: {estrategiaAposCorte === 'investido' ? 'Manter Crédito Aplicado' : 'Compra de Imóvel'}
                        </CardTitle>
                        <p className="text-sm text-gray-400">
                          {estrategiaAposCorte === 'investido' 
                            ? 'Contempla após corte e mantém crédito aplicado rendendo CDI, paga parcelas aumentadas'
                            : `Contempla após corte, usa ${percentualCompraImovel}% do crédito para compra de imóvel, paga parcelas aumentadas`
                          }
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {estrategiaAposCorte === 'imovel' && (
                            <div className="min-w-0 overflow-hidden">
                              <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Valor Disponível para Imóvel</p>
                              <p className="text-2xl md:text-3xl font-bold text-green-400 break-words overflow-hidden">
                                {formatCurrency(acumulacaoPatrimonio.opcao2.valorParaImovel)}
                              </p>
                            </div>
                          )}
                          {estrategiaAposCorte === 'investido' && (
                            <div className="min-w-0 overflow-hidden">
                              <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Crédito Aplicado (Rendendo CDI)</p>
                              <p className="text-2xl md:text-3xl font-bold text-green-400 break-words overflow-hidden">
                                {formatCurrency(acumulacaoPatrimonio.opcao2.valorCreditoAplicado)}
                              </p>
                            </div>
                          )}
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Total Pago em Parcelas</p>
                            <p className="text-xl md:text-2xl font-bold text-yellow-400 break-words overflow-hidden">
                              {formatCurrency(acumulacaoPatrimonio.opcao2.totalPagoFinal)}
                            </p>
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Contemplações Aplicadas</p>
                            <p className="text-xl md:text-2xl font-bold text-cyan-400">
                              {acumulacaoPatrimonio.opcao2.contemplacoesAplicadas}
                            </p>
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <p className="text-xs md:text-sm text-gray-400 truncate mb-1">Patrimônio Final</p>
                            <p className={`text-lg md:text-xl font-bold break-words overflow-hidden ${acumulacaoPatrimonio.opcao2.patrimonioFinal >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                              {formatCurrency(acumulacaoPatrimonio.opcao2.patrimonioFinal)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabela de Contemplações */}
                  {acumulacaoPatrimonio.contemplacoes.length > 0 && (
                    <Card className="bg-black/50 border-red-600/20">
                      <CardHeader>
                        <CardTitle className="text-white">Histórico de Contemplações e Vendas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-red-600/30">
                                <th className="text-left p-2 text-white text-sm">Mês</th>
                                <th className="text-left p-2 text-white text-sm">Cota</th>
                                <th className="text-right p-2 text-white text-sm">Valor com INCC</th>
                                <th className="text-right p-2 text-white text-sm">Opção</th>
                                <th className="text-right p-2 text-white text-sm">Valor Líquido/Parcela</th>
                                <th className="text-right p-2 text-white text-sm">Nova Parcela</th>
                              </tr>
                            </thead>
                            <tbody>
                              {acumulacaoPatrimonio.contemplacoes.map((contemplacao: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-700/30 hover:bg-red-600/10">
                                  <td className="p-2 text-gray-300 text-sm">{contemplacao.mes}</td>
                                  <td className="p-2 text-gray-300 text-sm">{contemplacao.cota}</td>
                                  <td className="p-2 text-right text-green-400 text-sm">
                                    {formatCurrency(contemplacao.vlBemComINCC)}
                                  </td>
                                  <td className="p-2 text-right text-sm">
                                    {contemplacao.vendida ? (
                                      <span className="text-blue-400">Vendida</span>
                                    ) : (
                                      <span className="text-green-400">Aplicada</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-right text-cyan-400 text-sm">
                                    {contemplacao.vendida 
                                      ? formatCurrency(contemplacao.valorLiquidoVenda)
                                      : formatCurrency(contemplacao.saldoDevedor || 0)
                                    }
                                  </td>
                                  <td className="p-2 text-right text-yellow-400 text-sm font-semibold">
                                    {contemplacao.novaParcela ? formatCurrency(contemplacao.novaParcela) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Gráfico de Fluxo de Caixa e Patrimônio */}
                  {acumulacaoPatrimonio.fluxoCaixa.length > 0 && (
                    <Card className="bg-black/50 border-red-600/20">
                      <CardHeader>
                        <CardTitle className="text-white">Evolução do Patrimônio e Fluxo de Caixa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full" style={{ height: '400px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={acumulacaoPatrimonio.fluxoCaixa}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis 
                                dataKey="mes" 
                                stroke="#999"
                                tickFormatter={(value) => `${value}m`}
                              />
                              <YAxis 
                                yAxisId="left"
                                stroke="#999"
                                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #dc2626' }}
                                formatter={(value: any) => formatCurrency(value)}
                              />
                              <Legend />
                              <Bar 
                                yAxisId="left"
                                dataKey="opcao1_saida" 
                                fill="#ef4444" 
                                name="Opção 1 - Saída"
                                opacity={0.5}
                              />
                              <Bar 
                                yAxisId="left"
                                dataKey="opcao1_entrada" 
                                fill="#10b981" 
                                name="Opção 1 - Entrada"
                                opacity={0.5}
                              />
                              <Bar 
                                yAxisId="left"
                                dataKey="opcao2_saida" 
                                fill="#f59e0b" 
                                name="Opção 2 - Saída"
                                opacity={0.5}
                              />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="opcao1_patrimonio"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Opção 1 - Patrimônio"
                                dot={false}
                              />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="opcao2_patrimonio"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="Opção 2 - Patrimônio"
                                dot={false}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente do Simulador de Cota Contemplada
function SimuladorCotaContemplada({ 
  quotas, 
  inccData 
}: { 
  quotas: Quota[]
  inccData: INCCData | null
}) {
  const [mesContemplacao, setMesContemplacao] = useState(12)
  const [prazoRestante, setPrazoRestante] = useState(228) // 240 - 12 meses já pagos
  const [usarLanceEmbutido, setUsarLanceEmbutido] = useState(false)
  const [percentualLance, setPercentualLance] = useState(30) // 30% de lance embutido
  const TAXA_CDI_ANUAL = 0.11 // 11% ao ano

  // Calcular valores totais
  const totalVlBem = quotas.reduce((sum, q) => sum + (q.vlBem || 0), 0)
  const totalVlParcela = quotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)
  const totalParcelasPagas = quotas.reduce((sum, q) => sum + (q.pclsPagas || 0), 0)
  const totalParcelasTotal = quotas.reduce((sum, q) => sum + (q.pclsPagar || 240), 0)

  // Calcular saldo devedor REAL do extrato
  const calcularSaldoDevedorInicial = () => {
    // Usar vlReceber do extrato se disponível, senão calcular
    const saldoExtrato = quotas.reduce((sum, q) => sum + ((q as any).vlReceber || 0), 0)
    
    if (saldoExtrato > 0) {
      // Usar saldo devedor real do extrato
      return saldoExtrato
    }
    
    // Fallback: calcular como antes
    const parcelasPagasValor = totalParcelasPagas * totalVlParcela
    return totalVlBem - parcelasPagasValor
  }

  const saldoDevedorInicialExtrato = calcularSaldoDevedorInicial()
  
  // Calcular valor do lance embutido (se aplicável)
  const valorLanceEmbutido = usarLanceEmbutido 
    ? (totalVlBem * percentualLance) / 100 
    : 0
  
  // Crédito inicial ajustado pelo lance (reduz 30% se usar lance)
  const creditoInicialAjustado = totalVlBem - valorLanceEmbutido
  
  // Saldo devedor ajustado pelo lance (reduz 30% se usar lance)
  const saldoDevedorAjustadoLance = saldoDevedorInicialExtrato - valorLanceEmbutido
  
  // Calcular saldo devedor na contemplação (proporcional) com INCC aplicado
  // Só diminui se contemplação for maior que o período atual
  const calcularSaldoDevedorNaContemplacao = () => {
    const periodoAtual = totalParcelasPagas // Meses já decorridos (pclsPagas)
    const taxaINCCAnual = inccData ? (inccData.media12Meses || 6.5) / 100 : 0.065
    
    // Se contemplação for maior que período atual, reduzir proporcionalmente
    if (mesContemplacao > periodoAtual) {
      // Calcular quantas parcelas serão pagas até contemplação
      const parcelasPagarAteContemplacao = mesContemplacao - periodoAtual
      
      // Calcular valor total das parcelas COM INCC aplicado até contemplação
      let valorTotalParcelasAteContemplacao = 0
      let parcelaAtual = totalVlParcela
      
      for (let mes = periodoAtual + 1; mes <= mesContemplacao; mes++) {
        const mesesDesdeInicio = mes
        // Aplicar INCC a cada 12 meses (juros compostos)
        if (mesesDesdeInicio > 1 && mesesDesdeInicio % 12 === 1) {
          parcelaAtual = parcelaAtual * (1 + taxaINCCAnual)
        }
        valorTotalParcelasAteContemplacao += parcelaAtual
      }
      
      // Saldo devedor na contemplação = saldo ajustado pelo lance - parcelas pagas (com INCC)
      const saldoNaContemplacao = saldoDevedorAjustadoLance - valorTotalParcelasAteContemplacao
      
      return Math.max(0, saldoNaContemplacao)
    }
    
    // Se contemplação <= período atual, usar saldo ajustado pelo lance (não reduz)
    return saldoDevedorAjustadoLance
  }

  const saldoDevedorInicial = calcularSaldoDevedorNaContemplacao()
  const novaParcelaBase = saldoDevedorInicial / prazoRestante
  const taxaINCCAnual = inccData ? (inccData.media12Meses || 6.5) / 100 : 0.065
  const taxaCDIMensal = Math.pow(1 + TAXA_CDI_ANUAL, 1/12) - 1

  // Simulação mês a mês
  const calcularSimulacao = () => {
    const dados = []
    let creditoAtual = creditoInicialAjustado // Crédito inicial ajustado pelo lance (se houver)
    let saldoDevedorAtual = saldoDevedorInicial
    let parcelaAtual = novaParcelaBase
    let totalPago = totalParcelasPagas * totalVlParcela // Já pago até contemplação
    let creditoAcumulado = 0

    for (let mes = mesContemplacao + 1; mes <= mesContemplacao + prazoRestante; mes++) {
      const mesRelativo = mes - mesContemplacao
      
      // Aplicar INCC nas parcelas a cada 12 meses após contemplação (juros compostos)
      // As parcelas aumentam e isso reduz o saldo devedor mais rápido
      if (mesRelativo > 1 && mesRelativo % 12 === 1) {
        parcelaAtual = parcelaAtual * (1 + taxaINCCAnual)
      }

      // Crédito rende 100% CDI (aplicado mensalmente)
      creditoAtual = creditoAtual * (1 + taxaCDIMensal)

      // Pagar parcela (com INCC aplicado) - reduz o saldo devedor
      // Quanto maior a parcela (devido ao INCC), mais rápido o saldo diminui
      saldoDevedorAtual -= parcelaAtual
      totalPago += parcelaAtual

      // Crédito acumulado = crédito atual - saldo devedor
      creditoAcumulado = creditoAtual - saldoDevedorAtual

      dados.push({
        mes,
        mesRelativo,
        creditoAtual,
        saldoDevedorAtual,
        parcelaAtual,
        totalPago,
        creditoAcumulado,
        rendimentoMensal: creditoAtual - creditoInicialAjustado,
      })
    }

    return dados
  }

  const dadosSimulacao = calcularSimulacao()
  const resultadoFinal = dadosSimulacao[dadosSimulacao.length - 1]

  return (
    <div className="space-y-6">
      <Card className="bg-black/50 border-green-600/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Simulador: Manter Cota Contemplada até Final do Grupo
          </CardTitle>
          <p className="text-sm text-gray-400 mt-2">
            Simula manter o crédito contemplado aplicado (rendendo 100% CDI) e pagar parcelas até o final do grupo.
            Veja se compensa ficar com o crédito aplicado versus vendê-lo.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parâmetros */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/30 rounded-lg">
              <div>
            <Label className="text-white">Mês da Contemplação</Label>
            <Input
              type="number"
              value={mesContemplacao}
              onChange={(e) => {
                const valor = Number(e.target.value)
                setMesContemplacao(valor)
                // Ajustar prazo restante
                const novoPrazo = Math.max(1, 240 - valor - totalParcelasPagas)
                setPrazoRestante(novoPrazo)
              }}
              className="bg-black border-red-600/20 text-white mt-1"
              min={1}
              max={240}
            />
              </div>
              <div>
                <Label className="text-white">Prazo Restante (meses)</Label>
                <Input
                  type="number"
                  value={prazoRestante}
                  onChange={(e) => setPrazoRestante(Number(e.target.value))}
                  className="bg-black border-red-600/20 text-white mt-1"
                  min={1}
                  max={240}
                />
              </div>
            </div>
          </div>

          {/* Opção de Lance Embutido */}
          <div className="p-4 bg-purple-900/20 border border-purple-600/30 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                id="lance-embutido"
                checked={usarLanceEmbutido}
                onCheckedChange={(checked) => setUsarLanceEmbutido(!!checked)}
                className="border-purple-600 data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="lance-embutido" className="text-white font-semibold cursor-pointer">
                Usar Lance Embutido ({percentualLance}%)
              </Label>
            </div>
            {usarLanceEmbutido && (
              <div className="mt-3 space-y-2">
                <Label className="text-white">
                  Percentual do Lance: {percentualLance}%
                </Label>
                <Slider
                  value={[percentualLance]}
                  onValueChange={([value]) => setPercentualLance(value)}
                  min={0}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-400">Valor do Lance:</p>
                    <p className="text-purple-400 font-bold">{formatCurrency(valorLanceEmbutido)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Crédito após Lance:</p>
                    <p className="text-blue-400 font-bold">{formatCurrency(creditoInicialAjustado)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  💡 O lance reduz o crédito inicial e o saldo devedor em {percentualLance}% para análise comparativa
                </p>
              </div>
            )}
          </div>

          {/* Dados Iniciais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs text-gray-400 truncate">Valor Contemplado Original</p>
              <p className="text-sm font-semibold text-gray-300 break-words overflow-hidden">{formatCurrency(totalVlBem)}</p>
              {usarLanceEmbutido && (
                <>
                  <p className="text-xs text-gray-400 mt-1 truncate">Lance Embutido ({percentualLance}%)</p>
                  <p className="text-xs md:text-sm font-semibold text-purple-400 break-words overflow-hidden">-{formatCurrency(valorLanceEmbutido)}</p>
                </>
              )}
              <p className="text-xs text-gray-400 mt-1 truncate">Valor Contemplado Líquido</p>
              <p className="text-base md:text-lg font-bold text-white break-words overflow-hidden">{formatCurrency(creditoInicialAjustado)}</p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs text-gray-400 truncate">Saldo Devedor do Extrato (atual)</p>
              <p className="text-sm font-semibold text-gray-300 break-words overflow-hidden">{formatCurrency(saldoDevedorInicialExtrato)}</p>
              {usarLanceEmbutido && (
                <>
                  <p className="text-xs text-gray-400 mt-1 truncate">Menos Lance ({percentualLance}%)</p>
                  <p className="text-xs md:text-sm font-semibold text-purple-400 break-words overflow-hidden">-{formatCurrency(valorLanceEmbutido)}</p>
                </>
              )}
              <p className="text-xs text-gray-400 mt-1 truncate">Saldo Devedor na Contemplação</p>
              <p className="text-base md:text-lg font-bold text-yellow-400 break-words overflow-hidden">{formatCurrency(saldoDevedorInicial)}</p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs text-gray-400 truncate">Nova Parcela Base</p>
              <p className="text-base md:text-lg font-bold text-blue-400 break-words overflow-hidden">{formatCurrency(novaParcelaBase)}</p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs text-gray-400 truncate">Prazo Restante</p>
              <p className="text-base md:text-lg font-bold text-green-400 break-words overflow-hidden">{prazoRestante} meses</p>
            </div>
          </div>

          {/* Resultado Final */}
          {resultadoFinal && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-400 truncate mb-1">Crédito Final (com CDI)</p>
                <p className="text-xl md:text-2xl font-bold text-green-400 break-words overflow-hidden">
                  {formatCurrency(resultadoFinal.creditoAtual)}
                </p>
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-400 truncate mb-1">Rendimento Total</p>
                <p className="text-lg md:text-xl font-bold text-green-500 break-words overflow-hidden">
                  {formatCurrency(resultadoFinal.rendimentoMensal)}
                </p>
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-400 truncate mb-1">Crédito Líquido Final</p>
                <p className="text-xl md:text-2xl font-bold text-cyan-400 break-words overflow-hidden">
                  {formatCurrency(resultadoFinal.creditoAcumulado)}
                </p>
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs text-gray-400 truncate mb-1">Total Pago</p>
                <p className="text-lg md:text-xl font-bold text-orange-400 break-words overflow-hidden">
                  {formatCurrency(resultadoFinal.totalPago)}
                </p>
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="space-y-4">
            {/* Gráfico 1: Evolução do Crédito e Saldo Devedor */}
            <Card className="bg-black/30 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Evolução: Crédito (CDI) vs Saldo Devedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosSimulacao.filter((_, i) => i % 6 === 0 || i === dadosSimulacao.length - 1)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="mesRelativo" 
                    stroke="#999"
                    label={{ value: 'Meses após Contemplação', position: 'insideBottom', offset: -5, fill: '#999' }}
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
                  <Line
                    type="monotone"
                    dataKey="creditoAtual"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Crédito (rendendo CDI)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldoDevedorAtual"
                    stroke="#EF4444"
                    strokeWidth={3}
                    name="Saldo Devedor"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="creditoAcumulado"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Crédito Líquido"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução das Parcelas com INCC */}
        <Card className="bg-black/30 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Evolução das Parcelas (com INCC) e Rendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dadosSimulacao.filter((_, i) => i % 6 === 0 || i === dadosSimulacao.length - 1)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="mesRelativo" 
                    stroke="#999"
                    label={{ value: 'Meses após Contemplação', position: 'insideBottom', offset: -5, fill: '#999' }}
                  />
                  <YAxis 
                    stroke="#999"
                    yAxisId="left"
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                  />
                  <YAxis 
                    stroke="#999"
                    yAxisId="right"
                    orientation="right"
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
                  <Bar 
                    yAxisId="left"
                    dataKey="parcelaAtual" 
                    fill="#F59E0B" 
                    name="Parcela Mensal (com INCC)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rendimentoMensal"
                    stroke="#10B981"
                    strokeWidth={3}
                    name="Rendimento Acumulado (CDI)"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Comparação Simples */}
          {resultadoFinal && (
            <Card className="bg-gradient-to-r from-blue-900/30 to-green-900/30 border-2 border-blue-600/50">
          <CardHeader>
            <CardTitle className="text-white text-xl text-center">
              Comparação Simples: Investimento vs Retorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Pago em Parcelas */}
              <div className="p-4 md:p-6 bg-red-900/20 border border-red-600/40 rounded-lg min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold text-base md:text-lg truncate pr-2">Total Pago em Parcelas</h4>
                  <span className="text-red-400 text-xl md:text-2xl flex-shrink-0">📉</span>
                </div>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-400 mb-2 break-words overflow-hidden">
                  {formatCurrency(resultadoFinal.totalPago)}
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  Parcelas com INCC aplicado a cada 12 meses
                </p>
                <div className="mt-4 pt-4 border-t border-red-600/30">
                  <p className="text-xs text-gray-500">
                    • Parcelas aumentam com INCC (juros compostos)
                  </p>
                  <p className="text-xs text-gray-500">
                    • Total investido do seu bolso
                  </p>
                </div>
              </div>

              {/* Crédito Final com CDI */}
              <div className="p-4 md:p-6 bg-green-900/20 border border-green-600/40 rounded-lg min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold text-base md:text-lg truncate pr-2">Crédito Final (com CDI)</h4>
                  <span className="text-green-400 text-xl md:text-2xl flex-shrink-0">📈</span>
                </div>
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-400 mb-2 break-words overflow-hidden">
                  {formatCurrency(resultadoFinal.creditoAtual)}
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  Rendimento acumulado de 100% CDI
                </p>
                <div className="mt-4 pt-4 border-t border-green-600/30">
                  <p className="text-xs text-gray-500">
                    • Crédito rende mensalmente
                  </p>
                  <p className="text-xs text-gray-500 break-words overflow-hidden">
                    • Rendimento total: {formatCurrency(resultadoFinal.rendimentoMensal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Resultado Líquido */}
            <div className="mt-6 p-4 md:p-6 bg-blue-900/30 border border-blue-600/50 rounded-lg min-w-0 overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 truncate">Resultado Final (Crédito - Total Pago)</p>
                  <p className="text-2xl md:text-3xl font-bold text-cyan-400 break-words overflow-hidden">
                    {formatCurrency(resultadoFinal.creditoAtual - resultadoFinal.totalPago)}
                  </p>
                </div>
                <div className="text-left md:text-right min-w-0 flex-1 md:flex-initial overflow-hidden">
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Lucro Líquido</p>
                  <p className="text-xl md:text-2xl font-bold text-green-500 break-words overflow-hidden">
                    {formatCurrency(resultadoFinal.creditoAcumulado)}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1 break-words overflow-hidden">
                    ROI: {((resultadoFinal.creditoAcumulado / resultadoFinal.totalPago - 1) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Análise de Compensação */}
            <div className="mt-4 p-4 bg-black/50 border border-yellow-600/30 rounded-lg">
              <h3 className="text-white font-bold mb-3 text-base md:text-lg">Análise de Compensação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs md:text-sm text-gray-400 mb-2">Se mantiver o crédito até o final:</p>
                  <p className="text-base md:text-lg text-green-400 font-bold break-words overflow-hidden mb-2">
                    Crédito Líquido Final: {formatCurrency(resultadoFinal.creditoAcumulado)}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400 break-words overflow-hidden">
                    Rendimento total do CDI: {formatCurrency(resultadoFinal.rendimentoMensal)}
                  </p>
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs md:text-sm text-gray-400 mb-2">Valor investido (total pago):</p>
                  <p className="text-base md:text-lg text-orange-400 font-bold break-words overflow-hidden mb-2">
                    {formatCurrency(resultadoFinal.totalPago)}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400 break-words overflow-hidden">
                    Diferença: {formatCurrency(resultadoFinal.creditoAtual - resultadoFinal.totalPago)}
                  </p>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
