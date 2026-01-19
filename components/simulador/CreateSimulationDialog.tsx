'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface CreateSimulationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateSimulationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSimulationDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    simulatorType: 'ACUMULO' as 'ACUMULO' | 'IMOVEIS' | 'VEICULOS' | 'FROTA' | 'LANCE' | 'SORTEIO',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Por favor, informe um nome para a simulação',
      })
      return
    }

    try {
      setLoading(true)

      // Por enquanto, criar projeto com params vazios (será preenchido depois)
      // TODO: Criar wizard de configuração completo
      const response = await fetch('/api/simulation/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          simulatorType: formData.simulatorType,
          params: {
            simulatorType: formData.simulatorType,
            quotas: [],
            prazo: 120,
            taxaContemplacao: 0.05,
            estrategiaVenda: 'IMMEDIATA',
            aplicarCDI: true,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar simulação')
      }

      toast({
        title: 'Simulação criada!',
        description: 'Agora você pode configurar e executar.',
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        simulatorType: 'ACUMULO',
      })

      onSuccess()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar simulação',
        description: error.message || 'Tente novamente',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B1220] border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Nova Simulação</DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie um novo projeto de simulação. Você poderá configurar os parâmetros depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Nome da Simulação *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Minha Estratégia de Acúmulo"
                className="bg-[#070B14] border-gray-600 text-white"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="simulatorType" className="text-gray-300">
                Tipo de Simulador
              </Label>
              <Select
                value={formData.simulatorType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, simulatorType: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="bg-[#070B14] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0B1220] border-gray-700">
                  <SelectItem value="ACUMULO">Acúmulo de Patrimônio</SelectItem>
                  <SelectItem value="IMOVEIS" disabled>Imóveis (Em breve)</SelectItem>
                  <SelectItem value="VEICULOS" disabled>Veículos (Em breve)</SelectItem>
                  <SelectItem value="FROTA" disabled>Frota (Em breve)</SelectItem>
                  <SelectItem value="LANCE" disabled>Lance (Em breve)</SelectItem>
                  <SelectItem value="SORTEIO">Sorteio Educativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">
                Descrição (opcional)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva sua estratégia ou objetivos..."
                className="bg-[#070B14] border-gray-600 text-white"
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Simulação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
