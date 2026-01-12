import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parsePDF } from '@/lib/services/pdfParser'
import { parsePDF as parsePDFWithOCR } from '@/lib/services/pdfParserWithOCR'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  let importBatch: any = null
  
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
    importBatch = await prisma.importBatch.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        status: 'processing',
      },
    })

    // Parse PDF - primeiro tenta normal, depois OCR se necessário
    console.log('📄 Iniciando parse do PDF:', file.name)
    let parsed = await parsePDF(buffer)
    console.log(`📊 Parse normal: ${parsed.quotas.length} cotas encontradas`)
    
    // Se não encontrou cotas suficientes, tenta com OCR
    if (parsed.quotas.length === 0) {
      console.log('⚠️  Nenhuma cota encontrada no modo normal, tentando OCR...')
      try {
        parsed = await parsePDFWithOCR(buffer, true)
        console.log(`📊 Parse OCR: ${parsed.quotas.length} cotas encontradas`)
      } catch (ocrError: any) {
        console.error('❌ Erro no OCR:', ocrError)
        // Continuar com o parsed vazio
      }
    }

    // Salvar quotas
    if (parsed.quotas && parsed.quotas.length > 0) {
      console.log(`💾 Salvando ${parsed.quotas.length} cotas no banco...`)
      const quotasData = parsed.quotas.map(q => ({
        userId: session.user.id,
        importBatchId: importBatch.id,
        administradora: (parsed.header?.administradora) || null,
        empresa: (parsed.header?.empresa) || null,
        grupo: q.grupo || '',
        cota: q.cota || '',
        versao: q.versao || '',
        dataVenda: q.dataVenda || '',
        situacaoCobranca: q.situacaoCobranca || 'N00 - NORMAL',
        contemplacao: q.contemplacao || 'Não Contemplada',
        percentPago: q.percentPago || 0,
        percentAtraso: q.percentAtraso || 0,
        percentFundoComum: q.percentFundoComum || 0,
        pclsPagar: q.pclsPagar || 0,
        pclsPagas: q.pclsPagas || 0,
        pclsPagasEmDia: q.pclsPagasEmDia || 0,
        pclsPagasAtraso: q.pclsPagasAtraso || 0,
        pclsEmAtraso: q.pclsEmAtraso || 0,
        vlBem: q.vlBem || 0,
        vlParcela: q.vlParcela || 0,
        vlQuitacao: q.vlQuitacao || 0,
        vlReceber: q.vlReceber || 0,
        tipoBem: q.tipoBem || null,
      }))

      // Deletar cotas anteriores deste batch antes de inserir novas
      await prisma.quota.deleteMany({
        where: { importBatchId: importBatch.id }
      })

      // Remover duplicatas antes de inserir (baseado em grupo + cota)
      const uniqueQuotas = quotasData.filter((q, index, self) =>
        index === self.findIndex((q2) => q2.grupo === q.grupo && q2.cota === q.cota)
      )
      
      if (uniqueQuotas.length !== quotasData.length) {
        console.log(`⚠️  ${quotasData.length - uniqueQuotas.length} cotas duplicadas removidas antes de salvar`)
      }

      await prisma.quota.createMany({
        data: uniqueQuotas,
      })
      
      console.log(`✅ ${uniqueQuotas.length} cotas salvas no banco`)
    } else {
      console.error('❌ Nenhuma cota para salvar!')
      console.error('📋 Dados do parse:', {
        quotas: parsed.quotas?.length || 0,
        errors: parsed.errors || [],
        header: parsed.header || {},
      })
    }

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
    const hasErrors = parsed.errors && parsed.errors.length > 0
    const hasQuotas = parsed.quotas && parsed.quotas.length > 0
    const finalStatus = hasQuotas ? (hasErrors ? 'pending_review' : 'completed') : 'failed'
    
    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        status: finalStatus,
        parsedAt: new Date(),
        errorsJson: hasErrors ? JSON.stringify(parsed.errors) : null,
      },
    })

    console.log(`✅ Importação finalizada: ${finalStatus}, ${parsed.quotas?.length || 0} cotas`)

    return NextResponse.json({
      success: hasQuotas,
      importBatchId: importBatch.id,
      quotasImportadas: parsed.quotas?.length || 0,
      quotas: parsed.quotas || [],
      totals: parsed.totals || null,
      errors: parsed.errors || [],
      header: parsed.header || {},
      message: hasQuotas 
        ? `Importação concluída! ${parsed.quotas.length} cotas importadas.`
        : 'Nenhuma cota foi encontrada no PDF. Verifique se o arquivo está no formato correto.',
    })
  } catch (error: any) {
    console.error('❌ Erro ao importar PDF:', error)
    console.error('❌ Stack:', error.stack)
    
    // Se tiver importBatch, atualizar status para failed
    if (importBatch?.id) {
      try {
        await prisma.importBatch.update({
          where: { id: importBatch.id },
          data: {
            status: 'failed',
            errorsJson: JSON.stringify([error.message || 'Erro desconhecido']),
          },
        })
      } catch (updateError) {
        console.error('Erro ao atualizar status do batch:', updateError)
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro ao processar PDF',
        quotasImportadas: 0,
        quotas: [],
      },
      { status: 500 }
    )
  }
}
