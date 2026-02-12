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

    const userRole = session.user.role as string

    // Cliente vê apenas suas próprias cotas
    // Vendedor/Admin vê suas cotas + cotas dos clientes que importou
    let quotas

    if (['VENDEDOR', 'ADMIN', 'LIDER', 'PARCEIRO'].includes(userRole)) {
      // Buscar IDs dos clientes para quem este vendedor importou cotas
      const importedBatches = await prisma.importBatch.findMany({
        where: {
          userId: session.user.id,
          importedForUserId: { not: null },
        },
        select: { importedForUserId: true },
      })

      const clientIds = [
        ...new Set(importedBatches.map(b => b.importedForUserId!)),
      ]

      quotas = await prisma.quota.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            ...(clientIds.length > 0 ? [{ userId: { in: clientIds } }] : []),
          ],
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          importBatch: {
            select: { userId: true, importedForUserId: true },
          },
        },
        orderBy: [
          { grupo: 'asc' },
          { cota: 'asc' },
        ],
      })

      // Marcar quais cotas são de clientes vs próprias
      quotas = quotas.map((q: any) => ({
        ...q,
        isClientQuota: q.userId !== session.user.id,
        clientName: q.userId !== session.user.id ? q.user?.name : null,
      }))
    } else {
      // Cliente: apenas suas cotas
      quotas = await prisma.quota.findMany({
        where: { userId: session.user.id },
        orderBy: [
          { grupo: 'asc' },
          { cota: 'asc' },
        ],
      })
    }

    return NextResponse.json({ quotas })
  } catch (error) {
    console.error('Cotas API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
