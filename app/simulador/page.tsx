'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Home, 
  Car, 
  Truck, 
  Target, 
  Dice6, 
  Plus,
  Star,
  Clock,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { SimulationCard } from '@/components/simulador/SimulationCard'
import { CreateSimulationDialog } from '@/components/simulador/CreateSimulationDialog'

interface SimulationProject {
  id: string
  name: string
  description?: string
  simulatorType: string
  isFavorite: boolean
  updatedAt: string
  _count: {
    runs: number
  }
}

export default function SimuladorHubPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<SimulationProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      loadProjects()
    }
  }, [session])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/simulation/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setShowCreateDialog(false)
    loadProjects()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const simulatorTypes = [
    {
      id: 'ACUMULO',
      name: 'Acúmulo de Patrimônio',
      description: 'Simule o crescimento do patrimônio via consórcio',
      icon: TrendingUp,
      color: 'text-blue-500',
      href: '/dashboard?tab=simulacoes',
      available: true,
    },
    {
      id: 'IMOVEIS',
      name: 'Imóveis (Tranches + Garantia)',
      description: 'Simule imóveis com múltiplas tranches e garantia',
      icon: Home,
      color: 'text-green-500',
      href: '/simulador/imoveis',
      available: false, // Ainda não implementado
    },
    {
      id: 'VEICULOS',
      name: 'Veículos',
      description: 'Simule consórcios de veículos',
      icon: Car,
      color: 'text-yellow-500',
      href: '/simulador/veiculos',
      available: false,
    },
    {
      id: 'FROTA',
      name: 'Frota Garantida',
      description: 'Simule frotas com múltiplas cotas',
      icon: Truck,
      color: 'text-purple-500',
      href: '/simulador/frota',
      available: false,
    },
    {
      id: 'LANCE',
      name: 'Lance (Embutido vs Livre)',
      description: 'Compare estratégias de lance',
      icon: Target,
      color: 'text-red-500',
      href: '/simulador/lance',
      available: false,
    },
    {
      id: 'SORTEIO',
      name: 'Simulador de Sorteio',
      description: 'Simule sorteios de forma educativa',
      icon: Dice6,
      color: 'text-pink-500',
      href: '/simulador/sorteio',
      available: true,
    },
  ]

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const favoriteProjects = projects.filter(p => p.isFavorite).slice(0, 4)

  return (
    <div className="min-h-screen bg-[#070B14]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Hub de Simuladores
              </h1>
              <p className="text-gray-400">
                Simule diferentes estratégias de consórcio e acúmulo de patrimônio
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Simulação
            </Button>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-200">
            ⚠️ <strong>Aviso:</strong> Todas as simulações são educativas e não representam resultados reais ou garantias de contemplação.
          </div>
        </div>

        {/* Simuladores Disponíveis */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Simuladores Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {simulatorTypes.map((simulator) => {
              const Icon = simulator.icon
              return (
                <Link key={simulator.id} href={simulator.href}>
                  <Card className={`bg-[#0B1220] border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer h-full ${
                    !simulator.available ? 'opacity-60' : ''
                  }`}>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-8 h-8 ${simulator.color}`} />
                        {!simulator.available && (
                          <Badge variant="secondary" className="text-xs">Em breve</Badge>
                        )}
                      </div>
                      <CardTitle className="text-white text-lg">{simulator.name}</CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        {simulator.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-blue-400 hover:text-blue-300"
                        disabled={!simulator.available}
                      >
                        {simulator.available ? 'Acessar' : 'Em breve'}
                        {simulator.available && <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Projetos Favoritos */}
        {favoriteProjects.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                Favoritos
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteProjects.map((project) => (
                <SimulationCard
                  key={project.id}
                  project={project}
                  onUpdate={loadProjects}
                />
              ))}
            </div>
          </div>
        )}

        {/* Projetos Recentes */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              Simulações Recentes
            </h2>
            {projects.length > 6 && (
              <Link href="/dashboard?tab=simulacoes">
                <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
                  Ver todas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <SimulationCard
                  key={project.id}
                  project={project}
                  onUpdate={loadProjects}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-[#0B1220] border-gray-700">
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Nenhuma simulação criada ainda</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Simulação
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de Criação */}
      <CreateSimulationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleProjectCreated}
      />
    </div>
  )
}
