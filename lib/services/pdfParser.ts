import pdfParse from 'pdf-parse'
import { parseBrazilianNumber, parseBrazilianPercent } from '@/lib/utils'

export interface ParsedQuota {
  grupo: string
  cota: string
  versao: string
  dataVenda: string
  situacaoCobranca: string
  contemplacao: string
  percentPago: number
  percentAtraso: number
  percentFundoComum: number
  pclsPagar: number
  pclsPagas: number
  pclsPagasEmDia: number
  pclsPagasAtraso: number
  pclsEmAtraso: number
  vlBem: number
  vlParcela: number
  vlQuitacao: number
  vlReceber: number
  errors?: string[]
}

export interface ParsedHeader {
  administradora?: string
  empresa?: string
  dataRelatorio?: string
  clienteNome?: string
  clienteDocumento?: string
}

export interface ParsedTotals {
  totalCotas: number
  totalVlBem: number
  totalVlParcela: number
  totalVlQuitacao: number
  totalVlReceber: number
}

export interface ParsedResult {
  header: ParsedHeader
  quotas: ParsedQuota[]
  totals: ParsedTotals | null
  errors: string[]
}

/**
 * Valida se uma linha parece ser uma linha de cota válida
 * Padrão esperado: 6 dígitos (grupo) + espaço + 4 dígitos (cota) + espaço + versao + data dd/mm/yyyy
 */
function isValidQuotaLine(line: string): boolean {
  const pattern = /^\d{6}\s+\d{4}\s+\d{2}\s+\d{2}\/\d{2}\/\d{4}/
  return pattern.test(line.trim())
}

/**
 * Extrai campos de uma linha de cota
 */
function parseQuotaLine(line: string): ParsedQuota | null {
  const trimmed = line.trim()
  if (!isValidQuotaLine(trimmed)) {
    return null
  }

  const errors: string[] = []
  
  // Dividir por múltiplos espaços e filtrar vazios
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0)
  
  if (parts.length < 17) {
    return null
  }

  try {
    const grupo = parts[0]
    const cota = parts[1]
    const versao = parts[2]
    const dataVenda = parts[3]
    const situacaoCobranca = parts[4] || ''
    const contemplacao = parts.slice(5, 7).join(' ') || ''
    const percentPago = parseBrazilianPercent(parts[7] || '0')
    const percentAtraso = parseBrazilianPercent(parts[8] || '0')
    const percentFundoComum = parseBrazilianPercent(parts[9] || '0')
    const pclsPagar = parseInt(parts[10] || '0', 10)
    const pclsPagas = parseInt(parts[11] || '0', 10)
    const pclsPagasEmDia = parseInt(parts[12] || '0', 10)
    const pclsPagasAtraso = parseInt(parts[13] || '0', 10)
    const pclsEmAtraso = parseInt(parts[14] || '0', 10)
    const vlBem = parseBrazilianNumber(parts[15] || '0')
    const vlParcela = parseBrazilianNumber(parts[16] || '0')
    const vlQuitacao = parseBrazilianNumber(parts[17] || '0')
    const vlReceber = parseBrazilianNumber(parts[18] || '0')

    return {
      grupo,
      cota,
      versao,
      dataVenda,
      situacaoCobranca,
      contemplacao,
      percentPago,
      percentAtraso,
      percentFundoComum,
      pclsPagar,
      pclsPagas,
      pclsPagasEmDia,
      pclsPagasAtraso,
      pclsEmAtraso,
      vlBem,
      vlParcela,
      vlQuitacao,
      vlReceber,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    return null
  }
}

/**
 * Extrai cabeçalho do PDF
 */
function parseHeader(lines: string[]): ParsedHeader {
  const header: ParsedHeader = {}
  
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].toUpperCase()
    
    if (line.includes('ADMINISTRADORA') && !header.administradora) {
      header.administradora = lines[i].trim()
    }
    
    if (line.includes('PROSPERE') && !header.empresa) {
      header.empresa = lines[i].trim()
    }
    
    if (line.includes('CPF/CNPJ') || line.includes('CPF') || line.includes('CNPJ')) {
      const nextLine = lines[i + 1] || ''
      if (!header.clienteNome && nextLine) {
        header.clienteNome = nextLine.trim()
      }
      // Extrair documento da mesma linha ou próxima
      const docMatch = line.match(/(\d{2,3}\.?\d{3}\.?\d{3}[-\/]?\d{2})/)
      if (docMatch && !header.clienteDocumento) {
        header.clienteDocumento = docMatch[1]
      }
    }
    
    // Data do relatório: dd/mm/yyyy hh:mm:ss
    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/)
    if (dateMatch && !header.dataRelatorio) {
      header.dataRelatorio = dateMatch[1]
    }
  }
  
  return header
}

/**
 * Extrai totais do final do PDF
 */
function parseTotals(lines: string[]): ParsedTotals | null {
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 20); i--) {
    const line = lines[i].toUpperCase()
    
    if (line.includes('TOTAL') || line.includes('TOTAIS')) {
      const totalLine = lines[i + 1] || lines[i]
      const parts = totalLine.trim().split(/\s+/).filter(p => p.length > 0)
      
      if (parts.length >= 5) {
        try {
          return {
            totalCotas: parseInt(parts[0] || '0', 10),
            totalVlBem: parseBrazilianNumber(parts[1] || '0'),
            totalVlParcela: parseBrazilianNumber(parts[2] || '0'),
            totalVlQuitacao: parseBrazilianNumber(parts[3] || '0'),
            totalVlReceber: parseBrazilianNumber(parts[4] || '0'),
          }
        } catch (error) {
          return null
        }
      }
    }
  }
  
  return null
}

/**
 * Função principal: parse PDF
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedResult> {
  const result: ParsedResult = {
    header: {},
    quotas: [],
    totals: null,
    errors: []
  }

  try {
    const data = await pdfParse(buffer)
    const allLines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

    // Parse header
    result.header = parseHeader(allLines)

    // Parse quotas
    for (const line of allLines) {
      const quota = parseQuotaLine(line)
      if (quota) {
        result.quotas.push(quota)
      }
    }

    // Parse totals
    result.totals = parseTotals(allLines)

    if (result.quotas.length === 0) {
      result.errors.push('Nenhuma cota válida encontrada no PDF')
    }

  } catch (error) {
    result.errors.push(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }

  return result
}
