import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Buscar todas as cotas
    const quotas = await prisma.quota.findMany({
      orderBy: [{ grupo: 'asc' }, { cota: 'asc' }],
    })

    console.log(`\n📊 TOTAL DE COTAS: ${quotas.length}\n`)

    if (quotas.length === 0) {
      console.log('❌ Nenhuma cota encontrada no banco')
      return
    }

    // Calcular totais
    const totalCredit = quotas.reduce((sum, q) => sum + (q.vlBem || 0), 0)
    const totalParcela = quotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)
    const totalReceber = quotas.reduce((sum, q) => sum + (q.vlReceber || 0), 0)

    // Valores esperados
    const expectedCredit = 12500000.00 // 12.500.000,00
    const expectedParcela = 44000.00 // 44.000,00
    const expectedCount = 48

    console.log('📈 VALORES ATUAIS:')
    console.log(`   Total de Cotas: ${quotas.length}`)
    console.log(`   Crédito Total: R$ ${totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Parcela Total: R$ ${totalParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Total a Receber: R$ ${totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

    console.log('\n🎯 VALORES ESPERADOS:')
    console.log(`   Total de Cotas: ${expectedCount}`)
    console.log(`   Crédito Total: R$ ${expectedCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Parcela Total: R$ ${expectedParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

    // Calcular valores por cota
    const creditPerQuota = expectedCredit / expectedCount
    const parcelaPerQuota = expectedParcela / expectedCount

    console.log('\n💰 VALORES POR COTA (ESPERADOS):')
    console.log(`   Crédito por Cota: R$ ${creditPerQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Parcela por Cota: R$ ${parcelaPerQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

    // Verificar discrepâncias
    console.log('\n🔍 ANÁLISE:')
    if (quotas.length !== expectedCount) {
      console.log(`   ⚠️ Quantidade de cotas incorreta: ${quotas.length} (esperado: ${expectedCount})`)
    } else {
      console.log(`   ✅ Quantidade de cotas correta: ${quotas.length}`)
    }

    const creditDiff = Math.abs(totalCredit - expectedCredit)
    const parcelaDiff = Math.abs(totalParcela - (expectedParcela * expectedCount))

    if (creditDiff > 0.01) {
      console.log(`   ⚠️ Crédito total diferente: Diferença de R$ ${creditDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    } else {
      console.log(`   ✅ Crédito total correto`)
    }

    if (parcelaDiff > 0.01) {
      console.log(`   ⚠️ Parcela total diferente: Diferença de R$ ${parcelaDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    } else {
      console.log(`   ✅ Parcela total correta`)
    }

    // Mostrar algumas cotas como exemplo
    console.log('\n📋 EXEMPLO DE COTAS (primeiras 5):')
    quotas.slice(0, 5).forEach(q => {
      console.log(`   ${q.grupo}-${q.cota}: Crédito R$ ${(q.vlBem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, Parcela R$ ${(q.vlParcela || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    })

    // Verificar se precisa corrigir
    const needsFix = quotas.length !== expectedCount || 
                     creditDiff > 0.01 || 
                     parcelaDiff > 0.01 ||
                     quotas.some(q => Math.abs((q.vlBem || 0) - creditPerQuota) > 0.01) ||
                     quotas.some(q => Math.abs((q.vlParcela || 0) - parcelaPerQuota) > 0.01)

    if (needsFix) {
      console.log('\n🔧 CORREÇÃO NECESSÁRIA')
      console.log('   Execute: npm run corrigir-cotas')
    } else {
      console.log('\n✅ TUDO CORRETO!')
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
