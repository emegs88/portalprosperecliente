import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        experience: true,
        date: true,
        clubLevel: true,
        guests: true,
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a reserva pertence ao usuário
    if (reservation.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      qrCode: reservation.qrCode,
      qrCodeImage: reservation.qrCodeImage,
      reservation: {
        id: reservation.id,
        experience: reservation.experience.title,
        date: reservation.date.date,
        time: reservation.date.time,
        status: reservation.status,
        guestCount: reservation.guestCount,
        guests: reservation.guests,
      },
    })
  } catch (error: any) {
    console.error('Error fetching QR code:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
