import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { parsePDFWithOCR, ParsedQuota } from '@/lib/services/pdfParserWithOCR'
import { parsePDFEnhanced } from '@/lib/services/pdfParserEnhanced'
import { parsePDFImproved } from '@/lib/services/pdfParserImproved'
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

    // Tentar parse melhorado (focado em valores brasileiros corretos)
    console.log('🔄 Tentando parse melhorado do PDF (focado em valores BR)...')
    let parseResult = await parsePDFImproved(buffer, true)

    // Se não encontrou cotas ou cotas incompletas, tentar outros métodos
    if (parseResult.quotas.length === 0 || parseResult.quotas.some(q => !q.vlBem || !q.vlParcela)) {
      console.log('⚠️ Parse melhorado incompleto, tentando métodos alternativos...')
      
      try {
        // Tentar método enhanced
        const enhancedResult = await parsePDFEnhanced(buffer, true)
        if (enhancedResult.quotas.length > parseResult.quotas.length) {
          parseResult = enhancedResult
        } else if (parseResult.quotas.length > 0) {
          // Mesclar para completar dados faltantes
          const quotaMap = new Map<string, ParsedQuota>()
          parseResult.quotas.forEach(q => {
            const key = `${q.grupo}-${q.cota}`
            quotaMap.set(key, q)
          })
          enhancedResult.quotas.forEach(q => {
            const key = `${q.grupo}-${q.cota}`
            const existing = quotaMap.get(key)
            if (existing) {
              if (!existing.vlBem && q.vlBem) existing.vlBem = q.vlBem
              if (!existing.vlParcela && q.vlParcela) existing.vlParcela = q.vlParcela
            } else {
              quotaMap.set(key, q)
            }
          })
          parseResult.quotas = Array.from(quotaMap.values())
        }
      } catch (enhancedError) {
        console.error('❌ Enhanced error:', enhancedError)
      }
    } else {
      console.log(`✅ Parse melhorado encontrou ${parseResult.quotas.length} cotas`)
      if (parseResult.quotas.length > 0) {
        const sample = parseResult.quotas[0]
        console.log(`📊 Exemplo extraído: vlBem=${sample.vlBem}, vlParcela=${sample.vlParcela}`)
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
