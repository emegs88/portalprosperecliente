import { NextResponse } from 'next/server'
import { fetchINCCHistorico, projetarINCC } from '@/lib/services/inccService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const horizonte = parseInt(searchParams.get('horizonte') || '12', 10)

    const [historico, projecao] = await Promise.all([
      fetchINCCHistorico(),
      projetarINCC(horizonte),
    ])

    const media12Meses = historico.reduce((sum, item) => sum + (item.valor || 0), 0) / historico.length
    const ultimoValor = historico[historico.length - 1]?.valor || 0

    return NextResponse.json({
      historico,
      projecao,
      ultimoValor,
      media12Meses,
    })
  } catch (error) {
    console.error('Erro ao buscar INCC:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do INCC' },
      { status: 500 }
    )
  }
}
