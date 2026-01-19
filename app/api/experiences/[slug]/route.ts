import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkEligibility } from '@/lib/services/clubService'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { slug } = params

    const experience = await prisma.experience.findUnique({
      where: { slug },
      include: {
        clubLevel: true,
        dates: {
          where: { status: 'active' },
          orderBy: { date: 'asc' },
        },
        _count: {
          select: { reservations: true },
        },
      },
    })

    if (!experience) {
      return NextResponse.json(
        { error: 'Experiência não encontrada' },
        { status: 404 }
      )
    }

    // Calcular disponibilidade por data
    const datesWithAvailability = experience.dates.map(date => {
      const reservationsCount = date.reservations?.length || 0
      const availableSlots = Math.max(0, date.availableSlots)
      
      return {
        ...date,
        availableSlots,
        reservedSlots: reservationsCount,
        isAvailable: availableSlots > 0,
      }
    })

    // Verificar elegibilidade se usuário estiver autenticado
    let eligible = true
    let eligibilityReason: string | undefined

    if (session?.user?.id) {
      const eligibility = await checkEligibility(session.user.id, experience.id)
      eligible = eligibility.eligible
      eligibilityReason = eligibility.reason
    } else if (experience.clubLevel) {
      eligible = false
      eligibilityReason = `Nível ${experience.clubLevel.displayName} necessário. Faça login para verificar sua elegibilidade.`
    }

    return NextResponse.json({
      ...experience,
      dates: datesWithAvailability,
      eligible,
      eligibilityReason,
    })
  } catch (error: any) {
    console.error('Error fetching experience:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
