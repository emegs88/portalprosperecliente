/**
 * Script para corrigir a cota 2562 - valor de 280.000,00
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

    // Buscar a cota 2562
    const quota = await prisma.quota.findFirst({
      where: { 
        userId: user.id, 
        grupo: '000707',
        cota: '2562'
      }
    })

    if (!quota) {
      console.error('❌ Cota 2562 não encontrada')
      process.exit(1)
    }

    console.log(`📋 Cota encontrada: ${quota.grupo}-${quota.cota}`)
    console.log(`   Valor atual vlBem: R$ ${quota.vlBem.toLocaleString('pt-BR')}`)

    // Atualizar valores conforme extrato:
    // vlBem = 280.000,00
    // vlParcela = 1.005,20
    // vlReceber = 280.000,00
    // vlQuitacao = 342.834,74
    await prisma.quota.update({
      where: { id: quota.id },
      data: {
        vlBem: 280000.00,
        vlParcela: 1005.20,
        vlReceber: 280000.00,
        vlQuitacao: 342834.74,
      }
    })

    console.log('✅ Cota 2562 atualizada:')
    console.log(`   vlBem: R$ 280.000,00`)
    console.log(`   vlParcela: R$ 1.005,20`)
    console.log(`   vlReceber: R$ 280.000,00`)
    console.log(`   vlQuitacao: R$ 342.834,74`)

    // Verificar totais atualizados
    const allQuotas = await prisma.quota.findMany({
      where: { userId: user.id, grupo: '000707' }
    })

    const totalCredito = allQuotas.reduce((sum, q) => sum + q.vlBem, 0)
    const totalParcela = allQuotas.reduce((sum, q) => sum + q.vlParcela, 0)
    const totalPatrimonio = allQuotas.reduce((sum, q) => sum + (q.pclsPagas * q.vlParcela), 0)

    console.log('')
    console.log('📊 Totais atualizados:')
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
