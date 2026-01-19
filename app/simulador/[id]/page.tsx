'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Play, Download, FileDown, TrendingUp, Settings } from 'lucide-react'
import Link from 'next/link'
import { SimulationConfigWizard } from '@/components/simulador/SimulationConfigWizard'
import { SimulationResults } from '@/components/simulador/SimulationResults'
import { SimulationHistory } from '@/components/simulador/SimulationHistory'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, History } from 'lucide-react'

interface SimulationProject {
  id: string
  name: string
  description?: string
  simulatorType: string
  params: any
  createdAt: string
  updatedAt: string
  runs: Array<{
    id: string
    name?: string
    executedAt: string
    patrimonioFinal: number
    roi: number
  }>
}

export default function SimulationDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const [project, setProject] = useState<SimulationProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('config')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)

  const simulationId = params?.id as string

  useEffect(() => {
    if (session?.user?.id && simulationId) {
      loadProject()
    }
  }, [session, simulationId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/simulation/projects/${simulationId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        
        // Se tem runs, selecionar a mais recente
        if (data.project.runs && data.project.runs.length > 0) {
          const latestRun = data.project.runs.sort(
            (a: any, b: any) => 
              new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
          )[0]
          setSelectedRunId(latestRun.id)
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Projeto não encontrado',
        })
        router.push('/simulador')
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar projeto',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async (params: any) => {
    try {
      setExecuting(true)
      const response = await fetch('/api/simulation/runs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulationId,
          name: `Execução ${new Date().toLocaleString('pt-BR')}`,
          params,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao executar simulação')
      }

      const data = await response.json()
      
      toast({
        title: 'Simulação executada!',
        description: 'Visualize os resultados na aba Resultados',
      })

      // Recarregar projeto e selecionar nova execução
      await loadProject()
      if (data.run) {
        setSelectedRunId(data.run.id)
        setActiveTab('results')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao executar simulação',
        description: error.message || 'Tente novamente',
      })
    } finally {
      setExecuting(false)
    }
  }

  const handleConfigSave = async (params: any) => {
    try {
      const response = await fetch(`/api/simulation/projects/${simulationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params }),
      })

      if (response.ok) {
        await loadProject()
        toast({
          title: 'Configuração salva!',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar configuração',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return null
  }

  const simulatorTypeLabels: Record<string, { label: string; color: string }> = {
    ACUMULO: { label: 'Acúmulo de Patrimônio', color: 'bg-blue-500/20 text-blue-400' },
    IMOVEIS: { label: 'Imóveis', color: 'bg-green-500/20 text-green-400' },
    VEICULOS: { label: 'Veículos', color: 'bg-yellow-500/20 text-yellow-400' },
    FROTA: { label: 'Frota', color: 'bg-purple-500/20 text-purple-400' },
    LANCE: { label: 'Lance', color: 'bg-red-500/20 text-red-400' },
    SORTEIO: { label: 'Sorteio', color: 'bg-pink-500/20 text-pink-400' },
  }

  const typeInfo = simulatorTypeLabels[project.simulatorType] || {
    label: project.simulatorType,
    color: 'bg-gray-500/20 text-gray-400',
  }

  return (
    <div className="min-h-screen bg-[#070B14]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/simulador">
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Hub
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
              </div>
              {project.description && (
                <p className="text-gray-400 mb-4">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  {project.runs?.length || 0} execução{project.runs?.length !== 1 ? 'ões' : ''}
                </span>
                <span>•</span>
                <span>
                  Última atualização: {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#0B1220] border border-gray-700">
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-600">
              <Settings className="w-4 h-4 mr-2" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-blue-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configuração */}
          <TabsContent value="config">
            <SimulationConfigWizard
              projectId={simulationId}
              initialParams={project.params}
              onSave={handleConfigSave}
              onExecute={handleExecute}
              executing={executing}
            />
          </TabsContent>

          {/* Tab: Resultados */}
          <TabsContent value="results">
            {selectedRunId ? (
              <SimulationResults
                runId={selectedRunId}
                projectId={simulationId}
                onRunChange={(runId) => setSelectedRunId(runId)}
                runs={project.runs || []}
              />
            ) : (
              <Card className="bg-[#0B1220] border-gray-700">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Nenhuma execução encontrada
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    Configure e execute uma simulação para ver os resultados
                  </p>
                  <Button onClick={() => setActiveTab('config')}>
                    Ir para Configuração
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history">
            <SimulationHistory projectId={simulationId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
