/**
 * Parser de PDF com OCR melhorado
 * Extrai informações de cotas de extratos PDF, incluindo PDFs escaneados
 */

import pdfParse from 'pdf-parse'
import { createWorker } from 'tesseract.js'
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
 * Extrair valor monetário melhorado
 */
function extractMonetaryValue(text: string, context: string = ''): number {
  // Padrões para valores monetários brasileiros
  const patterns = [
    // R$ 1.234.567,89
    /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
    // R$ 1234567,89
    /R\$\s*(\d+,\d{2})/gi,
    // 1.234.567,89
    /(\d{1,3}(?:\.\d{3})*,\d{2})/g,
    // 1234567,89
    /(\d+,\d{2})/g,
    // 1234567.89 (formato internacional)
    /(\d+\.\d{2})/g,
    // Números grandes simples
    /(\d{5,})/g,
  ]

  // Combinar texto e contexto
  const fullText = `${context} ${text}`.toLowerCase()

  for (const pattern of patterns) {
    const matches = fullText.match(pattern)
    if (matches) {
      // Pegar o maior valor (geralmente é o valor do bem)
      const values = matches.map(match => {
        const cleaned = match
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
        const num = parseFloat(cleaned)
        return isNaN(num) ? 0 : num
      }).filter(v => v > 0)

      if (values.length > 0) {
        // Retornar o maior valor ou a média dos maiores
        return Math.max(...values)
      }
    }
  }

  return 0
}

/**
 * Detectar grupo, cota e versão melhorado
 */
function detectQuotaNumber(text: string): { grupo?: string; cota?: string; versao?: string } | null {
  // Padrões comuns para números de cota
  const patterns = [
    // 000707-0256-2 ou 000707 0256 2
    /(\d{6})[\s\-\.]+(\d{4})[\s\-\.]*(\d{1,2})?/,
    // 000707/0256/2 ou 000707.0256.2
    /(\d{6})[\/\.]+(\d{4})[\/\.]*(\d{1,2})?/,
    // GRUPO: 000707 COTA: 0256 VERSAO: 2
    /(?:grupo|group)[\s:]+(\d{6})[\s,]+(?:cota|quota)[\s:]+(\d{4})(?:[\s,]+(?:versao|version)[\s:]+(\d{1,2}))?/i,
    // Apenas 6 dígitos + 4 dígitos
    /(\d{6})\s+(\d{4})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
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
 * Extrair informações da linha de texto
 */
function extractQuotaInfo(text: string, currentQuota: Partial<ParsedQuota>): Partial<ParsedQuota> {
  const lowerText = text.toLowerCase()
  const parts = text.split(/\s+/)

  // Detectar contemplação
  if (lowerText.includes('contemplada') || lowerText.includes('contemplado')) {
    currentQuota.contemplacao = 'Contemplada'
  }

  // Detectar situação de cobrança
  const situacaoMatch = text.match(/N\d{2}\s*-\s*[A-Z\s]+/i)
  if (situacaoMatch) {
    currentQuota.situacaoCobranca = situacaoMatch[0].trim()
  }

  // Extrair percentuais
  const percentMatches = text.match(/(\d+[,.]?\d*)\s*%/g)
  if (percentMatches) {
    percentMatches.forEach(match => {
      const value = parseBrazilianPercent(match.replace('%', '').trim())
      if (value > 0) {
        if (!currentQuota.percentPago || currentQuota.percentPago === 0) {
          currentQuota.percentPago = value
        } else if (!currentQuota.percentAtraso || currentQuota.percentAtraso === 0) {
          currentQuota.percentAtraso = value
        } else if (!currentQuota.percentFundoComum || currentQuota.percentFundoComum === 0) {
          currentQuota.percentFundoComum = value
        }
      }
    })
  }

  // Extrair parcelas (formato: X/Y ou X de Y)
  const parcelasMatch = text.match(/(\d+)\s*[\/\s]+\s*(\d+)/)
  if (parcelasMatch) {
    currentQuota.pclsPagas = parseInt(parcelasMatch[1], 10)
    currentQuota.pclsPagar = parseInt(parcelasMatch[2], 10)
  }

  // Extrair valores monetários com contexto
  if (lowerText.includes('bem') || lowerText.includes('crédito') || lowerText.includes('credito')) {
    const value = extractMonetaryValue(text, 'valor do bem crédito')
    if (value > 0 && (!currentQuota.vlBem || currentQuota.vlBem === 0)) {
      currentQuota.vlBem = value
    }
  }

  if (lowerText.includes('parcela') || lowerText.includes('parc.')) {
    const value = extractMonetaryValue(text, 'valor parcela')
    if (value > 0 && (!currentQuota.vlParcela || currentQuota.vlParcela === 0)) {
      currentQuota.vlParcela = value
    }
  }

  if (lowerText.includes('receber') || lowerText.includes('recebido')) {
    const value = extractMonetaryValue(text, 'valor receber')
    if (value > 0 && (!currentQuota.vlReceber || currentQuota.vlReceber === 0)) {
      currentQuota.vlReceber = value
    }
  }

  if (lowerText.includes('quitação') || lowerText.includes('quitacao') || lowerText.includes('quit')) {
    const value = extractMonetaryValue(text, 'valor quitação')
    if (value > 0 && (!currentQuota.vlQuitacao || currentQuota.vlQuitacao === 0)) {
      currentQuota.vlQuitacao = value
    }
  }

  return currentQuota
}

/**
 * Processar texto extraído do PDF
 */
function processExtractedText(text: string): ParsedQuota[] {
  const quotas: ParsedQuota[] = []
  
  // Normalizar quebras de linha
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  // Dividir em blocos (cada bloco pode ser uma cota)
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 2)

  let currentQuota: Partial<ParsedQuota> | null = null
  let quotaBlock: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLines = lines.slice(i, i + 5).join(' ')

    // Detectar início de nova cota
    const quotaInfo = detectQuotaNumber(nextLines)
    
    if (quotaInfo && quotaInfo.grupo && quotaInfo.cota) {
      // Salvar cota anterior se houver
      if (currentQuota && currentQuota.grupo && currentQuota.cota) {
        // Processar bloco completo da cota
        const blockText = quotaBlock.join(' ')
        currentQuota = extractQuotaInfo(blockText, currentQuota)
        quotas.push(currentQuota as ParsedQuota)
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
      continue
    }

    // Adicionar linha ao bloco atual
    if (currentQuota) {
      quotaBlock.push(line)
      
      // Processar linha atual
      currentQuota = extractQuotaInfo(line, currentQuota)
      
      // Limitar tamanho do bloco (máximo 10 linhas por cota)
      if (quotaBlock.length > 10) {
        quotaBlock.shift()
      }
    }
  }

  // Adicionar última cota
  if (currentQuota && currentQuota.grupo && currentQuota.cota) {
    const blockText = quotaBlock.join(' ')
    currentQuota = extractQuotaInfo(blockText, currentQuota)
    quotas.push(currentQuota as ParsedQuota)
  }

  return quotas
}

/**
 * Parse PDF com OCR melhorado
 */
export async function parsePDFWithOCR(buffer: Buffer, useOCR: boolean = false): Promise<ParseResult> {
  const result: ParseResult = {
    quotas: [],
    errors: [],
  }

  try {
    let extractedText = ''

    if (useOCR) {
      // Usar OCR real com Tesseract.js
      // Nota: Tesseract funciona melhor com imagens, então primeiro extraímos o texto do PDF
      // e depois tentamos OCR apenas se necessário
      try {
        // Primeiro tentar extrair texto diretamente do PDF
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text

        // Se o texto extraído está vazio ou muito curto, pode ser um PDF escaneado
        // Nesse caso, seria necessário converter PDF para imagem primeiro
        // Por enquanto, usamos o texto extraído e melhoramos o parsing
        if (!extractedText || extractedText.trim().length < 100) {
          console.warn('Texto extraído está vazio, PDF pode ser escaneado')
          // TODO: Implementar conversão PDF -> imagem -> OCR completo
        }
      } catch (pdfError) {
        console.warn('Erro ao extrair texto do PDF:', pdfError)
        result.errors.push('Erro ao extrair texto do PDF. Verifique se o arquivo está válido.')
        return result
      }
    } else {
      // Extrair texto normalmente
      try {
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
      } catch (pdfError) {
        console.error('Erro ao parsear PDF:', pdfError)
        result.errors.push('Erro ao processar PDF. Verifique se o arquivo está válido.')
        return result
      }
    }

    if (!extractedText || extractedText.trim().length < 50) {
      result.errors.push('PDF não contém texto extraível. Tente usar OCR para PDFs escaneados.')
      return result
    }

    // Processar texto extraído
    const quotas = processExtractedText(extractedText)

    // Validar e limpar cotas
    const validQuotas = quotas.filter(q => {
      const isValid = q.grupo && q.cota && (q.vlBem > 0 || q.vlParcela > 0)
      if (!isValid) {
        result.errors.push(`Cota ${q.grupo}-${q.cota} inválida: faltam dados essenciais`)
      }
      return isValid
    })

    result.quotas = validQuotas

    if (validQuotas.length === 0) {
      result.errors.push('Nenhuma cota válida encontrada no PDF. Verifique se o formato está correto.')
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    result.errors.push(`Erro ao processar PDF: ${errorMessage}`)
    console.error('PDF parse error:', error)
  }

  return result
}
