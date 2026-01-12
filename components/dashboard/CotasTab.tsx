'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, Search, Filter } from 'lucide-react'

export default function CotasTab() {
  const router = useRouter()
  const [quotas, setQuotas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetch('/api/cotas')
      .then((res) => res.json())
      .then((data) => {
        setQuotas(data.quotas || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const cotasFiltradas = quotas.filter(q => {
    if (filtroGrupo && !q.grupo.includes(filtroGrupo)) return false
    if (filtroStatus === 'contempladas' && !q.contemplacao.includes('Contemplada')) return false
    if (filtroStatus === 'nao_contempladas' && q.contemplacao.includes('Contemplada')) return false
    if (busca && !`${q.grupo} ${q.cota}`.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Filtros Premium */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white text-sm">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Grupo ou Cota..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="bg-black border-red-600/20 text-white pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white text-sm">Grupo</Label>
              <Input
                placeholder="Ex: 000706"
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                className="bg-black border-red-600/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white text-sm">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="bg-black border-red-600/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="contempladas">Contempladas</SelectItem>
                  <SelectItem value="nao_contempladas">Não Contempladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/50 border-red-600/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Total de Cotas</p>
            <p className="text-2xl font-bold text-primary">{cotasFiltradas.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-red-600/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Valor Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(cotasFiltradas.reduce((sum, q) => sum + q.vlBem, 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-black/50 border-red-600/20">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Parcela Mensal Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(cotasFiltradas.reduce((sum, q) => sum + q.vlParcela, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cotas - Premium */}
      <Card className="bg-black/50 border-red-600/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white text-lg font-semibold">Minhas Cotas</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {cotasFiltradas.length} {cotasFiltradas.length === 1 ? 'cota encontrada' : 'cotas encontradas'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-white text-center py-8">Carregando...</div>
          ) : cotasFiltradas.length === 0 ? (
            <div className="text-white text-center py-12">
              <p className="text-gray-400 text-lg">Nenhuma cota encontrada.</p>
              <p className="text-sm text-gray-500 mt-2">Importe um PDF ou Excel para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-red-600/30 bg-black/30">
                    <TableHead className="text-white font-semibold">Grupo</TableHead>
                    <TableHead className="text-white font-semibold">Cota</TableHead>
                    <TableHead className="text-white font-semibold">Versão</TableHead>
                    <TableHead className="text-white font-semibold">Data Venda</TableHead>
                    <TableHead className="text-white font-semibold text-right">Valor do Bem</TableHead>
                    <TableHead className="text-white font-semibold text-right">Parcela</TableHead>
                    <TableHead className="text-white font-semibold text-right">% Pago</TableHead>
                    <TableHead className="text-white font-semibold text-right">Valor Receber</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotasFiltradas.map((quota) => (
                    <TableRow
                      key={quota.id}
                      className="border-red-600/10 hover:bg-red-600/5 transition-colors"
                    >
                      <TableCell className="text-white font-mono text-sm">{quota.grupo}</TableCell>
                      <TableCell className="text-white font-mono text-sm">{quota.cota}</TableCell>
                      <TableCell className="text-white font-mono text-sm">{quota.versao || '00'}</TableCell>
                      <TableCell className="text-white text-sm">{quota.dataVenda || '-'}</TableCell>
                      <TableCell className="text-white text-right font-semibold">
                        {formatCurrency(quota.vlBem)}
                      </TableCell>
                      <TableCell className="text-white text-right">
                        {formatCurrency(quota.vlParcela)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded text-sm font-medium">
                          {formatPercent(quota.percentPago)}
                        </span>
                      </TableCell>
                      <TableCell className="text-white text-right font-semibold text-green-400">
                        {formatCurrency(quota.vlReceber || quota.vlBem)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            quota.contemplacao?.includes('Contemplada')
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {quota.contemplacao || 'Não Contemplada'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => {
                            // Salvar ID da cota no sessionStorage para pré-selecionar no simulador
                            if (typeof window !== 'undefined') {
                              sessionStorage.setItem('selectedQuotaId', quota.id)
                            }
                            // Redirecionar para dashboard na aba de simulações
                            router.push('/dashboard?tab=simulacoes')
                          }}
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-white hover:bg-red-600"
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Simular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
