# 💻 EXEMPLOS DE CÓDIGO - SIMULADOR DE PATRIMÔNIO

## 📋 ÍNDICE

1. [Interfaces TypeScript](#interfaces-typescript)
2. [Funções de Cálculo](#funções-de-cálculo)
3. [Componentes React](#componentes-react)
4. [Hooks Customizados](#hooks-customizados)
5. [Utilitários](#utilitários)

---

## 1️⃣ INTERFACES TYPESCRIPT

### 1.1 Estrutura Principal

```typescript
// types/simulacao.ts

export interface ConfiguracaoSimulacao {
  intervaloContemplacao: number
  mesCorte: number
  percentualVenda: number
  taxaIntermediacao: number
  taxaCDIInvestimento: number
  estrategiaAposCorte: 'investido' | 'imovel'
  percentualCompraImovel: number
  cotasSelecionadas: string[]
  destinoDinheiro: {
    percentualParcelas: number
    percentualReinvestir: number
    percentualCDI: number
  }
}

export interface IndicadoresPrincipais {
  totalPagoProjeto: number
  totalInvestido: number
  patrimonioFinalAcumulado: number
  ganhoPatrimonial: number
  roi: number
  custoPorRealPatrimonio: number
}

export interface CustoPatrimonio {
  totalPagoBolso: number
  totalRecebidoVendas: number
  totalReinvestido: number
  patrimonioFinal: number
  custoFormacaoPatrimonio: number
  fraseAutomatica: string
}

export interface FluxoVenda {
  mes: number
  numeroCota: string
  valorCredito: number
  percentualVenda: number
  valorBrutoVenda: number
  taxaIntermediacao: number
  valorLiquidoRecebido: number
  destinoDinheiro: {
    pagarParcelas: boolean
    reinvestir: boolean
    aplicarCDI: boolean
    percentualParcelas: number
    percentualReinvestir: number
    percentualCDI: number
  }
  saldoAcumuladoCaixa: number
}

export interface EventoMensal {
  mes: number
  tipo: 'pagamento' | 'contemplacao' | 'venda' | 'aplicacao' | 'reinvestimento' | 'corte'
  descricao: string
  valor: number
  valorBruto?: number
  valorLiquido?: number
  cotaRelacionada?: {
    grupo: string
    cota: string
    vlBem: number
  }
  impactoCaixa: number
  impactoPatrimonio: number
  saldoAnterior: number
  saldoAtual: number
}

export interface TimelineMensal {
  mes: number
  parcelasPagas: number
  cotasAtivas: number
  contemplacoes: number
  vendas: number
  caixa: number
  patrimonio: number
  eventos: EventoMensal[]
}

export interface ResumoEstrategico {
  estrategiaUtilizada: string
  tempoConstrucao: string
  totalPago: number
  patrimonioFinal: number
  eficienciaModelo: string
  multiplicadorPatrimonial: string
}

export interface ResultadosSimulacao {
  indicadoresPrincipais: IndicadoresPrincipais
  custoPatrimonio: CustoPatrimonio
  fluxoVendas: FluxoVenda[]
  timelineMensal: TimelineMensal[]
  resumoEstrategico: ResumoEstrategico
}

export interface SimulacaoCompleta {
  id: string
  userId: string
  dataCriacao: string
  configuracao: ConfiguracaoSimulacao
  resultados: ResultadosSimulacao
}
```

---

## 2️⃣ FUNÇÕES DE CÁLCULO

### 2.1 Cálculo de Indicadores Principais

```typescript
// lib/calculos/indicadores.ts

import { TimelineMensal, FluxoVenda, ConfiguracaoSimulacao } from '@/types/simulacao'

export function calcularIndicadoresPrincipais(
  timeline: TimelineMensal[],
  fluxoVendas: FluxoVenda[],
  configuracao: ConfiguracaoSimulacao
): IndicadoresPrincipais {
  // Total Pago no Projeto
  const totalPagoProjeto = timeline.reduce(
    (sum, mes) => sum + mes.parcelasPagas,
    0
  )

  // Total Recebido com Vendas
  const totalRecebidoVendas = fluxoVendas.reduce(
    (sum, venda) => sum + venda.valorLiquidoRecebido,
    0
  )

  // Total Investido (dinheiro efetivamente aportado)
  const totalInvestido = totalPagoProjeto - totalRecebidoVendas

  // Patrimônio Final Acumulado
  const ultimoMes = timeline[timeline.length - 1]
  const patrimonioFinalAcumulado = ultimoMes.patrimonio

  // Ganho Patrimonial
  const ganhoPatrimonial = patrimonioFinalAcumulado - totalPagoProjeto

  // ROI (%)
  const roi = totalPagoProjeto > 0
    ? (ganhoPatrimonial / totalPagoProjeto) * 100
    : 0

  // Custo por Real de Patrimônio
  const custoPorRealPatrimonio = patrimonioFinalAcumulado > 0
    ? totalPagoProjeto / patrimonioFinalAcumulado
    : 0

  return {
    totalPagoProjeto,
    totalInvestido,
    patrimonioFinalAcumulado,
    ganhoPatrimonial,
    roi,
    custoPorRealPatrimonio,
  }
}
```

### 2.2 Cálculo do Custo do Patrimônio

```typescript
// lib/calculos/custoPatrimonio.ts

import { TimelineMensal, FluxoVenda } from '@/types/simulacao'
import { formatCurrency } from '@/lib/utils'

export function calcularCustoPatrimonio(
  timeline: TimelineMensal[],
  fluxoVendas: FluxoVenda[]
): CustoPatrimonio {
  // Total Pago do Bolso
  const totalPagoBolso = timeline.reduce(
    (sum, mes) => sum + mes.parcelasPagas,
    0
  )

  // Total Recebido com Venda de Cartas
  const totalRecebidoVendas = fluxoVendas.reduce(
    (sum, venda) => sum + venda.valorLiquidoRecebido,
    0
  )

  // Total Reinvestido
  const totalReinvestido = fluxoVendas.reduce((sum, venda) => {
    if (venda.destinoDinheiro.reinvestir) {
      return sum + (venda.valorLiquidoRecebido * venda.destinoDinheiro.percentualReinvestir / 100)
    }
    return sum
  }, 0)

  // Patrimônio Final
  const ultimoMes = timeline[timeline.length - 1]
  const patrimonioFinal = ultimoMes.patrimonio

  // Quanto Custou Formar esse Patrimônio
  const custoFormacaoPatrimonio = totalPagoBolso - totalRecebidoVendas

  // Frase Automática
  const fraseAutomatica = `Você construiu um patrimônio de ${formatCurrency(patrimonioFinal)} pagando efetivamente ${formatCurrency(custoFormacaoPatrimonio)}.`

  return {
    totalPagoBolso,
    totalRecebidoVendas,
    totalReinvestido,
    patrimonioFinal,
    custoFormacaoPatrimonio,
    fraseAutomatica,
  }
}
```

### 2.3 Cálculo da Timeline Mensal

```typescript
// lib/calculos/timeline.ts

import { Quota } from '@/components/dashboard/SimulacoesTab'
import { ConfiguracaoSimulacao, TimelineMensal, EventoMensal, FluxoVenda } from '@/types/simulacao'
import { calcularValorComINCC } from './incc'

export function calcularTimelineMensal(
  cotas: Quota[],
  configuracao: ConfiguracaoSimulacao,
  inccData: { media12Meses: number }
): { timeline: TimelineMensal[], fluxoVendas: FluxoVenda[] } {
  const prazoTotal = 240 // 20 anos
  const timeline: TimelineMensal[] = []
  const fluxoVendas: FluxoVenda[] = []
  
  let indiceCota = 0
  let caixa = 0
  let patrimonio = 0
  let totalPago = 0
  let cotasContempladas = 0
  let totalVendas = 0
  
  const taxaCDIMensal = Math.pow(1 + (configuracao.taxaCDIInvestimento / 100), 1/12) - 1
  const taxaINCCAnual = inccData.media12Meses / 100
  
  // Calcular parcela mensal total
  const parcelaMensalBase = cotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)
  let parcelaAtual = parcelaMensalBase
  
  for (let mes = 1; mes <= prazoTotal; mes++) {
    const eventos: EventoMensal[] = []
    let parcelasPagasMes = 0
    let contemplacoesMes = 0
    let vendasMes = 0
    
    // Aplicar INCC nas parcelas a cada 12 meses
    if (mes > 1 && mes % 12 === 1) {
      parcelaAtual = parcelaAtual * (1 + taxaINCCAnual)
    }
    
    // Verificar contemplação
    const proximaContemplacao = (indiceCota + 1) * configuracao.intervaloContemplacao
    if (indiceCota < cotas.length && mes === proximaContemplacao) {
      const cota = cotas[indiceCota]
      const vlBemComINCC = calcularValorComINCC(cota.vlBem || 0, mes, inccData.media12Meses)
      
      contemplacoesMes = 1
      cotasContempladas++
      
      eventos.push({
        mes,
        tipo: 'contemplacao',
        descricao: `Cota ${cota.grupo}-${cota.cota} contemplada`,
        valor: vlBemComINCC,
        cotaRelacionada: {
          grupo: cota.grupo,
          cota: cota.cota,
          vlBem: vlBemComINCC,
        },
        impactoCaixa: 0,
        impactoPatrimonio: vlBemComINCC,
        saldoAnterior: patrimonio,
        saldoAtual: patrimonio,
      })
      
      // Se antes do corte, vender
      if (mes <= configuracao.mesCorte) {
        const valorBrutoVenda = vlBemComINCC * (configuracao.percentualVenda / 100)
        const taxaIntermediacao = valorBrutoVenda * (configuracao.taxaIntermediacao / 100)
        const valorLiquidoRecebido = valorBrutoVenda - taxaIntermediacao
        
        vendasMes = 1
        totalVendas++
        
        // Aplicar destino do dinheiro
        const valorParaParcelas = valorLiquidoRecebido * (configuracao.destinoDinheiro.percentualParcelas / 100)
        const valorParaReinvestir = valorLiquidoRecebido * (configuracao.destinoDinheiro.percentualReinvestir / 100)
        const valorParaCDI = valorLiquidoRecebido * (configuracao.destinoDinheiro.percentualCDI / 100)
        
        caixa += valorLiquidoRecebido - valorParaParcelas
        
        // Adicionar ao fluxo de vendas
        fluxoVendas.push({
          mes,
          numeroCota: `${cota.grupo}-${cota.cota}`,
          valorCredito: vlBemComINCC,
          percentualVenda: configuracao.percentualVenda,
          valorBrutoVenda,
          taxaIntermediacao,
          valorLiquidoRecebido,
          destinoDinheiro: {
            pagarParcelas: configuracao.destinoDinheiro.percentualParcelas > 0,
            reinvestir: configuracao.destinoDinheiro.percentualReinvestir > 0,
            aplicarCDI: configuracao.destinoDinheiro.percentualCDI > 0,
            percentualParcelas: configuracao.destinoDinheiro.percentualParcelas,
            percentualReinvestir: configuracao.destinoDinheiro.percentualReinvestir,
            percentualCDI: configuracao.destinoDinheiro.percentualCDI,
          },
          saldoAcumuladoCaixa: caixa,
        })
        
        eventos.push({
          mes,
          tipo: 'venda',
          descricao: `Venda da cota ${cota.grupo}-${cota.cota}`,
          valor: valorLiquidoRecebido,
          valorBruto: valorBrutoVenda,
          valorLiquido: valorLiquidoRecebido,
          cotaRelacionada: {
            grupo: cota.grupo,
            cota: cota.cota,
            vlBem: vlBemComINCC,
          },
          impactoCaixa: valorLiquidoRecebido,
          impactoPatrimonio: 0,
          saldoAnterior: caixa - valorLiquidoRecebido,
          saldoAtual: caixa,
        })
      } else {
        // Após corte, apenas contemplar (não vender)
        patrimonio += vlBemComINCC
      }
      
      indiceCota++
    }
    
    // Pagar parcelas
    let parcelaPaga = parcelaAtual
    
    // Se houver caixa, usar para pagar parcelas
    if (caixa > 0 && configuracao.destinoDinheiro.percentualParcelas > 0) {
      const valorDisponivel = caixa
      if (valorDisponivel >= parcelaPaga) {
        caixa -= parcelaPaga
        parcelaPaga = 0
      } else {
        parcelaPaga -= valorDisponivel
        caixa = 0
      }
    }
    
    totalPago += parcelaPaga
    parcelasPagasMes = parcelaPaga
    
    eventos.push({
      mes,
      tipo: 'pagamento',
      descricao: 'Parcela mensal paga',
      valor: parcelaPaga,
      impactoCaixa: -parcelaPaga,
      impactoPatrimonio: 0,
      saldoAnterior: totalPago - parcelaPaga,
      saldoAtual: totalPago,
    })
    
    // Aplicar rendimentos CDI no caixa
    if (caixa > 0 && configuracao.destinoDinheiro.percentualCDI > 0) {
      const rendimento = caixa * taxaCDIMensal
      caixa += rendimento
      
      eventos.push({
        mes,
        tipo: 'aplicacao',
        descricao: 'Rendimento CDI aplicado',
        valor: rendimento,
        impactoCaixa: rendimento,
        impactoPatrimonio: 0,
        saldoAnterior: caixa - rendimento,
        saldoAtual: caixa,
      })
    }
    
    // Atualizar patrimônio
    patrimonio = totalPago + caixa
    
    // Adicionar à timeline (registrar todos os meses ou apenas trimestralmente)
    if (mes % 3 === 0 || contemplacoesMes > 0 || vendasMes > 0 || mes === 1 || mes === prazoTotal) {
      timeline.push({
        mes,
        parcelasPagas: parcelasPagasMes,
        cotasAtivas: cotas.length - cotasContempladas,
        contemplacoes: contemplacoesMes,
        vendas: vendasMes,
        caixa,
        patrimonio,
        eventos,
      })
    }
  }
  
  return { timeline, fluxoVendas }
}
```

### 2.4 Cálculo do Resumo Estratégico

```typescript
// lib/calculos/resumoEstrategico.ts

import { ConfiguracaoSimulacao, IndicadoresPrincipais } from '@/types/simulacao'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function calcularResumoEstrategico(
  configuracao: ConfiguracaoSimulacao,
  indicadores: IndicadoresPrincipais
): ResumoEstrategico {
  // Estratégia Utilizada
  let estrategiaUtilizada = ''
  if (configuracao.estrategiaAposCorte === 'investido') {
    estrategiaUtilizada = `Venda de cotas contempladas até mês ${configuracao.mesCorte}, aplicação CDI após corte`
  } else {
    estrategiaUtilizada = `Venda de cotas contempladas até mês ${configuracao.mesCorte}, compra de imóvel após corte`
  }
  
  // Tempo de Construção
  const tempoConstrucao = '240 meses (20 anos)'
  
  // Eficiência do Modelo
  const eficienciaModelo = indicadores.totalPagoProjeto > 0
    ? formatPercent((indicadores.patrimonioFinalAcumulado / indicadores.totalPagoProjeto) * 100)
    : '0%'
  
  // Multiplicador Patrimonial
  const multiplicadorPatrimonial = indicadores.totalPagoProjeto > 0
    ? (indicadores.patrimonioFinalAcumulado / indicadores.totalPagoProjeto).toFixed(2) + 'x'
    : '0x'
  
  return {
    estrategiaUtilizada,
    tempoConstrucao,
    totalPago: indicadores.totalPagoProjeto,
    patrimonioFinal: indicadores.patrimonioFinalAcumulado,
    eficienciaModelo,
    multiplicadorPatrimonial,
  }
}
```

---

## 3️⃣ COMPONENTES REACT

### 3.1 Indicadores Principais

```typescript
// components/simulacao/IndicadoresPrincipais.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndicadoresPrincipais as IndicadoresType } from '@/types/simulacao'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { DollarSign, TrendingUp, Home, Calculator, Percent, Clock } from 'lucide-react'

interface Props {
  indicadores: IndicadoresType
}

export function IndicadoresPrincipais({ indicadores }: Props) {
  const cards = [
    {
      icon: DollarSign,
      label: 'Total Pago no Projeto',
      value: formatCurrency(indicadores.totalPagoProjeto),
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-600/30',
    },
    {
      icon: TrendingUp,
      label: 'Total Investido',
      value: formatCurrency(indicadores.totalInvestido),
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-600/30',
    },
    {
      icon: Home,
      label: 'Patrimônio Final Acumulado',
      value: formatCurrency(indicadores.patrimonioFinalAcumulado),
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-600/30',
    },
    {
      icon: Calculator,
      label: 'Ganho Patrimonial',
      value: formatCurrency(indicadores.ganhoPatrimonial),
      color: indicadores.ganhoPatrimonial >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: indicadores.ganhoPatrimonial >= 0 ? 'bg-green-900/20' : 'bg-red-900/20',
      borderColor: indicadores.ganhoPatrimonial >= 0 ? 'border-green-600/30' : 'border-red-600/30',
    },
    {
      icon: Percent,
      label: 'ROI',
      value: formatPercent(indicadores.roi),
      color: indicadores.roi >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: indicadores.roi >= 0 ? 'bg-green-900/20' : 'bg-red-900/20',
      borderColor: indicadores.roi >= 0 ? 'border-green-600/30' : 'border-red-600/30',
    },
    {
      icon: Clock,
      label: 'Custo por Real de Patrimônio',
      value: `R$ ${indicadores.custoPorRealPatrimonio.toFixed(2)}`,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900/20',
      borderColor: 'border-cyan-600/30',
    },
  ]

  return (
    <Card className="bg-black/50 border-red-600/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          💰 Indicadores Principais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <Card
                key={index}
                className={`${card.bgColor} ${card.borderColor} border overflow-hidden`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-5 w-5 ${card.color}`} />
                    <p className="text-sm text-gray-400">{card.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${card.color} break-words`}>
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3.2 Custo do Patrimônio

```typescript
// components/simulacao/CustoPatrimonioCard.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustoPatrimonio } from '@/types/simulacao'
import { formatCurrency } from '@/lib/utils'

interface Props {
  custoPatrimonio: CustoPatrimonio
}

export function CustoPatrimonioCard({ custoPatrimonio }: Props) {
  return (
    <Card className="bg-black/50 border-red-600/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🧮 Custo do Patrimônio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Pago do Bolso</p>
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(custoPatrimonio.totalPagoBolso)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Recebido com Vendas</p>
            <p className="text-xl font-bold text-green-400">
              {formatCurrency(custoPatrimonio.totalRecebidoVendas)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Reinvestido</p>
            <p className="text-xl font-bold text-blue-400">
              {formatCurrency(custoPatrimonio.totalReinvestido)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Patrimônio Final</p>
            <p className="text-xl font-bold text-cyan-400">
              {formatCurrency(custoPatrimonio.patrimonioFinal)}
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-red-600/20">
          <p className="text-sm text-gray-400 mb-1">Custo de Formação do Patrimônio</p>
          <p className="text-2xl font-bold text-yellow-400">
            {formatCurrency(custoPatrimonio.custoFormacaoPatrimonio)}
          </p>
        </div>
        
        <div className="pt-4 border-t border-red-600/20 bg-blue-900/10 p-4 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">💬 Frase Automática</p>
          <p className="text-lg text-white font-medium">
            {custoPatrimonio.fraseAutomatica}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 4️⃣ HOOKS CUSTOMIZADOS

### 4.1 Hook de Simulação

```typescript
// hooks/useSimulacaoPatrimonio.ts

import { useState, useMemo } from 'react'
import { Quota } from '@/components/dashboard/SimulacoesTab'
import { ConfiguracaoSimulacao, ResultadosSimulacao } from '@/types/simulacao'
import { calcularTimelineMensal } from '@/lib/calculos/timeline'
import { calcularIndicadoresPrincipais } from '@/lib/calculos/indicadores'
import { calcularCustoPatrimonio } from '@/lib/calculos/custoPatrimonio'
import { calcularResumoEstrategico } from '@/lib/calculos/resumoEstrategico'

export function useSimulacaoPatrimonio(
  cotas: Quota[],
  configuracao: ConfiguracaoSimulacao,
  inccData: { media12Meses: number }
) {
  const [loading, setLoading] = useState(false)
  
  const resultados = useMemo<ResultadosSimulacao | null>(() => {
    if (cotas.length === 0 || !configuracao) return null
    
    setLoading(true)
    
    try {
      // Calcular timeline e fluxo de vendas
      const { timeline, fluxoVendas } = calcularTimelineMensal(
        cotas,
        configuracao,
        inccData
      )
      
      // Calcular indicadores principais
      const indicadoresPrincipais = calcularIndicadoresPrincipais(
        timeline,
        fluxoVendas,
        configuracao
      )
      
      // Calcular custo do patrimônio
      const custoPatrimonio = calcularCustoPatrimonio(timeline, fluxoVendas)
      
      // Calcular resumo estratégico
      const resumoEstrategico = calcularResumoEstrategico(
        configuracao,
        indicadoresPrincipais
      )
      
      return {
        indicadoresPrincipais,
        custoPatrimonio,
        fluxoVendas,
        timelineMensal: timeline,
        resumoEstrategico,
      }
    } catch (error) {
      console.error('Erro ao calcular simulação:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [cotas, configuracao, inccData])
  
  return { resultados, loading }
}
```

---

## 5️⃣ UTILITÁRIOS

### 5.1 Exportação para PDF

```typescript
// lib/exportacao/pdf.ts

import jsPDF from 'jspdf'
import { ResultadosSimulacao } from '@/types/simulacao'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function exportarSimulacaoPDF(resultados: ResultadosSimulacao) {
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(20)
  doc.text('Relatório de Simulação - Acúmulo de Patrimônio', 20, 20)
  
  // Indicadores Principais
  doc.setFontSize(16)
  doc.text('Indicadores Principais', 20, 40)
  
  doc.setFontSize(12)
  let y = 50
  doc.text(`Total Pago no Projeto: ${formatCurrency(resultados.indicadoresPrincipais.totalPagoProjeto)}`, 20, y)
  y += 10
  doc.text(`Total Investido: ${formatCurrency(resultados.indicadoresPrincipais.totalInvestido)}`, 20, y)
  y += 10
  doc.text(`Patrimônio Final: ${formatCurrency(resultados.indicadoresPrincipais.patrimonioFinalAcumulado)}`, 20, y)
  y += 10
  doc.text(`Ganho Patrimonial: ${formatCurrency(resultados.indicadoresPrincipais.ganhoPatrimonial)}`, 20, y)
  y += 10
  doc.text(`ROI: ${formatPercent(resultados.indicadoresPrincipais.roi)}`, 20, y)
  
  // Adicionar nova página para fluxo de vendas
  doc.addPage()
  doc.setFontSize(16)
  doc.text('Fluxo de Vendas de Cartas', 20, 20)
  
  // Tabela de vendas
  let tableY = 30
  doc.setFontSize(10)
  resultados.fluxoVendas.slice(0, 20).forEach((venda, index) => {
    if (tableY > 280) {
      doc.addPage()
      tableY = 20
    }
    doc.text(`${venda.mes}`, 20, tableY)
    doc.text(venda.numeroCota, 40, tableY)
    doc.text(formatCurrency(venda.valorLiquidoRecebido), 100, tableY)
    tableY += 10
  })
  
  // Salvar PDF
  doc.save('simulacao-patrimonio.pdf')
}
```

### 5.2 Exportação para Excel

```typescript
// lib/exportacao/excel.ts

import * as XLSX from 'xlsx'
import { ResultadosSimulacao } from '@/types/simulacao'
import { formatCurrency } from '@/lib/utils'

export function exportarSimulacaoExcel(resultados: ResultadosSimulacao) {
  const workbook = XLSX.utils.book_new()
  
  // Aba 1: Indicadores Principais
  const indicadoresData = [
    ['Indicador', 'Valor'],
    ['Total Pago no Projeto', resultados.indicadoresPrincipais.totalPagoProjeto],
    ['Total Investido', resultados.indicadoresPrincipais.totalInvestido],
    ['Patrimônio Final', resultados.indicadoresPrincipais.patrimonioFinalAcumulado],
    ['Ganho Patrimonial', resultados.indicadoresPrincipais.ganhoPatrimonial],
    ['ROI (%)', resultados.indicadoresPrincipais.roi],
    ['Custo por Real', resultados.indicadoresPrincipais.custoPorRealPatrimonio],
  ]
  const indicadoresSheet = XLSX.utils.aoa_to_sheet(indicadoresData)
  XLSX.utils.book_append_sheet(workbook, indicadoresSheet, 'Indicadores')
  
  // Aba 2: Fluxo de Vendas
  const vendasData = [
    ['Mês', 'Cota', 'Valor Crédito', '% Venda', 'Valor Bruto', 'Taxa Intermediação', 'Valor Líquido', 'Caixa Acumulado'],
    ...resultados.fluxoVendas.map(v => [
      v.mes,
      v.numeroCota,
      v.valorCredito,
      v.percentualVenda,
      v.valorBrutoVenda,
      v.taxaIntermediacao,
      v.valorLiquidoRecebido,
      v.saldoAcumuladoCaixa,
    ]),
  ]
  const vendasSheet = XLSX.utils.aoa_to_sheet(vendasData)
  XLSX.utils.book_append_sheet(workbook, vendasSheet, 'Fluxo de Vendas')
  
  // Aba 3: Timeline Mensal
  const timelineData = [
    ['Mês', 'Parcelas Pagas', 'Cotas Ativas', 'Contemplações', 'Vendas', 'Caixa', 'Patrimônio'],
    ...resultados.timelineMensal.map(t => [
      t.mes,
      t.parcelasPagas,
      t.cotasAtivas,
      t.contemplacoes,
      t.vendas,
      t.caixa,
      t.patrimonio,
    ]),
  ]
  const timelineSheet = XLSX.utils.aoa_to_sheet(timelineData)
  XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline Mensal')
  
  // Salvar Excel
  XLSX.writeFile(workbook, 'simulacao-patrimonio.xlsx')
}
```

---

**Documento criado em:** 2026-01-13  
**Versão:** 1.0
