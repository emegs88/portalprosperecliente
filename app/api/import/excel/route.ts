import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseExcel, parseExcelWithMapping, ExcelMapping } from '@/lib/services/excelParser'
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
    const mappingJson = formData.get('mapping') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Salvar arquivo
    const filename = `${Date.now()}-${file.name}`
    const uploadPath = path.join(process.cwd(), 'uploads', filename)
    await writeFile(uploadPath, buffer)

    // Parse Excel
    const parsed = mappingJson 
      ? parseExcelWithMapping(JSON.parse(mappingJson).rows, JSON.parse(mappingJson).headers, JSON.parse(mappingJson).mapping as ExcelMapping)
      : (await parseExcel(buffer)).quotas

    // Criar import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        userId: session.user.id,
        sourceType: 'XLSX',
        filename: file.name,
        status: parsed.length === 0 ? 'pending_review' : 'processing',
      },
    })

    // Salvar quotas
    if (parsed.length > 0) {
      const quotasData = parsed.map(q => ({
        userId: session.user.id,
        importBatchId: importBatch.id,
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
        needsReview: !!q.errors && q.errors.length > 0,
      }))

      await prisma.quota.createMany({
        data: quotasData,
      })
    }

    // Atualizar status
    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        status: 'completed',
        parsedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      importBatchId: importBatch.id,
      quotas: parsed,
    })
  } catch (error) {
    console.error('Erro ao importar Excel:', error)
    return NextResponse.json(
      { error: 'Erro ao processar Excel' },
      { status: 500 }
    )
  }
}
