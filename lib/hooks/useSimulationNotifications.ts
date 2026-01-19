/**
 * Hook para gerenciar notificações de simulações
 */

import { useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

interface SimulationNotification {
  id: string
  simulationId: string
  runId: string
  name: string
  status: 'completed' | 'failed'
  createdAt: string
}

/**
 * Hook para verificar novas simulações concluídas e mostrar notificações
 */
export function useSimulationNotifications() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const checkNotifications = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      // Buscar simulações recentes (últimos 5 minutos)
      const response = await fetch(
        `/api/simulation/runs?limit=10&recentOnly=true`
      )
      
      if (response.ok) {
        const data = await response.json()
        const recentRuns = (data.runs || []).filter((run: any) => {
          const executedAt = new Date(run.executedAt)
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
          return executedAt > fiveMinutesAgo
        })

        // Verificar localStorage para ver se já notificou
        const notifiedRuns = JSON.parse(
          localStorage.getItem('notified_simulation_runs') || '[]'
        )

        recentRuns.forEach((run: any) => {
          if (!notifiedRuns.includes(run.id)) {
            toast({
              title: '✅ Simulação concluída!',
              description: `${run.name || 'Nova simulação'} está pronta para visualização`,
              duration: 5000,
            })

            // Marcar como notificado
            notifiedRuns.push(run.id)
            localStorage.setItem(
              'notified_simulation_runs',
              JSON.stringify(notifiedRuns.slice(-50)) // Manter apenas últimas 50
            )
          }
        })
      }
    } catch (error) {
      console.error('Erro ao verificar notificações:', error)
    }
  }, [session, toast])

  useEffect(() => {
    if (!session?.user?.id) return

    // Verificar imediatamente
    checkNotifications()

    // Verificar a cada 30 segundos
    const interval = setInterval(checkNotifications, 30000)

    return () => clearInterval(interval)
  }, [session, checkNotifications])

  return { checkNotifications }
}
