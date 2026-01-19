import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('\n🔍 Verificando duplicatas...\n')

    // Buscar todas as cotas
    const quotas = await prisma.quota.findMany({
      orderBy: [{ grupo: 'asc' }, { cota: 'asc' }, { createdAt: 'asc' }],
    })

    // Agrupar por grupo-cota
    const grouped = new Map<string, typeof quotas>()
    
    quotas.forEach(q => {
      const key = `${q.grupo}-${q.cota}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(q)
    })

    // Encontrar duplicatas
    const duplicates: Array<{ key: string; quotas: typeof quotas }> = []
    grouped.forEach((quotaList, key) => {
      if (quotaList.length > 1) {
        duplicates.push({ key, quotas: quotaList })
      }
    })

    if (duplicates.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada')
      return
    }

    console.log(`⚠️ Encontradas ${duplicates.length} cotas duplicadas:\n`)

    let totalRemoved = 0

    for (const { key, quotas: quotaList } of duplicates) {
      console.log(`   ${key}: ${quotaList.length} cópias`)
      
      // Manter a primeira (mais antiga) e remover as outras
      const [keep, ...toRemove] = quotaList.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      )

      console.log(`      ✅ Mantendo: ${keep.id} (criada em ${keep.createdAt.toISOString()})`)

      for (const quota of toRemove) {
        await prisma.quota.delete({
          where: { id: quota.id },
        })
        console.log(`      ❌ Removida: ${quota.id} (criada em ${quota.createdAt.toISOString()})`)
        totalRemoved++
      }
    }

    console.log(`\n✅ ${totalRemoved} cotas duplicadas removidas`)

    // Verificar total após remoção
    const remaining = await prisma.quota.count()
    console.log(`\n📊 Total de cotas após remoção: ${remaining}`)

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
