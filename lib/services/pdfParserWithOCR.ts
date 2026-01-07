import pdfParse from 'pdf-parse'
import { createWorker } from 'tesseract.js'
import { parseBrazilianNumber, parseBrazilianPercent } from '@/lib/utils'
import { ParsedQuota, ParsedHeader, ParsedTotals, ParsedResult } from './pdfParser'

/**
 * Converte PDF para imagem e extrai texto com OCR
 * NOTA: Esta função requer bibliotecas que podem não funcionar em todos os ambientes
 * Por enquanto, retorna o texto extraído normalmente e sugere melhoria no parser
 */
async function extractTextWithOCR(pdfBuffer: Buffer): Promise<string> {
  console.log('🔍 OCR não disponível neste ambiente. Melhorando extração de texto...')
  
  // Por enquanto, melhorar a extração de texto normal
  // Para OCR completo, use uma API externa como Google Cloud Vision ou AWS Textract
  
  try {
    const data = await pdfParse(pdfBuffer, {
      // Opções melhoradas para extrair mais texto
      max: 0, // Sem limite de páginas
      version: 'v1.10.100',
    })
    
    return data.text
  } catch (error) {
    console.error('❌ Erro ao extrair texto:', error)
    throw new Error('Não foi possível extrair texto do PDF. O PDF pode estar escaneado e requer OCR externo.')
  }
}

/**
 * Valida se uma linha parece ser uma linha de cota válida
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

    // Detectar tipo de bem (IMOVEL ou OUTROS)
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
      tipoBem,
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
  
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i].toUpperCase()
    
    if (line.includes('ADMINISTRADORA') && !header.administradora) {
      header.administradora = lines[i].trim()
    }
    
    if ((line.includes('PROSPERE') || line.includes('EMPRESA')) && !header.empresa) {
      header.empresa = lines[i].trim()
    }
    
    if (line.includes('CLIENTE:') && !header.clienteNome) {
      const clienteMatch = lines[i].match(/CLIENTE:\s*(.+)/i)
      if (clienteMatch) {
        header.clienteNome = clienteMatch[1].trim()
      }
    }
    
    if (line.includes('CPF/CNPJ') || line.includes('CPF') || line.includes('CNPJ')) {
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
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 30); i--) {
    const line = lines[i].toUpperCase()
    
    if (line.includes('TOTAL') || line.includes('TOTAIS')) {
      // Procurar linha de totais (pode estar na mesma linha ou próxima)
      const totalLines = [lines[i], lines[i + 1], lines[i - 1]].filter(Boolean)
      
      for (const totalLine of totalLines) {
        const parts = totalLine.trim().split(/\s+/).filter(p => p.length > 0)
        
        // Verificar se tem números que parecem totais (valores grandes)
        if (parts.length >= 5) {
          try {
            // Procurar padrão: número + valores monetários
            const values = parts.filter(p => /[\d.,]/.test(p) && p.includes(','))
            
            if (values.length >= 4) {
              return {
                totalCotas: parseInt(parts[0]?.replace(/\D/g, '') || '0', 10),
                totalVlBem: parseBrazilianNumber(parts.find(p => p.includes('.')) || '0'),
                totalVlParcela: parseBrazilianNumber(parts[values.length >= 2 ? 1 : 0] || '0'),
                totalVlQuitacao: parseBrazilianNumber(parts[values.length >= 3 ? 2 : 0] || '0'),
                totalVlReceber: parseBrazilianNumber(parts[values.length >= 4 ? 3 : 0] || '0'),
              }
            }
          } catch (error) {
            continue
          }
        }
      }
    }
  }
  
  return null
}

/**
 * Função principal: parse PDF com fallback para OCR
 */
export async function parsePDF(buffer: Buffer, useOCR: boolean = false): Promise<ParsedResult> {
  const result: ParsedResult = {
    header: {},
    quotas: [],
    totals: null,
    errors: []
  }

  try {
    let text = ''

    // Primeiro tenta extrair texto normal
    if (!useOCR) {
      try {
        console.log('📄 Tentando extrair texto normal do PDF...')
        const data = await pdfParse(buffer)
        text = data.text

        // Se não encontrou texto suficiente, tenta OCR
        if (text.trim().length < 100) {
          console.log('⚠️  Pouco texto extraído, tentando OCR...')
          text = await extractTextWithOCR(buffer)
        } else {
          console.log(`✅ Texto extraído: ${text.length} caracteres`)
        }
      } catch (error) {
        console.log('⚠️  Erro ao extrair texto normal, tentando OCR...')
        text = await extractTextWithOCR(buffer)
      }
    } else {
      // Usar OCR diretamente
      text = await extractTextWithOCR(buffer)
    }

    const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

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
      result.errors.push('Nenhuma cota válida encontrada no PDF. Tente usar OCR.')
    } else {
      console.log(`✅ ${result.quotas.length} cotas extraídas com sucesso!`)
    }

  } catch (error) {
    result.errors.push(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    console.error('❌ Erro ao processar PDF:', error)
  }

  return result
}
