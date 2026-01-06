'use client'

import { ParsedQuota } from '@/lib/services/pdfParser'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ImportPreviewTableProps {
  quotas: ParsedQuota[]
  onConfirm: () => void
  onEdit?: (index: number) => void
  loading?: boolean
}

export default function ImportPreviewTable({
  quotas,
  onConfirm,
  onEdit,
  loading = false,
}: ImportPreviewTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg border-red-600/20">
        <div className="overflow-x-auto max-h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary">
              <TableRow>
                <TableHead className="text-white">Grupo</TableHead>
                <TableHead className="text-white">Cota</TableHead>
                <TableHead className="text-white">Data Venda</TableHead>
                <TableHead className="text-white">Contemplação</TableHead>
                <TableHead className="text-white">% Pago</TableHead>
                <TableHead className="text-white">Valor Bem</TableHead>
                <TableHead className="text-white">Parcela</TableHead>
                <TableHead className="text-white">Valor Receber</TableHead>
                {onEdit && <TableHead className="text-white">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotas.map((quota, index) => (
                <TableRow
                  key={`${quota.grupo}-${quota.cota}-${index}`}
                  className={quota.errors ? 'bg-red-50 dark:bg-red-950/20' : ''}
                >
                  <TableCell className="text-white">{quota.grupo}</TableCell>
                  <TableCell className="text-white">{quota.cota}</TableCell>
                  <TableCell className="text-white">{quota.dataVenda}</TableCell>
                  <TableCell className="text-white">{quota.contemplacao}</TableCell>
                  <TableCell className="text-white">{formatPercent(quota.percentPago)}</TableCell>
                  <TableCell className="text-white">{formatCurrency(quota.vlBem)}</TableCell>
                  <TableCell className="text-white">{formatCurrency(quota.vlParcela)}</TableCell>
                  <TableCell className="text-white">{formatCurrency(quota.vlReceber)}</TableCell>
                  {onEdit && (
                    <TableCell>
                      <Button
                        onClick={() => onEdit(index)}
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary hover:bg-red-600/20"
                      >
                        Editar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Confirmar e Salvar'}
        </Button>
      </div>
    </div>
  )
}
