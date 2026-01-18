import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quotas = await prisma.quota.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { grupo: 'asc' },
        { cota: 'asc' },
      ],
    })

    return NextResponse.json({ quotas })
  } catch (error) {
    console.error('Cotas API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
