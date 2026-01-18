import { NextResponse } from 'next/server'
import { fetchPoupanca } from '@/lib/services/indicesService'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') as 'monthly' | 'annual') || 'monthly'

    const poupanca = await fetchPoupanca(period)

    return NextResponse.json({ poupanca, period })
  } catch (error: any) {
    console.error('Erro ao buscar Poupança:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar Poupança' },
      { status: 500 }
    )
  }
}
