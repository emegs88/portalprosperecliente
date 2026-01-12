import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parsePDFText } from '@/lib/services/pdfParser'
import { parseExcel } from '@/lib/services/excelParser'
import { extractTextWithOCR } from '@/lib/services/ocrService'
import pdfParse from 'pdf-parse'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const userRole = (session.user as any)?.role?.toLowerCase()
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    // Obter arquivo
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const userId = (session.user as any)?.id
    const filename = file.name
    const ext = filename.split('.').pop()?.toLowerCase()

    // Criar job de importação
    const importJob = await prisma.importJob.create({
      data: {
        userId,
        status: 'PROCESSING',
        filename,
      },
    })

    // Processar arquivo em background (async)
    processFileAsync(file, importJob.id, userId, ext || '')

    return NextResponse.json({
      success: true,
      jobId: importJob.id,
      message: 'Arquivo recebido e será processado em background',
    })
  } catch (error: any) {
    console.error('Erro ao importar extrato:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar arquivo' },
      { status: 500 }
    )
  }
}

async function processFileAsync(file: File, jobId: string, userId: string, ext: string) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    let parsedData: any = null
    let rawText = ''

    if (ext === 'pdf') {
      // Tentar extrair texto do PDF
      try {
        console.log(`📄 Processando PDF: ${file.name} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)
        
        // Primeiro, tentar extração normal
        let pdfData
        try {
          pdfData = await pdfParse(buffer)
          rawText = pdfData.text || ''
          console.log(`📄 Texto extraído inicialmente: ${rawText.length} caracteres`)
        } catch (parseError) {
          console.log('⚠️ Erro no parse inicial, tentando OCR...')
          rawText = await extractTextWithOCR(buffer)
        }

        // Se texto muito pequeno ou vazio, tentar OCR
        if (!rawText || rawText.trim().length < 50) {
          console.log('📄 PDF com pouco texto, tentando OCR melhorado...')
          try {
            rawText = await extractTextWithOCR(buffer)
            console.log(`📄 Após OCR: ${rawText.length} caracteres`)
          } catch (ocrError) {
            console.error('❌ Erro no OCR:', ocrError)
            // Continuar com o texto que temos, mesmo que pequeno
          }
        }

        // Garantir que temos algum texto
        if (!rawText || rawText.trim().length === 0) {
          throw new Error('Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.')
        }

        // Atualizar job com texto extraído
        await prisma.importJob.update({
          where: { id: jobId },
          data: { rawText: rawText.substring(0, 100000) }, // Limitar tamanho
        })

        // Parse do PDF usando texto extraído
        console.log('📄 Iniciando parse do texto extraído...')
        const parseResult = await parsePDFText(rawText)
        
        console.log(`✅ Parse concluído: ${parseResult.quotas.length} cotas encontradas`)
        
        parsedData = {
          cotas: parseResult.quotas || [],
          header: parseResult.header || {},
          totals: parseResult.totals || {},
          errors: parseResult.errors || [],
        }
        
        // Se não encontrou cotas mas tem texto, adicionar aviso
        if (parseResult.quotas.length === 0 && rawText.length > 100) {
          parsedData.errors = parsedData.errors || []
          parsedData.errors.push('Nenhuma cota foi encontrada no PDF. Verifique se o formato está correto.')
          console.warn('⚠️ Nenhuma cota encontrada no PDF')
        }
      } catch (error: any) {
        console.error('❌ Erro ao processar PDF:', error)
        throw new Error(`Erro ao processar PDF: ${error.message || error}`)
      }
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      // Processar Excel/CSV
      const excelResult = await parseExcel(buffer)
      parsedData = {
        cotas: excelResult.quotas || [],
        errors: excelResult.errors || [],
      }
      rawText = JSON.stringify(parsedData)
      
      await prisma.importJob.update({
        where: { id: jobId },
        data: { rawText },
      })
    } else {
      throw new Error('Formato de arquivo não suportado')
    }

    // Salvar dados parseados
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        parsedJson: JSON.stringify(parsedData),
      },
    })

    // Criar ImportBatch
    const importBatch = await prisma.importBatch.create({
      data: {
        userId,
        sourceType: ext.toUpperCase(),
        filename: file.name,
        status: parsedData.errors && parsedData.errors.length > 0 ? 'pending_review' : 'completed',
        parsedAt: new Date(),
        errorsJson: parsedData.errors ? JSON.stringify(parsedData.errors) : null,
      },
    })

    // Salvar cotas
    if (parsedData.cotas && Array.isArray(parsedData.cotas)) {
      for (const quota of parsedData.cotas) {
        try {
          await prisma.quota.create({
            data: {
              userId,
              importBatchId: importBatch.id,
              administradora: quota.administradora || parsedData.header?.administradora,
              empresa: quota.empresa || parsedData.header?.empresa,
              grupo: quota.grupo || '',
              cota: quota.cota || '',
              versao: quota.versao || '',
              dataVenda: quota.dataVenda || '',
              situacaoCobranca: quota.situacaoCobranca || quota.situacao || 'ATIVA',
              contemplacao: quota.contemplacao || 'NÃO CONTEMPLADA',
              percentPago: quota.percentPago || 0,
              percentAtraso: quota.percentAtraso || 0,
              percentFundoComum: quota.percentFundoComum || 0,
              pclsPagar: quota.pclsPagar || quota.prazo_meses || 0,
              pclsPagas: quota.pclsPagas || quota.parcelas_pagas || 0,
              pclsPagasEmDia: quota.pclsPagasEmDia || 0,
              pclsPagasAtraso: quota.pclsPagasAtraso || 0,
              pclsEmAtraso: quota.pclsEmAtraso || 0,
              vlBem: quota.vlBem || quota.credito || 0,
              vlParcela: quota.vlParcela || quota.parcela_atual || 0,
              vlQuitacao: quota.vlQuitacao || 0,
              vlReceber: quota.vlReceber || quota.saldo_devedor || 0,
              tipoBem: quota.tipoBem || 'OUTROS',
              needsReview: !!(quota.errors && quota.errors.length > 0),
            },
          })
        } catch (error: any) {
          console.error('Erro ao salvar cota:', error)
        }
      }
    }

    // Marcar job como concluído
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'DONE' },
    })

    console.log(`✅ Importação concluída: ${jobId}`)
  } catch (error: any) {
    console.error('❌ Erro ao processar arquivo:', error)
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'ERROR',
        errorMessage: error.message || 'Erro desconhecido',
      },
    })
  }
}
