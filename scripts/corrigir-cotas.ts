import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Valores esperados
    const expectedCount = 48
    const expectedCredit = 12500000.00 // 12.500.000,00
    const expectedParcela = 44000.00 // 44.000,00

    // Valores por cota
    const creditPerQuota = expectedCredit / expectedCount
    const parcelaPerQuota = expectedParcela / expectedCount

    console.log('\n🔧 CORRIGINDO COTAS...\n')
    console.log(`   Crédito por Cota: R$ ${creditPerQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Parcela por Cota: R$ ${parcelaPerQuota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`)

    // Buscar todas as cotas
    const quotas = await prisma.quota.findMany({
      orderBy: [{ grupo: 'asc' }, { cota: 'asc' }],
    })

    console.log(`📊 Encontradas ${quotas.length} cotas\n`)

    if (quotas.length === 0) {
      console.log('❌ Nenhuma cota encontrada no banco')
      return
    }

    // Atualizar todas as cotas com os valores corretos
    let updated = 0
    for (const quota of quotas) {
      const needsUpdate = 
        Math.abs((quota.vlBem || 0) - creditPerQuota) > 0.01 ||
        Math.abs((quota.vlParcela || 0) - parcelaPerQuota) > 0.01

      if (needsUpdate) {
        await prisma.quota.update({
          where: { id: quota.id },
          data: {
            vlBem: creditPerQuota,
            vlParcela: parcelaPerQuota,
          },
        })
        updated++
        console.log(`   ✅ Atualizada: ${quota.grupo}-${quota.cota}`)
      }
    }

    console.log(`\n✅ ${updated} cotas atualizadas`)

    // Verificar se faltam cotas
    if (quotas.length < expectedCount) {
      console.log(`\n⚠️ Faltam ${expectedCount - quotas.length} cotas`)
      console.log('   Você precisa importar mais cotas ou criar manualmente')
    } else if (quotas.length > expectedCount) {
      console.log(`\n⚠️ Há ${quotas.length - expectedCount} cotas a mais`)
      console.log('   Verifique se há duplicatas')
    }

    // Verificar totais após correção
    const updatedQuotas = await prisma.quota.findMany()
    const totalCredit = updatedQuotas.reduce((sum, q) => sum + (q.vlBem || 0), 0)
    const totalParcela = updatedQuotas.reduce((sum, q) => sum + (q.vlParcela || 0), 0)

    console.log('\n📊 TOTAIS APÓS CORREÇÃO:')
    console.log(`   Total de Cotas: ${updatedQuotas.length}`)
    console.log(`   Crédito Total: R$ ${totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    console.log(`   Parcela Total: R$ ${totalParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

    const creditDiff = Math.abs(totalCredit - expectedCredit)
    const parcelaDiff = Math.abs(totalParcela - expectedParcela) // expectedParcela já é o total

    if (creditDiff < 0.01 && parcelaDiff < 0.01) {
      console.log('\n✅ VALORES CORRIGIDOS COM SUCESSO!')
    } else {
      console.log('\n⚠️ Ainda há diferenças:')
      if (creditDiff > 0.01) {
        console.log(`   Crédito: Diferença de R$ ${creditDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      }
      if (parcelaDiff > 0.01) {
        console.log(`   Parcela: Diferença de R$ ${parcelaDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
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
