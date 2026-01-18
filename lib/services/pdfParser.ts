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
 * Extrai valor monetário de uma linha do PDF
 */
function extractMonetaryValue(parts: string[], index: number, line: string): number {
  if (index < 0 || index >= parts.length) {
    return 0
  }
  const value = parts[index].trim()
  // Tentar extrair valor monetário (formato brasileiro ou número)
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse arquivo PDF de extrato
 */
export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  const result: ParseResult = {
    quotas: [],
    errors: [],
  }

  try {
    const data = await pdfParse(buffer)
    const text = data.text

    // Dividir em linhas
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    let currentQuota: Partial<ParsedQuota> | null = null
    const quotas: ParsedQuota[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Detectar linha de cota (formato: GRUPO-COTA-VERSAO ou similar)
      const quotaMatch = trimmed.match(/(\d{6})[\s-]+(\d{4})[\s-]*(\d{2})?/)
      if (quotaMatch) {
        // Salvar cota anterior se houver
        if (currentQuota && currentQuota.grupo && currentQuota.cota) {
          quotas.push(currentQuota as ParsedQuota)
        }

        // Nova cota
        currentQuota = {
          grupo: quotaMatch[1],
          cota: quotaMatch[2],
          versao: quotaMatch[3] || '00',
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
        continue
      }

      if (!currentQuota) continue

      // Tentar extrair valores monetários
      const parts = trimmed.split(/\s+/)
      
      // Procurar por padrões de valores monetários (R$ ou números)
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j]
        
        // Valor do bem (vlBem)
        if (part.toLowerCase().includes('bem') || 
            (j > 0 && parts[j - 1].toLowerCase().includes('bem'))) {
          currentQuota.vlBem = extractMonetaryValue(parts, j, trimmed)
        }
        
        // Valor da parcela (vlParcela)
        if (part.toLowerCase().includes('parcela') || 
            part.toLowerCase().includes('parc.') ||
            (j > 0 && parts[j - 1].toLowerCase().includes('parcela'))) {
          currentQuota.vlParcela = extractMonetaryValue(parts, j, trimmed)
        }
        
        // Valor a receber (vlReceber)
        if (part.toLowerCase().includes('receber') || 
            (j > 0 && parts[j - 1].toLowerCase().includes('receber'))) {
          currentQuota.vlReceber = extractMonetaryValue(parts, j, trimmed)
        }
        
        // Valor de quitação (vlQuitacao)
        if (part.toLowerCase().includes('quitação') || 
            part.toLowerCase().includes('quitacao') ||
            (j > 0 && parts[j - 1].toLowerCase().includes('quitação'))) {
          currentQuota.vlQuitacao = extractMonetaryValue(parts, j, trimmed)
        }
      }

      // Extrair percentual pago
      const percentMatch = trimmed.match(/(\d+[,.]?\d*)\s*%/)
      if (percentMatch && !currentQuota.percentPago) {
        currentQuota.percentPago = parseBrazilianPercent(percentMatch[1])
      }

      // Extrair parcelas pagas
      const parcelasMatch = trimmed.match(/(\d+)\s*\/\s*(\d+)/)
      if (parcelasMatch) {
        currentQuota.pclsPagas = parseInt(parcelasMatch[1], 10)
        currentQuota.pclsPagar = parseInt(parcelasMatch[2], 10)
      }

      // Detectar contemplação
      if (trimmed.toLowerCase().includes('contemplada') || 
          trimmed.toLowerCase().includes('contemplado')) {
        currentQuota.contemplacao = 'Contemplada'
      }

      // Detectar situação de cobrança
      if (trimmed.match(/N\d{2}\s*-/)) {
        currentQuota.situacaoCobranca = trimmed
      }
    }

    // Adicionar última cota
    if (currentQuota && currentQuota.grupo && currentQuota.cota) {
      quotas.push(currentQuota as ParsedQuota)
    }

    result.quotas = quotas

    if (quotas.length === 0) {
      result.errors.push('Nenhuma cota encontrada no PDF')
    }

  } catch (error) {
    result.errors.push(
      `Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    )
  }

  return result
}
