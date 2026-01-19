import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, getReservationConfirmationEmail } from '@/lib/services/emailService'

export const dynamic = 'force-dynamic'

/**
 * Confirmar reserva (mudar status de pending para confirmed)
 * e reenviar email de confirmação
 */
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

    // Verificar se pertence ao usuário ou é admin
    if (reservation.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Confirmar reserva
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        status: 'confirmed',
      },
      include: {
        experience: {
          include: { clubLevel: true },
        },
        date: true,
        clubLevel: true,
        guests: true,
      },
    })

    // Reenviar email de confirmação
    const userEmail = reservation.user?.email || session.user.email
    const userName = reservation.user?.name || session.user.name || 'Cliente'

    if (userEmail) {
      try {
        const emailTemplate = getReservationConfirmationEmail({
          userName,
          userEmail,
          experienceTitle: reservation.experience.title,
          experienceDate: reservation.date.date,
          experienceTime: reservation.date.time || undefined,
          location: reservation.experience.location || undefined,
          address: reservation.experience.address || undefined,
          guestCount: reservation.guestCount,
          guests: reservation.guests.map(g => ({
            name: g.name,
            email: g.email || undefined,
          })),
          qrCode: reservation.qrCodeImage || undefined,
          reservationId: reservation.id,
          clubLevel: reservation.clubLevel.displayName,
        })

        const emailResult = await sendEmail({
          to: userEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        })

        if (emailResult.success) {
          console.log(`✅ Email de confirmação reenviado para ${userEmail}`)
        }
      } catch (emailError: any) {
        console.error('❌ Erro ao reenviar email:', emailError)
      }
    }

    return NextResponse.json(updatedReservation)
  } catch (error: any) {
    console.error('Error confirming reservation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
