import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateCommission } from '@/lib/services/commissionService'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const period = searchParams.get('period')

    const where: any = {}

    // Filtrar por papel do usuário
    if (session.user.role === 'VENDEDOR' || session.user.role === 'LIDER') {
      where.sellerId = session.user.id
    } else if (session.user.role === 'CLIENTE') {
      where.clientId = session.user.id
    } else {
      // Admin pode ver tudo, aplicar filtros
      if (sellerId) where.sellerId = sellerId
      if (clientId) where.clientId = clientId
    }

    if (status) where.status = status
    if (period) {
      const [year, month] = period.split('-')
      where.saleDate = {
        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        lt: new Date(parseInt(year), parseInt(month), 1),
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true, image: true },
        },
        seller: {
          select: { id: true, name: true, email: true, image: true },
        },
        partner: {
          select: { id: true, name: true, email: true, image: true },
        },
        quota: true,
        commissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ sales })
  } catch (error: any) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'VENDEDOR' && session.user.role !== 'LIDER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      clientId,
      sellerId,
      partnerId,
      quotaId,
      productType,
      creditAmount,
      installmentAmount,
      term,
      saleDate,
      notes,
    } = body

    // Criar venda
    const sale = await prisma.sale.create({
      data: {
        clientId,
        sellerId: sellerId || session.user.id,
        partnerId,
        quotaId,
        productType,
        creditAmount: parseFloat(creditAmount),
        installmentAmount: parseFloat(installmentAmount),
        term: parseInt(term),
        status: 'proposta',
        saleDate: saleDate ? new Date(saleDate) : new Date(),
        notes,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        seller: {
          select: { id: true, name: true, email: true },
        },
        partner: {
          select: { id: true, name: true, email: true },
        },
        quota: true,
      },
    })

    // Calcular e criar comissões
    try {
      await calculateCommission(sale.id)
    } catch (error) {
      console.error('Error calculating commission:', error)
      // Continuar mesmo se falhar cálculo de comissão
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error: any) {
    console.error('Error creating sale:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
