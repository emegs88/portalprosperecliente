'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import DashboardTab from '@/components/dashboard/DashboardTab'
import CotasTab from '@/components/dashboard/CotasTab'
import ImportacoesTab from '@/components/dashboard/ImportacoesTab'
import PatrimonioTab from '@/components/dashboard/PatrimonioTab'
import SimulacoesTab from '@/components/dashboard/SimulacoesTab'
import ProspereVidaTab from '@/components/dashboard/ProspereVidaTab'
import { Logo } from '@/components/Logo'
import { LogoutButton } from '@/components/LogoutButton'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirecionar para login se não autenticado (após montar)
  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      router.push('/login')
    }
  }, [mounted, status, router])

  // Sempre renderizar o dashboard - não bloquear renderização
  // O NextAuth vai atualizar em background
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-red-600/20 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <div className="text-white">
                <p className="text-sm">{session?.user?.name || 'Usuário'}</p>
                <p className="text-xs text-gray-400">{session?.user?.email || 'Carregando...'}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-black/50 border border-red-600/20">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="cotas" className="data-[state=active]:bg-primary">
              Minhas Cotas
            </TabsTrigger>
            <TabsTrigger value="patrimonio" className="data-[state=active]:bg-primary">
              Patrimônio
            </TabsTrigger>
            <TabsTrigger value="simulacoes" className="data-[state=active]:bg-primary">
              Simulações
            </TabsTrigger>
            <TabsTrigger value="importacoes" className="data-[state=active]:bg-primary">
              Importações
            </TabsTrigger>
            <TabsTrigger value="prospere-vida" className="data-[state=active]:bg-primary">
              Prospere Vida
            </TabsTrigger>
            <TabsTrigger value="documentos" className="data-[state=active]:bg-primary">
              Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="cotas">
            <CotasTab />
          </TabsContent>

          <TabsContent value="patrimonio">
            <PatrimonioTab />
          </TabsContent>

          <TabsContent value="simulacoes">
            <SimulacoesTab />
          </TabsContent>

          <TabsContent value="importacoes">
            <ImportacoesTab />
          </TabsContent>

          <TabsContent value="prospere-vida">
            <ProspereVidaTab />
          </TabsContent>

          <TabsContent value="documentos">
            <Card className="bg-black/50 border-red-600/20">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Documentos</h2>
                <p className="text-gray-400">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
