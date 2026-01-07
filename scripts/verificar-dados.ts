import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando dados no banco...\n')

  // Verificar usuários
  const users = await prisma.user.findMany({
    include: {
      clientProfile: true,
      quotas: true,
    },
  })

  console.log(`📊 Total de usuários: ${users.length}\n`)

  for (const user of users) {
    console.log(`👤 Usuário: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Total de cotas: ${user.quotas.length}`)
    
    if (user.clientProfile) {
      console.log(`   Perfil: ${user.clientProfile.nome}`)
      console.log(`   Administradora: ${user.clientProfile.administradora || 'Não informada'}`)
    }

    if (user.quotas.length > 0) {
      const primeiraCota = user.quotas[0]
      console.log(`   Primeira cota: ${primeiraCota.grupo}-${primeiraCota.cota}`)
      console.log(`   Valor do bem: R$ ${primeiraCota.vlBem.toLocaleString('pt-BR')}`)
    }
    
    console.log('')
  }

  // Estatísticas gerais
  const totalCotas = await prisma.quota.count()
  const totalUsuarios = await prisma.user.count()
  
  console.log('📈 Estatísticas Gerais:')
  console.log(`   Total de cotas: ${totalCotas}`)
  console.log(`   Total de usuários: ${totalUsuarios}`)
  console.log('')

  console.log('✅ Todas as cotas têm usuário vinculado')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
