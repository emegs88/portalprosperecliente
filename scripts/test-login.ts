import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testando login...\n')

  const testEmail = 'rafael@prospere.com'
  const testPassword = 'rafael123'

  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { clientProfile: true },
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', testEmail)
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`   Nome: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Hash no banco: ${user.passwordHash.substring(0, 20)}...`)

    // Testar senha
    console.log(`\n🔐 Testando senha: "${testPassword}"`)
    const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash)

    if (passwordMatch) {
      console.log('✅ Senha CORRETA - Login funcionaria!')
    } else {
      console.log('❌ Senha INCORRETA - Login falharia!')
      console.log('\n💡 Execute: npm run db:reset-senhas')
    }
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
