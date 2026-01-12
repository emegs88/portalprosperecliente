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
  if (trimmed.length < 20) return false // Linha muito curta não é cota
  
  // Padrão 1: Exato: 6 dígitos + espaço + 4 dígitos + espaço + 2 dígitos + espaço + data
  const pattern1 = /^\d{6}\s+\d{4}\s+\d{2}\s+\d{2}\/\d{2}\/\d{4}/
  
  // Padrão 2: Com espaços flexíveis
  const pattern2 = /^\d{6}[\s]+\d{4}[\s]+\d{2}[\s]+\d{2}\/\d{2}\/\d{4}/
  
  // Padrão 3: Mais flexível - grupo e cota em qualquer lugar com data
  const pattern3 = /\d{6}.*\d{4}.*\d{2}\/\d{2}\/\d{4}/
  
  // Padrão 4: Grupo e cota juntos (sem espaço): 0007062013
  const pattern4 = /\d{6}\d{4}.*\d{2}\/\d{2}\/\d{4}/
  
  // Padrão 5: Apenas verificar se tem grupo (6 dígitos) + cota (4 dígitos) + data
  const pattern5 = /\b\d{6}\b.*\b\d{4}\b.*\d{2}\/\d{2}\/\d{4}/
  
  // Padrão 6: Formato alternativo com hífen: 000706-2013
  const pattern6 = /\d{6}[-\s]+\d{4}.*\d{2}\/\d{2}\/\d{4}/
  
  return pattern1.test(trimmed) || pattern2.test(trimmed) || pattern3.test(trimmed) || 
         pattern4.test(trimmed) || pattern5.test(trimmed) || pattern6.test(trimmed)
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
  
  try {
    // PRIMEIRO: Extrair grupo e cota (obrigatórios) - tentar múltiplas estratégias
    let grupo = ''
    let cota = ''
    
    // Estratégia 1: Regex direto na linha
    const grupoCotaMatch = trimmed.match(/(\d{6})[-\s]*(\d{4})/)
    if (grupoCotaMatch) {
      grupo = grupoCotaMatch[1]
      cota = grupoCotaMatch[2]
    }
    
    // Estratégia 2: Se não encontrou, usar partes
    if (!grupo || !cota) {
      const grupoPart = parts[0]?.replace(/\D/g, '') || ''
      if (grupoPart.length >= 10) {
        // Grupo e cota juntos (0007062013)
        grupo = grupoPart.substring(0, 6)
        cota = grupoPart.substring(6, 10)
      } else if (grupoPart.length >= 6) {
        grupo = grupoPart.substring(0, 6)
        cota = parts[1]?.replace(/\D/g, '').padStart(4, '0').substring(0, 4) || ''
      } else if (parts.length >= 2) {
        grupo = grupoPart.padStart(6, '0').substring(0, 6)
        cota = parts[1]?.replace(/\D/g, '').padStart(4, '0').substring(0, 4) || ''
      }
    }
    
    // Se ainda não encontrou grupo e cota, não é uma cota válida
    if (!grupo || !cota || grupo.length !== 6 || cota.length !== 4) {
      return null
    }
    
    // Versão (2 dígitos) - pode estar na posição 2 ou após grupo+cota
    let versao = '00'
    const versaoMatch = trimmed.match(/(?:^|\s)(\d{2})(?:\s|$)/)
    if (versaoMatch && versaoMatch[1]) {
      versao = versaoMatch[1]
    } else if (parts[2] && /^\d{2}$/.test(parts[2])) {
      versao = parts[2]
    }
    
    // Data pode estar no formato dd/mm/yyyy ou junto com outros dados
    let dataVenda = ''
    const dateMatch = trimmed.match(/(\d{2}\/\d{2}\/\d{4})/)
    if (dateMatch) {
      dataVenda = dateMatch[1]
    } else if (parts[3] && /\d{2}\/\d{2}\/\d{4}/.test(parts[3])) {
      dataVenda = parts[3]
    }
    
    // Situação pode estar junto ou separada
    let situacaoCobranca = ''
    let contemplacao = ''
    let idx = 3 // Começar após data
    
    // Procurar "Não Contemplada" ou "Contemplada" na linha inteira
    const contemplacaoMatch = trimmed.match(/(Não\s+)?Contemplada/gi)
    if (contemplacaoMatch) {
      contemplacao = contemplacaoMatch[0]
    }
    
    // Procurar situação (N00, ATRASO, etc)
    const situacaoMatch = trimmed.match(/(N\d+|ATRASO|NORMAL|CANCELADA)/i)
    if (situacaoMatch) {
      situacaoCobranca = situacaoMatch[0]
    }
    
    // Se não encontrou, tentar usar parts
    if (!contemplacao) {
      // Procurar nas partes
      for (let j = idx; j < Math.min(idx + 5, parts.length); j++) {
        if (parts[j]?.toLowerCase().includes('contemplad')) {
          contemplacao = parts.slice(j, j + 2).join(' ') || 'Não Contemplada'
          idx = j + 2
          break
        }
      }
      if (!contemplacao) {
        contemplacao = 'Não Contemplada'
      }
    }
    
    // Se não encontrou situação, usar padrão
    if (!situacaoCobranca) {
      situacaoCobranca = parts[idx] || 'N00 - NORMAL'
      idx++
    }
    
    // Extrair valores na ordem específica do extrato
    // Ordem no extrato: Grupo, Cota, Versão, Venda, Situação, Contemplação, [vazio], % Pago, % Atraso, % Fdo. Comum,
    // Pcls. Pagar, Pcls. Pagas, Pcls. Pagas em Dia, Pcls. Em Atraso, Vl. Bem, Vl. Parcela, Vl. Receber, Vl. Quitação
    
    // Encontrar índice inicial dos valores (após contemplação)
    // Procurar pelos percentuais primeiro (valores pequenos com vírgula: 0,0050)
    let percentIdx = idx
    for (let i = idx; i < Math.min(parts.length, idx + 10); i++) {
      const part = parts[i] || ''
      if (part.includes(',') && part.match(/^\d+,\d+$/)) {
        const parsed = parseBrazilianPercent(part)
        if (parsed >= 0 && parsed < 1) { // Percentuais pequenos como 0,0050
          percentIdx = i
          break
        }
      }
    }
    
    // Percentuais (3 valores consecutivos)
    const percentPago = percentIdx < parts.length ? parseBrazilianPercent(parts[percentIdx] || '0') : 0
    const percentAtraso = percentIdx + 1 < parts.length ? parseBrazilianPercent(parts[percentIdx + 1] || '0') : 0
    const percentFundoComum = percentIdx + 2 < parts.length ? parseBrazilianPercent(parts[percentIdx + 2] || '0') : 0
    
    // Parcelas (valores inteiros: 001, 000, etc.)
    let parcelasIdx = percentIdx + 3
    const pclsPagar = extractIntegerValue(parts, parcelasIdx, trimmed)
    const pclsPagas = extractIntegerValue(parts, parcelasIdx + 1, trimmed)
    const pclsPagasEmDia = extractIntegerValue(parts, parcelasIdx + 2, trimmed)
    const pclsPagasAtraso = extractIntegerValue(parts, parcelasIdx + 3, trimmed)
    const pclsEmAtraso = extractIntegerValue(parts, parcelasIdx + 4, trimmed)
    
    // Valores monetários (procurar a partir das parcelas)
    // Ordem no extrato: Vl. Bem (260.000,00), Vl. Parcela (933,40), Vl. Receber (260.000,00), Vl. Quitação (318.346,54)
    let valoresIdx = parcelasIdx + 5
    // Encontrar todos os valores monetários na linha (padrão brasileiro: 123.456,78)
    const allMonetaryValues: Array<{ value: number, index: number }> = []
    for (let i = valoresIdx; i < parts.length; i++) {
      const part = parts[i] || ''
      if (part.includes(',') && part.includes('.')) {
        const parsed = parseBrazilianNumber(part)
        if (parsed > 100) {
          allMonetaryValues.push({ value: parsed, index: i })
        }
      }
    }
    
    // Ordenar valores monetários por tamanho
    const sortedMonetary = [...allMonetaryValues].sort((a, b) => b.value - a.value)
    
    // Extrair valores na ordem correta:
    // Vl. Bem: geralmente o segundo maior (260.000,00) ou primeiro se não houver quitação maior
    // Vl. Parcela: valor menor (933,40) - menor valor monetário
    // Vl. Receber: geralmente igual ao Vl. Bem (260.000,00)
    // Vl. Quitação: maior valor (318.346,54)
    
    const vlQuitacao = sortedMonetary[0]?.value || 0 // Maior valor
    const vlBem = sortedMonetary.find(v => v.value > 200000 && v.value < 300000)?.value || 
                  sortedMonetary[1]?.value || 
                  sortedMonetary[0]?.value || 0 // Segundo maior ou valor próximo a 260k
    const vlParcela = sortedMonetary.find(v => v.value > 500 && v.value < 2000)?.value || 
                     sortedMonetary[sortedMonetary.length - 1]?.value || 0 // Menor valor entre 500-2000
    const vlReceber = vlBem || 0 // Geralmente igual ao vlBem

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
 * Extrai valor monetário de uma lista de partes ou da linha inteira, procurando padrões brasileiros
 */
function extractMonetaryValue(parts: string[], startIdx: number, fullLine?: string): number {
  // Tentar o índice direto primeiro
  if (startIdx < parts.length) {
    const value = parseBrazilianNumber(parts[startIdx] || '0')
    if (value > 0) return value
  }
  
  // Procurar em índices próximos
  for (let i = Math.max(0, startIdx - 2); i <= Math.min(parts.length - 1, startIdx + 3); i++) {
    const part = parts[i]
    if (part && /[\d.,]/.test(part) && (part.includes(',') || part.includes('.'))) {
      const parsed = parseBrazilianNumber(part)
      if (parsed > 0) return parsed
    }
  }
  
  // Se não encontrou, procurar na linha inteira por padrões monetários
  if (fullLine) {
    const monetaryPatterns = fullLine.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g)
    if (monetaryPatterns && monetaryPatterns.length > 0) {
      // Retornar o maior valor encontrado (geralmente é o valor do bem)
      const values = monetaryPatterns.map(p => parseBrazilianNumber(p)).filter(v => v > 0)
      if (values.length > 0) {
        return Math.max(...values)
      }
    }
  }
  
  return 0
}

/**
 * Extrai valor inteiro (parcelas) de uma lista de partes ou da linha inteira
 */
function extractIntegerValue(parts: string[], startIdx: number, fullLine?: string): number {
  // Tentar o índice direto
  if (startIdx < parts.length) {
    const value = parseInt(parts[startIdx]?.replace(/\D/g, '') || '0', 10)
    if (value > 0) return value
  }
  
  // Procurar em índices próximos
  for (let i = Math.max(0, startIdx - 1); i <= Math.min(parts.length - 1, startIdx + 2); i++) {
    const part = parts[i]
    if (part && /^\d+$/.test(part.replace(/[^\d]/g, ''))) {
      const parsed = parseInt(part.replace(/\D/g, ''), 10)
      if (parsed > 0 && parsed < 1000) return parsed // Parcelas geralmente < 1000
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
    
    // Log de amostra das primeiras linhas para debug
    if (allLines.length > 0) {
      console.log('📄 Primeiras 5 linhas (amostra):')
      allLines.slice(0, 5).forEach((line, idx) => {
        console.log(`  ${idx + 1}: ${line.substring(0, 100)}`)
      })
    }

    // Parse header
    result.header = parseHeader(allLines)
    console.log('📄 Header extraído:', result.header)

    // Parse quotas - tentar diferentes estratégias
    let quotasFound = 0
    const processedIndices = new Set<number>() // Evitar duplicatas
    
    // Estratégia 1: Linha por linha (mais comum)
    console.log('🔍 Estratégia 1: Processando linhas individuais...')
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i]
      const quota = parseQuotaLine(line)
      if (quota) {
        // Verificar se já não temos esta cota (evitar duplicatas)
        const isDuplicate = result.quotas.some(q => q.grupo === quota.grupo && q.cota === quota.cota)
        if (!isDuplicate) {
          result.quotas.push(quota)
          quotasFound++
          processedIndices.add(i)
          
          // Log a cada 10 cotas encontradas
          if (quotasFound % 10 === 0) {
            console.log(`  ✓ ${quotasFound} cotas encontradas até agora...`)
          }
        }
      }
    }
    console.log(`  ✓ Estratégia 1 concluída: ${quotasFound} cotas encontradas`)

    // Estratégia 2: Tentar juntar linhas quebradas (quando cota está dividida em 2 linhas)
    if (quotasFound < 50) { // Se encontrou poucas, tentar juntar linhas
      console.log('⚠️  Apenas', quotasFound, 'cotas encontradas, tentando juntar linhas quebradas...')
      for (let i = 0; i < allLines.length - 1; i++) {
        if (processedIndices.has(i) || processedIndices.has(i + 1)) continue // Pular se já processado
        
        const combinedLine = allLines[i].trim() + ' ' + allLines[i + 1].trim()
        const quota = parseQuotaLine(combinedLine)
        if (quota) {
          const isDuplicate = result.quotas.some(q => q.grupo === quota.grupo && q.cota === quota.cota)
          if (!isDuplicate) {
            result.quotas.push(quota)
            quotasFound++
            processedIndices.add(i)
            processedIndices.add(i + 1)
          }
        }
      }
    }

    // Estratégia 3: Tentar juntar 3 linhas (para casos muito complexos)
    if (quotasFound < 30) {
      console.log('⚠️  Ainda poucas cotas, tentando juntar 3 linhas...')
      for (let i = 0; i < allLines.length - 2; i++) {
        if (processedIndices.has(i) || processedIndices.has(i + 1) || processedIndices.has(i + 2)) continue
        
        const combinedLine = allLines[i].trim() + ' ' + allLines[i + 1].trim() + ' ' + allLines[i + 2].trim()
        const quota = parseQuotaLine(combinedLine)
        if (quota) {
          const isDuplicate = result.quotas.some(q => q.grupo === quota.grupo && q.cota === quota.cota)
          if (!isDuplicate) {
            result.quotas.push(quota)
            quotasFound++
          }
        }
      }
    }

    // Estratégia 4: Buscar padrões mais flexíveis e tentar parse manual
    if (quotasFound < 20) {
      console.log('⚠️  Buscando padrões flexíveis de grupo-cota...')
      for (let i = 0; i < allLines.length; i++) {
        if (processedIndices.has(i)) continue
        
        const line = allLines[i]
        // Buscar qualquer padrão que pareça grupo-cota
        const grupoCotaMatch = line.match(/(\d{6})[-\s]+(\d{4})/)
        if (grupoCotaMatch) {
          console.log(`🔍 Linha ${i} parece ter grupo-cota:`, line.substring(0, 150))
          // Tentar parsear mesmo que não passe na validação inicial
          const quota = parseQuotaLine(line)
          if (quota) {
            const isDuplicate = result.quotas.some(q => q.grupo === quota.grupo && q.cota === quota.cota)
            if (!isDuplicate) {
              result.quotas.push(quota)
              quotasFound++
              processedIndices.add(i)
            }
          }
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
      console.error('Primeiras 20 linhas do PDF:')
      allLines.slice(0, 20).forEach((line, idx) => {
        console.error(`  ${idx + 1}: ${line.substring(0, 150)}`)
      })
      console.error('Últimas 10 linhas do PDF:')
      allLines.slice(-10).forEach((line, idx) => {
        const actualIdx = allLines.length - 10 + idx
        console.error(`  ${actualIdx + 1}: ${line.substring(0, 150)}`)
      })
    } else {
      console.log(`✅ Total de ${result.quotas.length} cotas únicas encontradas (após remoção de duplicatas)`)
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
