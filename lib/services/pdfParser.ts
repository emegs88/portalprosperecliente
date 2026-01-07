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
  tipoBem?: string // "IMOVEL" ou "OUTROS"
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
  const trimmed = line.trim()
  // Padrão mais flexível: grupo (6 dígitos) + cota (4 dígitos) + versão (2 dígitos) + data
  const pattern1 = /^\d{6}\s+\d{4}\s+\d{2}\s+\d{2}\/\d{2}\/\d{4}/
  // Padrão alternativo: sem espaços exatos
  const pattern2 = /^\d{6}[\s]+\d{4}[\s]+\d{2}[\s]+\d{2}\/\d{2}\/\d{4}/
  // Padrão ainda mais flexível
  const pattern3 = /\d{6}.*\d{4}.*\d{2}\/\d{2}\/\d{4}/
  
  return pattern1.test(trimmed) || pattern2.test(trimmed) || pattern3.test(trimmed)
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
  // Também considerar separadores como tabs ou múltiplos espaços
  let parts = trimmed.split(/\s+/).filter(p => p.length > 0)
  
  // Se não encontrou partes suficientes, tentar outras estratégias
  if (parts.length < 15) {
    // Tentar dividir por tab
    const tabParts = trimmed.split(/\t+/).filter(p => p.length > 0)
    if (tabParts.length > parts.length) {
      parts = tabParts
    }
    
    // Tentar regex mais específico
    if (parts.length < 15) {
      const regexMatch = trimmed.match(/(\d{6})\s+(\d{4})\s+(\d{2})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+)/)
      if (regexMatch) {
        // Tentar processar a parte restante
        const rest = regexMatch[5]
        parts = [
          regexMatch[1], // grupo
          regexMatch[2], // cota
          regexMatch[3], // versao
          regexMatch[4], // data
          ...rest.split(/\s+/)
        ]
      }
    }
  }
  
  if (parts.length < 15) {
    return null
  }

  try {
    const grupo = parts[0]?.replace(/\D/g, '').padStart(6, '0').substring(0, 6) || ''
    const cota = parts[1]?.replace(/\D/g, '').padStart(4, '0').substring(0, 4) || ''
    const versao = parts[2]?.replace(/\D/g, '').padStart(2, '0').substring(0, 2) || '00'
    
    // Data pode estar no formato dd/mm/yyyy ou junto com outros dados
    let dataVenda = parts[3] || ''
    if (!/\d{2}\/\d{2}\/\d{4}/.test(dataVenda)) {
      // Procurar data na linha
      const dateMatch = trimmed.match(/(\d{2}\/\d{2}\/\d{4})/)
      dataVenda = dateMatch ? dateMatch[1] : ''
    }
    
    // Situação pode estar junto ou separada
    let situacaoCobranca = parts[4] || ''
    let contemplacao = ''
    let idx = 5
    
    // Procurar "Não Contemplada" ou "Contemplada"
    const contemplacaoMatch = trimmed.match(/(Não\s+)?Contemplada/i)
    if (contemplacaoMatch) {
      contemplacao = contemplacaoMatch[0]
      // Ajustar índice se necessário
      while (idx < parts.length && !parts[idx]?.toLowerCase().includes('contemplad')) {
        idx++
      }
    } else {
      contemplacao = parts.slice(idx, idx + 2).join(' ') || 'Não Contemplada'
      idx += 2
    }
    
    // Extrair valores numéricos
    const percentPago = idx < parts.length ? parseBrazilianPercent(parts[idx] || '0') : 0
    const percentAtraso = idx + 1 < parts.length ? parseBrazilianPercent(parts[idx + 1] || '0') : 0
    const percentFundoComum = idx + 2 < parts.length ? parseBrazilianPercent(parts[idx + 2] || '0') : 0
    const pclsPagar = idx + 3 < parts.length ? parseInt(parts[idx + 3]?.replace(/\D/g, '') || '0', 10) : 0
    const pclsPagas = idx + 4 < parts.length ? parseInt(parts[idx + 4]?.replace(/\D/g, '') || '0', 10) : 0
    const pclsPagasEmDia = idx + 5 < parts.length ? parseInt(parts[idx + 5]?.replace(/\D/g, '') || '0', 10) : 0
    const pclsPagasAtraso = idx + 6 < parts.length ? parseInt(parts[idx + 6]?.replace(/\D/g, '') || '0', 10) : 0
    const pclsEmAtraso = idx + 7 < parts.length ? parseInt(parts[idx + 7]?.replace(/\D/g, '') || '0', 10) : 0
    
    // Valores monetários - procurar padrões com vírgula
    const vlBem = extractMonetaryValue(parts, idx + 8)
    const vlParcela = extractMonetaryValue(parts, idx + 9)
    const vlQuitacao = extractMonetaryValue(parts, idx + 10)
    const vlReceber = extractMonetaryValue(parts, idx + 11)

    // Detectar tipo de bem
    let tipoBem: string | undefined = undefined
    if (contemplacao.toLowerCase().includes('imovel') || contemplacao.toLowerCase().includes('imóvel')) {
      tipoBem = 'IMOVEL'
    } else {
      tipoBem = 'OUTROS'
    }

    return {
      grupo,
      cota,
      versao,
      dataVenda,
      situacaoCobranca: situacaoCobranca || 'N00 - NORMAL',
      contemplacao: contemplacao || 'Não Contemplada',
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
      tipoBem,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    console.error('Erro ao parsear linha:', trimmed.substring(0, 100), error)
    return null
  }
}

/**
 * Extrai valor monetário de uma lista de partes, procurando padrões brasileiros
 */
function extractMonetaryValue(parts: string[], startIdx: number): number {
  if (startIdx >= parts.length) return 0
  
  // Tentar o índice direto
  let value = parseBrazilianNumber(parts[startIdx] || '0')
  if (value > 0) return value
  
  // Procurar em índices próximos
  for (let i = Math.max(0, startIdx - 2); i <= Math.min(parts.length - 1, startIdx + 2); i++) {
    const part = parts[i]
    if (part && /[\d.,]/.test(part) && part.includes(',')) {
      const parsed = parseBrazilianNumber(part)
      if (parsed > 0) return parsed
    }
  }
  
  return 0
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
 * Parse PDF a partir de texto já extraído (útil após OCR)
 */
export function parsePDFText(text: string): ParsedResult {
  const result: ParsedResult = {
    header: {},
    quotas: [],
    totals: null,
    errors: []
  }

  try {
    console.log('📄 Parseando texto do PDF...')
    console.log(`📄 Texto: ${text.length} caracteres`)

    // Melhorar extração de linhas - considerar múltiplos delimitadores
    const allLines = text
      .split(/\n|\r\n/)
      .map(l => l.trim())
      .filter(l => l.length > 5) // Filtrar linhas muito curtas

    console.log(`📄 Total de linhas extraídas: ${allLines.length}`)

    // Parse header
    result.header = parseHeader(allLines)
    console.log('📄 Header extraído:', result.header)

    // Parse quotas - tentar diferentes estratégias
    let quotasFound = 0
    
    // Estratégia 1: Linha por linha
    for (const line of allLines) {
      const quota = parseQuotaLine(line)
      if (quota) {
        result.quotas.push(quota)
        quotasFound++
      }
    }

    // Estratégia 2: Se não encontrou, tentar juntar linhas quebradas
    if (quotasFound === 0) {
      console.log('⚠️  Nenhuma cota encontrada linha por linha, tentando juntar linhas quebradas...')
      for (let i = 0; i < allLines.length - 1; i++) {
        const combinedLine = allLines[i] + ' ' + allLines[i + 1]
        const quota = parseQuotaLine(combinedLine)
        if (quota) {
          result.quotas.push(quota)
          quotasFound++
        }
      }
    }

    // Estratégia 3: Buscar padrões mais flexíveis
    if (quotasFound === 0) {
      console.log('⚠️  Tentando padrões mais flexíveis...')
      for (const line of allLines) {
        // Buscar padrão: grupo-cota em qualquer lugar da linha
        const grupoCotaMatch = line.match(/(\d{6})\s*[-\s]+\s*(\d{4})/)
        if (grupoCotaMatch) {
          console.log('🔍 Possível linha de cota encontrada:', line.substring(0, 100))
        }
      }
    }

    console.log(`✅ Cotas encontradas: ${result.quotas.length}`)

    // Parse totals
    result.totals = parseTotals(allLines)
    if (result.totals) {
      console.log('📄 Totais extraídos:', result.totals)
    }

    if (result.quotas.length === 0) {
      result.errors.push('Nenhuma cota válida encontrada no PDF')
      console.error('❌ ERRO: Nenhuma cota encontrada!')
      console.error('Primeiras 10 linhas do PDF:')
      allLines.slice(0, 10).forEach((line, idx) => {
        console.error(`  ${idx + 1}: ${line.substring(0, 150)}`)
      })
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
    result.errors.push(`Erro ao processar texto do PDF: ${errorMsg}`)
    console.error('❌ Erro ao processar texto do PDF:', error)
  }

  return result
}

/**
 * Função principal: parse PDF a partir de buffer
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedResult> {
  try {
    console.log('📄 Iniciando parse do PDF...')
    const data = await pdfParse(buffer)
    console.log(`📄 PDF parseado: ${data.numpages} página(s), ${data.text.length} caracteres`)
    
    // Usar parsePDFText com o texto extraído
    return parsePDFText(data.text)
  } catch (error) {
    const result: ParsedResult = {
      header: {},
      quotas: [],
      totals: null,
      errors: []
    }
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
    result.errors.push(`Erro ao processar PDF: ${errorMsg}`)
    console.error('❌ Erro ao processar PDF:', error)
    return result
  }
}
