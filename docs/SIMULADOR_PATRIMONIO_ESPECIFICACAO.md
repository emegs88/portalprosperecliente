# 📊 SIMULADOR DE ACÚMULO DE PATRIMÔNIO - ESPECIFICAÇÃO COMPLETA

## 🎯 OBJETIVO PRINCIPAL

Evoluir o sistema "Simulador de Venda de Cota" para um **SIMULADOR DE ACÚMULO DE PATRIMÔNIO**, focado em investimento via consórcio, deixando extremamente claro:

1. **Quanto ele pagou no total**
2. **Quanto de patrimônio acumulou**
3. **Quanto esse patrimônio custou de fato**
4. **Qual foi o lucro ou ganho patrimonial**
5. **Como funcionou o fluxo de vendas das cartas contempladas**

---

## 1️⃣ MODELO DE DADOS (JSON)

### 1.1 Estrutura Principal da Simulação

```json
{
  "simulacao": {
    "id": "uuid",
    "userId": "uuid",
    "dataCriacao": "2026-01-13T00:00:00Z",
    "configuracao": {
      "intervaloContemplacao": 7,
      "mesCorte": 70,
      "percentualVenda": 45,
      "taxaIntermediacao": 5,
      "taxaCDIInvestimento": 11,
      "estrategiaAposCorte": "investido | imovel",
      "percentualCompraImovel": 100,
      "cotasSelecionadas": ["id1", "id2", ...]
    },
    "resultados": {
      "indicadoresPrincipais": {
        "totalPagoProjeto": 0,
        "totalInvestido": 0,
        "patrimonioFinalAcumulado": 0,
        "ganhoPatrimonial": 0,
        "roi": 0,
        "custoPorRealPatrimonio": 0
      },
      "custoPatrimonio": {
        "totalPagoBolso": 0,
        "totalRecebidoVendas": 0,
        "totalReinvestido": 0,
        "patrimonioFinal": 0,
        "custoFormacaoPatrimonio": 0,
        "fraseAutomatica": "Você construiu um patrimônio de R$ X pagando efetivamente R$ Y."
      },
      "fluxoVendas": [
        {
          "mes": 12,
          "numeroCota": "000707-2562",
          "valorCredito": 280000,
          "percentualVenda": 45,
          "valorBrutoVenda": 126000,
          "taxaIntermediacao": 6300,
          "valorLiquidoRecebido": 119700,
          "destinoDinheiro": {
            "pagarParcelas": true,
            "reinvestir": false,
            "aplicarCDI": false,
            "percentualParcelas": 100,
            "percentualReinvestir": 0,
            "percentualCDI": 0
          },
          "saldoAcumuladoCaixa": 119700
        }
      ],
      "timelineMensal": [
        {
          "mes": 1,
          "parcelasPagas": 933.40,
          "cotasAtivas": 48,
          "contemplacoes": 0,
          "vendas": 0,
          "caixa": 0,
          "patrimonio": 933.40,
          "eventos": [
            {
              "tipo": "pagamento",
              "descricao": "Parcela mensal paga",
              "valor": 933.40
            }
          ]
        },
        {
          "mes": 7,
          "parcelasPagas": 933.40,
          "cotasAtivas": 48,
          "contemplacoes": 1,
          "vendas": 1,
          "caixa": 119700,
          "patrimonio": 120633.40,
          "eventos": [
            {
              "tipo": "contemplacao",
              "descricao": "Cota 000707-2562 contemplada",
              "valor": 280000
            },
            {
              "tipo": "venda",
              "descricao": "Venda da cota 000707-2562",
              "valorBruto": 126000,
              "valorLiquido": 119700
            },
            {
              "tipo": "pagamento",
              "descricao": "Parcela mensal paga",
              "valor": 933.40
            }
          ]
        }
      ],
      "graficos": {
        "evolucaoPatrimonio": [
          { "mes": 1, "valor": 933.40 },
          { "mes": 7, "valor": 120633.40 }
        ],
        "evolucaoTotalPago": [
          { "mes": 1, "valor": 933.40 },
          { "mes": 7, "valor": 6533.80 }
        ],
        "evolucaoCaixa": [
          { "mes": 1, "valor": 0 },
          { "mes": 7, "valor": 119700 }
        ],
        "comparativoTotalPagoVsPatrimonio": [
          { "mes": 1, "totalPago": 933.40, "patrimonio": 933.40 },
          { "mes": 7, "totalPago": 6533.80, "patrimonio": 120633.40 }
        ],
        "acumuloCotasContempladas": [
          { "mes": 1, "cotas": 0 },
          { "mes": 7, "cotas": 1 }
        ],
        "receitaVendasCartas": [
          { "mes": 1, "valor": 0 },
          { "mes": 7, "valor": 119700 }
        ]
      },
      "resumoEstrategico": {
        "estrategiaUtilizada": "Venda de cotas contempladas até mês 70, aplicação CDI após corte",
        "tempoConstrucao": "240 meses (20 anos)",
        "totalPago": 15788171.07,
        "patrimonioFinal": 23480778.81,
        "eficienciaModelo": "148.8%",
        "multiplicadorPatrimonial": "1.49x"
      }
    }
  }
}
```

### 1.2 Estrutura de Eventos Mensais

```json
{
  "eventoMensal": {
    "mes": 12,
    "tipo": "pagamento | contemplacao | venda | aplicacao | reinvestimento | corte",
    "descricao": "Descrição do evento",
    "valor": 0,
    "valorBruto": 0,
    "valorLiquido": 0,
    "cotaRelacionada": {
      "grupo": "000707",
      "cota": "2562",
      "vlBem": 280000
    },
    "impactoCaixa": 0,
    "impactoPatrimonio": 0,
    "saldoAnterior": 0,
    "saldoAtual": 0
  }
}
```

---

## 2️⃣ LISTA DE COMPONENTES DA INTERFACE

### 2.1 Componentes Principais

#### **DashboardTab (Aba Resultados)**
- `IndicadoresPrincipais.tsx` - Cards com 6 indicadores principais
- `CustoPatrimonioCard.tsx` - Bloco "Custo do Patrimônio"
- `FluxoVendasTable.tsx` - Tabela de fluxo de vendas
- `TimelineMensal.tsx` - Linha do tempo do projeto
- `ResumoEstrategico.tsx` - Resumo automático da simulação

#### **GráficosTab (Aba Gráficos)**
- `EvolucaoPatrimonioChart.tsx` - Gráfico de evolução do patrimônio
- `EvolucaoTotalPagoChart.tsx` - Gráfico de evolução do total pago
- `EvolucaoCaixaChart.tsx` - Gráfico de evolução do caixa
- `ComparativoTotalPagoVsPatrimonioChart.tsx` - Comparativo
- `AcumuloCotasContempladasChart.tsx` - Acúmulo de cotas
- `ReceitaVendasCartasChart.tsx` - Receita com vendas

#### **ConfiguracaoTab (Aba Configuração)**
- `ParametrosSimulacao.tsx` - Parâmetros da simulação (já existe, ajustar)
- `SelecaoCotas.tsx` - Seleção de cotas (já existe, manter)

#### **Exportacao**
- `ExportarPDF.tsx` - Botão e lógica para exportar PDF
- `ExportarExcel.tsx` - Botão e lógica para exportar Excel

### 2.2 Componentes de UI Reutilizáveis

- `MetricCard.tsx` - Card de métrica (já existe, ajustar)
- `CurrencyDisplay.tsx` - Exibição de valores monetários
- `PercentageDisplay.tsx` - Exibição de percentuais
- `TimelineItem.tsx` - Item da linha do tempo
- `EventBadge.tsx` - Badge para tipos de eventos
- `FraseAutomatica.tsx` - Componente para frases automáticas

---

## 3️⃣ LÓGICA FINANCEIRA VALIDADA

### 3.1 Cálculo de Indicadores Principais

```typescript
// Total Pago no Projeto
totalPagoProjeto = soma(todasParcelasPagas * valorParcelaComINCC)

// Total Investido (dinheiro efetivamente aportado)
totalInvestido = totalPagoProjeto - totalRecebidoVendas

// Patrimônio Final Acumulado
patrimonioFinalAcumulado = 
  se (estrategiaAposCorte === 'investido'):
    valorCreditoAplicado * (1 + taxaCDI)^meses
  senão:
    valorImovelComprado

// Ganho Patrimonial
ganhoPatrimonial = patrimonioFinalAcumulado - totalPagoProjeto

// ROI (%)
roi = (ganhoPatrimonial / totalPagoProjeto) * 100

// Custo por Real de Patrimônio
custoPorRealPatrimonio = totalPagoProjeto / patrimonioFinalAcumulado
```

### 3.2 Cálculo do Custo do Patrimônio

```typescript
// Total Pago do Bolso
totalPagoBolso = totalPagoProjeto

// Total Recebido com Venda de Cartas
totalRecebidoVendas = soma(valorLiquidoRecebido de todas as vendas)

// Total Reinvestido
totalReinvestido = soma(valorReinvestido de cada venda)

// Patrimônio Final
patrimonioFinal = patrimonioFinalAcumulado

// Quanto Custou Formar esse Patrimônio
custoFormacaoPatrimonio = totalPagoBolso - totalRecebidoVendas

// Frase Automática
fraseAutomatica = `Você construiu um patrimônio de ${formatCurrency(patrimonioFinal)} pagando efetivamente ${formatCurrency(custoFormacaoPatrimonio)}.`
```

### 3.3 Cálculo do Fluxo de Vendas

```typescript
// Para cada contemplação até mês de corte:
para cada contemplacao em contemplacoes:
  se (mes <= mesCorte):
    valorCredito = calcularValorComINCC(vlBem, mes)
    valorBrutoVenda = valorCredito * (percentualVenda / 100)
    taxaIntermediacao = valorBrutoVenda * (taxaIntermediacao / 100)
    valorLiquidoRecebido = valorBrutoVenda - taxaIntermediacao
    
    // Destino do dinheiro (configurável)
    valorParaParcelas = valorLiquidoRecebido * (percentualParcelas / 100)
    valorParaReinvestir = valorLiquidoRecebido * (percentualReinvestir / 100)
    valorParaCDI = valorLiquidoRecebido * (percentualCDI / 100)
    
    saldoAcumuladoCaixa = saldoAnterior + valorLiquidoRecebido - valorParaParcelas
```

### 3.4 Cálculo da Timeline Mensal

```typescript
// Para cada mês de 1 até prazoTotal (240 meses):
para cada mes de 1 até 240:
  eventos = []
  
  // 1. Pagamento de parcelas
  valorParcela = calcularParcelaComINCC(mes)
  eventos.push({ tipo: 'pagamento', valor: valorParcela })
  
  // 2. Verificar contemplação
  se (mes % intervaloContemplacao === 0):
    cota = proximaCota()
    eventos.push({ tipo: 'contemplacao', cota: cota })
    
    // 3. Se antes do corte, vender
    se (mes <= mesCorte):
      venda = calcularVenda(cota, mes)
      eventos.push({ tipo: 'venda', venda: venda })
      
      // Aplicar destino do dinheiro
      aplicarDestinoDinheiro(venda.valorLiquidoRecebido)
  
  // 4. Aplicar rendimentos CDI (se houver)
  se (caixa > 0 e aplicandoCDI):
    rendimento = caixa * taxaCDIMensal
    eventos.push({ tipo: 'aplicacao', rendimento: rendimento })
  
  // 5. Calcular totais do mês
  timelineMensal.push({
    mes,
    parcelasPagas: soma(valoresPagamento),
    cotasAtivas: totalCotas - cotasContempladas,
    contemplacoes: totalContemplacoes,
    vendas: totalVendas,
    caixa: saldoCaixa,
    patrimonio: calcularPatrimonioAtual(),
    eventos
  })
```

### 3.5 Aplicação de INCC

```typescript
// INCC aplicado anualmente como juros compostos
calcularValorComINCC(valorBase: number, meses: number): number {
  se (meses <= 12):
    retornar valorBase
  
  taxaINCCAnual = inccData.media12Meses / 100
  anos = Math.floor(meses / 12)
  valorCorrigido = valorBase
  
  para cada ano de 1 até anos:
    valorCorrigido = valorCorrigido * (1 + taxaINCCAnual)
  
  retornar valorCorrigido
}
```

### 3.6 Aplicação de CDI

```typescript
// CDI aplicado mensalmente
taxaCDIMensal = Math.pow(1 + (taxaCDIAnual / 100), 1/12) - 1

// Rendimento mensal
rendimentoMensal = valorAplicado * taxaCDIMensal

// Valor acumulado após N meses
valorAcumulado = valorInicial * Math.pow(1 + taxaCDIMensal, meses)
```

---

## 4️⃣ WIREFRAME TEXTUAL DAS TELAS

### 4.1 Aba "Resultados" (Dashboard Principal)

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 RESULTADOS DA SIMULAÇÃO                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💰 INDICADORES PRINCIPAIS                               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│  │
│  │  │💰 Total  │  │🏦 Total  │  │🏠 Patrim.│  │📈 Ganho  ││  │
│  │  │  Pago    │  │Investido │  │  Final   │  │Patrimonial││  │
│  │  │          │  │          │  │          │  │          ││  │
│  │  │R$ 15.7mi │  │R$ 5.6mi  │  │R$ 23.4mi│  │R$ 7.7mi  ││  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘│  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐                             │  │
│  │  │📊 ROI    │  │⏳ Custo/ │                             │  │
│  │  │          │  │  Real    │                             │  │
│  │  │ 48.8%    │  │  R$ 0.67 │                             │  │
│  │  └──────────┘  └──────────┘                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🧮 CUSTO DO PATRIMÔNIO                                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  Total Pago do Bolso:        R$ 15.788.171,07          │  │
│  │  Total Recebido com Vendas:  R$ 10.234.567,89          │  │
│  │  Total Reinvestido:           R$ 2.500.000,00           │  │
│  │  Patrimônio Final:            R$ 23.480.778,81          │  │
│  │  Custo de Formação:          R$ 5.553.603,18          │  │
│  │                                                           │  │
│  │  💬 "Você construiu um patrimônio de R$ 23.480.778,81   │  │
│  │     pagando efetivamente R$ 5.553.603,18."               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📑 FLUXO DE VENDAS DE CARTAS CONTEMPLADAS               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  [Exportar PDF] [Exportar Excel]                         │  │
│  │                                                           │  │
│  │  ┌────┬──────────┬──────────┬──────┬──────────┬────────┐│  │
│  │  │Mês │Cota      │Valor     │% Venda│Valor     │Líquido ││  │
│  │  │    │          │Crédito   │      │Bruto     │Recebido││  │
│  │  ├────┼──────────┼──────────┼──────┼──────────┼────────┤│  │
│  │  │ 7  │000707-   │R$ 280k   │ 45%  │R$ 126k   │R$ 119k ││  │
│  │  │    │2562      │          │      │          │        ││  │
│  │  ├────┼──────────┼──────────┼──────┼──────────┼────────┤│  │
│  │  │14  │000707-   │R$ 260k   │ 45%  │R$ 117k   │R$ 111k ││  │
│  │  │    │2563      │          │      │          │        ││  │
│  │  └────┴──────────┴──────────┴──────┴──────────┴────────┘│  │
│  │                                                           │  │
│  │  [Ver mais...]                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🏗️ LINHA DO TEMPO DO PROJETO                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌────┬──────────┬──────────┬──────────┬──────┬────────┐│  │
│  │  │Mês │Parcelas │Cotas     │Contempl. │Vendas│Caixa   ││  │
│  │  │    │Pagas    │Ativas    │          │      │        ││  │
│  │  ├────┼──────────┼──────────┼──────────┼──────┼────────┤│  │
│  │  │ 1  │R$ 933   │   48     │    0     │  0   │R$ 0    ││  │
│  │  │ 7  │R$ 933   │   47     │    1     │  1   │R$ 119k││  │
│  │  │14  │R$ 933   │   46     │    2     │  2   │R$ 230k││  │
│  │  └────┴──────────┴──────────┴──────────┴──────┴────────┘│  │
│  │                                                           │  │
│  │  [Ver detalhes do mês...]                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🧠 RESUMO ESTRATÉGICO DA SIMULAÇÃO PROSPERE             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  • Estratégia: Venda de cotas contempladas até mês 70,  │  │
│  │    aplicação CDI após corte                              │  │
│  │  • Tempo de Construção: 240 meses (20 anos)              │  │
│  │  • Total Pago: R$ 15.788.171,07                          │  │
│  │  • Patrimônio Final: R$ 23.480.778,81                    │  │
│  │  • Eficiência do Modelo: 148.8%                          │  │
│  │  • Multiplicador Patrimonial: 1.49x                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Aba "Gráficos"

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 GRÁFICOS DA SIMULAÇÃO                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📈 EVOLUÇÃO DO PATRIMÔNIO TOTAL                          │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │     [Gráfico de Linha - Patrimônio ao longo do tempo]    │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💰 EVOLUÇÃO DO TOTAL PAGO                               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │     [Gráfico de Linha - Total Pago ao longo do tempo]    │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💵 EVOLUÇÃO DO CAIXA                                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │     [Gráfico de Área - Caixa ao longo do tempo]          │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📊 COMPARATIVO: TOTAL PAGO VS PATRIMÔNIO                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │     [Gráfico de Barras Comparativo]                      │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🎯 ACÚMULO DE COTAS CONTEMPLADAS                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │     [Gráfico de Barras - Cotas contempladas]             │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💸 RECEITA COM VENDAS DE CARTAS                          │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │     [Gráfico de Linha - Receita de vendas]                │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Aba "Configuração" (Ajustes)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ CONFIGURAÇÕES DA SIMULAÇÃO                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Mantém a estrutura atual, adiciona:]                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💰 DESTINO DO DINHEIRO DAS VENDAS                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  Quando uma cota é vendida, o dinheiro será usado para: │  │
│  │                                                           │  │
│  │  ☑ Pagar Parcelas        [___]%                          │  │
│  │  ☐ Reinvestir            [___]%                          │  │
│  │  ☐ Aplicar CDI           [___]%                          │  │
│  │                                                           │  │
│  │  Total: 100%                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ REGRAS DE NEGÓCIO IMPORTANTES

### 5.1 Armazenamento de Eventos

- Todos os eventos mensais devem ser armazenados (pagamento, contemplação, venda, aplicação, reinvestimento, corte)
- Cada evento deve ter: tipo, descrição, valor, mês, cota relacionada (se aplicável)
- Eventos devem ser consultáveis para gerar relatórios e gráficos

### 5.2 Exportação

- **PDF**: Relatório completo com todos os indicadores, gráficos e timeline
- **Excel**: Planilha com:
  - Aba 1: Indicadores principais
  - Aba 2: Fluxo de vendas (tabela completa)
  - Aba 3: Timeline mensal (todos os meses)
  - Aba 4: Eventos detalhados

### 5.3 Validações

- Soma dos percentuais de destino do dinheiro deve ser 100%
- Mês de corte deve ser menor que prazo total (240 meses)
- Intervalo de contemplação deve ser > 0
- Taxa de intermediação deve ser >= 0 e <= 100%
- Percentual de venda deve ser > 0 e <= 100%

---

## 6️⃣ EXPERIÊNCIA DO USUÁRIO (UX)

### 6.1 Design

- **Tema**: Dark, clean, executivo (fintech premium)
- **Cores**: 
  - Primária: Vermelho (#DC2626) - Prospere
  - Sucesso: Verde (#10B981)
  - Informação: Azul (#3B82F6)
  - Aviso: Amarelo (#F59E0B)
  - Erro: Vermelho (#EF4444)

### 6.2 Cards

- Cards grandes, claros e comparativos
- Destaque visual para:
  - "Quanto paguei" (vermelho/laranja)
  - "Quanto construí" (verde)
  - "Quanto custou esse patrimônio" (azul/ciano)

### 6.3 Frases Automáticas

- Gerar frases explicativas baseadas nos resultados
- Exemplos:
  - "Você construiu um patrimônio de R$ X pagando efetivamente R$ Y."
  - "Seu patrimônio cresceu X% acima do total investido."
  - "Cada real de patrimônio custou R$ Y."

### 6.4 Interatividade

- Gráficos interativos (hover, zoom, filtros)
- Timeline clicável (ver detalhes do mês)
- Tabela de vendas com paginação e busca
- Exportação em um clique

---

## 7️⃣ DIFERENCIAL - RESUMO ESTRATÉGICO

O resumo estratégico deve ser gerado automaticamente com base nos resultados e incluir:

1. **Estratégia Utilizada**: Descrição da estratégia escolhida
2. **Tempo de Construção**: Período total da simulação
3. **Total Pago**: Valor total investido
4. **Patrimônio Final**: Valor acumulado ao final
5. **Eficiência do Modelo**: (Patrimônio Final / Total Pago) * 100
6. **Multiplicador Patrimonial**: Patrimônio Final / Total Pago

---

## 8️⃣ PRÓXIMOS PASSOS

1. ✅ Documentação completa criada
2. ⏳ Implementar novo modelo de dados
3. ⏳ Criar componentes de interface
4. ⏳ Implementar lógica financeira
5. ⏳ Criar gráficos interativos
6. ⏳ Implementar exportação (PDF/Excel)
7. ⏳ Testes e validações
8. ⏳ Deploy

---

**Documento criado em:** 2026-01-13  
**Versão:** 1.0  
**Autor:** Sistema de Especificação Prospere
