import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'jihad@prospere.com'
  const testPassword = 'admin123'

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }

    console.log('✅ Usuário encontrado:', user.email)
    console.log('📝 Nome:', user.name)
    console.log('🔐 Hash da senha:', user.passwordHash?.substring(0, 20) + '...' || 'N/A')

    // Testar senha
    if (!user.passwordHash) {
      console.log('❌ Usuário não tem senha cadastrada')
      process.exit(1)
    }
    const isValid = await bcrypt.compare(testPassword, user.passwordHash)
    console.log('🔑 Teste de senha:', isValid ? '✅ CORRETO' : '❌ INCORRETO')

    if (!isValid) {
      // Criar novo hash
      const newHash = await bcrypt.hash(testPassword, 10)
      console.log('🔄 Criando novo hash...')
      await prisma.user.update({
        where: { email },
        data: { passwordHash: newHash },
      })
      console.log('✅ Senha atualizada com sucesso')
      
      // Testar novamente
      const userUpdated = await prisma.user.findUnique({
        where: { email },
      })
      if (userUpdated) {
        const isValid2 = await bcrypt.compare(testPassword, userUpdated.passwordHash)
        console.log('🔑 Teste após atualização:', isValid2 ? '✅ CORRETO' : '❌ INCORRETO')
      }
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
