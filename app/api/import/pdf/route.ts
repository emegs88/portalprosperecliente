import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parsePDF } from '@/lib/services/pdfParser'
import { parsePDFEnhanced } from '@/lib/services/pdfParserEnhanced'
import { parsePDFImproved } from '@/lib/services/pdfParserImproved'
import { parsePDFWithOCR } from '@/lib/services/pdfParserWithOCR'
import { parsePDFRobust } from '@/lib/services/pdfParserRobust'
import { parsePDFAncora, isAncoraFormat } from '@/lib/services/pdfParserAncora'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Arquivo deve ser PDF' }, { status: 400 })
    }

    // Salvar arquivo temporariamente
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const filepath = join(uploadsDir, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filepath, buffer)

    // 1. Tentar parser Âncora primeiro (formato específico, maior precisão)
    console.log('🔄 Tentando parser Âncora (formato específico)...')
    let parseResult: { quotas: any[]; errors: string[] } = { quotas: [], errors: [] }

    try {
      const pdfParse = (await import('pdf-parse')).default
      const pdfData = await pdfParse(buffer, { max: 0 })
      const rawText = pdfData.text || ''

      if (isAncoraFormat(rawText)) {
        console.log('✅ Formato Âncora detectado! Usando parser específico...')
        const ancoraResult = await parsePDFAncora(buffer)
        if (ancoraResult.quotas.length > 0) {
          parseResult = {
            quotas: ancoraResult.quotas,
            errors: ancoraResult.errors,
          }
          console.log(`✅ Parser Âncora encontrou ${parseResult.quotas.length} cotas`)
        } else {
          console.log('⚠️ Parser Âncora não encontrou cotas, tentando parsers genéricos...')
        }
      }
    } catch (ancoraError) {
      console.error('⚠️ Parser Âncora falhou, tentando parsers genéricos:', ancoraError)
    }

    // 2. Se Âncora não encontrou, tentar parse melhorado (focado em valores brasileiros)
    if (parseResult.quotas.length === 0) {
      console.log('🔄 Tentando parse melhorado do PDF (valores BR)...')
      parseResult = await parsePDFImproved(buffer, false)
    }

    // 3. Se não encontrou cotas, tentar enhanced como fallback
    if (parseResult.quotas.length === 0 || parseResult.quotas.some(q => !q.vlBem || !q.vlParcela)) {
      console.log('⚠️ Parse melhorado incompleto, tentando enhanced...')
      const enhancedResult = await parsePDFEnhanced(buffer, false)
      if (enhancedResult.quotas.length > 0) {
        parseResult = enhancedResult
      }
    }

    // 4. Se ainda não encontrou, tentar parser robusto (último recurso)
    if (parseResult.quotas.length === 0 || parseResult.quotas.some(q => !q.vlBem || !q.vlParcela)) {
      console.log('⚠️ Parse enhanced incompleto, tentando parser robusto (extração agressiva)...')
      try {
        const robustResult = await parsePDFRobust(buffer)
        if (robustResult.quotas.length > parseResult.quotas.length) {
          parseResult = robustResult
          console.log(`✅ Parser robusto encontrou ${parseResult.quotas.length} cotas`)
        }
      } catch (robustError) {
        console.error('❌ Parser robusto falhou:', robustError)
      }
    } else {
      console.log(`✅ Parse encontrou ${parseResult.quotas.length} cotas`)
    }

    if (parseResult.errors.length > 0 && parseResult.quotas.length === 0) {
      return NextResponse.json(
        { error: parseResult.errors.join(', ') || 'Nenhuma cota encontrada no PDF. Tente usar OCR para PDFs escaneados.' },
        { status: 400 }
      )
    }

    // Extrair dados do cliente do PDF (se Âncora)
    let clientInfo: { nome: string; cpf: string } | null = null
    let ancoraClientData: any = null

    try {
      const pdfParseLib = (await import('pdf-parse')).default
      const pdfCheck = await pdfParseLib(buffer, { max: 0 })
      const checkText = pdfCheck.text || ''

      if (isAncoraFormat(checkText)) {
        const ancoraFull = await parsePDFAncora(buffer)
        if (ancoraFull.cliente) {
          clientInfo = {
            nome: ancoraFull.cliente.nome,
            cpf: ancoraFull.cliente.cpfCnpj,
          }
          ancoraClientData = ancoraFull.cliente
        }
      }
    } catch {
      // Ignorar erros na extração de cliente
    }

    // Tentar criar/encontrar conta do cliente se tiver dados
    const clientEmail = formData.get('clientEmail') as string | null
    let clientAccount: any = null
    let needsClientEmail = false

    if (clientInfo) {
      const { findOrCreateClientFromPDF } = await import('@/lib/services/clientAccountService')
      clientAccount = await findOrCreateClientFromPDF(
        {
          nome: clientInfo.nome,
          cpf: clientInfo.cpf,
          email: clientEmail || undefined,
        },
        session.user.id
      )

      // Se criou com email placeholder e não tem email real, sinalizar
      if (clientAccount.user.isNew && !clientEmail && clientAccount.user.email.endsWith('@prospere.pendente')) {
        needsClientEmail = true
      }
    }

    // Determinar a quem vincular as cotas
    const quotaOwnerId = clientAccount ? clientAccount.user.id : session.user.id
    const clientProfileId = clientAccount ? clientAccount.clientProfile.id : null

    // Criar batch de importação
    const importBatch = await prisma.importBatch.create({
      data: {
        userId: session.user.id,
        importedForUserId: clientAccount ? clientAccount.user.id : null,
        sourceType: 'PDF',
        filename: file.name,
        status: 'PENDING',
        clientName: clientInfo?.nome || null,
        clientCpf: clientInfo?.cpf || null,
        errorsJson: parseResult.errors.length > 0 ? JSON.stringify(parseResult.errors) : null,
      },
    })

    // Criar quotas vinculadas ao cliente (ou ao vendedor se não tem cliente)
    if (parseResult.quotas.length > 0) {
      await prisma.quota.createMany({
        data: parseResult.quotas.map(quota => ({
          userId: quotaOwnerId,
          clientProfileId,
          importBatchId: importBatch.id,
          administradora: 'ANCORA ADMINISTRADORA DE CONSORCIOS S.A.',
          grupo: quota.grupo,
          cota: quota.cota,
          versao: quota.versao,
          dataVenda: quota.dataVenda || new Date().toLocaleDateString('pt-BR'),
          situacaoCobranca: quota.situacaoCobranca,
          contemplacao: quota.contemplacao,
          percentPago: quota.percentPago,
          percentAtraso: quota.percentAtraso,
          percentFundoComum: quota.percentFundoComum,
          pclsPagar: quota.pclsPagar,
          pclsPagas: quota.pclsPagas,
          pclsPagasEmDia: quota.pclsPagasEmDia,
          pclsPagasAtraso: quota.pclsPagasAtraso,
          pclsEmAtraso: quota.pclsEmAtraso,
          vlBem: quota.vlBem,
          vlParcela: quota.vlParcela,
          vlQuitacao: quota.vlQuitacao,
          vlReceber: quota.vlReceber,
        })),
      })

      // Calcular totais
      const totals = parseResult.quotas.reduce(
        (acc, q) => ({
          totalCotas: acc.totalCotas + 1,
          totalVlBem: acc.totalVlBem + q.vlBem,
          totalVlParcela: acc.totalVlParcela + q.vlParcela,
          totalVlQuitacao: acc.totalVlQuitacao + q.vlQuitacao,
          totalVlReceber: acc.totalVlReceber + q.vlReceber,
        }),
        {
          totalCotas: 0,
          totalVlBem: 0,
          totalVlParcela: 0,
          totalVlQuitacao: 0,
          totalVlReceber: 0,
        }
      )

      await prisma.importTotals.create({
        data: {
          importBatchId: importBatch.id,
          ...totals,
        },
      })

      // Enviar email de boas-vindas se criou conta nova com email real
      if (clientAccount?.user.isNew && clientAccount.setPasswordToken && !needsClientEmail) {
        try {
          const { sendEmail, getWelcomeSetPasswordEmail } = await import('@/lib/services/emailService')
          const emailData = getWelcomeSetPasswordEmail({
            clientName: clientInfo!.nome,
            clientEmail: clientAccount.user.email,
            token: clientAccount.setPasswordToken,
            vendedorNome: session.user.name || 'Prospere',
            totalCotas: totals.totalCotas,
            totalCredito: totals.totalVlBem,
          })
          await sendEmail({
            to: clientAccount.user.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
          })
          console.log(`📧 Email de boas-vindas enviado para: ${clientAccount.user.email}`)
        } catch (emailError) {
          console.error('⚠️ Erro ao enviar email de boas-vindas:', emailError)
          // Não falhar a importação por erro de email
        }
      }

      // Atualizar status do batch
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: needsClientEmail ? 'NEEDS_EMAIL' : 'COMPLETED',
          parsedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      importBatchId: importBatch.id,
      quotasCount: parseResult.quotas.length,
      errors: parseResult.errors,
      // Dados do cliente criado
      client: clientAccount ? {
        id: clientAccount.user.id,
        name: clientAccount.user.name,
        email: clientAccount.user.email,
        isNew: clientAccount.user.isNew,
        needsEmail: needsClientEmail,
      } : null,
      needsClientEmail,
    })
  } catch (error: any) {
    console.error('❌ Import PDF error:', error)
    
    // Garantir que sempre retorna JSON válido
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Erro desconhecido ao importar PDF'
    
    // Se o erro parece ser de parsing JSON, informar melhor
    if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected')) {
      return NextResponse.json(
        { 
          error: 'Erro ao processar o arquivo PDF. O arquivo pode estar corrompido ou em formato não suportado. Tente usar OCR para PDFs escaneados.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
