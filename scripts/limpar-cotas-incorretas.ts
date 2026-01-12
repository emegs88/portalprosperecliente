/**
 * Script para limpar cotas com dados incorretos
 * Use com cuidado - deleta todas as cotas do usuário
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  
  if (!email) {
    console.error('❌ Por favor, forneça o email do usuário:')
    console.error('   npm run ts-node scripts/limpar-cotas-incorretas.ts email@exemplo.com')
    process.exit(1)
  }

  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.error(`❌ Usuário não encontrado: ${email}`)
      process.exit(1)
    }

    console.log(`📋 Usuário encontrado: ${user.name} (${user.email})`)

    // Contar cotas antes
    const countBefore = await prisma.quota.count({
      where: { userId: user.id }
    })
    console.log(`📊 Cotas antes: ${countBefore}`)

    if (countBefore === 0) {
      console.log('✅ Nenhuma cota para deletar')
      return
    }

    // Deletar todas as cotas do usuário
    const deleted = await prisma.quota.deleteMany({
      where: { userId: user.id }
    })

    console.log(`✅ ${deleted.count} cotas deletadas`)
    console.log('')
    console.log('📝 Próximos passos:')
    console.log('   1. Reimporte os extratos pelo painel de importação')
    console.log('   2. O parser corrigido agora extrairá os valores corretos')
    console.log('')

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
