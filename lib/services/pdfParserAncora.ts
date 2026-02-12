/**
 * Parser de PDF específico para Âncora Administradora de Consórcios S.A.
 *
 * Formato: "Relatório de Cotas do Cliente"
 *
 * O pdf-parse extrai o texto SEM espaços entre colunas. Exemplo real:
 * 000704231500N00 - NORMALNão Contemplada0,06000,000029/08/202599,940000600500100050.000,00192,5062.845,1800050.000,00
 *
 * Ordem dos campos (conforme cabeçalho do PDF):
 * Grupo(6) | Cota(4) | Versão(2) | Situação de Cobrança | Contemplação | Entrega Bem |
 * % Pago | % Atraso | Venda(data) | % Fdo. Comum Pagar |
 * Pcls. Pagas | Pcls. Pagas em Dia | Pcls. Pagas Atraso | Pcls. Em Atraso |
 * Vl. Bem | Vl. Parcela | Vl. Quitação | Dias em Atraso | Vl. Receber
 */

import pdfParse from 'pdf-parse'

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
  diasEmAtraso?: number
  errors?: string[]
}

export interface AncoraParseResult {
  quotas: ParsedQuota[]
  cliente: {
    codigo: string
    nome: string
    cpfCnpj: string
  } | null
  administradora: string
  empresa: string
  totalCotas: number
  totals: {
    vlBem: number
    vlParcela: number
    vlReceber: number
    vlQuitacao: number
  } | null
  errors: string[]
}

/**
 * Parse valor monetário brasileiro: 100.000,00 -> 100000.00
 */
function parseBRMoney(text: string): number {
  if (!text || text.trim() === '') return 0
  const cleaned = text
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse percentual brasileiro: 0,0600 -> 0.06 ou 99,9400 -> 99.94
 */
function parseBRPercent(text: string): number {
  if (!text || text.trim() === '') return 0
  const cleaned = text.replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Detectar se o PDF é do formato Âncora
 */
export function isAncoraFormat(text: string): boolean {
  const indicators = [
    'ANCORA ADMINISTRADORA',
    'Relatório de Cotas do Cliente',
    'Relatório de Cotas',
    '% Fdo. Comum',
    'Vl. Bem',
    'Vl. Parcela',
    'Vl. Quitação',
  ]
  const normalizedText = text.toUpperCase()
  const matchCount = indicators.filter(ind => normalizedText.includes(ind.toUpperCase())).length
  return matchCount >= 2
}

/**
 * Extrair informações do cliente do cabeçalho
 */
function extractClientInfo(text: string): { codigo: string; nome: string; cpfCnpj: string } | null {
  // Pattern: Cliente: 0000452103 - RAFAEL MARCHIORI CABIDELI        CPF/CNPJ: 104.666.137-09
  const clientPattern = /Cliente:\s*(\d+)\s*[-–]\s*([A-ZÀ-Ú\s]+?)\s*CPF\/CNPJ:\s*([\d.\-\/]+)/i
  const match = text.match(clientPattern)
  if (match) {
    return {
      codigo: match[1].trim(),
      nome: match[2].trim(),
      cpfCnpj: match[3].trim(),
    }
  }
  return null
}

/**
 * Extrair informações da empresa/administradora
 */
function extractCompanyInfo(text: string): { administradora: string; empresa: string } {
  let administradora = 'ANCORA ADMINISTRADORA DE CONSORCIOS S.A.'
  let empresa = ''

  const adminMatch = text.match(/\d{4}\s+(ANCORA\s+ADMINISTRADORA[^\n\r]*)/i)
  if (adminMatch) {
    administradora = adminMatch[1].trim()
  }

  const empresaMatch = text.match(/(\d{10})\s*[-–]\s*([A-ZÀ-Ú\s]+(?:LTDA|S\.?A\.?|EIRELI|ME|EPP)?)/i)
  if (empresaMatch) {
    empresa = empresaMatch[2].trim()
  }

  return { administradora, empresa }
}

/**
 * Parse de uma linha de cota do relatório Âncora (formato CONCATENADO sem espaços).
 *
 * Texto real do pdf-parse (sem espaços entre colunas):
 * 000704231500N00 - NORMALNão Contemplada0,06000,000029/08/202599,940000600500100050.000,00192,5062.845,1800050.000,00
 *
 * Campos na ordem:
 * 1. Grupo: 6 dígitos (000704)
 * 2. Cota: 4 dígitos (2315)
 * 3. Versão: 2 dígitos (00)
 * 4. Situação: N00 - NORMAL (até "Contemplada" ou "Não Contemplada")
 * 5. Contemplação: "Contemplada" ou "Não Contemplada"
 * 6. % Pago: decimal com 4 casas (0,0600)
 * 7. % Atraso: decimal com 4 casas (0,0000)
 * 8. Data Venda: dd/mm/yyyy (29/08/2025)
 * 9. % Fdo Comum: decimal com 4 casas (99,9400)
 * 10. Pcls Pagar: 3 dígitos (006) (NOTE: na verdade "Pcls. Pagas" do cabeçalho)
 * 11-13. Demais parcelas: 3 dígitos cada
 * 14. Pcls Em Atraso: 3 dígitos
 * 15. Vl. Bem: valor monetário (50.000,00 ou 100.000,00)
 * 16. Vl. Parcela: valor monetário (192,50 ou 385,00)
 * 17. Vl. Quitação: valor monetário (62.845,18)
 * 18. Dias Atraso: 3 dígitos (000)
 * 19. Vl. Receber: valor monetário (50.000,00)
 */
function parseAncoraLine(line: string): ParsedQuota | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // O regex lida com campos concatenados sem espaços
  // Formato: {grupo6}{cota4}{versao2}{N00 - NORMAL}{Não Contemplada|Contemplada}{%pago}{%atraso}{data}{%fdo}{pcls*5}{vlBem}{vlParcela}{vlQuitacao}{diasAtraso}{vlReceber}
  const pattern = /^(\d{6})(\d{4})(\d{2})(N\d{2}\s*-\s*\w+?)((?:Não\s*)?Contemplada)(\d{1,3},\d{4})(\d{1,3},\d{4})(\d{2}\/\d{2}\/\d{4})(\d{1,3},\d{4})(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})([\d.,]+?),([\d.,]+?),([\d.,]+?)(\d{3})([\d.,]+)$/

  const match = trimmed.match(pattern)
  if (!match) return null

  // Os valores monetários estão colados. Precisamos separá-los.
  // O problema: "50.000,00192,5062.845,1800050.000,00"
  // Precisamos de uma abordagem diferente - extrair os 4 monetários + diasAtraso do final

  return null // Usaremos parseAncoraLineSmart em vez desta
}

/**
 * Parse inteligente de linha Âncora concatenada.
 *
 * Estratégia: usar regex para capturar os campos estruturados do início,
 * depois extrair os valores monetários do final da string.
 */
function parseAncoraLineSmart(line: string): ParsedQuota | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length < 50) return null

  // Parte 1: Extrair grupo(6) + cota(4) + versão(2) do início
  const startMatch = trimmed.match(/^(\d{6})(\d{4})(\d{2})/)
  if (!startMatch) return null

  const grupo = startMatch[1]
  const cota = startMatch[2]
  const versao = startMatch[3]

  // Parte 2: Encontrar situação de cobrança (N00 - NORMAL, N00 - CANCELADO, etc)
  const afterStart = trimmed.substring(12)
  const situacaoMatch = afterStart.match(/^(N\d{2}\s*-\s*\w+?)(?=(?:Não\s*)?Contemplada)/)
  if (!situacaoMatch) return null

  const situacaoCobranca = situacaoMatch[1].trim()
  const afterSituacao = afterStart.substring(situacaoMatch[0].length)

  // Parte 3: Contemplação
  const contemplacaoMatch = afterSituacao.match(/^((?:Não\s*)?Contemplada)/)
  if (!contemplacaoMatch) return null

  const contemplacao = contemplacaoMatch[1]
  const afterContemplacao = afterSituacao.substring(contemplacaoMatch[0].length)

  // Parte 4: % Pago (X,XXXX) + % Atraso (X,XXXX) + Data (dd/mm/yyyy) + % Fdo Comum (XX,XXXX)
  const numericMatch = afterContemplacao.match(/^(\d{1,3},\d{4})(\d{1,3},\d{4})(\d{2}\/\d{2}\/\d{4})(\d{1,3},\d{4})/)
  if (!numericMatch) return null

  const percentPago = parseBRPercent(numericMatch[1])
  const percentAtraso = parseBRPercent(numericMatch[2])
  const dataVenda = numericMatch[3]
  const percentFundoComum = parseBRPercent(numericMatch[4])

  const afterNumeric = afterContemplacao.substring(numericMatch[0].length)

  // Parte 5: Parcelas + valores monetários
  //
  // O texto concatenado é algo como:
  //   "00600500100050.000,00192,5062.845,1800050.000,00"  (vlBem=50.000)
  //   "006005001000100.000,00385,00125.697,89000100.000,00" (vlBem=100.000)
  //
  // Parcelas são sempre 4 campos de 3 dígitos = 12 dígitos.
  // MAS o valor vlBem fica colado logo depois, e se vlBem for ex 50.000,00 o regex
  // de money pode "roubar" o último 0 das parcelas como parte do 050.000.
  //
  // Estratégia: sabemos que são EXATAMENTE 12 dígitos de parcelas.
  // Pegar os primeiros 12 dígitos do afterNumeric como parcelas.
  const pclsDigits = afterNumeric.substring(0, 12)

  let pclsPagar = 0, pclsPagas = 0, pclsPagasEmDia = 0, pclsPagasAtraso = 0, pclsEmAtraso = 0

  if (/^\d{12}/.test(pclsDigits)) {
    pclsPagar = parseInt(pclsDigits.substring(0, 3), 10)
    pclsPagas = parseInt(pclsDigits.substring(3, 6), 10)
    pclsPagasEmDia = parseInt(pclsDigits.substring(6, 9), 10)
    pclsPagasAtraso = parseInt(pclsDigits.substring(9, 12), 10)
  } else {
    return null
  }

  // Parte 6: Valores monetários e dias atraso
  // afterPcls contém: "50.000,00192,5062.845,1800050.000,00"
  // ou: "100.000,00385,00125.697,89000100.000,00"
  const afterPcls = afterNumeric.substring(12)

  const moneyPattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g
  const moneyMatches: { value: number; raw: string; index: number }[] = []
  let m: RegExpExecArray | null
  while ((m = moneyPattern.exec(afterPcls)) !== null) {
    moneyMatches.push({
      value: parseBRMoney(m[1]),
      raw: m[1],
      index: m.index,
    })
  }

  if (moneyMatches.length < 3) return null

  // Ordem: vlBem, vlParcela, vlQuitacao, [diasAtraso3], vlReceber
  let vlBem = 0, vlParcela = 0, vlQuitacao = 0, vlReceber = 0, diasEmAtraso = 0

  if (moneyMatches.length >= 4) {
    vlBem = moneyMatches[0].value
    vlParcela = moneyMatches[1].value
    vlQuitacao = moneyMatches[2].value
    vlReceber = moneyMatches[3].value

    // Tentar extrair dias em atraso entre vlQuitacao e vlReceber
    const afterQuitacao = moneyMatches[2].index + moneyMatches[2].raw.length
    const beforeReceber = moneyMatches[3].index
    const between = afterPcls.substring(afterQuitacao, beforeReceber)
    const diasMatch = between.match(/(\d{3})/)
    if (diasMatch) {
      diasEmAtraso = parseInt(diasMatch[1], 10)
    }
  } else {
    vlBem = moneyMatches[0].value
    vlParcela = moneyMatches[1].value
    vlQuitacao = moneyMatches[2].value
    vlReceber = vlBem
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
    diasEmAtraso,
  }
}

/**
 * Extrair totais do relatório.
 * Formato real: "Total:5.216.699,904.150.000,0016.010,10\n0042\n4.150.000,00"
 * Ou com espaço: "Total: 0042 ..."
 */
function extractTotals(text: string): { totalCotas: number; vlBem: number; vlParcela: number; vlReceber: number; vlQuitacao: number } | null {
  // Tentar formato com espaços primeiro
  const spacedPattern = /Total:\s*(\d+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/
  const spacedMatch = text.match(spacedPattern)
  if (spacedMatch) {
    return {
      totalCotas: parseInt(spacedMatch[1], 10),
      vlBem: parseBRMoney(spacedMatch[2]),
      vlParcela: parseBRMoney(spacedMatch[3]),
      vlReceber: parseBRMoney(spacedMatch[4]),
      vlQuitacao: parseBRMoney(spacedMatch[5]),
    }
  }

  // Formato concatenado: "Total:5.216.699,904.150.000,0016.010,10\n0042\n4.150.000,00"
  // Extrair todos os valores monetários após "Total:"
  const totalSection = text.substring(text.indexOf('Total:'))
  if (!totalSection) return null

  const moneyPattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g
  const moneyValues: number[] = []
  let m: RegExpExecArray | null
  while ((m = moneyPattern.exec(totalSection)) !== null) {
    moneyValues.push(parseBRMoney(m[1]))
  }

  // Extrair número de cotas (4 dígitos isolado, ex: "0042")
  const cotasMatch = totalSection.match(/\b(\d{4})\b/)
  const totalCotas = cotasMatch ? parseInt(cotasMatch[1], 10) : 0

  if (moneyValues.length >= 4) {
    return {
      totalCotas,
      vlQuitacao: moneyValues[0],   // 5.216.699,90
      vlBem: moneyValues[1],        // 4.150.000,00
      vlParcela: moneyValues[2],    // 16.010,10
      vlReceber: moneyValues[3],    // 4.150.000,00
    }
  }

  return null
}

/**
 * Parser principal do PDF Âncora
 */
export async function parsePDFAncora(buffer: Buffer): Promise<AncoraParseResult> {
  const result: AncoraParseResult = {
    quotas: [],
    cliente: null,
    administradora: '',
    empresa: '',
    totalCotas: 0,
    totals: null,
    errors: [],
  }

  try {
    if (!buffer || buffer.length === 0) {
      result.errors.push('Buffer do PDF está vazio ou inválido.')
      return result
    }

    console.log(`[Ancora Parser] Iniciando parse (${buffer.length} bytes)...`)

    const pdfData = await pdfParse(buffer, { max: 0 })
    const text = pdfData.text || ''

    if (text.trim().length < 50) {
      result.errors.push('PDF não contém texto suficiente para extração.')
      return result
    }

    // Verificar se é formato Âncora
    if (!isAncoraFormat(text)) {
      result.errors.push('PDF não parece ser um relatório Âncora. Formato não reconhecido.')
      return result
    }

    console.log(`[Ancora Parser] Formato Âncora detectado. Texto: ${text.length} chars`)

    // Extrair metadados
    const companyInfo = extractCompanyInfo(text)
    result.administradora = companyInfo.administradora
    result.empresa = companyInfo.empresa

    result.cliente = extractClientInfo(text)
    if (result.cliente) {
      console.log(`[Ancora Parser] Cliente: ${result.cliente.nome} (${result.cliente.cpfCnpj})`)
    }

    // Parse das linhas de cotas
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 30)
    const quotas: ParsedQuota[] = []

    for (const line of lines) {
      // Pular linhas de cabeçalho/metadados
      if (line.startsWith('Grupo') || line.startsWith('Cliente:') ||
          line.includes('Relatório') || line.includes('Página') ||
          line.includes('ANCORA') || line.includes('PROSPERE') ||
          line.startsWith('Total:') || line.includes('Vl. Bem') ||
          line.includes('% Fdo.') || line.includes('Pcls.')) {
        continue
      }

      // Verificar se a linha começa com 6 dígitos (grupo)
      if (!/^\d{6}/.test(line)) continue

      const quota = parseAncoraLineSmart(line)
      if (quota) {
        quotas.push(quota)
      }
    }

    console.log(`[Ancora Parser] Cotas extraídas: ${quotas.length}`)

    // Extrair totais para validação
    const totals = extractTotals(text)
    if (totals) {
      result.totals = {
        vlBem: totals.vlBem,
        vlParcela: totals.vlParcela,
        vlReceber: totals.vlReceber,
        vlQuitacao: totals.vlQuitacao,
      }
      result.totalCotas = totals.totalCotas

      if (quotas.length !== totals.totalCotas && totals.totalCotas > 0) {
        console.warn(`[Ancora Parser] Aviso: encontradas ${quotas.length} cotas, relatório diz ${totals.totalCotas}`)
        if (quotas.length < totals.totalCotas) {
          result.errors.push(
            `Encontradas ${quotas.length} de ${totals.totalCotas} cotas. Algumas cotas podem não ter sido extraídas corretamente.`
          )
        }
      }

      // Validar totais monetários
      const sumVlBem = quotas.reduce((sum, q) => sum + q.vlBem, 0)
      const tolerance = 0.01
      if (Math.abs(sumVlBem - totals.vlBem) > tolerance * totals.vlBem && totals.vlBem > 0) {
        console.warn(`[Ancora Parser] Aviso: soma vlBem (${sumVlBem.toFixed(2)}) difere do total (${totals.vlBem.toFixed(2)})`)
      } else if (totals.vlBem > 0) {
        console.log(`[Ancora Parser] Validação OK: soma vlBem = ${sumVlBem.toFixed(2)}, total = ${totals.vlBem.toFixed(2)}`)
      }
    }

    result.quotas = quotas

    if (quotas.length === 0) {
      result.errors.push('Nenhuma cota encontrada no relatório Âncora.')
    } else {
      console.log(`[Ancora Parser] Sucesso: ${quotas.length} cotas extraídas`)
      const sample = quotas[0]
      console.log(`[Ancora Parser] Exemplo: ${sample.grupo}-${sample.cota} | Bem: ${sample.vlBem} | Parcela: ${sample.vlParcela} | Receber: ${sample.vlReceber}`)
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    result.errors.push(`Erro ao processar PDF Âncora: ${msg}`)
    console.error('[Ancora Parser] Erro:', error)
  }

  return result
}
