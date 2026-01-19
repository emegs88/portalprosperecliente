/**
 * Parser de PDF MELHORADO - Extração robusta de cotas
 * Versão otimizada para diferentes formatos de extratos
 */

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

interface ParseResult {
  quotas: ParsedQuota[]
  errors: string[]
}

/**
 * Extrair todos os valores monetários de uma linha
 */
function extractAllMonetaryValues(text: string): number[] {
  const values: number[] = []
  
  // Padrões mais abrangentes
  const patterns = [
    // R$ 1.234.567,89 ou R$ 1234567,89
    /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+,\d{2})/gi,
    // 1.234.567,89
    /(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    // 1234567,89
    /(\d{4,},\d{2})/g,
    // 1234567.89
    /(\d{4,}\.\d{2})/g,
    // Números grandes sem decimal
    /(\d{5,})/g,
  ]

  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const cleaned = match
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
        const num = parseFloat(cleaned)
        if (!isNaN(num) && num > 0 && num < 1000000000) { // Até 1 bilhão (suporta 12.500.000,00)
          values.push(num)
        }
      })
    }
  }

  return values.sort((a, b) => b - a) // Maior primeiro
}

/**
 * Detectar cota - padrões mais flexíveis
 */
function detectQuotaInfo(text: string): { grupo?: string; cota?: string; versao?: string } | null {
  // Normalizar texto (remover espaços extras)
  const normalized = text.replace(/\s+/g, ' ').trim()

  // Múltiplos padrões
  const patterns = [
    // 000707-0256-2 ou 000707 0256 2 ou 000707/0256/2
    /(\d{6})[\s\-\.\/]+(\d{4})[\s\-\.\/]*(\d{1,2})?/,
    // GRUPO: 000707 COTA: 0256
    /(?:grupo|group)[\s:]+(\d{6})[\s,]+(?:cota|quota)[\s:]+(\d{4})(?:[\s,]+(?:versao|version)[\s:]+(\d{1,2}))?/i,
    // 00070702562 (sem separadores)
    /(\d{6})(\d{4})(\d{2})/,
    // Apenas 6 dígitos seguido de 4 dígitos
    /(\d{6})\s+(\d{4})/,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match) {
      return {
        grupo: match[1]?.padStart(6, '0'),
        cota: match[2]?.padStart(4, '0'),
        versao: match[3]?.padStart(2, '0') || '00',
      }
    }
  }

  return null
}

/**
 * Extrair informações de uma cota de um bloco de texto
 */
function extractQuotaFromBlock(blockText: string, quotaInfo: { grupo: string; cota: string; versao: string }): ParsedQuota {
  const quota: ParsedQuota = {
    grupo: quotaInfo.grupo,
    cota: quotaInfo.cota,
    versao: quotaInfo.versao,
    dataVenda: '',
    situacaoCobranca: 'N00 - NORMAL',
    contemplacao: 'Não Contemplada',
    percentPago: 0,
    percentAtraso: 0,
    percentFundoComum: 0,
    pclsPagar: 0,
    pclsPagas: 0,
    pclsPagasEmDia: 0,
    pclsPagasAtraso: 0,
    pclsEmAtraso: 0,
    vlBem: 0,
    vlParcela: 0,
    vlQuitacao: 0,
    vlReceber: 0,
  }

  const lowerText = blockText.toLowerCase()

  // Contemplação
  if (lowerText.includes('contemplada') || lowerText.includes('contemplado')) {
    quota.contemplacao = 'Contemplada'
  }

  // Situação de cobrança
  const situacaoMatch = blockText.match(/N\d{2}\s*[-–]\s*[A-Z\s]+/i)
  if (situacaoMatch) {
    quota.situacaoCobranca = situacaoMatch[0].trim()
  }

  // Percentuais
  const percentMatches = blockText.match(/(\d+[,.]?\d*)\s*%/g)
  if (percentMatches) {
    const percents = percentMatches
      .map(m => parseBrazilianPercent(m.replace('%', '').trim()))
      .filter(p => p > 0 && p <= 100)
      .sort((a, b) => b - a) // Maior primeiro

    if (percents.length > 0) quota.percentPago = percents[0]
    if (percents.length > 1) quota.percentAtraso = percents[1]
    if (percents.length > 2) quota.percentFundoComum = percents[2]
  }

  // Parcelas (X/Y, X de Y, etc)
  const parcelasPatterns = [
    /(\d+)\s*[\/\s]+\s*(\d+)/, // 12/60
    /(\d+)\s+de\s+(\d+)/i, // 12 de 60
    /parcela[s]?[:\s]+(\d+)[\/\s]+(\d+)/i, // Parcelas: 12/60
  ]

  for (const pattern of parcelasPatterns) {
    const match = blockText.match(pattern)
    if (match) {
      quota.pclsPagas = parseInt(match[1], 10)
      quota.pclsPagar = parseInt(match[2], 10)
      break
    }
  }

  // Extrair todos os valores monetários
  const allValues = extractAllMonetaryValues(blockText)

  // Tentar identificar valores por contexto
  const lines = blockText.split('\n').map(l => l.trim().toLowerCase())

  for (const line of lines) {
    // Valor do bem (geralmente o maior)
    if (line.includes('bem') || line.includes('crédito') || line.includes('credito') || line.includes('valor')) {
      const lineValues = extractAllMonetaryValues(line)
      if (lineValues.length > 0 && lineValues[0] > 10000) {
        quota.vlBem = lineValues[0]
      }
    }

    // Valor da parcela
    if (line.includes('parcela') || line.includes('parc.') || line.includes('mensal')) {
      const lineValues = extractAllMonetaryValues(line)
      if (lineValues.length > 0 && lineValues[0] > 0 && lineValues[0] < 50000) {
        quota.vlParcela = lineValues[0]
      }
    }

    // Valor a receber
    if (line.includes('receber') || line.includes('recebido') || line.includes('receberá')) {
      const lineValues = extractAllMonetaryValues(line)
      if (lineValues.length > 0) {
        quota.vlReceber = lineValues[0]
      }
    }

    // Valor de quitação
    if (line.includes('quitação') || line.includes('quitacao') || line.includes('quit') || line.includes('liquidar')) {
      const lineValues = extractAllMonetaryValues(line)
      if (lineValues.length > 0) {
        quota.vlQuitacao = lineValues[0]
      }
    }
  }

  // Se ainda não identificou, usar os maiores valores encontrados
  if (allValues.length > 0) {
    if (!quota.vlBem && allValues[0] > 10000) {
      quota.vlBem = allValues[0]
    }
    if (!quota.vlParcela && allValues.length > 1 && allValues[1] > 0 && allValues[1] < 50000) {
      quota.vlParcela = allValues[1]
    }
    if (!quota.vlReceber && allValues.length > 2) {
      quota.vlReceber = allValues[2]
    }
  }

  return quota
}

/**
 * Processar texto extraído - versão melhorada
 */
function processTextEnhanced(text: string): ParsedQuota[] {
  const quotas: ParsedQuota[] = []

  // Normalizar texto
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n')

  const lines = normalizedText.split('\n')

  let currentQuota: ParsedQuota | null = null
  let quotaBlock: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join(' ')

    // Detectar nova cota
    const quotaInfo = detectQuotaInfo(nextLines)

    if (quotaInfo && quotaInfo.grupo && quotaInfo.cota) {
      // Salvar cota anterior
      if (currentQuota && quotaBlock.length > 0) {
        const blockText = quotaBlock.join('\n')
        currentQuota = extractQuotaFromBlock(blockText, currentQuota)
        quotas.push(currentQuota)
      }

      // Nova cota
      currentQuota = {
        grupo: quotaInfo.grupo,
        cota: quotaInfo.cota,
        versao: quotaInfo.versao || '00',
        dataVenda: '',
        situacaoCobranca: 'N00 - NORMAL',
        contemplacao: 'Não Contemplada',
        percentPago: 0,
        percentAtraso: 0,
        percentFundoComum: 0,
        pclsPagar: 0,
        pclsPagas: 0,
        pclsPagasEmDia: 0,
        pclsPagasAtraso: 0,
        pclsEmAtraso: 0,
        vlBem: 0,
        vlParcela: 0,
        vlQuitacao: 0,
        vlReceber: 0,
      }

      quotaBlock = [line]
      i++
      continue
    }

    // Adicionar linha ao bloco atual
    if (currentQuota) {
      quotaBlock.push(line)

      // Limitar bloco (máximo 15 linhas por cota)
      if (quotaBlock.length > 15) {
        quotaBlock.shift()
      }

      // Processar linha atual para extrair informações
      currentQuota = extractQuotaFromBlock(line, currentQuota)
    }

    i++
  }

  // Adicionar última cota
  if (currentQuota && quotaBlock.length > 0) {
    const blockText = quotaBlock.join('\n')
    currentQuota = extractQuotaFromBlock(blockText, currentQuota)
    quotas.push(currentQuota)
  }

  return quotas
}

/**
 * Parse PDF com extração melhorada
 */
export async function parsePDFEnhanced(buffer: Buffer, useOCR: boolean = false): Promise<ParseResult> {
  const result: ParseResult = {
    quotas: [],
    errors: [],
  }

  try {
    let extractedText = ''

    // Extrair texto do PDF
    try {
      const pdfData = await pdfParse(buffer)
      extractedText = pdfData.text || ''

      // Se o texto está muito curto, pode ser PDF escaneado
      if (extractedText.trim().length < 100) {
        result.errors.push('PDF pode estar escaneado. Ative a opção OCR para melhor extração.')
      }
    } catch (pdfError) {
      result.errors.push(`Erro ao extrair texto do PDF: ${pdfError instanceof Error ? pdfError.message : 'Erro desconhecido'}`)
      return result
    }

    if (!extractedText || extractedText.trim().length < 50) {
      result.errors.push('PDF não contém texto suficiente para extração.')
      return result
    }

    // Processar texto
    const quotas = processTextEnhanced(extractedText)

    // Validar cotas
    const validQuotas = quotas.filter(q => {
      const hasNumbers = q.grupo && q.cota
      const hasValues = q.vlBem > 0 || q.vlParcela > 0
      return hasNumbers && hasValues
    })

    // Se não encontrou cotas válidas, tentar busca mais agressiva
    if (validQuotas.length === 0) {
      // Buscar por padrões alternativos
      const allQuotaMatches = extractedText.match(/(\d{6})[\s\-\.\/]+(\d{4})/g)
      if (allQuotaMatches) {
        result.errors.push(`Encontrados ${allQuotaMatches.length} padrões de cotas, mas não foi possível extrair dados completos.`)
      } else {
        result.errors.push('Nenhum padrão de cota encontrado no PDF.')
      }
    }

    result.quotas = validQuotas

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    result.errors.push(`Erro ao processar PDF: ${errorMessage}`)
    console.error('PDF parse error:', error)
  }

  return result
}
