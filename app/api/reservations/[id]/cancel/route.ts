import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, getReservationCancellationEmail } from '@/lib/services/emailService'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        experience: true,
        date: true,
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se pertence ao usuário ou é admin
    if (reservation.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cancelar reserva
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
      },
      include: {
        experience: true,
        date: true,
      },
    })

    // Restaurar disponibilidade
    await prisma.experienceDate.update({
      where: { id: reservation.experienceDateId },
      data: {
        availableSlots: {
          increment: reservation.guestCount,
        },
      },
    })

    // Enviar email de cancelamento
    if (reservation.user.email) {
      try {
        const emailTemplate = getReservationCancellationEmail({
          userName: reservation.user.name || 'Cliente',
          experienceTitle: reservation.experience.title,
          experienceDate: reservation.date.date,
          reservationId: reservation.id,
        })

        await sendEmail({
          to: reservation.user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        })

        console.log(`✅ Email de cancelamento enviado para ${reservation.user.email}`)
      } catch (emailError: any) {
        console.error('❌ Erro ao enviar email de cancelamento:', emailError)
      }
    }

    return NextResponse.json(updatedReservation)
  } catch (error: any) {
    console.error('Error cancelling reservation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
