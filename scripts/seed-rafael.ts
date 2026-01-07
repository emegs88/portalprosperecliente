import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generateAllQuotas } from '../prisma/fixtures/ancora-report-real'

const prisma = new PrismaClient()

// Verificar se DATABASE_URL está configurado
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está configurado no arquivo .env')
  console.error('')
  console.error('Por favor, configure o DATABASE_URL no arquivo .env:')
  console.error('DATABASE_URL="postgresql://usuario:senha@localhost:5432/prospere"')
  console.error('')
  console.error('Ou para usar SQLite localmente:')
  console.error('DATABASE_URL="file:./dev.db"')
  console.error('')
  process.exit(1)
}

async function main() {
  console.log('🌱 Cadastrando Rafael e importando 42 cotas...')

  const email = 'rafael@prospere.com'
  const password = 'rafael123'
  const name = 'Rafael Marchiori Cabideli'
  const documento = '104.666.137-09'
  const administradora = 'ANCORA ADMINISTRADORA DE CONSORCIOS S.A.'
  const empresa = 'PROSPERE INVESTIMENTOS E CONSORCIO LTDA'

  // Verificar se já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log('⚠️  Usuário já existe. Deletando para recriar...')
    await prisma.user.delete({
      where: { email },
    })
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10)

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'client',
    },
  })

  console.log('✅ Usuário criado:', user.email)

  // Criar perfil do cliente
  const clientProfile = await prisma.clientProfile.create({
    data: {
      userId: user.id,
      nome: name,
      documento,
      administradora,
      empresa,
    },
  })

  console.log('✅ Perfil criado com administradora:', administradora)

  // Criar ImportBatch
  const importBatch = await prisma.importBatch.create({
    data: {
      userId: user.id,
      sourceType: 'PDF',
      filename: 'cotas-cleinte.pdf',
      status: 'processing',
    },
  })

  // Gerar todas as 42 cotas do extrato real
  const quotas = generateAllQuotas()

  console.log(`📊 Importando ${quotas.length} cotas...`)

  // Salvar todas as cotas
  let quotasCreated = 0
  for (const quota of quotas) {
    try {
      await prisma.quota.create({
        data: {
          userId: user.id,
          importBatchId: importBatch.id,
          administradora,
          empresa,
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
          needsReview: false,
        },
      })
      quotasCreated++
    } catch (e) {
      console.error(`❌ Erro ao salvar cota ${quota.grupo}-${quota.cota}:`, e)
    }
  }

  // Calcular totais
  const totalVlBem = quotas.reduce((sum, q) => sum + q.vlBem, 0)
  const totalVlParcela = quotas.reduce((sum, q) => sum + q.vlParcela, 0)
  const totalVlQuitacao = quotas.reduce((sum, q) => sum + q.vlQuitacao, 0)
  const totalVlReceber = quotas.reduce((sum, q) => sum + q.vlReceber, 0)

  // Criar ImportTotals
  await prisma.importTotals.create({
    data: {
      importBatchId: importBatch.id,
      totalCotas: quotas.length,
      totalVlBem: totalVlBem,
      totalVlParcela: totalVlParcela,
      totalVlQuitacao: totalVlQuitacao,
      totalVlReceber: totalVlReceber,
    },
  })

  // Atualizar status do batch
  await prisma.importBatch.update({
    where: { id: importBatch.id },
    data: {
      status: 'completed',
      parsedAt: new Date(),
    },
  })

  console.log('')
  console.log('🎉 ==========================================')
  console.log('✅ CADASTRO CONCLUÍDO COM SUCESSO!')
  console.log('🎉 ==========================================')
  console.log('')
  console.log('📧 Email:', email)
  console.log('🔐 Senha:', password)
  console.log('')
  console.log('📊 Estatísticas:')
  console.log(`   - ${quotasCreated} cotas importadas`)
  console.log(`   - Total Crédito: R$ ${totalVlBem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`   - Parcela Mensal: R$ ${totalVlParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  console.log(`   - Administradora: ${administradora}`)
  console.log('')
  console.log('🌐 Acesse: http://localhost:3000/login')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
