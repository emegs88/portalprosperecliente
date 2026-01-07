import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { parsePDF } from '@/lib/services/pdfParser'
import { parsePDF as parsePDFWithOCR } from '@/lib/services/pdfParserWithOCR'
import { parseExcel } from '@/lib/services/excelParser'
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
    const file = formData.get('file') as File

    if (!name || !email || !password || !documento || !file) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
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

    // Processar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    // Salvar arquivo
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (e) {
      // Diretório já existe
    }

    const filename = `${Date.now()}-${file.name}`
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    // Criar ImportBatch
    const importBatch = await prisma.importBatch.create({
      data: {
        userId: newUser.id,
        sourceType: fileExt === 'pdf' ? 'PDF' : 'XLSX',
        filename: file.name,
        status: 'processing',
      },
    })

    let quotas: any[] = []
    let administradora: string | null = null
    let empresa: string | null = null

    try {
      if (fileExt === 'pdf') {
        // Parse PDF - primeiro tenta normal, depois OCR se necessário
        let parsed = await parsePDF(buffer)
        if (parsed.quotas.length === 0) {
          console.log('⚠️  Tentando OCR...')
          parsed = await parsePDFWithOCR(buffer, true)
        }
        
        if (parsed.header.administradora) {
          administradora = parsed.header.administradora
        }
        if (parsed.header.empresa) {
          empresa = parsed.header.empresa
        }

        quotas = parsed.quotas || []
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const parsed = await parseExcel(buffer)
        quotas = parsed.quotas || []
      }

      // Atualizar perfil com administradora
      if (administradora) {
        await prisma.clientProfile.update({
          where: { userId: newUser.id },
          data: {
            administradora,
            empresa,
          },
        })
      }

      // Salvar cotas
      let quotasCreated = 0
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
          quotasCreated++
        } catch (e) {
          console.error('Erro ao salvar cota:', e)
        }
      }

      // Atualizar status do batch
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: quotasCreated > 0 ? 'completed' : 'failed',
          parsedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Cliente cadastrado e extrato importado com sucesso',
        quotasImportadas: quotasCreated,
        userId: newUser.id,
      })
    } catch (error: any) {
      console.error('Erro ao processar extrato:', error)
      
      await prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: 'failed',
          errorsJson: JSON.stringify([error.message]),
        },
      })

      return NextResponse.json(
        { error: 'Erro ao processar extrato: ' + error.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erro ao cadastrar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao cadastrar cliente' },
      { status: 500 }
    )
  }
}
