'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock } from 'lucide-react'
import { SimulationResults } from '@/components/simulador/SimulationResults'

export default function SharedSimulationPage() {
  const params = useParams()
  const token = params?.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runData, setRunData] = useState<any>(null)

  useEffect(() => {
    if (token) {
      loadSharedSimulation()
    }
  }, [token])

  const loadSharedSimulation = async () => {
    try {
      // Decodificar token para obter runId
      // Por enquanto, assumir que o token contém o runId
      const decoded = Buffer.from(token, 'base64url').toString()
      const runId = decoded.split('-')[0]

      const response = await fetch(`/api/simulation/runs/${runId}`)
      if (response.ok) {
        const data = await response.json()
        setRunData(data)
      } else {
        setError('Simulação não encontrada ou link expirado')
      }
    } catch (error) {
      console.error('Erro ao carregar simulação compartilhada:', error)
      setError('Erro ao carregar simulação')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !runData) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Card className="bg-[#0B1220] border-gray-700 max-w-md">
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">{error || 'Simulação não encontrada'}</p>
            <p className="text-gray-500 text-sm">
              O link pode ter expirado ou a simulação foi removida
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070B14]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">Visualização Compartilhada</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Esta é uma visualização somente leitura da simulação
          </p>
        </div>

        <SimulationResults
          runId={runData.run.id}
          projectId={runData.run.simulationId}
          onRunChange={() => {}}
          runs={[runData.run]}
        />
      </div>
    </div>
  )
}
