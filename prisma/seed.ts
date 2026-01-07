import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário ADMIN
  const adminEmail = 'admin@prospere.com'
  const adminPassword = 'Admin@12345'
  const adminHash = await bcrypt.hash(adminPassword, 10)

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log('✅ Admin já existe, atualizando senha...')
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: adminHash, role: 'admin' },
    })
  } else {
    console.log('👤 Criando usuário ADMIN...')
    await prisma.user.create({
      data: {
        name: 'Administrador Prospere',
        email: adminEmail,
        passwordHash: adminHash,
        role: 'admin',
      },
    })
  }

  // Criar usuário CLIENT
  const clientEmail = 'cliente@prospere.com'
  const clientPassword = 'Cliente@12345'
  const clientHash = await bcrypt.hash(clientPassword, 10)

  const existingClient = await prisma.user.findUnique({
    where: { email: clientEmail },
  })

  if (existingClient) {
    console.log('✅ Cliente já existe, atualizando senha...')
    await prisma.user.update({
      where: { email: clientEmail },
      data: { passwordHash: clientHash, role: 'client' },
    })
  } else {
    console.log('👤 Criando usuário CLIENT...')
    await prisma.user.create({
      data: {
        name: 'Cliente Teste',
        email: clientEmail,
        passwordHash: clientHash,
        role: 'client',
      },
    })
  }

  console.log('✅ Seed concluído com sucesso!')
  console.log('')
  console.log('📋 Credenciais criadas:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👨‍💼 ADMIN:')
  console.log('   Email: admin@prospere.com')
  console.log('   Senha: Admin@12345')
  console.log('')
  console.log('👤 CLIENT:')
  console.log('   Email: cliente@prospere.com')
  console.log('   Senha: Cliente@12345')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
