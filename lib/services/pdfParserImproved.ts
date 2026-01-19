/**
 * Parser de PDF MELHORADO - Extração precisa de valores monetários brasileiros
 * Focado em extrair corretamente: 12.500.000,00 (crédito) e 44.000,00 (parcela)
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
 * Extrair valor monetário brasileiro CORRETO
 * Suporta: 12.500.000,00 | 44.000,00 | R$ 260.000,00
 */
function extractBrazilianCurrency(text: string): number {
  // Normalizar: remover espaços extras
  const normalized = text.replace(/\s+/g, ' ')

  // Padrões BRASILEIROS (ponto para milhar, vírgula para decimal)
  const patterns = [
    // R$ 12.500.000,00 ou R$ 44.000,00
    /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    // 12.500.000,00 ou 44.000,00 (formato brasileiro com pontos)
    /(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    // 12500000,00 ou 44000,00 (sem pontos, apenas vírgula decimal)
    /(\d+,\d{2})/g,
  ]

  let maxValue = 0

  for (const pattern of patterns) {
    const matches = normalized.matchAll(pattern)
    for (const match of matches) {
      const valueStr = match[1] || match[0]
      // Parse brasileiro: remover pontos (milhares), vírgula vira ponto decimal
      const cleaned = valueStr
        .replace(/[R$\s]/g, '') // Remove R$ e espaços
        .replace(/\./g, '')      // Remove pontos (milhares)
        .replace(',', '.')       // Vírgula vira ponto decimal
      
      const num = parseFloat(cleaned)
      if (!isNaN(num) && num > 0) {
        maxValue = Math.max(maxValue, num)
      }
    }
  }

  return maxValue
}

/**
 * Extrair TODOS os valores monetários de uma linha/bloco
 */
function extractAllCurrencyValues(text: string): number[] {
  const values: number[] = []
  const normalized = text.replace(/\s+/g, ' ')

  // Padrões brasileiros
  const patterns = [
    /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    /(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    /(\d{4,},\d{2})/g,
  ]

  for (const pattern of patterns) {
    const matches = normalized.matchAll(pattern)
    for (const match of matches) {
      const valueStr = match[1] || match[0]
      const cleaned = valueStr
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      
      const num = parseFloat(cleaned)
      if (!isNaN(num) && num > 0 && num < 1000000000) { // Até 1 bilhão
        values.push(num)
      }
    }
  }

  // Remover duplicatas e ordenar (maior primeiro)
  return [...new Set(values)].sort((a, b) => b - a)
}

/**
 * Detectar número de cota
 */
function detectQuotaNumber(text: string): { grupo?: string; cota?: string; versao?: string } | null {
  const normalized = text.replace(/\s+/g, ' ').trim()

  const patterns = [
    /(\d{6})[\s\-\.\/]+(\d{4})[\s\-\.\/]*(\d{1,2})?/,
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
  const lines = blockText.split('\n').map(l => l.trim()).filter(l => l.length > 2)

  // Contemplação
  if (lowerText.includes('contemplada') || lowerText.includes('contemplado')) {
    quota.contemplacao = 'Contemplada'
  }

  // Situação de cobrança
  const situacaoMatch = blockText.match(/N\d{2}\s*[-–]\s*[A-Z\s]+/i)
  if (situacaoMatch) {
    quota.situacaoCobranca = situacaoMatch[0].trim()
  }

  // Extrair todos os valores monetários do bloco
  const allValues = extractAllCurrencyValues(blockText)

  // Processar cada linha para identificar contexto
  for (const line of lines) {
    const lineLower = line.toLowerCase()
    const lineValues = extractAllCurrencyValues(line)

    // Valor do bem/crédito (geralmente o maior valor, relacionado a "bem", "crédito", "valor")
    if (lineLower.includes('bem') || lineLower.includes('crédito') || lineLower.includes('credito') || 
        lineLower.includes('valor') || lineLower.includes('credito')) {
      if (lineValues.length > 0 && lineValues[0] > 10000) {
        quota.vlBem = lineValues[0]
      }
    }

    // Valor da parcela (geralmente menor, relacionado a "parcela", "mensal")
    if (lineLower.includes('parcela') || lineLower.includes('parc.') || lineLower.includes('mensal')) {
      if (lineValues.length > 0) {
        // Parcela geralmente está entre 1.000 e 100.000
        const parcelaValue = lineValues.find(v => v >= 1000 && v <= 200000) || lineValues[0]
        if (parcelaValue > 0) {
          quota.vlParcela = parcelaValue
        }
      }
    }

    // Valor a receber
    if (lineLower.includes('receber') || lineLower.includes('recebido')) {
      if (lineValues.length > 0) {
        quota.vlReceber = lineValues[0]
      }
    }

    // Valor de quitação
    if (lineLower.includes('quitação') || lineLower.includes('quitacao')) {
      if (lineValues.length > 0) {
        quota.vlQuitacao = lineValues[0]
      }
    }
  }

  // Se não identificou valores por contexto, usar heurística dos valores encontrados
  if (allValues.length > 0) {
    // Valor do bem: geralmente o maior (acima de 100.000)
    if (!quota.vlBem) {
      const vlBemCandidato = allValues.find(v => v >= 100000) || allValues[0]
      if (vlBemCandidato > 0) {
        quota.vlBem = vlBemCandidato
      }
    }

    // Valor da parcela: geralmente menor (entre 1.000 e 200.000)
    if (!quota.vlParcela) {
      const vlParcelaCandidato = allValues.find(v => v >= 1000 && v <= 200000)
      if (vlParcelaCandidato && vlParcelaCandidato > 0) {
        quota.vlParcela = vlParcelaCandidato
      } else if (allValues.length > 1) {
        // Se não encontrou nesse range, pegar o segundo maior (menos provável)
        quota.vlParcela = allValues[1]
      }
    }

    // Valor a receber: geralmente próximo do valor do bem ou menor
    if (!quota.vlReceber && quota.vlBem) {
      const vlReceberCandidato = allValues.find(v => v < quota.vlBem && v > quota.vlParcela)
      if (vlReceberCandidato) {
        quota.vlReceber = vlReceberCandidato
      }
    }
  }

  // Percentuais
  const percentMatches = blockText.match(/(\d+[,.]?\d*)\s*%/g)
  if (percentMatches) {
    const percents = percentMatches
      .map(m => parseBrazilianPercent(m.replace('%', '').trim()))
      .filter(p => p > 0 && p <= 100)
      .sort((a, b) => b - a)

    if (percents.length > 0) quota.percentPago = percents[0]
    if (percents.length > 1) quota.percentAtraso = percents[1]
    if (percents.length > 2) quota.percentFundoComum = percents[2]
  }

  // Parcelas (X/Y)
  const parcelasPatterns = [
    /(\d+)\s*[\/\s]+\s*(\d+)/,
    /(\d+)\s+de\s+(\d+)/i,
  ]

  for (const pattern of parcelasPatterns) {
    const match = blockText.match(pattern)
    if (match) {
      quota.pclsPagas = parseInt(match[1], 10)
      quota.pclsPagar = parseInt(match[2], 10)
      break
    }
  }

  return quota
}

/**
 * Processar texto com lógica melhorada
 */
function processTextImproved(text: string): ParsedQuota[] {
  const quotas: ParsedQuota[] = []
  
  // Normalizar
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
  
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 2)

  let currentQuota: ParsedQuota | null = null
  let quotaBlock: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join(' ')

    // Detectar nova cota
    const quotaInfo = detectQuotaNumber(nextLines)
    
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

    // Adicionar linha ao bloco
    if (currentQuota) {
      quotaBlock.push(line)
      if (quotaBlock.length > 20) {
        quotaBlock.shift()
      }
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
 * Calcular valores médios quando todas as cotas têm os mesmos valores
 */
function normalizeQuotaValues(quotas: ParsedQuota[]): ParsedQuota[] {
  if (quotas.length === 0) return quotas

  // Se temos valores consistentes, aplicar média onde faltar
  const valuesWithBem = quotas.filter(q => q.vlBem > 0)
  const valuesWithParcela = quotas.filter(q => q.vlParcela > 0)

  // Se a maioria tem os mesmos valores, aplicar aos que não têm
  if (valuesWithBem.length > quotas.length / 2) {
    // Calcular moda (valor mais comum)
    const bemCounts = new Map<number, number>()
    valuesWithBem.forEach(q => {
      bemCounts.set(q.vlBem, (bemCounts.get(q.vlBem) || 0) + 1)
    })
    const mostCommonBem = Array.from(bemCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0]

    if (mostCommonBem) {
      quotas.forEach(q => {
        if (!q.vlBem || q.vlBem === 0) {
          q.vlBem = mostCommonBem
        }
      })
    }
  }

  if (valuesWithParcela.length > quotas.length / 2) {
    const parcelaCounts = new Map<number, number>()
    valuesWithParcela.forEach(q => {
      parcelaCounts.set(q.vlParcela, (parcelaCounts.get(q.vlParcela) || 0) + 1)
    })
    const mostCommonParcela = Array.from(parcelaCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0]

    if (mostCommonParcela) {
      quotas.forEach(q => {
        if (!q.vlParcela || q.vlParcela === 0) {
          q.vlParcela = mostCommonParcela
        }
      })
    }
  }

  return quotas
}

/**
 * Parse PDF com extração melhorada
 */
export async function parsePDFImproved(buffer: Buffer, useOCR: boolean = false): Promise<ParseResult> {
  const result: ParseResult = {
    quotas: [],
    errors: [],
  }

  try {
    // Validar buffer
    if (!buffer || buffer.length === 0) {
      result.errors.push('Buffer do PDF está vazio ou inválido.')
      return result
    }

    let extractedText = ''

    // Extrair texto
    try {
      console.log(`📄 Iniciando extração de texto do PDF (tamanho: ${buffer.length} bytes)...`)
      const pdfData = await pdfParse(buffer, {
        max: 0, // Sem limite de páginas
      })
      extractedText = pdfData.text || ''

      console.log(`📝 Texto extraído: ${extractedText.length} caracteres`)

      if (extractedText.trim().length < 50) {
        result.errors.push('PDF não contém texto suficiente para extração. O PDF pode estar escaneado. Tente usar OCR.')
        console.warn('⚠️ PDF com pouco texto extraído:', extractedText.substring(0, 200))
        return result
      }

      // Log dos primeiros caracteres para debug
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Primeiros 500 caracteres:', extractedText.substring(0, 500))
      }
    } catch (pdfError: any) {
      const errorMsg = pdfError instanceof Error ? pdfError.message : String(pdfError)
      console.error('❌ Erro ao extrair texto do PDF:', errorMsg)
      result.errors.push(`Erro ao extrair texto do PDF: ${errorMsg}. Verifique se o arquivo é um PDF válido.`)
      return result
    }

    // Processar texto
    let quotas = processTextImproved(extractedText)

    // Normalizar valores (aplicar valores comuns onde faltar)
    quotas = normalizeQuotaValues(quotas)

    // Validar cotas
    const validQuotas = quotas.filter(q => {
      const hasNumbers = q.grupo && q.cota
      const hasValues = q.vlBem > 0 || q.vlParcela > 0
      return hasNumbers && hasValues
    })

    result.quotas = validQuotas

    if (validQuotas.length === 0) {
      result.errors.push('Nenhuma cota válida encontrada no PDF.')
    } else {
      console.log(`✅ Encontradas ${validQuotas.length} cotas`)
      if (validQuotas.length > 0) {
        const sample = validQuotas[0]
        console.log(`📊 Exemplo: Cota ${sample.grupo}-${sample.cota} - vlBem: ${sample.vlBem}, vlParcela: ${sample.vlParcela}`)
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    result.errors.push(`Erro ao processar PDF: ${errorMessage}`)
    console.error('PDF parse error:', error)
  }

  return result
}
