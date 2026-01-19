# 📐 BLUEPRINT TURBO - Ecossistema Prospere

**Data:** 2026-01-18  
**Versão:** 1.0  
**Status:** 🚧 Em Construção

---

## 1️⃣ ESTRUTURA DE PASTAS PROPOSTA

```
projeto-cliente-prospere/
├── app/
│   ├── (auth)/                    # Rotas públicas de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   │
│   ├── (public)/                  # Rotas públicas (sem auth)
│   │   ├── page.tsx               # Landing page
│   │   ├── como-funciona/
│   │   ├── glossario/
│   │   ├── experiencias/
│   │   │   ├── page.tsx           # Lista de experiências
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # Detalhes + reserva
│   │   └── comparador/
│   │       └── page.tsx           # Comparador educativo
│   │
│   ├── (dashboard)/               # Rotas protegidas por auth
│   │   ├── dashboard/             # Portal do Cliente
│   │   │   ├── page.tsx           # Dashboard principal
│   │   │   ├── minhas-cotas/
│   │   │   ├── timeline/
│   │   │   └── patrimonio/
│   │   │
│   │   ├── vendas/                # Portal do Vendedor
│   │   │   ├── page.tsx
│   │   │   ├── minhas-vendas/
│   │   │   └── minhas-comissoes/
│   │   │
│   │   └── admin/                 # Portal Admin
│   │       ├── page.tsx           # Dashboard admin
│   │       ├── clientes/
│   │       ├── vendas/
│   │       ├── experiencias/
│   │       ├── comissoes/
│   │       ├── relatorios/
│   │       └── config/
│   │
│   ├── simulador/                 # SIMULADORES (SANDBOX)
│   │   ├── page.tsx               # Hub de simuladores
│   │   ├── sorteio/               # ✅ Já existe
│   │   ├── imoveis/
│   │   │   ├── page.tsx
│   │   │   ├── configuracao/
│   │   │   ├── simulacao/
│   │   │   └── resultados/
│   │   ├── veiculos/
│   │   ├── frota/
│   │   ├── lance/
│   │   └── acumulo-patrimonio/    # ✅ Já existe parcialmente
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/    # ✅ Já existe
│   │   │
│   │   ├── simulation/            # SANDBOX - Simulações
│   │   │   ├── projects/          # CRUD de projetos
│   │   │   ├── runs/              # Executar simulação
│   │   │   ├── snapshots/         # Snapshots mensais
│   │   │   └── compare/           # Comparar 2 simulações
│   │   │
│   │   ├── core/                  # CORE REAL - Dados reais
│   │   │   ├── quotas/            # ✅ Já existe (separar?)
│   │   │   ├── sales/             # ✅ Já existe
│   │   │   ├── clients/
│   │   │   └── timeline/
│   │   │
│   │   ├── commission/            # COMISSÕES
│   │   │   ├── rules/             # CRUD regras
│   │   │   ├── calculate/         # Calcular comissão
│   │   │   ├── reconcile/         # Conciliação CSV
│   │   │   └── payouts/           # Repasses
│   │   │
│   │   ├── experience/            # ✅ Já existe
│   │   │   ├── route.ts
│   │   │   └── [slug]/
│   │   │
│   │   ├── club/                  # ✅ Já existe
│   │   │   └── status/
│   │   │
│   │   ├── reservations/          # ✅ Já existe
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │
│   │   ├── admin/                 # Admin APIs
│   │   │   ├── dashboard/
│   │   │   ├── funil/
│   │   │   └── reports/
│   │   │
│   │   └── indices/               # ✅ Já existe
│   │       ├── cdi/
│   │       ├── incc/
│   │       └── poupanca/
│   │
│   └── layout.tsx
│
├── lib/
│   ├── domain/
│   │   ├── simulation/            # SANDBOX Domain
│   │   │   ├── services/
│   │   │   │   ├── simulatorEngine.ts      # Motor de simulação
│   │   │   │   ├── snapshotGenerator.ts    # Gerar snapshots
│   │   │   │   └── comparisonService.ts    # Comparar simulações
│   │   │   ├── types/
│   │   │   │   └── simulation.ts
│   │   │   └── validators/
│   │   │       └── simulationSchema.ts
│   │   │
│   │   ├── core/                  # CORE REAL Domain
│   │   │   ├── services/
│   │   │   │   ├── quotaService.ts         # Cotas reais
│   │   │   │   ├── saleService.ts          # Vendas reais
│   │   │   │   └── timelineService.ts      # Timeline mensal
│   │   │   ├── types/
│   │   │   │   └── core.ts
│   │   │   └── validators/
│   │   │       └── coreSchema.ts
│   │   │
│   │   ├── commission/            # COMISSÕES Domain
│   │   │   ├── services/
│   │   │   │   ├── commissionCalculator.ts # Calcular comissão
│   │   │   │   ├── reconciliationService.ts # Conciliação CSV
│   │   │   │   └── payoutService.ts        # Repasses
│   │   │   ├── types/
│   │   │   │   └── commission.ts
│   │   │   └── validators/
│   │   │       └── commissionSchema.ts
│   │   │
│   │   ├── experience/            # EXPERIÊNCIAS Domain
│   │   │   ├── services/
│   │   │   │   ├── experienceService.ts    # CRUD experiências
│   │   │   │   ├── reservationService.ts   # Reservas
│   │   │   │   └── checkinService.ts       # Check-in QR
│   │   │   ├── types/
│   │   │   │   └── experience.ts
│   │   │   └── validators/
│   │   │       └── experienceSchema.ts
│   │   │
│   │   └── admin/                 # ADMIN Domain
│   │       ├── services/
│   │       │   ├── dashboardService.ts     # KPIs
│   │       │   ├── funilService.ts         # Funil de vendas
│   │       │   └── reportService.ts        # Relatórios
│   │       └── types/
│   │           └── admin.ts
│   │
│   ├── services/                  # Services compartilhados
│   │   ├── emailService.ts        # ✅ Já existe
│   │   ├── qrService.ts           # ✅ Já existe
│   │   ├── pdfParser*.ts          # ✅ Já existe
│   │   └── indicesService.ts      # ✅ Já existe
│   │
│   ├── utils/
│   │   ├── validation.ts
│   │   └── performance.ts
│   │
│   ├── auth.ts                    # ✅ Já existe
│   └── prisma.ts                  # ✅ Já existe
│
├── components/
│   ├── dashboard/                 # ✅ Já existe
│   ├── simulador/                 # ✅ Já existe
│   ├── experience/                # ✅ Já existe
│   ├── admin/                     # Novos componentes admin
│   │   ├── DashboardStats.tsx
│   │   ├── FunilVisual.tsx
│   │   └── ReconciliationTable.tsx
│   └── ui/                        # ✅ Já existe (shadcn/ui)
│
├── config/
│   ├── commissionPlan.json        # ✅ Já existe
│   ├── clubLevels.json            # ✅ Já existe
│   ├── drawSimConfig.json         # ✅ Já existe
│   ├── simulators.json            # ⏳ Novo
│   └── experienceTemplates.json   # ⏳ Novo
│
├── middleware.ts                  # ✅ Já existe (ajustar para separação)
├── prisma/
│   └── schema.prisma              # ✅ Já existe (ajustar separação)
└── types/
    ├── simulation/                # ✅ Já existe parcialmente
    └── core/                      # ⏳ Novo
```

---

## 2️⃣ LISTA DE ROTAS/TELAS

### **CLIENTE** (`role: CLIENTE`)

| Rota | Descrição | Status |
|------|-----------|--------|
| `/dashboard` | Dashboard principal (cotas, KPIs, resumo) | ✅ Existe |
| `/dashboard/minhas-cotas` | Lista de cotas reais | ✅ Existe |
| `/dashboard/timeline` | Timeline mensal (pagamentos, contemplações) | ⏳ Falta |
| `/dashboard/patrimonio` | Simulador de acúmulo patrimonial | ✅ Existe parcial |
| `/dashboard/prospere-club` | Nível do clube, benefícios | ✅ Existe |
| `/experiencias` | Lista de experiências disponíveis | ✅ Existe |
| `/experiencias/[slug]` | Detalhes + reserva | ✅ Existe |
| `/simulador` | Hub de simuladores | ⏳ Falta |
| `/simulador/imoveis` | Simulador imóveis (tranches+garantia) | ⏳ Falta |
| `/simulador/veiculos` | Simulador veículos | ⏳ Falta |
| `/simulador/frota` | Simulador frota garantida | ⏳ Falta |
| `/simulador/lance` | Simulador lance (embutido vs livre) | ⏳ Falta |
| `/simulador/acumulo-patrimonio` | Simulador acúmulo (melhorado) | ⏳ Melhorar |
| `/simulador/sorteio` | Simulador sorteio educativo | ✅ Existe |
| `/comparador` | Comparador CDI/Poupança/INCC | ⏳ Falta |

### **VENDEDOR** (`role: VENDEDOR`)

| Rota | Descrição | Status |
|------|-----------|--------|
| `/vendas` | Dashboard vendedor | ⏳ Falta |
| `/vendas/minhas-vendas` | Lista de vendas do vendedor | ⏳ Falta |
| `/vendas/nova-venda` | Cadastrar nova venda | ⏳ Falta |
| `/vendas/minhas-comissoes` | Comissões do vendedor | ⏳ Falta |

### **ADMIN** (`role: ADMIN`)

| Rota | Descrição | Status |
|------|-----------|--------|
| `/admin` | Dashboard admin (KPIs, funil) | ⏳ Falta |
| `/admin/clientes` | Lista de clientes | ⏳ Falta |
| `/admin/clientes/[id]` | Perfil completo do cliente | ⏳ Falta |
| `/admin/vendas` | Funil de vendas completo | ⏳ Falta |
| `/admin/vendas/[id]` | Detalhes da venda | ⏳ Falta |
| `/admin/experiencias` | CRUD de experiências | ✅ Existe parcial |
| `/admin/experiencias/[id]` | Editar experiência | ⏳ Falta |
| `/admin/reservas` | Lista de reservas | ⏳ Falta |
| `/admin/comissoes` | Regras e entradas de comissão | ⏳ Falta |
| `/admin/comissoes/conciliar` | Conciliação CSV | ⏳ Falta |
| `/admin/comissoes/repasses` | Repasses | ⏳ Falta |
| `/admin/ranking` | Ranking vendedores/parceiros | ⏳ Falta |
| `/admin/relatorios` | Relatórios exportáveis | ⏳ Falta |
| `/admin/config` | Configurações (JSON editáveis) | ✅ Existe parcial |

### **PÚBLICO** (sem auth)

| Rota | Descrição | Status |
|------|-----------|--------|
| `/` | Landing page | ✅ Existe básico |
| `/como-funciona` | Como funciona consórcio | ⏳ Falta |
| `/glossario` | Glossário educativo | ⏳ Falta |
| `/experiencias` | Lista pública de experiências | ⏳ Falta |
| `/experiencias/[slug]` | Detalhes públicos (sem reserva) | ⏳ Falta |

---

## 3️⃣ SCHEMA PRISMA COMPLETO

### **SIMULAÇÕES (SANDBOX)** - `simulation_*`

```prisma
// ============================================
// SIMULAÇÕES (SANDBOX) - NÃO MISTURAR COM REAL
// ============================================

model SimulationProject {
  id            String   @id @default(cuid())
  userId        String
  name          String   @default("Simulação Sem Nome")
  description   String?
  simulatorType String   // "IMOVEIS" | "VEICULOS" | "FROTA" | "LANCE" | "ACUMULO"
  isFavorite    Boolean  @default(false)
  isTemplate    Boolean  @default(false)
  isSimulation  Boolean  @default(true) // Flag de segurança
  params        String   // JSON SimulationParams
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  runs          SimulationRun[]

  @@index([userId])
  @@index([userId, simulatorType])
  @@map("simulation_projects")
}

model SimulationRun {
  id                       String   @id @default(cuid())
  simulationProjectId      String
  name                     String?
  executedAt               DateTime @default(now())
  isSimulation             Boolean  @default(true) // Flag de segurança
  params                   String   // JSON SimulationParams (snapshot do usado)
  quotaIds                 String   // JSON string[] - IDs simuladas (NÃO FK real)
  patrimonioFinal          Float    @default(0)
  totalPagoParcelas        Float    @default(0)
  totalPagoBolso           Float    @default(0)
  totalRecebidoVendas      Float    @default(0)
  caixaFinalInvestido      Float    @default(0)
  custoPatrimonio          Float    @default(0)
  roi                      Float    @default(0)
  multiplicadorPatrimonial Float    @default(0)
  custoPorReal             Float    @default(0)
  numContemplacoes         Int      @default(0)
  numVendas                Int      @default(0)
  cotasAtivasFinal         Int      @default(0)
  comparacaoCdi            String?  // JSON Comparacao
  comparacaoPoupanca       String?  // JSON Comparacao
  resumoTexto              String?

  simulationProject SimulationProject @relation(fields: [simulationProjectId], references: [id], onDelete: Cascade)
  snapshots         SimulationSnapshot[]
  events            SimulationEvent[]

  @@index([simulationProjectId])
  @@index([executedAt])
  @@map("simulation_runs")
}

model SimulationSnapshot {
  id                String   @id @default(cuid())
  simulationRunId   String
  mes               Int
  mesLabel          String
  isSimulation      Boolean  @default(true) // Flag de segurança
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
  cdiAcumulado      Float?
  poupancaAcumulado Float?
  createdAt         DateTime @default(now())

  simulationRun SimulationRun @relation(fields: [simulationRunId], references: [id], onDelete: Cascade)

  @@unique([simulationRunId, mes])
  @@index([simulationRunId])
  @@map("simulation_snapshots")
}

model SimulationEvent {
  id              String   @id @default(cuid())
  simulationRunId String
  tipo            String   // "PAGAMENTO" | "CONTEMPLACAO" | "VENDA" | "APLICACAO" | "REINVESTIMENTO"
  mes             Int
  cotaId          String?  // ID da cota simulada (NÃO FK real)
  cotaGrupo       String?
  cotaNumero      String?
  valor           Float    @default(0)
  descricao       String
  destino         String?
  metadata        String?  // JSON
  isSimulation    Boolean  @default(true) // Flag de segurança
  createdAt       DateTime @default(now())

  simulationRun SimulationRun @relation(fields: [simulationRunId], references: [id], onDelete: Cascade)

  @@index([simulationRunId])
  @@index([simulationRunId, mes])
  @@index([simulationRunId, tipo])
  @@map("simulation_events")
}
```

### **CORE REAL** - `quotas`, `sales`, etc (já existem, verificar)

```prisma
// JÁ EXISTE em schema.prisma:
// - Quota (cotas reais)
// - Sale (vendas reais)
// - ClientProfile
// - ImportBatch

// ADICIONAR separação clara:
// - Garantir que não há FK entre simulation_* e real_*
// - Adicionar flag isSimulation onde necessário
```

### **COMISSÕES** - `commission_*` (já existe, ajustar)

```prisma
// JÁ EXISTE em schema.prisma:
// - CommissionRule
// - CommissionEntry
// - Payout
// - PayoutEntry

// ADICIONAR:
model CommissionReconciliation {
  id              String   @id @default(cuid())
  uploadedAt      DateTime @default(now())
  uploadedBy      String
  filename        String
  totalRows       Int
  matchedEntries  Int
  unmatchedRows   String?  // JSON
  status          String   // "pending" | "reviewed" | "approved"
  notes           String?
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [uploadedBy], references: [id])

  @@index([uploadedAt])
  @@map("commission_reconciliations")
}
```

### **EXPERIÊNCIAS** - `experience_*` (já existe, verificar)

```prisma
// JÁ EXISTE em schema.prisma:
// - Experience
// - ExperienceDate
// - Reservation
// - Guest
// - ClubLevel
// - UserClubLevel
// - Badge
// - UserBadge
```

---

## 4️⃣ TYPES TYPESCRIPT PRINCIPAIS

```typescript
// lib/domain/simulation/types/simulation.ts

export interface SimulationParams {
  simulatorType: 'IMOVEIS' | 'VEICULOS' | 'FROTA' | 'LANCE' | 'ACUMULO'
  quotas: SimulationQuota[] // IDs simuladas, não reais
  prazo: number
  taxaContemplacao?: number
  estrategiaVenda?: 'IMMEDIATA' | 'MANTER' | 'REINVESTIR'
  aplicarCDI?: boolean
  // Imóveis específicos
  tranches?: Tranche[]
  garantia?: number
  // Lance específicos
  lanceEmbutido?: boolean
  valorLance?: number
}

export interface SimulationQuota {
  id: string // ID simulado (não FK real)
  grupo: string
  cota: string
  vlBem: number
  vlParcela: number
  percentPago: number
  contemplacao: string
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
  totalPago: number
  totalPagoBolso: number
  cdiAcumulado?: number
  poupancaAcumulado?: number
}

export interface SimulationEvent {
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
  snapshots: MonthlySnapshot[]
  events: SimulationEvent[]
  comparacaoCdi?: Comparacao
  comparacaoPoupanca?: Comparacao
}
```

```typescript
// lib/domain/commission/types/commission.ts

export interface CommissionRule {
  id: string
  name: string
  levelId?: string
  productType?: string
  baseRate: number
  splitRules: {
    seller: number
    leader?: number
    partner?: number
  }
  bonusRules?: {
    minCredit?: number
    bonusRate?: number
  }
  validFrom: Date
  validUntil?: Date
  isActive: boolean
}

export interface CommissionEntry {
  id: string
  saleId: string
  userId: string
  role: 'seller' | 'leader' | 'partner'
  baseAmount: number
  rate: number
  amount: number
  bonus: number
  total: number
  status: 'pending' | 'confirmed' | 'paid'
  paidAt?: Date
  payoutId?: string
}

export interface ReconciliationRow {
  saleId: string
  creditAmount: number
  commissionAmount: number
  date: Date
  matched: boolean
  commissionEntryId?: string
}
```

---

## 5️⃣ PSEUDOCÓDIGO DO MOTOR DE SIMULAÇÃO

```typescript
async function runSimulation(params: SimulationParams): Promise<SimulationResult> {
  // 1. VALIDAR PARAMS
  validateParams(params)
  
  // 2. INICIALIZAR
  let caixa = 0
  let patrimonio = 0
  let totalPago = 0
  let totalPagoBolso = 0
  let totalRecebidoVendas = 0
  const snapshots: MonthlySnapshot[] = []
  const events: SimulationEvent[] = []
  const quotas = params.quotas.map(q => ({ ...q, contemplada: false }))

  // 3. OBTER ÍNDICES (se aplicável)
  const cdiSeries = params.aplicarCDI ? await getCDISeries(params.prazo) : null
  const poupancaSeries = params.aplicarCDI ? await getPoupancaSeries(params.prazo) : null

  // 4. LOOP MENSAL
  for (let mes = 1; mes <= params.prazo; mes++) {
    const snapshot: MonthlySnapshot = {
      mes,
      mesLabel: formatMonth(mes),
      parcelasPagas: 0,
      valorParcelas: 0,
      contemplacoes: 0,
      vendas: 0,
      valorVendas: 0,
      caixa: 0,
      caixaInvestido: 0,
      patrimonio: 0,
      totalPago: 0,
      totalPagoBolso: 0,
    }

    // 4.1 PAGAR PARCELAS (todas as cotas ativas)
    quotas.forEach(quota => {
      if (!quota.contemplada) {
        const valorParcela = quota.vlParcela
        totalPago += valorParcela
        totalPagoBolso += valorParcela
        snapshot.parcelasPagas++
        snapshot.valorParcelas += valorParcela
        
        // Calcular patrimônio (percentPago aumenta)
        quota.percentPago += (valorParcela / quota.vlBem) * 100
        
        events.push({
          tipo: 'PAGAMENTO',
          mes,
          cotaId: quota.id,
          cotaGrupo: quota.grupo,
          cotaNumero: quota.cota,
          valor: valorParcela,
          descricao: `Parcela cota ${quota.grupo}-${quota.cota}`,
        })
      }
    })

    // 4.2 CONTEMPLAÇÕES (periódicas, ex: trimestral)
    if (mes % 3 === 0) {
      const cotasParaContemplar = quotas.filter(q => !q.contemplada)
      const numContemplacoes = Math.floor(cotasParaContemplar.length * (params.taxaContemplacao || 0.05))
      
      for (let i = 0; i < numContemplacoes && i < cotasParaContemplar.length; i++) {
        const quota = cotasParaContemplar[i]
        quota.contemplada = true
        snapshot.contemplacoes++
        
        patrimonio += quota.vlReceber || quota.vlBem * (quota.percentPago / 100)
        
        events.push({
          tipo: 'CONTEMPLACAO',
          mes,
          cotaId: quota.id,
          cotaGrupo: quota.grupo,
          cotaNumero: quota.cota,
          valor: quota.vlReceber || quota.vlBem,
          descricao: `Contemplação cota ${quota.grupo}-${quota.cota}`,
        })

        // 4.2.1 VENDER COTA CONTEMPLADA (se estratégia for vender)
        if (params.estrategiaVenda === 'IMMEDIATA') {
          const valorVenda = calcularValorVenda(quota)
          caixa += valorVenda
          totalRecebidoVendas += valorVenda
          snapshot.vendas++
          snapshot.valorVendas += valorVenda
          
          events.push({
            tipo: 'VENDA',
            mes,
            cotaId: quota.id,
            cotaGrupo: quota.grupo,
            cotaNumero: quota.cota,
            valor: valorVenda,
            descricao: `Venda cota ${quota.grupo}-${quota.cota}`,
            destino: 'caixa',
          })
        }
      }
    }

    // 4.3 APLICAR CAIXA (CDI/Poupança)
    if (caixa > 0 && params.aplicarCDI) {
      const taxaCdi = cdiSeries[mes - 1] || 0
      const rendimento = caixa * (taxaCdi / 100)
      caixa += rendimento
      snapshot.caixaInvestido += rendimento
      
      if (params.estrategiaVenda === 'REINVESTIR') {
        // Reinvestir em novas cotas ou pagar parcelas
        // Lógica específica...
      }
    }

    // 4.4 CALCULAR PATRIMÔNIO TOTAL
    patrimonio = quotas.reduce((sum, q) => {
      if (q.contemplada) {
        return sum + (q.vlReceber || q.vlBem)
      } else {
        return sum + (q.vlBem * (q.percentPago / 100))
      }
    }, 0) + caixa

    snapshot.caixa = caixa
    snapshot.patrimonio = patrimonio
    snapshot.totalPago = totalPago
    snapshot.totalPagoBolso = totalPagoBolso
    snapshot.cdiAcumulado = cdiSeries ? calcularCDIAcumulado(cdiSeries, mes) : undefined
    snapshot.poupancaAcumulado = poupancaSeries ? calcularPoupancaAcumulado(poupancaSeries, mes) : undefined

    snapshots.push(snapshot)
  }

  // 5. CALCULAR RESULTADOS FINAIS
  const custoPatrimonio = totalPagoBolso - totalRecebidoVendas
  const roi = ((patrimonio - totalPagoBolso) / totalPagoBolso) * 100
  const multiplicadorPatrimonial = patrimonio / totalPagoBolso
  const custoPorReal = totalPagoBolso / patrimonio

  // 6. COMPARAÇÃO COM ÍNDICES (se aplicável)
  const comparacaoCdi = params.aplicarCDI 
    ? await compareWithCDI(totalPagoBolso, snapshots, cdiSeries)
    : undefined
  
  const comparacaoPoupanca = params.aplicarCDI
    ? await compareWithPoupanca(totalPagoBolso, snapshots, poupancaSeries)
    : undefined

  return {
    patrimonioFinal: patrimonio,
    totalPagoParcelas: totalPago,
    totalPagoBolso,
    totalRecebidoVendas,
    caixaFinalInvestido: caixa,
    custoPatrimonio,
    roi,
    multiplicadorPatrimonial,
    custoPorReal,
    numContemplacoes: snapshots.reduce((sum, s) => sum + s.contemplacoes, 0),
    numVendas: snapshots.reduce((sum, s) => sum + s.vendas, 0),
    cotasAtivasFinal: quotas.filter(q => !q.contemplada).length,
    snapshots,
    events,
    comparacaoCdi,
    comparacaoPoupanca,
  }
}
```

---

## 6️⃣ PSEUDOCÓDIGO DO MOTOR DE COMISSÃO E CONCILIAÇÃO

```typescript
// Calcular comissão para uma venda
async function calculateCommission(saleId: string): Promise<CommissionEntry[]> {
  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { seller: { include: { sellerProfile: true } } } })
  
  if (!sale) throw new Error('Venda não encontrada')
  
  // 1. BUSCAR REGRA APLICÁVEL
  const rule = await findApplicableRule(sale.productType, sale.seller.sellerProfile?.levelId)
  
  // 2. CALCULAR BASE
  const baseCommission = sale.creditAmount * (rule.baseRate / 100)
  
  // 3. CALCULAR SPLIT
  const entries: CommissionEntry[] = []
  
  // 3.1 Vendedor
  entries.push({
    saleId,
    userId: sale.sellerId,
    role: 'seller',
    baseAmount: sale.creditAmount,
    rate: rule.baseRate,
    amount: baseCommission * (rule.splitRules.seller / 100),
    bonus: calculateBonus(sale.creditAmount, rule.bonusRules),
    total: 0, // Calculado depois
    status: 'pending',
  })
  
  // 3.2 Líder (se houver)
  if (sale.seller.sellerProfile?.leaderId && rule.splitRules.leader) {
    entries.push({
      saleId,
      userId: sale.seller.sellerProfile.leaderId,
      role: 'leader',
      baseAmount: sale.creditAmount,
      rate: 0,
      amount: baseCommission * (rule.splitRules.leader / 100),
      bonus: 0,
      total: 0,
      status: 'pending',
    })
  }
  
  // 3.3 Parceiro (se houver)
  if (sale.partnerId && rule.splitRules.partner) {
    entries.push({
      saleId,
      userId: sale.partnerId,
      role: 'partner',
      baseAmount: sale.creditAmount,
      rate: 0,
      amount: baseCommission * (rule.splitRules.partner / 100),
      bonus: 0,
      total: 0,
      status: 'pending',
    })
  }
  
  // 4. CALCULAR TOTAL (com bonus)
  entries.forEach(entry => {
    entry.total = entry.amount + entry.bonus
  })
  
  // 5. SALVAR NO BANCO
  await prisma.commissionEntry.createMany({ data: entries })
  
  return entries
}

// Conciliação CSV
async function reconcileCommissions(csvFile: File): Promise<ReconciliationResult> {
  // 1. LER CSV
  const rows = await parseCSV(csvFile)
  
  // 2. MATCHING AUTOMÁTICO
  const matches: ReconciliationRow[] = []
  const unmatched: ReconciliationRow[] = []
  
  for (const row of rows) {
    // Tentar encontrar comissão correspondente
    const entry = await prisma.commissionEntry.findFirst({
      where: {
        sale: {
          creditAmount: { gte: row.creditAmount * 0.99, lte: row.creditAmount * 1.01 }, // Tolerância 1%
          saleDate: { gte: row.date, lte: addDays(row.date, 30) }, // Janela 30 dias
        },
        status: 'pending',
      },
      include: { sale: true },
    })
    
    if (entry && Math.abs(entry.total - row.commissionAmount) < 0.01) {
      // Match encontrado
      matches.push({
        ...row,
        matched: true,
        commissionEntryId: entry.id,
      })
      
      // Atualizar status para 'confirmed'
      await prisma.commissionEntry.update({
        where: { id: entry.id },
        data: { status: 'confirmed' },
      })
    } else {
      // Sem match
      unmatched.push({
        ...row,
        matched: false,
      })
    }
  }
  
  // 3. SALVAR RECONCILIAÇÃO
  const reconciliation = await prisma.commissionReconciliation.create({
    data: {
      uploadedBy: currentUserId,
      filename: csvFile.name,
      totalRows: rows.length,
      matchedEntries: matches.length,
      unmatchedRows: JSON.stringify(unmatched),
      status: 'pending',
    },
  })
  
  return {
    reconciliationId: reconciliation.id,
    totalRows: rows.length,
    matched: matches.length,
    unmatched: unmatched.length,
    unmatchedRows: unmatched,
  }
}
```

---

## 7️⃣ ORDEM DE IMPLEMENTAÇÃO (10 COMMITS)

### **Commit 1: Estrutura Base + Domínios**
- Criar pastas `/lib/domain/*`
- Mover/criar services por domínio
- Middleware de separação sandbox/real

### **Commit 2: Schema Prisma - Separação Simulation**
- Adicionar `simulation_projects`, `simulation_runs`, `simulation_snapshots`, `simulation_events`
- Garantir que não há FK entre simulation e real
- Rodar migration

### **Commit 3: Types TypeScript**
- Criar `lib/domain/*/types/*.ts`
- Interfaces principais (SimulationParams, CommissionEntry, etc)

### **Commit 4: Motor de Simulação Base**
- `lib/domain/simulation/services/simulatorEngine.ts`
- Função `runSimulation()` básica
- Teste unitário simples

### **Commit 5: APIs Simulation**
- `/api/simulation/projects` (CRUD)
- `/api/simulation/runs` (executar)
- `/api/simulation/snapshots` (listar)

### **Commit 6: Hub Simuladores + 1 Completo (Imóveis)**
- `/app/simulador/page.tsx` (hub)
- `/app/simulador/imoveis/*` (fluxo completo)
- Integrar com APIs simulation

### **Commit 7: Timeline Cliente**
- `/app/dashboard/timeline/page.tsx`
- API `/api/core/timeline`
- Service `timelineService.ts`

### **Commit 8: Comissões - Cálculo + Regras**
- UI admin comissões
- Cálculo automático
- Regras editáveis (JSON)

### **Commit 9: Conciliação CSV**
- Upload CSV
- Matching automático
- UI revisão

### **Commit 10: Repasses**
- Gerar lotes
- Status pagamento
- Export comprovantes

---

## ✅ PRÓXIMOS PASSOS

1. Revisar blueprint com o time
2. Ajustar schema Prisma
3. Começar Commit 1 (estrutura base)
