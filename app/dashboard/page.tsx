'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardTab } from '@/components/dashboard/DashboardTab'
import { CotasTab } from '@/components/dashboard/CotasTab'
import { ImportacoesTab } from '@/components/dashboard/ImportacoesTab'
import { PatrimonioTab } from '@/components/dashboard/PatrimonioTab'
import { ProspereVidaTab } from '@/components/dashboard/ProspereVidaTab'
import { SimulacoesTab } from '@/components/dashboard/SimulacoesTab'
import { PlanoCarreiraTab } from '@/components/dashboard/PlanoCarreiraTab'
import { BrandHeader } from '@/components/BrandHeader'
import { LogoutButton } from '@/components/LogoutButton'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return searchParams.get('tab') || 'dashboard'
    }
    return 'dashboard'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <BrandHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <LogoutButton />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-gray-800">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="cotas">Cotas</TabsTrigger>
            <TabsTrigger value="importacoes">Importações</TabsTrigger>
            <TabsTrigger value="patrimonio">Patrimônio</TabsTrigger>
            <TabsTrigger value="prospere-vida">Prospere Vida</TabsTrigger>
            <TabsTrigger value="simulacoes">Simulações</TabsTrigger>
            <TabsTrigger value="plano-carreira">Plano de Carreira</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="cotas" className="mt-6">
            <CotasTab />
          </TabsContent>
          <TabsContent value="importacoes" className="mt-6">
            <ImportacoesTab />
          </TabsContent>
          <TabsContent value="patrimonio" className="mt-6">
            <PatrimonioTab />
          </TabsContent>
          <TabsContent value="prospere-vida" className="mt-6">
            <ProspereVidaTab />
          </TabsContent>
          <TabsContent value="simulacoes" className="mt-6">
            <SimulacoesTab />
          </TabsContent>
          <TabsContent value="plano-carreira" className="mt-6">
            <PlanoCarreiraTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
