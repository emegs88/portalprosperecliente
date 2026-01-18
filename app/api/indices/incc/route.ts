import { NextResponse } from 'next/server'
import { fetchINCC } from '@/lib/services/indicesService'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') as 'monthly') || 'monthly'

    const incc = await fetchINCC(period)

    return NextResponse.json({ incc, period })
  } catch (error: any) {
    console.error('Erro ao buscar INCC:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar INCC' },
      { status: 500 }
    )
  }
}
