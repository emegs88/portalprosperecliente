# VERSÃO TURBO - Simulador de Acúmulo de Patrimônio
## Planejamento Completo

---

## 1. PROPOSTA DE ARQUITETURA

### 1.1 Estrutura de Pastas
```
projeto-cliente-prospere/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx (dashboard principal)
│   │   │   └── simulations/
│   │   │       ├── page.tsx (lista de simulações)
│   │   │       ├── [id]/
│   │   │       │   └── page.tsx (detalhes da simulação)
│   │   │       └── new/
│   │   │           └── page.tsx (criar nova simulação)
│   │   ├── quotas/
│   │   │   └── page.tsx (gerenciar cotas)
│   │   └── reports/
│   │       └── page.tsx (relatórios)
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   ├── quotas/
│   │   │   ├── route.ts (GET, POST)
│   │   │   └── [id]/
│   │   │       └── route.ts (GET, PUT, DELETE)
│   │   ├── simulations/
│   │   │   ├── route.ts (GET lista, POST criar)
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts (GET, PUT, DELETE)
│   │   │   │   └── run/
│   │   │   │       └── route.ts (POST executar simulação)
│   │   │   └── [id]/
│   │   │       ├── snapshots/
│   │   │       │   └── route.ts (GET snapshots mensais)
│   │   │       └── events/
│   │   │           └── route.ts (GET eventos)
│   │   ├── indices/
│   │   │   ├── cdi/
│   │   │   │   └── route.ts
│   │   │   ├── incc/
│   │   │   │   └── route.ts
│   │   │   └── update/
│   │   │       └── route.ts (endpoint protegido para job)
│   │   └── compare/
│   │       └── route.ts (comparar 2 simulações)
│   └── cron/
│       └── update-indices/
│           └── route.ts (Vercel cron job)
│
├── components/
│   ├── dashboard/
│   │   ├── DashboardTab.tsx
│   │   ├── CotasTab.tsx
│   │   ├── SimulacoesTab.tsx (refatorado)
│   │   ├── HistoricoTab.tsx (NOVO)
│   │   └── RelatoriosTab.tsx (NOVO)
│   ├── simulation/
│   │   ├── ConfiguracaoTab.tsx
│   │   ├── ResultadosTab.tsx
│   │   ├── GraficosTab.tsx
│   │   ├── AcumulacaoTab.tsx
│   │   ├── FluxoVendasTable.tsx
│   │   └── ComparativoIndices.tsx
│   └── shared/
│       ├── SaveSimulationDialog.tsx
│       └── CompareSimulations.tsx
│
├── lib/
│   ├── services/
│   │   ├── simulatorEngine.ts (motor de simulação)
│   │   ├── indicesService.ts (buscar índices)
│   │   ├── indicesProvider.ts (adapters CDI/INCC)
│   │   └── exportUtils.ts (PDF/Excel)
│   ├── hooks/
│   │   ├── useIndices.ts
│   │   ├── useSimulation.ts
│   │   └── useSimulationHistory.ts
│   ├── validations/
│   │   └── simulationSchema.ts (Zod)
│   ├── prisma/
│   │   └── client.ts (singleton)
│   └── auth.ts (NextAuth config)
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── scripts/
│   ├── seed.ts
│   └── update-indices.ts (job manual)
│
└── docs/
    ├── VERSAO_TURBO_PLANEJAMENTO.md (este arquivo)
    └── API.md
```

### 1.2 Módulos Principais

**A. Módulo de Autenticação**
- NextAuth.js com Credentials Provider
- OAuth opcional (Google, GitHub)
- RBAC: User, Admin
- Middleware de proteção de rotas

**B. Módulo de Cotas**
- CRUD completo de cotas por usuário
- Importação em massa (PDF/Excel) já existente
- Validação de dados

**C. Módulo de Simulação**
- Criar/Editar/Deletar simulações
- Executar simulação (motor)
- Salvar resultados (snapshots + eventos)
- Duplicar simulação
- Compartilhar (opcional, futuro)

**D. Módulo de Índices (MarketData)**
- Provider pattern para múltiplas fontes
- Cache em DB com TTL
- Job diário para atualizar
- Fallback manual

**E. Módulo de Histórico e Comparação**
- Listar simulações executadas
- Comparar 2 execuções (diff + gráfico)
- Filtros e busca

**F. Módulo de Relatórios**
- Export PDF (jspdf + react-pdf)
- Export Excel (xlsx)
- Resumo executivo automático

---

## 2. SCHEMA PRISMA COMPLETO

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTENTICAÇÃO
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String? // hashed
  role          UserRole  @default(USER)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relacionamentos
  quotas        Quota[]
  simulations   Simulation[]
  accounts      Account[]
  sessions      Session[]

  @@index([email])
  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================
// COTAS
// ============================================

model Quota {
  id              String   @id @default(cuid())
  userId          String
  grupo           String
  cota            String
  versao          String
  dataVenda       DateTime?
  situacaoCobranca String
  contemplacao    String
  percentPago     Float    @default(0)
  percentAtraso   Float    @default(0)
  percentFundoComum Float  @default(0)
  pclsPagar       Int      @default(0)
  pclsPagas       Int      @default(0)
  pclsPagasEmDia  Int      @default(0)
  pclsPagasAtraso Int      @default(0)
  pclsEmAtraso    Int      @default(0)
  vlBem           Float    @default(0)
  vlParcela       Float    @default(0)
  vlQuitacao      Float    @default(0)
  vlReceber       Float    @default(0)
  tipoBem         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([grupo, cota])
  @@map("quotas")
}

// ============================================
// SIMULAÇÕES
// ============================================

model Simulation {
  id            String   @id @default(cuid())
  userId        String
  name          String   @default("Simulação Sem Nome")
  description   String?
  isFavorite    Boolean  @default(false)
  isTemplate    Boolean  @default(false) // para templates compartilhados
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Parâmetros da simulação (JSON)
  params        Json // SimulationParams

  // Relacionamentos
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  runs          SimulationRun[]

  @@index([userId])
  @@index([userId, isFavorite])
  @@map("simulations")
}

model SimulationRun {
  id            String   @id @default(cuid())
  simulationId  String
  name          String?
  executedAt    DateTime @default(now())
  
  // Parâmetros usados nesta execução (snapshot)
  params        Json // SimulationParams
  
  // Cotas usadas (IDs)
  quotaIds      String[]
  
  // Resultados agregados
  patrimonioFinal      Float   @default(0)
  totalPagoParcelas    Float   @default(0)
  totalPagoBolso       Float   @default(0)
  totalRecebidoVendas  Float   @default(0)
  caixaFinalInvestido  Float   @default(0)
  custoPatrimonio      Float   @default(0)
  roi                  Float   @default(0)
  multiplicadorPatrimonial Float @default(0)
  custoPorReal         Float   @default(0)
  numContemplacoes     Int     @default(0)
  numVendas            Int     @default(0)
  cotasAtivasFinal     Int     @default(0)
  
  // Comparação com índices
  comparacaoCdi        Json? // Comparacao
  comparacaoPoupanca   Json? // Comparacao
  
  // Resumo textual
  resumoTexto          String? @db.Text
  
  // Relacionamentos
  simulation    Simulation       @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  snapshots     MonthlySnapshot[]
  events        EventLog[]

  @@index([simulationId])
  @@index([executedAt])
  @@map("simulation_runs")
}

model MonthlySnapshot {
  id                String   @id @default(cuid())
  simulationRunId   String
  mes               Int
  mesLabel          String
  
  // Estado do mês
  parcelasPagas     Int      @default(0)
  valorParcelas     Float    @default(0)
  contemplacoes     Int      @default(0)
  vendas            Int      @default(0)
  valorVendas       Float    @default(0)
  caixa             Float    @default(0)
  caixaInvestido    Float    @default(0)
  patrimonio        Float    @default(0)
  creditoAtualizado Float    @default(0)
  totalPago         Float    @default(0)
  totalPagoBolso    Float    @default(0)
  
  // Comparação acumulada
  cdiAcumulado      Float?
  poupancaAcumulado Float?
  
  createdAt         DateTime @default(now())

  simulationRun SimulationRun @relation(fields: [simulationRunId], references: [id], onDelete: Cascade)

  @@unique([simulationRunId, mes])
  @@index([simulationRunId])
  @@map("monthly_snapshots")
}

model EventLog {
  id            String   @id @default(cuid())
  simulationRunId String
  tipo          EventType
  mes           Int
  cotaId        String?
  cotaGrupo     String?
  cotaNumero    String?
  valor         Float    @default(0)
  descricao     String
  destino       String? // "CDI", "pagar", "imovel", etc
  metadata      Json? // dados extras
  createdAt     DateTime @default(now())

  simulationRun SimulationRun @relation(fields: [simulationRunId], references: [id], onDelete: Cascade)

  @@index([simulationRunId])
  @@index([simulationRunId, mes])
  @@index([simulationRunId, tipo])
  @@map("event_logs")
}

enum EventType {
  PAGAMENTO
  CONTEMPLACAO
  VENDA
  APLICACAO
  REINVESTIMENTO
}

// ============================================
// ÍNDICES FINANCEIROS (MARKET DATA)
// ============================================

model IndexSeries {
  id            String   @id @default(cuid())
  tipo          IndexType
  data          DateTime
  valor         Float
  fonte         String   @default("manual") // "manual", "bcb", "ibge", etc
  periodo       String   @default("monthly") // "monthly", "annual"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([tipo, data, periodo])
  @@index([tipo, data])
  @@index([tipo, updatedAt])
  @@map("index_series")
}

enum IndexType {
  CDI
  INCC
  POUPANCA
  SELIC
  IPCA
}

// ============================================
// RELATÓRIOS E EXPORTS
// ============================================

model Report {
  id            String   @id @default(cuid())
  userId        String
  simulationRunId String
  tipo          ReportType
  formato       String   @default("pdf") // "pdf", "excel"
  arquivoUrl    String?  // S3/Storage URL (futuro)
  params        Json?    // parâmetros do relatório
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([simulationRunId])
  @@map("reports")
}

enum ReportType {
  RESUMO_EXECUTIVO
  FLUXO_COMPLETO
  COMPARATIVO_INDICES
  ANALISE_DETALHADA
}
```

---

## 3. CONTRATOS TYPESCRIPT

```typescript
// lib/types/simulation.ts

export interface SimulationParams {
  cotasSelecionadas: string[]
  mesesSimulacao: number
  intervaloContemplacao: number
  percentVendaContemplada: number
  taxaIntermediacao: number
  taxaAdministracao?: number
  fundoReserva?: number
  inccConfig: {
    fonte: 'manual' | 'api'
    valorMensal: number
  }
  cdiConfig: {
    fonte: 'manual' | 'api'
    valorMensal: number
  }
  poupancaConfig?: {
    fonte: 'manual' | 'api'
    valorAnual: number
  }
  estrategiaPosVenda: 'vender' | 'investir' | 'comprarImovel'
  mesCorte?: number
  correcaoParcela: boolean
  correcaoCredito: boolean
  indiceCorrecao: 'INCC' | 'IPCA'
}

export interface Quota {
  id: string
  userId: string
  grupo: string
  cota: string
  versao: string
  vlBem: number
  vlParcela: number
  vlReceber: number
  percentPago: number
  contemplacao: string
  pclsPagar: number
  pclsPagas: number
}

export interface MonthlySnapshot {
  mes: number
  mesLabel: string
  parcelasPagas: number
  valorParcelas: number
  contemplacoes: number
  vendas: number
  valorVendas: number
  caixa: number
  caixaInvestido: number
  patrimonio: number
  creditoAtualizado: number
  totalPago: number
  totalPagoBolso: number
  cdiAcumulado?: number
  poupancaAcumulado?: number
  eventos: EventLog[]
}

export interface EventLog {
  tipo: 'PAGAMENTO' | 'CONTEMPLACAO' | 'VENDA' | 'APLICACAO' | 'REINVESTIMENTO'
  mes: number
  cotaId?: string
  cotaGrupo?: string
  cotaNumero?: string
  valor: number
  descricao: string
  destino?: string
  metadata?: Record<string, any>
}

export interface SimulationResult {
  patrimonioFinal: number
  totalPagoParcelas: number
  totalPagoBolso: number
  totalRecebidoVendas: number
  caixaFinalInvestido: number
  custoPatrimonio: number
  roi: number
  multiplicadorPatrimonial: number
  custoPorReal: number
  numContemplacoes: number
  numVendas: number
  cotasAtivasFinal: number
  resultadosMensais: MonthlySnapshot[]
  eventos: EventLog[]
  comparacao: Comparacao
  resumoTexto: string
}

export interface Comparacao {
  cdiFinal: number
  poupancaFinal: number
  diferencaCdi: number
  diferencaPoupanca: number
  percentDiferencaCdi: number
  percentDiferencaPoupanca: number
}
```

---

## 4. PSEUDOCÓDIGO DO MOTOR MENSAL

```typescript
function simulatePatrimonioAccumulation(
  cotas: Quota[],
  params: SimulationParams,
  indices: IndicesData
): SimulationResult {
  
  // INICIALIZAÇÃO
  estado = {
    patrimonio: 0,
    caixa: 0,
    caixaInvestido: 0,
    totalPago: 0,
    totalPagoBolso: 0,
    totalRecebido: 0,
    cotasAtivas: cotas.filter(não_contempladas),
    cotasContempladas: [],
    eventos: [],
    resultadosMensais: []
  }
  
  valoresBase = calcularValoresBase(cotas)
  
  // LOOP MENSAL
  for mes = 1 to params.mesesSimulacao {
    indicesMes = obterIndices(mes, indices)
    
    // 1. ATUALIZAR CRÉDITO (se correção ativada)
    if params.correcaoCredito {
      creditoAcumulado *= (1 + indicesMes.incc / 100)
    }
    
    // 2. PAGAR PARCELAS
    vlParcelaMes = calcularParcela(valoresBase.parcelaBase, mes, params, indicesMes)
    valorParcelas = vlParcelaMes * estado.cotasAtivas.length
    estado.totalPago += valorParcelas
    
    // Abater do caixa se estratégia "pagar"
    if params.estrategiaPosVenda === 'vender' && estado.caixa > 0 {
      abatimento = min(estado.caixa, valorParcelas)
      estado.totalPagoBolso += valorParcelas - abatimento
      estado.caixa -= abatimento
    } else {
      estado.totalPagoBolso += valorParcelas
    }
    
    registrarEvento('PAGAMENTO', mes, -valorParcelas, 'Pagamento de parcelas')
    
    // 3. CONTEMPLAÇÕES (se for o mês)
    if mes % params.intervaloContemplacao === 0 && estado.cotasAtivas.length > 0 {
      numContemplacoes = max(1, floor(estado.cotasAtivas.length * 0.1))
      contempladas = estado.cotasAtivas.slice(0, numContemplacoes)
      
      estado.cotasAtivas = estado.cotasAtivas.slice(numContemplacoes)
      estado.cotasContempladas.push(...contempladas)
      
      registrarEvento('CONTEMPLACAO', mes, 0, `${contempladas.length} cota(s) contemplada(s)`)
      
      // 4. VENDER COTAS CONTEMPLADAS
      for cota in contempladas {
        vlBemAtualizado = params.correcaoCredito 
          ? cota.vlBem * pow(1 + indicesMes.incc / 100, mes)
          : cota.vlBem
        
        valorVendaBruto = vlBemAtualizado * (params.percentVendaContemplada / 100)
        taxaIntermediacaoValor = valorVendaBruto * (params.taxaIntermediacao / 100)
        valorLiquido = valorVendaBruto - taxaIntermediacaoValor
        
        estado.totalRecebido += valorLiquido
        estado.caixa += valorLiquido
        
        registrarEvento('VENDA', mes, valorLiquido, `Venda cota ${cota.grupo}-${cota.cota}`, params.estrategiaPosVenda)
      }
    }
    
    // 5. APLICAR ESTRATÉGIA PÓS-VENDA
    if params.estrategiaPosVenda === 'investir' && estado.caixa > 0 {
      rendimento = estado.caixa * (indicesMes.cdi / 100)
      estado.caixaInvestido += rendimento
      estado.caixa *= (1 + indicesMes.cdi / 100)
      
      registrarEvento('APLICACAO', mes, rendimento, `Rendimento CDI ${indicesMes.cdi}%`, 'CDI')
    } else if params.estrategiaPosVenda === 'comprarImovel' && estado.caixa > 0 {
      valorizacao = estado.caixa * (indicesMes.incc / 100)
      estado.patrimonio += estado.caixa
      estado.caixa = 0
      
      registrarEvento('REINVESTIMENTO', mes, valorizacao, `Compra imóvel (valorização INCC)`, 'imovel')
    }
    
    // 6. CALCULAR COMPARAÇÃO COM CDI/POUPANÇA
    comparacaoCdi = simularCDI(estado.totalPagoBolso, mes, indicesMes.cdi)
    comparacaoPoupanca = simularPoupanca(estado.totalPagoBolso, mes, indicesMes.poupanca)
    
    // 7. ATUALIZAR PATRIMÔNIO
    patrimonioCotas = calcularPatrimonioCotas(estado.cotasAtivas, mes, params, indicesMes)
    estado.patrimonio = patrimonioCotas + estado.caixa + estado.caixaInvestido
    
    // 8. SALVAR SNAPSHOT MENSAL
    snapshot = {
      mes,
      mesLabel: `Mês ${mes}`,
      parcelasPagas: estado.cotasAtivas.length,
      valorParcelas,
      contemplacoes: contempladas?.length || 0,
      vendas: contempladas?.length || 0,
      valorVendas: contempladas ? estado.totalRecebido : 0,
      caixa: estado.caixa,
      caixaInvestido: estado.caixaInvestido,
      patrimonio: estado.patrimonio,
      creditoAtualizado: creditoAcumulado,
      totalPago: estado.totalPago,
      totalPagoBolso: estado.totalPagoBolso,
      cdiAcumulado: comparacaoCdi,
      poupancaAcumulado: comparacaoPoupanca,
      eventos: eventosDoMes(mes)
    }
    
    estado.resultadosMensais.push(snapshot)
  }
  
  // CALCULAR RESULTADOS FINAIS
  resultado = {
    patrimonioFinal: estado.patrimonio,
    totalPagoParcelas: estado.totalPago,
    totalPagoBolso: estado.totalPagoBolso,
    totalRecebidoVendas: estado.totalRecebido,
    caixaFinalInvestido: estado.caixaInvestido,
    custoPatrimonio: estado.totalPagoBolso,
    roi: calcularROI(estado.patrimonio, estado.totalPagoBolso),
    multiplicadorPatrimonial: calcularMultiplicador(estado.patrimonio, estado.totalPagoBolso),
    custoPorReal: calcularCustoPorReal(estado.totalPagoBolso, estado.patrimonio),
    numContemplacoes: estado.cotasContempladas.length,
    numVendas: estado.cotasContempladas.length,
    cotasAtivasFinal: estado.cotasAtivas.length,
    resultadosMensais: estado.resultadosMensais,
    eventos: estado.eventos,
    comparacao: calcularComparacaoFinal(estado.resultadosMensais, params, indices),
    resumoTexto: gerarResumoTexto(resultado)
  }
  
  return resultado
}
```

---

## 5. CHECKLIST DE MIGRAÇÃO DO FRONT ATUAL

### Fase 1: Preparação (não quebra nada)
- [ ] Criar schema Prisma completo
- [ ] Rodar migrations
- [ ] Atualizar lib/prisma/client.ts
- [ ] Criar tipos TypeScript
- [ ] Criar validations com Zod

### Fase 2: Auth (não quebra front atual)
- [ ] Configurar NextAuth completamente
- [ ] Criar páginas login/register
- [ ] Middleware de proteção
- [ ] Testar login/logout

### Fase 3: Backend APIs (incremental)
- [ ] API de cotas (já existe, ajustar)
- [ ] API de simulações (CRUD)
- [ ] API de execução de simulação
- [ ] API de índices (já existe, melhorar)

### Fase 4: Refatorar SimulacoesTab (compatível)
- [ ] Manter estrutura atual funcionando
- [ ] Adicionar botão "Salvar Simulação"
- [ ] Adicionar integração com novo motor
- [ ] Adicionar tab "Histórico"
- [ ] Adicionar tab "Relatórios"

### Fase 5: Novos Componentes
- [ ] SaveSimulationDialog
- [ ] HistoricoTab (lista de simulações)
- [ ] CompareSimulations (comparar 2 execuções)
- [ ] RelatoriosTab (export PDF/Excel)

### Fase 6: Índices Automáticos
- [ ] Provider pattern implementado
- [ ] Job diário (Vercel cron)
- [ ] Cache em DB
- [ ] UI com toggle automático/manual

### Fase 7: Polimento
- [ ] Validações Zod em todas as APIs
- [ ] Rate limiting
- [ ] Logs e auditoria
- [ ] Testes unitários do motor
- [ ] Otimizações de performance

---

## 6. ROADMAP EM ETAPAS (COMMITS PEQUENOS)

### **Etapa 1: Banco + Auth + CRUD de Cotas**
**Commits:**
1. `feat(db): adicionar schema Prisma completo`
2. `feat(db): migrations iniciais`
3. `feat(auth): configurar NextAuth com Credentials`
4. `feat(auth): páginas login e register`
5. `feat(api): ajustar CRUD de cotas para usar Prisma`
6. `test(auth): testar login e criação de usuário`

**Tempo estimado:** 4-6h

---

### **Etapa 2: Salvar Simulações + Motor + Persistir**
**Commits:**
1. `feat(api): CRUD de simulações (POST, GET, PUT, DELETE)`
2. `feat(engine): refatorar motor para retornar snapshots`
3. `feat(api): endpoint executar simulação e salvar resultados`
4. `feat(db): batch insert de snapshots e eventos`
5. `feat(ui): dialog salvar simulação`
6. `test(engine): testes unitários do motor`

**Tempo estimado:** 6-8h

---

### **Etapa 3: Resultados + Custo Patrimônio + Fluxo Vendas**
**Commits:**
1. `feat(ui): refatorar ResultadosTab com novos dados`
2. `feat(ui): cards de resumo executivo`
3. `feat(ui): seção custo do patrimônio`
4. `feat(ui): tabela fluxo de vendas`
5. `feat(ui): timeline de eventos`

**Tempo estimado:** 4-6h

---

### **Etapa 4: Gráficos + Comparativos CDI/Poupança**
**Commits:**
1. `feat(ui): gráfico evolução patrimônio`
2. `feat(ui): gráfico comparação CDI/Poupança`
3. `feat(ui): gráfico entradas vs saídas`
4. `feat(ui): gráfico crédito corrigido`
5. `feat(ui): otimizar performance dos gráficos`

**Tempo estimado:** 4-6h

---

### **Etapa 5: Índices Automáticos + Cache + Job**
**Commits:**
1. `feat(provider): adapter pattern para índices`
2. `feat(provider): implementar BCB provider (CDI/Selic)`
3. `feat(db): salvar séries de índices`
4. `feat(cache): TTL e atualização automática`
5. `feat(cron): job diário para atualizar índices`
6. `feat(ui): toggle automático/manual`

**Tempo estimado:** 6-8h

---

### **Etapa 6: Histórico + Comparar Execuções**
**Commits:**
1. `feat(ui): HistoricoTab com lista de simulações`
2. `feat(ui): filtros e busca no histórico`
3. `feat(ui): componente comparar 2 simulações`
4. `feat(api): endpoint comparar simulações`
5. `feat(ui): gráfico sobreposto de comparação`

**Tempo estimado:** 4-6h

---

### **Etapa 7: Export PDF/Excel + Relatório Executivo**
**Commits:**
1. `feat(export): biblioteca para gerar PDF (jspdf)`
2. `feat(export): template de relatório PDF`
3. `feat(export): export Excel com xlsx`
4. `feat(export): relatório executivo automático`
5. `feat(ui): RelatoriosTab com downloads`

**Tempo estimado:** 6-8h

---

## TOTAL ESTIMADO: 34-48 horas de desenvolvimento

---

## DECISÕES TÉCNICAS IMPORTANTES

1. **Banco de Dados**: PostgreSQL (produção) + SQLite (dev local)
2. **Auth**: NextAuth.js (suporta OAuth futuro)
3. **Validação**: Zod (schema validation)
4. **PDF**: jsPDF ou react-pdf
5. **Excel**: xlsx (SheetJS)
6. **Cache**: DB primeiro, Redis opcional depois
7. **Jobs**: Vercel Cron (se Vercel) ou node-cron (self-hosted)
8. **Índices**: BCB SGS para CDI/Selic, INCC manual até ter API

---

## PRÓXIMOS PASSOS

1. ✅ Aprovar este planejamento
2. ⏳ Implementar Etapa 1 (Banco + Auth)
3. ⏳ Implementar Etapa 2 (Motor + Persistir)
4. ⏳ Continuar etapas sequenciais

---

**Data:** 2026-01-18
**Versão:** 1.0
**Status:** Planejamento completo ✅
