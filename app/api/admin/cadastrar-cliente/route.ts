import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { parsePDF, parsePDFText } from '@/lib/services/pdfParser'
import { parsePDF as parsePDFWithOCR } from '@/lib/services/pdfParserWithOCR'
import { parseExcel } from '@/lib/services/excelParser'
import { extractTextWithOCR } from '@/lib/services/ocrService'
import pdfParse from 'pdf-parse'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const documento = formData.get('documento') as string
    
    // Obter todos os arquivos enviados
    const files: File[] = []
    const filesData = formData.getAll('files')
    filesData.forEach((file) => {
      if (file instanceof File) {
        files.push(file)
      }
    })

    if (!name || !email || !password || !documento || files.length === 0) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios, incluindo pelo menos um arquivo' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'client',
      },
    })

    // Criar perfil do cliente
    await prisma.clientProfile.create({
      data: {
        userId: newUser.id,
        nome: name,
        documento: documento.trim(),
      },
    })

    // Processar múltiplos arquivos
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (e) {
      // Diretório já existe
    }

    let totalQuotasCreated = 0
    let administradora: string | null = null
    let empresa: string | null = null
    const importBatches: string[] = []

    // Processar cada arquivo
    for (const file of files) {
      try {
        console.log(`📄 Processando arquivo: ${file.name}`)
        
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const fileExt = file.name.split('.').pop()?.toLowerCase()

        // Salvar arquivo
        const filename = `${Date.now()}-${file.name}`
        const filepath = join(uploadsDir, filename)
        await writeFile(filepath, buffer)

        // Criar ImportBatch para este arquivo
        const importBatch = await prisma.importBatch.create({
          data: {
            userId: newUser.id,
            sourceType: fileExt === 'pdf' ? 'PDF' : fileExt === 'xlsx' || fileExt === 'xls' ? 'XLSX' : 'CSV',
            filename: file.name,
            status: 'processing',
          },
        })
        
        importBatches.push(importBatch.id)

        let quotas: any[] = []

        try {
          if (fileExt === 'pdf') {
            console.log(`📄 Processando PDF ${files.indexOf(file) + 1}/${files.length}: ${file.name}`)
            
            // Estratégia 1: Tentar extração normal primeiro
            let parsed = await parsePDF(buffer)
            console.log(`📄 [${file.name}] Extração normal: ${parsed.quotas.length} cotas encontradas`)
            
            // Estratégia 2: Se não encontrou cotas, tentar OCR melhorado
            if (parsed.quotas.length === 0) {
              console.log(`⚠️  [${file.name}] PDF sem cotas, tentando OCR melhorado...`)
              try {
                // Extrair texto com OCR melhorado
                const rawText = await extractTextWithOCR(buffer)
                console.log(`📄 [${file.name}] Texto extraído com OCR: ${rawText.length} caracteres`)
                
                // Parsear o texto extraído
                parsed = parsePDFText(rawText)
                console.log(`📄 [${file.name}] Após OCR e parse: ${parsed.quotas.length} cotas encontradas`)
              } catch (ocrError: any) {
                console.error(`❌ [${file.name}] Erro no OCR:`, ocrError.message)
                // Tentar parsePDFWithOCR como fallback
                try {
                  parsed = await parsePDFWithOCR(buffer, true)
                  console.log(`📄 [${file.name}] Após parsePDFWithOCR: ${parsed.quotas.length} cotas encontradas`)
                } catch (fallbackError) {
                  console.error(`❌ [${file.name}] Erro no fallback:`, fallbackError)
                }
              }
            }
            
            // Estratégia 3: Se ainda não encontrou, tentar extração direta de texto
            if (parsed.quotas.length === 0) {
              console.log(`⚠️  [${file.name}] Tentando extração direta de texto...`)
              try {
                const pdfData = await pdfParse(buffer)
                const rawText = pdfData.text || ''
                
                if (rawText.length > 50) {
                  parsed = parsePDFText(rawText)
                  console.log(`📄 [${file.name}] Após extração direta: ${parsed.quotas.length} cotas encontradas`)
                } else {
                  console.log(`⚠️  [${file.name}] Texto muito pequeno (${rawText.length} chars), pode ser PDF escaneado`)
                }
              } catch (altError: any) {
                console.error(`❌ [${file.name}] Erro na extração direta:`, altError.message)
              }
            }
            
            // Extrair informações do header (usar da primeira vez que encontrar)
            if (parsed.header.administradora && !administradora) {
              administradora = parsed.header.administradora
              console.log(`📄 Administradora extraída do arquivo ${file.name}: ${administradora}`)
            }
            if (parsed.header.empresa && !empresa) {
              empresa = parsed.header.empresa
              console.log(`📄 Empresa extraída do arquivo ${file.name}: ${empresa}`)
            }

            quotas = parsed.quotas || []
            
            if (quotas.length > 0) {
              console.log(`✅ [${file.name}] ${quotas.length} cotas processadas com sucesso`)
            } else {
              console.warn(`⚠️  [${file.name}] Nenhuma cota encontrada. Verifique se o PDF está no formato correto.`)
            }
          } else if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
            console.log(`📊 Processando Excel/CSV ${files.indexOf(file) + 1}/${files.length}: ${file.name}`)
            const parsed = await parseExcel(buffer)
            quotas = parsed.quotas || []
            console.log(`✅ [${file.name}] ${quotas.length} cotas processadas`)
          }

          // Salvar cotas deste arquivo
          for (const quota of quotas) {
            try {
              await prisma.quota.create({
                data: {
                  userId: newUser.id,
                  importBatchId: importBatch.id,
                  administradora: administradora || null,
                  empresa: empresa || null,
                  grupo: quota.grupo,
                  cota: quota.cota,
                  versao: quota.versao,
                  dataVenda: quota.dataVenda,
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
                  tipoBem: quota.tipoBem || null,
                  needsReview: quota.errors ? true : false,
                },
              })
              totalQuotasCreated++
            } catch (e) {
              console.error('Erro ao salvar cota:', e)
            }
          }

          // Atualizar status do batch
          await prisma.importBatch.update({
            where: { id: importBatch.id },
            data: {
              status: quotas.length > 0 ? 'completed' : 'failed',
              parsedAt: new Date(),
            },
          })
        } catch (error: any) {
          console.error(`Erro ao processar arquivo ${file.name}:`, error)
          
          await prisma.importBatch.update({
            where: { id: importBatch.id },
            data: {
              status: 'failed',
              errorsJson: JSON.stringify([error.message]),
            },
          })
        }
      } catch (error: any) {
        console.error(`Erro ao processar arquivo ${file.name}:`, error)
      }
    }

    // Atualizar perfil com administradora (pegar da primeira extraída)
    if (administradora) {
      await prisma.clientProfile.update({
        where: { userId: newUser.id },
        data: {
          administradora,
          empresa,
        },
      })
    }

      return NextResponse.json({
        success: true,
        message: 'Cliente cadastrado e extratos importados com sucesso',
        quotasImportadas: totalQuotasCreated,
        arquivosProcessados: files.length,
        userId: newUser.id,
      })
  } catch (error: any) {
    console.error('Erro ao cadastrar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao cadastrar cliente' },
      { status: 500 }
    )
  }
}
