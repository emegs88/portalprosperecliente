/**
 * POST /api/import/pdf/complete
 *
 * Completa a importação quando o vendedor fornece o email do cliente.
 * Chamado após o import inicial retornar needsClientEmail: true.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateClientEmail } from '@/lib/services/clientAccountService'
import { sendEmail, getWelcomeSetPasswordEmail } from '@/lib/services/emailService'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { importBatchId, clientEmail } = body

    if (!importBatchId || !clientEmail) {
      return NextResponse.json(
        { error: 'importBatchId e clientEmail são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Buscar batch
    const batch = await prisma.importBatch.findFirst({
      where: {
        id: importBatchId,
        userId: session.user.id,
        status: 'NEEDS_EMAIL',
      },
      include: {
        importedForUser: true,
        totals: true,
      },
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Importação não encontrada ou já completada' },
        { status: 404 }
      )
    }

    if (!batch.importedForUserId) {
      return NextResponse.json(
        { error: 'Importação sem cliente vinculado' },
        { status: 400 }
      )
    }

    // Atualizar email do cliente e gerar token
    const { setPasswordToken } = await updateClientEmail(
      batch.importedForUserId,
      clientEmail
    )

    // Enviar email de boas-vindas
    try {
      const emailData = getWelcomeSetPasswordEmail({
        clientName: batch.clientName || batch.importedForUser?.name || 'Cliente',
        clientEmail,
        token: setPasswordToken,
        vendedorNome: session.user.name || 'Prospere',
        totalCotas: batch.totals?.totalCotas || 0,
        totalCredito: batch.totals?.totalVlBem || 0,
      })

      await sendEmail({
        to: clientEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      })

      console.log(`📧 Email de boas-vindas enviado para: ${clientEmail}`)
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email:', emailError)
    }

    // Atualizar status do batch
    await prisma.importBatch.update({
      where: { id: importBatchId },
      data: { status: 'COMPLETED' },
    })

    return NextResponse.json({
      success: true,
      clientEmail,
      message: 'Email enviado com sucesso',
    })
  } catch (error: any) {
    console.error('❌ Complete import error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao completar importação' },
      { status: 500 }
    )
  }
}
