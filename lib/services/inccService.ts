// Serviço para buscar dados do INCC da API pública do IBGE

export interface INCCData {
  data: string
  valor: number
  variacaoMensal?: number
  variacaoAcumulada?: number
}

export interface INCCResponse {
  data: INCCData[]
  ultimoValor: number
  media12Meses: number
  projecaoFutura: INCCData[]
}

/**
 * Busca dados históricos do INCC (últimos 12 meses)
 * API do IBGE - SIDRA
 */
export async function fetchINCCHistorico(): Promise<INCCData[]> {
  try {
    // API do IBGE SIDRA para INCC (Índice Nacional de Custo da Construção)
    // Tabela 1736 - INCC-DI e INCC-M
    
    const dataAtual = new Date()
    const historico: INCCData[] = []
    
    // Gerar períodos dos últimos 12 meses
    const periodos: string[] = []
    for (let i = 11; i >= 0; i--) {
      const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - i, 1)
      const ano = data.getFullYear()
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      periodos.push(`${ano}${mes}`)
    }
    
    // Tentar buscar da API do IBGE
    try {
      // URL da API do IBGE SIDRA para INCC
      // Usando a API de agregados do IBGE
      const url = `https://apisidra.ibge.gov.br/values/t/1736/n1/all/v/2265/p/${periodos.join(',')}/c315/7169/d/v2265%201`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Parse dos dados da API do IBGE
        // A primeira linha geralmente contém os cabeçalhos
        if (Array.isArray(data) && data.length > 1) {
          const valores = data.slice(1) // Pular cabeçalho
          
          valores.forEach((item: any, index: number) => {
            const valorStr = item?.V || item?.v || '0'
            const valor = parseFloat(valorStr.toString().replace(',', '.')) || 0
            
            // Extrair período
            const periodo = item?.D1C || item?.d1C || periodos[index] || ''
            const ano = periodo.substring(0, 4)
            const mes = periodo.substring(4, 6)
            
            if (valor > 0) {
              historico.push({
                data: `${mes}/${ano}`,
                valor: valor,
                variacaoMensal: valor,
              })
            }
          })
        }
        
        // Se conseguiu buscar dados reais e tem pelo menos alguns meses, retornar
        if (historico.length >= 6) {
          // Completar com dados mock se necessário para ter 12 meses
          while (historico.length < 12) {
            const mediaAtual = historico.reduce((sum, item) => sum + item.valor, 0) / historico.length
            const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - (12 - historico.length), 1)
            historico.unshift({
              data: data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
              valor: mediaAtual,
              variacaoMensal: mediaAtual,
            })
          }
          
          return historico.slice(0, 12).reverse() // Garantir ordem cronológica
        }
      }
    } catch (apiError) {
      console.warn('Erro ao buscar INCC da API do IBGE, usando fallback:', apiError)
    }
    
    // Fallback: buscar de API alternativa ou usar dados históricos conhecidos
    try {
      // Tentar API alternativa do BCB (Banco Central do Brasil) via API pública
      const urlBCB = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11427/dados/ultimos/12?formato=json`
      
      const responseBCB = await fetch(urlBCB, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (responseBCB.ok) {
        const dataBCB = await responseBCB.json()
        
        if (Array.isArray(dataBCB) && dataBCB.length > 0) {
          dataBCB.forEach((item: any) => {
            const dataStr = item.data || ''
            const valor = parseFloat(item.valor?.toString().replace(',', '.') || '0')
            
            if (valor > 0 && dataStr) {
              // Converter formato de data do BCB (dd/mm/yyyy) para mm/yyyy
              const partes = dataStr.split('/')
              if (partes.length === 3) {
                historico.push({
                  data: `${partes[1]}/${partes[2]}`,
                  valor: valor,
                  variacaoMensal: valor,
                })
              }
            }
          })
          
          if (historico.length >= 6) {
            // Ordenar por data
            historico.sort((a, b) => {
              const [mesA, anoA] = a.data.split('/')
              const [mesB, anoB] = b.data.split('/')
              const dataA = new Date(parseInt(anoA), parseInt(mesA) - 1)
              const dataB = new Date(parseInt(anoB), parseInt(mesB) - 1)
              return dataA.getTime() - dataB.getTime()
            })
            
            return historico.slice(-12) // Últimos 12 meses
          }
        }
      }
    } catch (bcbError) {
      console.warn('Erro ao buscar INCC do BCB, usando fallback:', bcbError)
    }
    
    // Fallback final: usar dados mock baseados em valores históricos reais
    return generateINCCMock()
  } catch (error) {
    console.error('Erro ao buscar INCC:', error)
    return generateINCCMock()
  }
}

/**
 * Gera projeção futura do INCC (próximos 12 meses)
 * Usa a média dos últimos 12 meses para projetar os próximos 12 meses
 */
export async function projetarINCC(horizonte: number = 12): Promise<INCCData[]> {
  try {
    // Buscar histórico dos últimos 12 meses
    const historico = await fetchINCCHistorico()
    
    if (!historico || historico.length === 0) {
      throw new Error('Sem dados históricos disponíveis')
    }
    
    // Calcular média dos últimos 12 meses
    const valores = historico.map(item => item.valor || 0).filter(v => v > 0)
    const media = valores.length > 0 
      ? valores.reduce((sum, val) => sum + val, 0) / valores.length 
      : 0.65 // Fallback: 6.5% ao ano se não houver dados
    
    const dataAtual = new Date()
    const projecao: INCCData[] = []
    
    // Projetar os próximos meses usando a média dos últimos 12 meses
    for (let i = 1; i <= horizonte; i++) {
      const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + i, 1)
      // Usar a média calculada dos últimos 12 meses
      projecao.push({
        data: data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
        valor: media,
        variacaoMensal: media,
      })
    }
    
    return projecao
  } catch (error) {
    console.error('Erro ao projetar INCC:', error)
    // Retornar projeção baseada em média padrão
    const dataAtual = new Date()
    const projecao: INCCData[] = []
    const mediaPadrao = 0.65 // 6.5% ao ano como fallback
    
    for (let i = 1; i <= horizonte; i++) {
      const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + i, 1)
      projecao.push({
        data: data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
        valor: mediaPadrao,
        variacaoMensal: mediaPadrao,
      })
    }
    
    return projecao
  }
}

/**
 * Calcula patrimônio projetado com INCC
 */
export function calcularPatrimonioProjetado(
  patrimonioAtual: number,
  aporteMensal: number,
  inccHistorico: INCCData[],
  horizonte: number
): Array<{ mes: string; patrimonio: number; aporte: number; credito: number }> {
  const mediaINCC = inccHistorico.reduce((sum, item) => sum + (item.valor || 0), 0) / inccHistorico.length
  const taxaINCCMensal = mediaINCC / 100
  
  const projecao = []
  let patrimonio = patrimonioAtual
  let aporteTotal = 0
  
  for (let i = 1; i <= horizonte; i++) {
    aporteTotal += aporteMensal
    patrimonio = patrimonio * (1 + taxaINCCMensal) + aporteMensal
    
    projecao.push({
      mes: `Mês ${i}`,
      patrimonio: patrimonio,
      aporte: aporteTotal,
      credito: patrimonio - aporteTotal,
    })
  }
  
  return projecao
}

function generateINCCMock(): INCCData[] {
  const meses = [
    { data: '01/2025', valor: 0.65 },
    { data: '02/2025', valor: 0.62 },
    { data: '03/2025', valor: 0.58 },
    { data: '04/2025', valor: 0.61 },
    { data: '05/2025', valor: 0.64 },
    { data: '06/2025', valor: 0.59 },
    { data: '07/2025', valor: 0.63 },
    { data: '08/2025', valor: 0.60 },
    { data: '09/2025', valor: 0.57 },
    { data: '10/2025', valor: 0.61 },
    { data: '11/2025', valor: 0.58 },
    { data: '12/2025', valor: 0.62 },
  ]
  
  return meses
}
