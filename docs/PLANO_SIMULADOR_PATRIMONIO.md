# Plano de Implementação - Simulador de Acúmulo de Patrimônio

## 1. MODELO DE DADOS (JSON)

### 1.1 Cota
```json
{
  "id": "string",
  "userId": "string",
  "grupo": "string",
  "cota": "string",
  "versao": "string",
  "vlBem": "number",
  "vlParcela": "number",
  "vlQuitacao": "number",
  "vlReceber": "number",
  "pclsPagar": "number",
  "pclsPagas": "number",
  "percentPago": "number",
  "contemplacao": "string",
  "situacaoCobranca": "string",
  "dataVenda": "string"
}
```

### 1.2 Parâmetros da Simulação
```json
{
  "cotasSelecionadas": ["string"],
  "mesesSimulacao": "number",
  "intervaloContemplacao": "number",
  "percentVendaContemplada": "number",
  "taxaIntermediacao": "number",
  "taxaAdministracao": "number",
  "fundoReserva": "number",
  "inccConfig": {
    "fonte": "manual|api",
    "valorMensal": "number"
  },
  "cdiConfig": {
    "fonte": "manual|api",
    "valorAnual": "number",
    "valorMensal": "number"
  },
  "poupancaConfig": {
    "fonte": "manual|api",
    "valorAnual": "number"
  },
  "estrategiaPosVenda": "vender|investir|comprarImovel",
  "mesCorte": "number",
  "correcaoParcela": "boolean",
  "correcaoCredito": "boolean",
  "indiceCorrecao": "INCC|IPCA"
}
```

### 1.3 Resultado Mensal
```json
{
  "mes": "number",
  "mesLabel": "string",
  "parcelasPagas": "number",
  "valorParcelas": "number",
  "contemplacoes": "number",
  "vendas": "number",
  "valorVendas": "number",
  "caixa": "number",
  "caixaInvestido": "number",
  "patrimonio": "number",
  "creditoAtualizado": "number",
  "totalPago": "number",
  "eventos": ["Evento"]
}
```

### 1.4 Evento
```json
{
  "tipo": "pagamento|contemplacao|venda|aplicacao|reinvestimento",
  "mes": "number",
  "cotaId": "string",
  "cotaGrupo": "string",
  "cotaNumero": "string",
  "valor": "number",
  "descricao": "string",
  "destino": "string"
}
```

### 1.5 Resultado Final
```json
{
  "patrimonioFinal": "number",
  "totalPagoParcelas": "number",
  "totalPagoBolso": "number",
  "totalRecebidoVendas": "number",
  "caixaFinalInvestido": "number",
  "custoPatrimonio": "number",
  "roi": "number",
  "multiplicadorPatrimonial": "number",
  "custoPorReal": "number",
  "numContemplacoes": "number",
  "numVendas": "number",
  "cotasAtivasFinal": "number",
  "comparacao": {
    "cdiFinal": "number",
    "poupancaFinal": "number",
    "diferencaCdi": "number",
    "diferencaPoupanca": "number"
  },
  "resumoTexto": "string"
}
```

## 2. COMPONENTES REACT/NEXT

### 2.1 Páginas
- `app/dashboard/page.tsx` (já existe - manter)
- `components/dashboard/SimulacoesTab.tsx` (refatorar completamente)

### 2.2 Componentes
- `components/dashboard/SimulacoesTab.tsx` - Componente principal
  - TabsContainer
  - ConfiguracaoTab
    - SelecaoCotasSection
    - ParametrosSection
    - IndicesSection (INCC, CDI, Poupança)
  - ResultadosTab
    - ResumoExecutivoCards
    - CustoPatrimonioSection
    - FluxoVendasTable
    - TimelineEvents
  - GraficosTab
    - GraficoPatrimonio
    - GraficoComparativo
    - GraficoEntradasSaidas
    - GraficoCreditoCorrigido
  - AcumulacaoTab
    - EvolucaoMensal
    - EventosTimeline

### 2.3 Serviços/Utils
- `lib/services/simulatorEngine.ts` - Motor de simulação
- `lib/services/indicesService.ts` - API de índices (CDI, INCC, Poupança)
- `lib/utils/exportUtils.ts` - Exportação PDF/Excel
- `lib/hooks/useIndices.ts` - Hook para buscar índices
- `lib/hooks/useSimulation.ts` - Hook para rodar simulação

### 2.4 APIs
- `app/api/indices/cdi/route.ts` - Endpoint CDI
- `app/api/indices/incc/route.ts` - Endpoint INCC
- `app/api/indices/poupanca/route.ts` - Endpoint Poupança
- `app/api/simulation/run/route.ts` - Executar simulação (opcional - pode ser client-side)

## 3. ESQUELETO DAS FUNÇÕES (PSEUDOCÓDIGO)

### 3.1 Motor de Simulação
```typescript
function simulatePatrimonioAccumulation(
  cotas: Cota[],
  params: SimulationParams,
  indices: IndicesData
): SimulationResult {
  // Inicializar estado
  let patrimonio = 0
  let caixa = 0
  let totalPago = 0
  let totalPagoBolso = 0
  let totalRecebido = 0
  let cotasAtivas = cotas.filter(c => !c.contemplada)
  let eventos: Evento[] = []
  let resultadosMensais: ResultadoMensal[] = []
  
  // Para cada mês da simulação
  for (let mes = 1; mes <= params.mesesSimulacao; mes++) {
    // 1. Pagar parcelas
    const valorParcelas = calcularParcelas(cotasAtivas, mes, params, indices)
    totalPago += valorParcelas
    totalPagoBolso += valorParcelas
    caixa -= valorParcelas
    
    // 2. Contemplações (se for o mês)
    if (mes % params.intervaloContemplacao === 0) {
      const contempladas = contemplarCotas(cotasAtivas, params)
      cotasAtivas = cotasAtivas.filter(c => !contempladas.includes(c))
      
      // 3. Vender cotas contempladas
      for (const cota of contempladas) {
        const venda = venderCota(cota, mes, params, indices)
        totalRecebido += venda.valorLiquido
        caixa += venda.valorLiquido
        
        // 4. Aplicar estratégia pós-venda
        if (params.estrategiaPosVenda === 'investir') {
          // Aplicar em CDI ou Poupança
        } else if (params.estrategiaPosVenda === 'pagar') {
          // Usar para pagar próximas parcelas
        } else if (params.estrategiaPosVenda === 'comprarImovel') {
          // Converter em patrimônio imobiliário
        }
      }
    }
    
    // 5. Atualizar patrimônio
    patrimonio = calcularPatrimonio(cotasAtivas, caixa, mes, params, indices)
    
    // 6. Salvar resultado mensal
    resultadosMensais.push({
      mes,
      parcelasPagas: valorParcelas,
      patrimonio,
      caixa,
      // ... outros campos
    })
  }
  
  // Calcular resultados finais
  return {
    patrimonioFinal: patrimonio,
    totalPagoParcelas: totalPago,
    totalPagoBolso,
    totalRecebidoVendas: totalRecebido,
    resultadosMensais,
    eventos,
    comparacao: calcularComparacao(totalPagoBolso, resultadosMensais, indices),
  }
}
```

### 3.2 Funções Auxiliares
```typescript
function calcularParcelas(cotas: Cota[], mes: number, params: Params, indices: Indices): number
function contemplarCotas(cotas: Cota[], params: Params): Cota[]
function venderCota(cota: Cota, mes: number, params: Params, indices: Indices): VendaResult
function calcularPatrimonio(cotas: Cota[], caixa: number, mes: number, params: Params, indices: Indices): number
function aplicarInvestimento(caixa: number, mes: number, tipo: 'cdi'|'poupanca', indices: Indices): number
function calcularComparacao(totalPago: number, resultados: ResultadoMensal[], indices: Indices): Comparacao
```

## 4. BIBLIOTECA DE GRÁFICOS

**Recharts** (já instalado) - será usado para todos os gráficos:
- `LineChart` - Evolução do patrimônio, total pago, comparações
- `AreaChart` - Áreas preenchidas para visualização
- `BarChart` - Entradas vs saídas
- `ComposedChart` - Gráficos combinados
- `ResponsiveContainer` - Responsividade

## 5. PLANO DE MIGRAÇÃO INCREMENTAL

### Fase 1: Preparação (sem quebrar)
1. Criar novos arquivos sem modificar os existentes
2. Criar `lib/services/simulatorEngine.ts` (novo motor)
3. Criar hooks `useIndices.ts` e `useSimulation.ts`

### Fase 2: Restaurar UI
1. Refatorar `SimulacoesTab.tsx` mantendo compatibilidade
2. Criar tabs: Configuração, Resultados, Gráficos, Acumulação
3. Implementar seleção de cotas com cards interativos

### Fase 3: Motor de Simulação
1. Implementar `simulatePatrimonioAccumulation`
2. Testar com dados reais
3. Integrar com UI

### Fase 4: APIs de Índices
1. Criar endpoints `/api/indices/*`
2. Implementar cache e fallback
3. Integrar com simulador

### Fase 5: Gráficos
1. Criar gráficos comparativos
2. Adicionar interatividade
3. Otimizar performance

### Fase 6: Exportação
1. Implementar exportação PDF
2. Implementar exportação Excel
3. Testar relatórios

## 6. ESTRUTURA DE ARQUIVOS FINAL

```
components/dashboard/SimulacoesTab.tsx (refatorado)
├── ConfiguracaoTab
│   ├── SelecaoCotasSection
│   ├── ParametrosSection
│   └── IndicesSection
├── ResultadosTab
│   ├── ResumoExecutivoCards
│   ├── CustoPatrimonioSection
│   └── FluxoVendasTable
├── GraficosTab
│   ├── GraficoPatrimonio
│   ├── GraficoComparativo
│   └── GraficoEntradasSaidas
└── AcumulacaoTab
    └── TimelineEvents

lib/services/
├── simulatorEngine.ts
├── indicesService.ts
└── exportUtils.ts

lib/hooks/
├── useIndices.ts
└── useSimulation.ts

app/api/indices/
├── cdi/route.ts
├── incc/route.ts
└── poupanca/route.ts
```
