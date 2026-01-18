import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAvailableExperiences } from '@/lib/services/clubService'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const level = searchParams.get('level')
    const search = searchParams.get('search')

    // Se não estiver autenticado, retornar apenas experiências públicas
    if (!session?.user?.id) {
      const experiences = await prisma.experience.findMany({
        where: {
          status: 'active',
          clubLevelId: null, // Apenas públicas
          ...(category && { category }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
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
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      return NextResponse.json({
        experiences: experiences.map(exp => ({
          ...exp,
          eligible: true,
          availableSlots: null,
        })),
      })
    }

    // Se estiver autenticado, retornar com elegibilidade
    const experiences = await getAvailableExperiences(session.user.id)

    // Aplicar filtros
    let filtered = experiences

    if (category) {
      filtered = filtered.filter(exp => exp.category === category)
    }

    if (level) {
      filtered = filtered.filter(exp => !exp.clubLevel || exp.clubLevel.name === level)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(exp =>
        exp.title.toLowerCase().includes(searchLower) ||
        exp.description?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({ experiences: filtered })
  } catch (error: any) {
    console.error('Error fetching experiences:', error)
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      slug,
      title,
      description,
      longDescription,
      imageUrl,
      gallery,
      videoUrl,
      location,
      address,
      category,
      tags,
      clubLevelId,
      eligibilityRules,
      benefits,
      metadata,
    } = body

    const experience = await prisma.experience.create({
      data: {
        slug,
        title,
        description,
        longDescription,
        imageUrl,
        gallery: gallery ? JSON.stringify(gallery) : null,
        videoUrl,
        location,
        address,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        clubLevelId,
        eligibilityRules: eligibilityRules ? JSON.stringify(eligibilityRules) : null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'active',
      },
      include: {
        clubLevel: true,
        dates: true,
      },
    })

    return NextResponse.json(experience, { status: 201 })
  } catch (error: any) {
    console.error('Error creating experience:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
