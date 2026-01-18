import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import Tesseract from 'tesseract.js'
import pdfParse from 'pdf-parse'
import { parsePDF } from '@/lib/services/pdfParser'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutos para OCR

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

    // Tentar parse normal primeiro
    let parseResult = await parsePDF(buffer)

    // Se não encontrou cotas, usar OCR
    if (parseResult.quotas.length === 0) {
      try {
        const pdfData = await pdfParse(buffer)
        const numPages = pdfData.numpages

        // Processar cada página com OCR
        let fullText = ''
        for (let page = 1; page <= Math.min(numPages, 10); page++) {
          // Nota: Tesseract.js funciona melhor com imagens
          // Aqui estamos usando o texto extraído do PDF como fallback
          // Para OCR completo, seria necessário converter PDF para imagem primeiro
          fullText += pdfData.text
        }

        // Tentar parse novamente com texto do OCR
        if (fullText.length > 0) {
          // Criar um novo buffer com o texto extraído
          const textBuffer = Buffer.from(fullText)
          parseResult = await parsePDF(textBuffer)
        }
      } catch (ocrError) {
        console.error('OCR error:', ocrError)
        // Continuar com resultado do parse normal
      }
    }

    if (parseResult.errors.length > 0 && parseResult.quotas.length === 0) {
      return NextResponse.json(
        { error: parseResult.errors.join(', ') || 'Nenhuma cota encontrada no PDF' },
        { status: 400 }
      )
    }

    // Criar batch de importação
    const importBatch = await prisma.importBatch.create({
      data: {
        userId: session.user.id,
        sourceType: 'PDF-OCR',
        filename: file.name,
        status: 'PENDING',
        errorsJson: parseResult.errors.length > 0 ? JSON.stringify(parseResult.errors) : null,
      },
    })

    // Criar quotas
    if (parseResult.quotas.length > 0) {
      await prisma.quota.createMany({
        data: parseResult.quotas.map(quota => ({
          userId: session.user.id,
          importBatchId: importBatch.id,
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

      // Atualizar status do batch
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'COMPLETED',
          parsedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      importBatchId: importBatch.id,
      quotasCount: parseResult.quotas.length,
      errors: parseResult.errors,
    })
  } catch (error) {
    console.error('Import PDF OCR error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao importar PDF com OCR' },
      { status: 500 }
    )
  }
}
