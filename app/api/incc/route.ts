import { NextResponse } from 'next/server'
import { fetchINCCHistorico, projetarINCC } from '@/lib/services/inccService'

export const dynamic = 'force-dynamic' // Forçar renderização dinâmica

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const horizonte = parseInt(searchParams.get('horizonte') || '12', 10)

    const [historico, projecao] = await Promise.all([
      fetchINCCHistorico(),
      projetarINCC(horizonte),
    ])

    // Calcular média mensal dos últimos 12 meses
    const mediaMensal = historico.reduce((sum, item) => sum + (item.valor || 0), 0) / historico.length
    
    // Converter média mensal para taxa anual composta
    // Se cada mês tem taxa média de X%, a taxa anual é: (1 + X/100)^12 - 1
    // Mas para simplificar, vamos usar: média mensal * 12 (aproximação)
    // Ou calcular taxa anual acumulada: ((1 + taxa1/100) * (1 + taxa2/100) * ... * (1 + taxa12/100) - 1) * 100
    let taxaAnual = 0
    if (historico.length > 0) {
      // Calcular taxa anual acumulada (mais precisa)
      const taxaAcumulada = historico.reduce((acc, item) => {
        const taxaMensal = (item.valor || 0) / 100
        return acc * (1 + taxaMensal)
      }, 1)
      taxaAnual = (taxaAcumulada - 1) * 100
      
      // Se o cálculo der muito diferente, usar aproximação: média mensal * 12
      if (taxaAnual <= 0 || taxaAnual > 50) {
        taxaAnual = mediaMensal * 12
      }
    } else {
      taxaAnual = mediaMensal * 12 // Fallback
    }
    
    const ultimoValor = historico[historico.length - 1]?.valor || 0

    return NextResponse.json({
      historico,
      projecao,
      ultimoValor,
      media12Meses: taxaAnual, // Taxa anual em %
      mediaMensal: mediaMensal, // Média mensal em %
    })
  } catch (error) {
    console.error('Erro ao buscar INCC:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do INCC' },
      { status: 500 }
    )
  }
}
