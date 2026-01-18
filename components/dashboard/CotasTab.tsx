'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Quota {
  id: string
  grupo: string
  cota: string
  versao: string
  dataVenda: string
  situacaoCobranca: string
  contemplacao: string
  percentPago: number
  percentAtraso: number
  pclsPagar: number
  pclsPagas: number
  pclsPagasEmDia: number
  pclsPagasAtraso: number
  pclsEmAtraso: number
  vlBem: number
  vlParcela: number
  vlQuitacao: number
  vlReceber: number
}

export function CotasTab() {
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterContempladas, setFilterContempladas] = useState<'all' | 'contempladas' | 'nao-contempladas'>('all')

  useEffect(() => {
    fetchQuotas()
  }, [])

  const fetchQuotas = async () => {
    try {
      const res = await fetch('/api/cotas')
      if (res.ok) {
        const data = await res.json()
        setQuotas(data.quotas || [])
      }
    } catch (error) {
      console.error('Error fetching quotas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotas = quotas.filter(quota => {
    const matchesSearch = 
      quota.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.cota.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterContempladas === 'all' ||
      (filterContempladas === 'contempladas' && (quota.contemplacao.includes('Contemplada') || quota.contemplacao.includes('CONTEMPLADA'))) ||
      (filterContempladas === 'nao-contempladas' && !quota.contemplacao.includes('Contemplada') && !quota.contemplacao.includes('CONTEMPLADA'))

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Carregando cotas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Minhas Cotas</h2>
        <p className="text-gray-400">
          Visualize todas as suas cotas importadas do extrato
        </p>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por grupo ou cota..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterContempladas === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterContempladas('all')}
              >
                Todas
              </Button>
              <Button
                variant={filterContempladas === 'contempladas' ? 'default' : 'outline'}
                onClick={() => setFilterContempladas('contempladas')}
              >
                Contempladas
              </Button>
              <Button
                variant={filterContempladas === 'nao-contempladas' ? 'default' : 'outline'}
                onClick={() => setFilterContempladas('nao-contempladas')}
              >
                Não Contempladas
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Exibindo {filteredQuotas.length} de {quotas.length} cotas
          </p>
        </CardContent>
      </Card>

      {/* Tabela de Cotas */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Cotas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-800">
                <TableRow>
                  <TableHead className="text-white">Grupo</TableHead>
                  <TableHead className="text-white">Cota</TableHead>
                  <TableHead className="text-white">Versão</TableHead>
                  <TableHead className="text-white">Valor Bem</TableHead>
                  <TableHead className="text-white">Parcela</TableHead>
                  <TableHead className="text-white">% Pago</TableHead>
                  <TableHead className="text-white">Parcelas</TableHead>
                  <TableHead className="text-white">Contemplação</TableHead>
                  <TableHead className="text-white">A Receber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                      Nenhuma cota encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotas.map((quota) => (
                    <TableRow
                      key={quota.id}
                      className={`border-gray-700 ${
                        quota.contemplacao.includes('Contemplada') || quota.contemplacao.includes('CONTEMPLADA')
                          ? 'bg-green-950/20'
                          : ''
                      }`}
                    >
                      <TableCell className="text-white font-medium">{quota.grupo}</TableCell>
                      <TableCell className="text-white">{quota.cota}</TableCell>
                      <TableCell className="text-white">{quota.versao}</TableCell>
                      <TableCell className="text-white">{formatCurrency(quota.vlBem)}</TableCell>
                      <TableCell className="text-white">{formatCurrency(quota.vlParcela)}</TableCell>
                      <TableCell className="text-white">{formatPercent(quota.percentPago)}</TableCell>
                      <TableCell className="text-white">
                        {quota.pclsPagas} / {quota.pclsPagar}
                      </TableCell>
                      <TableCell className={quota.contemplacao.includes('Contemplada') || quota.contemplacao.includes('CONTEMPLADA') ? 'text-green-400' : 'text-gray-400'}>
                        {quota.contemplacao}
                      </TableCell>
                      <TableCell className="text-green-400 font-medium">
                        {formatCurrency(quota.vlReceber)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
