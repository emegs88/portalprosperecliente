import * as XLSX from 'xlsx'
import { parseBrazilianNumber, parseBrazilianPercent } from '@/lib/utils'
import { ParsedQuota } from './pdfParser'

export interface ExcelMapping {
  grupo?: string
  cota?: string
  versao?: string
  dataVenda?: string
  situacaoCobranca?: string
  contemplacao?: string
  percentPago?: string
  percentAtraso?: string
  percentFundoComum?: string
  pclsPagar?: string
  pclsPagas?: string
  pclsPagasEmDia?: string
  pclsPagasAtraso?: string
  pclsEmAtraso?: string
  vlBem?: string
  vlParcela?: string
  vlQuitacao?: string
  vlReceber?: string
}

export interface ExcelParseResult {
  headers: string[]
  rows: any[][]
  quotas: ParsedQuota[]
  errors: string[]
}

/**
 * Parse arquivo Excel
 */
export async function parseExcel(buffer: Buffer): Promise<ExcelParseResult> {
  const result: ExcelParseResult = {
    headers: [],
    rows: [],
    quotas: [],
    errors: [],
  }

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

    if (jsonData.length === 0) {
      result.errors.push('Planilha vazia')
      return result
    }

    // Primeira linha são os headers
    result.headers = jsonData[0].map((h: any) => String(h || '').trim())
    result.rows = jsonData.slice(1)

    // Tentar parse automático das linhas
    result.quotas = result.rows
      .map((row, idx) => parseExcelRow(row, result.headers, idx))
      .filter((q): q is ParsedQuota => q !== null)

    if (result.quotas.length === 0) {
      result.errors.push('Nenhuma cota válida encontrada na planilha')
    }

  } catch (error) {
    result.errors.push(`Erro ao processar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }

  return result
}

/**
 * Parse uma linha do Excel com mapeamento automático
 */
function parseExcelRow(row: any[], headers: string[], rowIndex: number): ParsedQuota | null {
  try {
    // Mapear valores por índice de coluna
    const getValue = (colName: string): string => {
      const idx = headers.findIndex(h => 
        h.toLowerCase().includes(colName.toLowerCase())
      )
      return idx >= 0 ? String(row[idx] || '') : ''
    }

    // Tentar encontrar campos
    const grupo = getValue('grupo') || getValue('group') || ''
    const cota = getValue('cota') || getValue('quota') || ''
    const versao = getValue('versao') || getValue('versão') || getValue('version') || '00'
    const dataVenda = getValue('data') || getValue('data_venda') || getValue('datavenda') || ''
    const situacaoCobranca = getValue('situacao') || getValue('situação') || getValue('status') || ''
    const contemplacao = getValue('contemplacao') || getValue('contemplação') || getValue('contemplada') || ''
    const percentPago = getValue('percent_pago') || getValue('% pago') || getValue('pago') || '0'
    const vlBem = getValue('vl_bem') || getValue('valor_bem') || getValue('valor') || getValue('vl bem') || '0'
    const vlParcela = getValue('vl_parcela') || getValue('parcela') || getValue('vl parcela') || '0'
    const vlQuitacao = getValue('vl_quitacao') || getValue('quitacao') || getValue('vl quitação') || '0'
    const vlReceber = getValue('vl_receber') || getValue('receber') || getValue('vl receber') || '0'

    // Validar campos obrigatórios
    if (!grupo || !cota) {
      return null
    }

    return {
      grupo: String(grupo).padStart(6, '0'),
      cota: String(cota).padStart(4, '0'),
      versao: String(versao).padStart(2, '0'),
      dataVenda: dataVenda || new Date().toLocaleDateString('pt-BR'),
      situacaoCobranca: situacaoCobranca || 'N00 - NORMAL',
      contemplacao: contemplacao || 'Não Contemplada',
      percentPago: parseBrazilianPercent(percentPago || '0'),
      percentAtraso: parseBrazilianPercent(getValue('percent_atraso') || '0'),
      percentFundoComum: parseBrazilianPercent(getValue('percent_fundo') || '0'),
      pclsPagar: parseInt(getValue('pcls_pagar') || '0', 10),
      pclsPagas: parseInt(getValue('pcls_pagas') || '0', 10),
      pclsPagasEmDia: parseInt(getValue('pcls_pagas_em_dia') || '0', 10),
      pclsPagasAtraso: parseInt(getValue('pcls_pagas_atraso') || '0', 10),
      pclsEmAtraso: parseInt(getValue('pcls_em_atraso') || '0', 10),
      vlBem: parseBrazilianNumber(vlBem || '0'),
      vlParcela: parseBrazilianNumber(vlParcela || '0'),
      vlQuitacao: parseBrazilianNumber(vlQuitacao || '0'),
      vlReceber: parseBrazilianNumber(vlReceber || '0'),
    }
  } catch (error) {
    return null
  }
}

/**
 * Parse Excel com mapeamento manual de colunas
 */
export function parseExcelWithMapping(
  rows: any[][],
  headers: string[],
  mapping: ExcelMapping
): ParsedQuota[] {
  return rows
    .map((row, idx) => {
      try {
        const getValue = (colName: string | undefined): string => {
          if (!colName) return ''
          const idx = headers.indexOf(colName)
          return idx >= 0 ? String(row[idx] || '') : ''
        }

        const grupo = getValue(mapping.grupo)
        const cota = getValue(mapping.cota)

        if (!grupo || !cota) return null

        return {
          grupo: String(grupo).padStart(6, '0'),
          cota: String(cota).padStart(4, '0'),
          versao: String(getValue(mapping.versao) || '00').padStart(2, '0'),
          dataVenda: getValue(mapping.dataVenda) || new Date().toLocaleDateString('pt-BR'),
          situacaoCobranca: getValue(mapping.situacaoCobranca) || 'N00 - NORMAL',
          contemplacao: getValue(mapping.contemplacao) || 'Não Contemplada',
          percentPago: parseBrazilianPercent(getValue(mapping.percentPago) || '0'),
          percentAtraso: parseBrazilianPercent(getValue(mapping.percentAtraso) || '0'),
          percentFundoComum: parseBrazilianPercent(getValue(mapping.percentFundoComum) || '0'),
          pclsPagar: parseInt(getValue(mapping.pclsPagar) || '0', 10),
          pclsPagas: parseInt(getValue(mapping.pclsPagas) || '0', 10),
          pclsPagasEmDia: parseInt(getValue(mapping.pclsPagasEmDia) || '0', 10),
          pclsPagasAtraso: parseInt(getValue(mapping.pclsPagasAtraso) || '0', 10),
          pclsEmAtraso: parseInt(getValue(mapping.pclsEmAtraso) || '0', 10),
          vlBem: parseBrazilianNumber(getValue(mapping.vlBem) || '0'),
          vlParcela: parseBrazilianNumber(getValue(mapping.vlParcela) || '0'),
          vlQuitacao: parseBrazilianNumber(getValue(mapping.vlQuitacao) || '0'),
          vlReceber: parseBrazilianNumber(getValue(mapping.vlReceber) || '0'),
        }
      } catch (error) {
        return null
      }
    })
    .filter((q): q is ParsedQuota => q !== null)
}
