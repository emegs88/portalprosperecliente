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
import { ProspereClubTab } from '@/components/dashboard/ProspereClubTab'
import { BrandHeader } from '@/components/BrandHeader'
import { LogoutButton } from '@/components/LogoutButton'
import { NavigationCard } from '@/components/dashboard/NavigationCard'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ErrorFallback } from '@/components/dashboard/ErrorFallback'
import { Crown, Dice6, TrendingUp, FileText } from 'lucide-react'

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

  useEffect(() => {
    // Atualizar tab ativa quando URL mudar
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

  useEffect(() => {
    // Atualizar tab ativa quando URL mudar
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams])

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Bem-vindo ao portal Prospere</p>
          </div>
          <LogoutButton />
        </div>

        {/* Navegação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <NavigationCard
            title="Prospere Club"
            description="Veja seu nível, benefícios e experiências"
            href="/dashboard?tab=prospere-club"
            icon={<Crown className="w-6 h-6" />}
            badge="Novo"
          />
          <NavigationCard
            title="Simulador de Sorteio"
            description="Simule sorteios de forma educativa"
            href="/simulador/sorteio"
            icon={<Dice6 className="w-6 h-6" />}
          />
          <NavigationCard
            title="Simulações"
            description="Acumule patrimônio via consórcio"
            href="/dashboard?tab=simulacoes"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <NavigationCard
            title="Minhas Cotas"
            description="Visualize suas cotas importadas"
            href="/dashboard?tab=cotas"
            icon={<FileText className="w-6 h-6" />}
          />
        </div>
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value)
            router.push(`/dashboard?tab=${value}`)
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 bg-gray-800 gap-1 p-1">
            <TabsTrigger 
              value="dashboard"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="prospere-club"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Prospere Club
            </TabsTrigger>
            <TabsTrigger 
              value="cotas"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Cotas
            </TabsTrigger>
            <TabsTrigger 
              value="importacoes"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Importações
            </TabsTrigger>
            <TabsTrigger 
              value="patrimonio"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Patrimônio
            </TabsTrigger>
            <TabsTrigger 
              value="prospere-vida"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Prospere Vida
            </TabsTrigger>
            <TabsTrigger 
              value="simulacoes"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Simulações
            </TabsTrigger>
            <TabsTrigger 
              value="plano-carreira"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Plano de Carreira
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <DashboardTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="prospere-club" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <ProspereClubTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="cotas" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <CotasTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="importacoes" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <ImportacoesTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="patrimonio" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <PatrimonioTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="prospere-vida" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <ProspereVidaTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="simulacoes" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <SimulacoesTab />
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="plano-carreira" className="mt-6">
            <ErrorBoundary fallback={ErrorFallback}>
              <PlanoCarreiraTab />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
