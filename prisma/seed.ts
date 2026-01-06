import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@prospere.com.br' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@prospere.com.br',
      passwordHash: hashedPassword,
      clientProfile: {
        create: {
          nome: 'Administrador Prospere',
          documento: '000.000.000-00',
        },
      },
    },
  })

  console.log('✅ Usuário admin criado:', admin.email)

  // Criar usuário de teste
  const testUser = await prisma.user.upsert({
    where: { email: 'cliente@prospere.com.br' },
    update: {},
    create: {
      name: 'Cliente Teste',
      email: 'cliente@prospere.com.br',
      passwordHash: await bcrypt.hash('cliente123', 10),
      clientProfile: {
        create: {
          nome: 'Cliente Teste',
          documento: '111.111.111-11',
        },
      },
    },
  })

  console.log('✅ Usuário cliente criado:', testUser.email)

  // Criar usuário Rafael (dados reais)
  const rafael = await prisma.user.upsert({
    where: { email: 'rafael@prospere.com.br' },
    update: {},
    create: {
      name: 'RAFAEL MARCHIORI CABIDELI',
      email: 'rafael@prospere.com.br',
      passwordHash: await bcrypt.hash('rafael123', 10),
      clientProfile: {
        create: {
          nome: 'RAFAEL MARCHIORI CABIDELI',
          documento: '104.666.137-09',
        },
      },
    },
  })

  console.log('✅ Usuário Rafael criado:', rafael.email)
  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
