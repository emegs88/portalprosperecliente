/**
 * Parser de PDF ROBUSTO - Extração alternativa mais agressiva
 * Foco em encontrar informações mesmo em PDFs com formatação difícil
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
 * Extrair todos os números de um texto (muito agressivo)
 */
function extractAllNumbers(text: string): Array<{ value: number; context: string; index: number }> {
  const numbers: Array<{ value: number; context: string; index: number }> = []
  const lines = text.split('\n')
  
  lines.forEach((line, lineIndex) => {
    // Padrões brasileiros (com pontos e vírgulas)
    const patterns = [
      /(\d{1,3}(?:\.\d{3})*,\d{2})/g, // 12.500.000,00
      /(\d+,\d{2})/g, // 44000,00
      /(\d{6,})/g, // Números grandes (6+ dígitos)
    ]

    patterns.forEach(pattern => {
      const matches = line.matchAll(pattern)
      for (const match of matches) {
        const valueStr = match[1] || match[0]
        const cleaned = valueStr
          .replace(/\./g, '')
          .replace(',', '.')
        const num = parseFloat(cleaned)
        if (!isNaN(num) && num > 100) { // Ignorar números muito pequenos
          numbers.push({
            value: num,
            context: line.substring(Math.max(0, match.index! - 20), Math.min(line.length, match.index! + valueStr.length + 20)),
            index: lineIndex,
          })
        }
      }
    })
  })

  return numbers.sort((a, b) => b.value - a.value) // Maior primeiro
}

/**
 * Detectar números de cota (muito flexível)
 */
function detectQuotaNumberFlexible(text: string): { grupo?: string; cota?: string; versao?: string } | null {
  // Normalizar: remover caracteres especiais que podem atrapalhar
  const normalized = text.replace(/[^\d\s-]/g, ' ').replace(/\s+/g, ' ').trim()

  // Padrões muito flexíveis
  const patterns = [
    /(\d{6})[\s-]+(\d{4})[\s-]*(\d{2})?/, // 000707 0256 02 ou 000707-0256-02
    /(\d{6})(\d{4})(\d{2})/, // 000707025602
    /grupo[\s:]*(\d{6})[^\d]*(\d{4})/i, // grupo: 000707 cota: 0256
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
 * Extrair informações de cota de forma muito agressiva
 */
function extractQuotaAggressive(blockText: string, quotaInfo: { grupo: string; cota: string; versao: string }): ParsedQuota {
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

  // Extrair todos os valores monetários do bloco
  const allNumbers = extractAllNumbers(blockText)

  // Valores esperados para consórcio brasileiro
  // Crédito: geralmente entre 50.000 e 10.000.000
  // Parcela: geralmente entre 500 e 50.000

  // Identificar valor do bem (geralmente o maior valor acima de 50.000)
  const creditCandidates = allNumbers.filter(n => n.value >= 50000 && n.value <= 50000000)
  if (creditCandidates.length > 0) {
    quota.vlBem = creditCandidates[0].value
  }

  // Identificar parcela (geralmente entre 500 e 200.000)
  const parcelaCandidates = allNumbers.filter(n => n.value >= 500 && n.value <= 200000)
  if (parcelaCandidates.length > 0) {
    // Se encontrou crédito, usar parcela que não seja o crédito
    if (quota.vlBem > 0) {
      const parcela = parcelaCandidates.find(n => Math.abs(n.value - quota.vlBem) > 1000)
      if (parcela) {
        quota.vlParcela = parcela.value
      } else if (parcelaCandidates.length > 0) {
        quota.vlParcela = parcelaCandidates[0].value
      }
    } else {
      quota.vlParcela = parcelaCandidates[0].value
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

  // Parcelas (X/Y ou X de Y)
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
 * Processar texto de forma muito agressiva (encontra cotas mesmo em formatos difíceis)
 */
function processTextAggressive(text: string): ParsedQuota[] {
  const quotas: ParsedQuota[] = []
  
  // Normalizar texto
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\S\n]+/g, ' ')
  
  // Dividir em seções (procurar por padrões de cota em todo o texto)
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 2)

  // Procurar todos os possíveis números de cota no texto
  const quotaMatches: Array<{ info: { grupo: string; cota: string; versao: string }; lineIndex: number }> = []

  lines.forEach((line, index) => {
    // Verificar linha atual e próximas 3 linhas
    const context = lines.slice(index, Math.min(index + 4, lines.length)).join(' ')
    const quotaInfo = detectQuotaNumberFlexible(context)
    if (quotaInfo && quotaInfo.grupo && quotaInfo.cota) {
      quotaMatches.push({ 
        info: {
          grupo: quotaInfo.grupo,
          cota: quotaInfo.cota,
          versao: quotaInfo.versao || '00',
        }, 
        lineIndex: index 
      })
    }
  })

  // Processar cada cota encontrada
  quotaMatches.forEach((match, matchIndex) => {
    const startLine = match.lineIndex
    const endLine = matchIndex < quotaMatches.length - 1 
      ? quotaMatches[matchIndex + 1].lineIndex 
      : Math.min(startLine + 30, lines.length)
    
    const blockText = lines.slice(startLine, endLine).join('\n')
    const quota = extractQuotaAggressive(blockText, match.info)
    
    // Validar que a cota tem dados mínimos
    if (quota.vlBem > 0 || quota.vlParcela > 0 || quota.percentPago > 0) {
      quotas.push(quota)
    }
  })

  // Se não encontrou cotas, tentar abordagem alternativa: procurar por padrões de valores
  if (quotas.length === 0) {
    console.log('⚠️ Nenhuma cota encontrada por padrões, tentando abordagem alternativa...')
    
    // Procurar por sequências de valores que podem ser cotas
    const allNumbers = extractAllNumbers(normalizedText)
    const creditValues = allNumbers.filter(n => n.value >= 50000 && n.value <= 50000000)
    const parcelaValues = allNumbers.filter(n => n.value >= 500 && n.value <= 200000)

    // Se encontrou valores consistentes, criar cotas fictícias baseadas neles
    if (creditValues.length > 0 || parcelaValues.length > 0) {
      const avgCredit = creditValues.length > 0 
        ? creditValues.reduce((sum, n) => sum + n.value, 0) / creditValues.length 
        : 0
      const avgParcela = parcelaValues.length > 0
        ? parcelaValues.reduce((sum, n) => sum + n.value, 0) / parcelaValues.length
        : 0

      // Tentar encontrar números de cota próximos aos valores
      creditValues.slice(0, 10).forEach((numInfo, idx) => {
        const nearbyLines = lines.slice(Math.max(0, numInfo.index - 5), Math.min(lines.length, numInfo.index + 5))
        const nearbyText = nearbyLines.join('\n')
        const quotaInfo = detectQuotaNumberFlexible(nearbyText)
        
        if (quotaInfo && quotaInfo.grupo && quotaInfo.cota) {
          const quota: ParsedQuota = {
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
            vlBem: numInfo.value,
            vlParcela: avgParcela > 0 ? avgParcela : 0,
            vlQuitacao: 0,
            vlReceber: 0,
          }
          quotas.push(quota)
        }
      })

      // Se ainda não encontrou, criar cotas baseadas nos valores médios (último recurso)
      if (quotas.length === 0 && avgCredit > 0) {
        console.log('⚠️ Criando cotas baseadas em valores médios (último recurso)')
        // Este é um fallback: criar uma cota genérica
        const quota: ParsedQuota = {
          grupo: '000000',
          cota: '0001',
          versao: '00',
          dataVenda: new Date().toLocaleDateString('pt-BR'),
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
          vlBem: avgCredit,
          vlParcela: avgParcela,
          vlQuitacao: 0,
          vlReceber: 0,
          errors: ['Cota criada automaticamente - verifique dados extraídos'],
        }
        quotas.push(quota)
      }
    }
  }

  return quotas
}

/**
 * Parse PDF de forma muito robusta (último recurso)
 */
export async function parsePDFRobust(buffer: Buffer): Promise<ParseResult> {
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

    console.log('🔄 Parser Robusto: Iniciando extração agressiva...')

    // Extrair texto
    let extractedText = ''
    try {
      const pdfData = await pdfParse(buffer, {
        max: 0, // Sem limite de páginas
      })
      extractedText = pdfData.text || ''

      console.log(`📝 Parser Robusto: Texto extraído: ${extractedText.length} caracteres`)

      if (extractedText.trim().length < 50) {
        result.errors.push('PDF não contém texto suficiente. O PDF pode estar escaneado ou protegido.')
        return result
      }
    } catch (pdfError: any) {
      const errorMsg = pdfError instanceof Error ? pdfError.message : String(pdfError)
      console.error('❌ Parser Robusto: Erro ao extrair texto:', errorMsg)
      result.errors.push(`Erro ao extrair texto do PDF: ${errorMsg}`)
      return result
    }

    // Processar texto de forma agressiva
    let quotas = processTextAggressive(extractedText)

    // Normalizar valores
    quotas = normalizeQuotaValues(quotas)

    // Validar cotas
    const validQuotas = quotas.filter(q => {
      const hasNumbers = q.grupo && q.cota
      const hasValues = q.vlBem > 0 || q.vlParcela > 0 || q.percentPago > 0
      return hasNumbers && hasValues
    })

    result.quotas = validQuotas

    if (validQuotas.length === 0) {
      result.errors.push('Nenhuma cota válida encontrada no PDF mesmo com extração agressiva. Verifique o formato do arquivo.')
    } else {
      console.log(`✅ Parser Robusto: Encontradas ${validQuotas.length} cotas`)
      if (validQuotas.length > 0) {
        const sample = validQuotas[0]
        console.log(`📊 Parser Robusto: Exemplo - Cota ${sample.grupo}-${sample.cota}, vlBem: ${sample.vlBem}, vlParcela: ${sample.vlParcela}`)
      }
    }

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error || 'Erro desconhecido')
    result.errors.push(`Erro ao processar PDF: ${errorMessage}`)
    console.error('❌ Parser Robusto: Erro fatal:', error)
  }

  return result
}

/**
 * Normalizar valores de cotas
 */
function normalizeQuotaValues(quotas: ParsedQuota[]): ParsedQuota[] {
  if (quotas.length === 0) return quotas

  // Calcular moda dos valores
  const bemValues = quotas.filter(q => q.vlBem > 0).map(q => q.vlBem)
  const parcelaValues = quotas.filter(q => q.vlParcela > 0).map(q => q.vlParcela)

  // Contar frequências
  const bemFreq = new Map<number, number>()
  bemValues.forEach(v => bemFreq.set(v, (bemFreq.get(v) || 0) + 1))
  const mostCommonBem = Array.from(bemFreq.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  const parcelaFreq = new Map<number, number>()
  parcelaValues.forEach(v => parcelaFreq.set(v, (parcelaFreq.get(v) || 0) + 1))
  const mostCommonParcela = Array.from(parcelaFreq.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  // Aplicar valores comuns onde faltar
  return quotas.map(q => ({
    ...q,
    vlBem: q.vlBem || mostCommonBem || 0,
    vlParcela: q.vlParcela || mostCommonParcela || 0,
  }))
}
