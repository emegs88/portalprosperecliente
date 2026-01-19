'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, MoreVertical, Play, Trash2, Edit } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

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

interface SimulationCardProps {
  project: SimulationProject
  onUpdate: () => void
}

const simulatorTypeLabels: Record<string, { label: string; color: string }> = {
  ACUMULO: { label: 'Acúmulo', color: 'bg-blue-500/20 text-blue-400' },
  IMOVEIS: { label: 'Imóveis', color: 'bg-green-500/20 text-green-400' },
  VEICULOS: { label: 'Veículos', color: 'bg-yellow-500/20 text-yellow-400' },
  FROTA: { label: 'Frota', color: 'bg-purple-500/20 text-purple-400' },
  LANCE: { label: 'Lance', color: 'bg-red-500/20 text-red-400' },
  SORTEIO: { label: 'Sorteio', color: 'bg-pink-500/20 text-pink-400' },
}

export function SimulationCard({ project, onUpdate }: SimulationCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const typeInfo = simulatorTypeLabels[project.simulatorType] || {
    label: project.simulatorType,
    color: 'bg-gray-500/20 text-gray-400',
  }

  const handleToggleFavorite = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/simulation/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFavorite: !project.isFavorite,
        }),
      })

      if (response.ok) {
        toast({
          title: project.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
        })
        onUpdate()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar favorito',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja deletar "${project.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/simulation/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Simulação deletada',
        })
        onUpdate()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar simulação',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = () => {
    // TODO: Navegar para página de execução
    router.push(`/dashboard?tab=simulacoes&project=${project.id}`)
  }

  return (
    <Card className="bg-[#0B1220] border-gray-700 hover:border-blue-500/50 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-white text-base font-semibold line-clamp-1">
                {project.name}
              </CardTitle>
              {project.isFavorite && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            {project.description && (
              <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
              <span className="text-xs text-gray-500">
                {project._count.runs} execução{project._count.runs !== 1 ? 'ões' : ''}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0B1220] border-gray-700">
              <DropdownMenuItem
                onClick={handleToggleFavorite}
                className="text-gray-300 hover:text-white cursor-pointer"
              >
                <Star className={`w-4 h-4 mr-2 ${project.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {project.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard?tab=simulacoes&edit=${project.id}`)}
                className="text-gray-300 hover:text-white cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Atualizado {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: ptBR })}
          </span>
          <Button
            size="sm"
            onClick={handleExecute}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <Play className="w-3 h-3 mr-1" />
            Executar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
