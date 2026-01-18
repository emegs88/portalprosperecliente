import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkEligibility } from '@/lib/services/clubService'
import { generateQRCode } from '@/lib/services/qrService'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
      },
      include: {
        experience: {
          include: { clubLevel: true },
        },
        date: true,
        clubLevel: true,
        guests: true,
        _count: {
          select: { badges: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reservations })
  } catch (error: any) {
    console.error('Error fetching reservations:', error)
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

    const body = await request.json()
    const { experienceId, experienceDateId, guestCount, guests } = body

    // Verificar elegibilidade
    const eligibility = await checkEligibility(session.user.id, experienceId)
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason || 'Não elegível para esta experiência' },
        { status: 400 }
      )
    }

    // Verificar disponibilidade
    const experienceDate = await prisma.experienceDate.findUnique({
      where: { id: experienceDateId },
      include: {
        experience: true,
        _count: {
          select: { reservations: true },
        },
      },
    })

    if (!experienceDate) {
      return NextResponse.json(
        { error: 'Data não encontrada' },
        { status: 404 }
      )
    }

    if (experienceDate.availableSlots < guestCount) {
      return NextResponse.json(
        { error: 'Não há vagas suficientes' },
        { status: 400 }
      )
    }

    // Gerar QR Code
    const qrCode = await generateQRCode({
      userId: session.user.id,
      experienceId,
      experienceDateId,
    })

    // Criar reserva
    const reservation = await prisma.reservation.create({
      data: {
        userId: session.user.id,
        experienceId,
        experienceDateId,
        clubLevelId: eligibility.currentLevel.id,
        guestCount,
        maxGuests: guestCount,
        qrCode: qrCode.code,
        qrCodeImage: qrCode.imageUrl,
        status: 'pending',
        reservationDate: experienceDate.date,
        guests: {
          create: guests.map((guest: any) => ({
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            cpf: guest.cpf,
            birthDate: guest.birthDate ? new Date(guest.birthDate) : null,
            isLead: guest.isLead || false,
          })),
        },
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

    // Atualizar disponibilidade
    await prisma.experienceDate.update({
      where: { id: experienceDateId },
      data: {
        availableSlots: experienceDate.availableSlots - guestCount,
      },
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
