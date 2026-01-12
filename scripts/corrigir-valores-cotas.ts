/**
 * Script para corrigir valores das cotas
 * Atualiza vlBem para 260000 e vlParcela para 933.40 conforme extrato
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'jihad@prospere.com'
  
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.error(`❌ Usuário não encontrado: ${email}`)
      process.exit(1)
    }

    console.log(`📋 Usuário: ${user.name} (${user.email})`)

    // Buscar todas as cotas do usuário
    const quotas = await prisma.quota.findMany({
      where: { userId: user.id, grupo: '000707' }
    })

    console.log(`📊 Encontradas ${quotas.length} cotas do grupo 000707`)

    if (quotas.length === 0) {
      console.log('⚠️  Nenhuma cota encontrada')
      return
    }

    // Atualizar valores conforme extrato:
    // vlBem = 260.000,00 (para todas as 48 cotas)
    // vlParcela = 933,40 (para a maioria, exceto cota 2562 que tem 1.005,20)
    // pclsPagas = 1 (1 parcela paga)
    // vlReceber = 260.000,00 (igual ao vlBem)
    let updated = 0
    for (const quota of quotas) {
      const vlParcela = quota.cota === '2562' ? 1005.20 : 933.40
      const vlBem = 260000.00
      const vlReceber = 260000.00
      const vlQuitacao = quota.cota === '2562' ? 342834.74 : 318346.54
      const pclsPagas = 1

      await prisma.quota.update({
        where: { id: quota.id },
        data: {
          vlBem,
          vlParcela,
          vlReceber,
          vlQuitacao,
          pclsPagas,
        }
      })
      updated++
    }

    console.log(`✅ ${updated} cotas atualizadas`)
    
    // Verificar totais
    const updatedQuotas = await prisma.quota.findMany({
      where: { userId: user.id, grupo: '000707' }
    })

    const totalCredito = updatedQuotas.reduce((sum, q) => sum + q.vlBem, 0)
    const totalParcela = updatedQuotas.reduce((sum, q) => sum + q.vlParcela, 0)
    const totalPatrimonio = updatedQuotas.reduce((sum, q) => sum + (q.pclsPagas * q.vlParcela), 0)

    console.log('')
    console.log('📊 Totais:')
    console.log(`   Total Crédito: R$ ${totalCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Total Parcela: R$ ${totalParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Patrimônio: R$ ${totalPatrimonio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
