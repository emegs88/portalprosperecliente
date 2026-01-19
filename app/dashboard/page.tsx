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
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-[#FFFFFF]">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#070B14]">
      <BrandHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
          <h1 className="text-3xl font-bold text-[#FFFFFF]">Dashboard</h1>
          <p className="text-[#9CA3AF] mt-1">Bem-vindo ao portal Prospere</p>
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
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 bg-[#0B1220] border border-[rgba(255,255,255,0.08)] gap-1 p-1 rounded-lg">
            <TabsTrigger 
              value="dashboard"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="prospere-club"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
            >
              Prospere Club
            </TabsTrigger>
            <TabsTrigger 
              value="cotas"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
            >
              Cotas
            </TabsTrigger>
            <TabsTrigger 
              value="importacoes"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
            >
              Importações
            </TabsTrigger>
            <TabsTrigger 
              value="patrimonio"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
            >
              Patrimônio
            </TabsTrigger>
            <TabsTrigger 
              value="prospere-vida"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
            >
              Prospere Vida
            </TabsTrigger>
            <TabsTrigger 
              value="simulacoes"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
            >
              Simulações
            </TabsTrigger>
            <TabsTrigger 
              value="plano-carreira"
              className="data-[state=active]:bg-[#111B2E] data-[state=active]:text-[#FFFFFF] data-[state=active]:border data-[state=active]:border-[rgba(59,130,246,0.35)] text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[rgba(255,255,255,0.05)] rounded-md transition-all duration-200"
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
