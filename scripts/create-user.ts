import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'jihad@prospere.com'
  const password = 'admin123'
  const name = 'Jihad'

  // Verifica se o usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    // Atualiza a senha do usuário existente
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    })
    console.log(`✅ Senha atualizada para ${email}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Senha: ${password}`)
  } else {
    // Cria um novo usuário
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'admin',
      },
    })
    console.log(`✅ Usuário criado: ${user.email}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Senha: ${password}`)
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
