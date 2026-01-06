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
 * API do IBGE ou fonte alternativa
 */
export async function fetchINCCHistorico(): Promise<INCCData[]> {
  try {
    // Tentar buscar da API do IBGE
    // Endpoint: https://servicodados.ibge.gov.br/api/v3/agregados/1736/periodos/...
    
    // Por enquanto, retornar dados mock simulados baseados em valores reais
    const dataAtual = new Date()
    const historico: INCCData[] = []
    
    for (let i = 11; i >= 0; i--) {
      const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - i, 1)
      // Valores simulados baseados em INCC real (aproximado)
      const baseINCC = 0.65 // 6.5% ao ano médio
      const variacao = (Math.random() * 0.3 - 0.15) + baseINCC / 12 // Variação mensal
      
      historico.push({
        data: data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
        valor: baseINCC + (variacao * i),
        variacaoMensal: variacao,
      })
    }
    
    return historico
  } catch (error) {
    console.error('Erro ao buscar INCC:', error)
    // Retornar valores padrão em caso de erro
    return generateINCCMock()
  }
}

/**
 * Gera projeção futura do INCC (próximos 12 meses)
 */
export async function projetarINCC(horizonte: number = 12): Promise<INCCData[]> {
  const historico = await fetchINCCHistorico()
  const media = historico.reduce((sum, item) => sum + (item.valor || 0), 0) / historico.length
  const dataAtual = new Date()
  
  const projecao: INCCData[] = []
  
  for (let i = 1; i <= horizonte; i++) {
    const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + i, 1)
    // Projeção conservadora: média dos últimos 12 meses
    projecao.push({
      data: data.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
      valor: media,
    })
  }
  
  return projecao
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
