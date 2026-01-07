import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Resetando senhas dos usuários...\n')

  const usuarios = [
    {
      email: 'rafael@prospere.com',
      senha: 'rafael123',
      nome: 'Rafael Marchiori Cabideli',
    },
  ]

  for (const usuario of usuarios) {
    try {
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email: usuario.email },
      })

      if (!user) {
        console.log(`❌ Usuário não encontrado: ${usuario.email}`)
        continue
      }

      // Criar novo hash da senha
      const passwordHash = await bcrypt.hash(usuario.senha, 10)

      // Atualizar senha
      await prisma.user.update({
        where: { email: usuario.email },
        data: { passwordHash },
      })

      console.log(`✅ Senha resetada para: ${usuario.email}`)
      console.log(`   Senha: ${usuario.senha}`)
      console.log(`   Hash: ${passwordHash}\n`)

      // Verificar se a senha funciona
      const testMatch = await bcrypt.compare(usuario.senha, passwordHash)
      console.log(`   Teste de verificação: ${testMatch ? '✅ PASSOU' : '❌ FALHOU'}\n`)
    } catch (error) {
      console.error(`❌ Erro ao resetar senha para ${usuario.email}:`, error)
    }
  }

  console.log('✅ Processo concluído!')
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
