import { NextResponse } from 'next/server'
import { fetchCDI } from '@/lib/services/indicesService'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') as 'monthly' | 'annual') || 'monthly'

    const cdi = await fetchCDI(period)

    return NextResponse.json({ cdi, period })
  } catch (error: any) {
    console.error('Erro ao buscar CDI:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar CDI' },
      { status: 500 }
    )
  }
}
