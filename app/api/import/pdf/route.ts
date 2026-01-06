import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parsePDF } from '@/lib/services/pdfParser'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Salvar arquivo
    const filename = `${Date.now()}-${file.name}`
    const uploadPath = path.join(process.cwd(), 'uploads', filename)
    await writeFile(uploadPath, buffer)

    // Criar import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        status: 'processing',
      },
    })

    // Parse PDF
    const parsed = await parsePDF(buffer)

    // Salvar quotas
    const quotasData = parsed.quotas.map(q => ({
      userId: session.user.id,
      importBatchId: importBatch.id,
      administradora: parsed.header.administradora,
      empresa: parsed.header.empresa,
      grupo: q.grupo,
      cota: q.cota,
      versao: q.versao,
      dataVenda: q.dataVenda,
      situacaoCobranca: q.situacaoCobranca,
      contemplacao: q.contemplacao,
      percentPago: q.percentPago,
      percentAtraso: q.percentAtraso,
      percentFundoComum: q.percentFundoComum,
      pclsPagar: q.pclsPagar,
      pclsPagas: q.pclsPagas,
      pclsPagasEmDia: q.pclsPagasEmDia,
      pclsPagasAtraso: q.pclsPagasAtraso,
      pclsEmAtraso: q.pclsEmAtraso,
      vlBem: q.vlBem,
      vlParcela: q.vlParcela,
      vlQuitacao: q.vlQuitacao,
      vlReceber: q.vlReceber,
    }))

    await prisma.quota.createMany({
      data: quotasData,
    })

    // Salvar totais
    if (parsed.totals) {
      await prisma.importTotals.create({
        data: {
          importBatchId: importBatch.id,
          totalCotas: parsed.totals.totalCotas,
          totalVlBem: parsed.totals.totalVlBem,
          totalVlParcela: parsed.totals.totalVlParcela,
          totalVlQuitacao: parsed.totals.totalVlQuitacao,
          totalVlReceber: parsed.totals.totalVlReceber,
        },
      })
    }

    // Atualizar status
    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        status: parsed.errors.length > 0 ? 'pending_review' : 'completed',
        parsedAt: new Date(),
        errorsJson: parsed.errors.length > 0 ? JSON.stringify(parsed.errors) : null,
      },
    })

    return NextResponse.json({
      success: true,
      importBatchId: importBatch.id,
      quotas: parsed.quotas,
      totals: parsed.totals,
      errors: parsed.errors,
    })
  } catch (error) {
    console.error('Erro ao importar PDF:', error)
    return NextResponse.json(
      { error: 'Erro ao processar PDF' },
      { status: 500 }
    )
  }
}
