/**
 * Script para criar usuário ADMIN master
 * 
 * Uso: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@prospere.com.br'
  const password = process.argv[3] || 'admin123'
  const name = process.argv[4] || 'Admin Master'

  console.log('🔐 Criando usuário ADMIN master...')
  console.log(`Email: ${email}`)
  console.log(`Nome: ${name}`)
  console.log(`Senha: ${password}`)
  console.log('')

  // Verificar se usuário já existe
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    // Atualizar para ADMIN se não for
    if (existing.role !== 'ADMIN') {
      const passwordHash = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { email },
        data: {
          role: 'ADMIN',
          passwordHash,
          name,
        },
      })
      console.log('✅ Usuário atualizado para ADMIN!')
    } else {
      // Atualizar senha se necessário
      if (password !== 'admin123') {
        const passwordHash = await bcrypt.hash(password, 10)
        await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            name,
          },
        })
        console.log('✅ Senha do ADMIN atualizada!')
      } else {
        console.log('ℹ️  Usuário ADMIN já existe com esta senha')
      }
    }
  } else {
    // Criar novo usuário ADMIN
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })
    console.log('✅ Usuário ADMIN criado com sucesso!')
    console.log(`ID: ${user.id}`)
  }

  console.log('')
  console.log('🎉 Pronto! Você pode fazer login com:')
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${password}`)
  console.log('')
  console.log('📋 Acesse: http://localhost:3000/admin')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
