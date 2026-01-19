# SEPARAÇÃO ABSOLUTA: SIMULAÇÃO vs DADOS REAIS

**REGRA CRÍTICA:** O simulador é um SANDBOX FINANCEIRO. NUNCA deve tocar dados reais.

---

## 1. DIAGRAMA DE SEPARAÇÃO

```
┌─────────────────────────────────────────────────────────────────┐
│                     APLICAÇÃO PROSPERE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────┐         │
│  │   DOMAIN/SIMULATION  │     │    DOMAIN/CORE       │         │
│  │   (SANDBOX)          │     │    (DADOS REAIS)     │         │
│  ├──────────────────────┤     ├──────────────────────┤         │
│  │ • Simulation         │     │ • Quota (real)       │         │
│  │ • SimulationRun      │     │ • Sale (real)        │         │
│  │ • SimulationSnapshot │     │ • ClientProfile      │         │
│  │ • SimulationEvent    │     │ • CommissionEntry    │         │
│  │                      │     │ • Payout             │         │
│  │ ✅ Pode LER:         │     │                      │         │
│  │   - IndexSeries      │     │ ✅ Dados reais       │         │
│  │   - Config (readonly)│     │ ✅ Operação real     │         │
│  │                      │     │                      │         │
│  │ ❌ PROIBIDO:         │     │ ❌ PROIBIDO:         │         │
│  │   - FK para Quota    │     │   - FK para Simul.*  │         │
│  │   - FK para Sale     │     │   - Ler simulações   │         │
│  │   - Escrever em real │     │   - Escrever simul.  │         │
│  └──────────────────────┘     └──────────────────────┘         │
│           │                              │                      │
│           └──────────┬───────────────────┘                      │
│                      │                                          │
│           ┌──────────▼──────────┐                               │
│           │  SHARED READ-ONLY   │                               │
│           ├─────────────────────┤                               │
│           │ • IndexSeries       │                               │
│           │ • ClubLevel (config)│                               │
│           │ • CommissionPlan    │                               │
│           └─────────────────────┘                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐     ┌──────────────────────┐         │
│  │  DOMAIN/EXPERIENCE   │     │   DOMAIN/ADMIN       │         │
│  │  (Eventos/Benefícios)│     │   (Operação Admin)   │         │
│  ├──────────────────────┤     ├──────────────────────┤         │
│  │ • Experience         │     │ • CRUD Real          │         │
│  │ • Reservation        │     │ • Relatórios         │         │
│  │ • Guest              │     │ • Configurações      │         │
│  │ • Badge              │     │                      │         │
│  └──────────────────────┘     └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. TABELAS DO BANCO DE DADOS

### TABELAS DE SIMULAÇÃO (Prefixo `simulation_`)

```
simulation_projects
  - id
  - userId
  - name
  - description
  - params (JSON)
  - createdAt
  - updatedAt
  ❌ NUNCA FK para quota, sale, client

simulation_runs
  - id
  - simulationProjectId
  - name
  - executedAt
  - params (JSON)
  - quotaIds (JSON array - apenas IDs, não FK)
  - resultados...
  ❌ NUNCA FK para quota, sale, client

simulation_snapshots
  - id
  - simulationRunId
  - mes
  - dados do mês...
  ❌ NUNCA FK para quota, sale, client

simulation_events
  - id
  - simulationRunId
  - tipo
  - mes
  - cotaReference (string, não FK)
  - dados do evento...
  ❌ NUNCA FK para quota, sale, client
```

### TABELAS DE DADOS REAIS (Prefixo real ou sem prefixo)

```
quotas (ou real_quotas)
  - id
  - userId
  - importBatchId
  - dados reais...
  ❌ NUNCA FK para simulation_*

sales (ou real_sales)
  - id
  - clientId
  - sellerId
  - quotaId (FK para quota real)
  - dados reais...
  ❌ NUNCA FK para simulation_*

client_profiles
  - id
  - userId
  - dados reais...
  ❌ NUNCA FK para simulation_*

commission_entries
  - id
  - saleId (FK para sale real)
  - userId
  - dados reais...
  ❌ NUNCA FK para simulation_*

payouts
  - id
  - userId
  - dados reais...
  ❌ NUNCA FK para simulation_*
```

### TABELAS COMPARTILHADAS (READ-ONLY para simulação)

```
index_series
  - id
  - tipo (CDI, INCC, etc)
  - data
  - valor
  ✅ Leitura livre para ambos

club_levels
  - id
  - configuração...
  ✅ Leitura livre para ambos

commission_plan_configs
  - id
  - configuração...
  ✅ Leitura livre para ambos
```

---

## 3. ARQUITETURA DE PASTAS

```
/domain
  /simulation              # MÓDULO SIMULADOR (ISOLADO)
    /models                # Prisma models simulation_*
    /services              # simulationService, engineService
      - simulationService.ts
      - simulationEngine.ts
      - simulationValidator.ts
    /api                   # /api/simulation/*
      - /projects/route.ts
      - /runs/route.ts
      - /export/route.ts
    /components            # UI do simulador
      - SimulationBuilder.tsx
      - SimulationResults.tsx
    /types                 # Types do simulador
      - simulation.types.ts
    /utils                 # Utils do simulador
      - simulationHelpers.ts

  /core                    # MÓDULO OPERAÇÃO REAL
    /models                # Prisma models reais
    /services              # coreService, salesService
      - quotaService.ts
      - saleService.ts
      - commissionService.ts
    /api                   # /api/core/* ou /api/*
      - /quotas/route.ts
      - /sales/route.ts
      - /commissions/route.ts
    /components            # UI de operação real
      - QuotaTable.tsx
      - SalesTable.tsx
    /types                 # Types de operação real
      - core.types.ts

  /shared                  # COMPARTILHADO (READ-ONLY)
    /services
      - indexService.ts    # Lê index_series
      - configService.ts   # Lê configs
    /types
      - shared.types.ts
    /utils
      - formatters.ts

  /experience              # MÓDULO EXPERIÊNCIAS
    /models
    /services
    /api
    /components

  /admin                   # MÓDULO ADMIN
    /services
    /api
    /components
```

---

## 4. MIDDLEWARE DE FIREWALL

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // BLOQUEAR: Simulação tentando acessar APIs de dados reais
  if (path.startsWith('/api/simulation/')) {
    // Permitir apenas endpoints de simulação
    // Bloquear qualquer tentativa de acessar /api/core/* ou /api/quotas/* etc
  }

  // BLOQUEAR: APIs reais tentando acessar dados de simulação
  if (path.startsWith('/api/core/') || path.startsWith('/api/quotas') || path.startsWith('/api/sales')) {
    // Bloquear qualquer FK para simulation_*
    // Validar que não está tentando criar/atualizar simulação
  }

  // AVISAR: Se estiver no simulador, mostrar aviso
  if (path.startsWith('/simulador')) {
    // Adicionar header ou cookie indicando modo simulação
  }
}
```

---

## 5. SERVIÇOS ISOLADOS

### ❌ PROIBIDO em simulationService.ts:

```typescript
// ❌ PROIBIDO
import { prisma } from '@/lib/prisma'
import { Quota } from '@prisma/client'

// ❌ PROIBIDO
const quota = await prisma.quota.findUnique({ where: { id } })

// ❌ PROIBIDO
await prisma.sale.create({ ... })
```

### ✅ PERMITIDO em simulationService.ts:

```typescript
// ✅ PERMITIDO - Apenas leitura de índices
import { indexService } from '@/domain/shared/services/indexService'
const cdi = await indexService.getCDI()

// ✅ PERMITIDO - Criar simulação própria
await prisma.simulationProject.create({ ... })

// ✅ PERMITIDO - Referência por string (não FK)
const quotaIds = ["id1", "id2"] // Apenas IDs como string
```

### ✅ PERMITIDO em coreService.ts:

```typescript
// ✅ PERMITIDO - Operação real
import { prisma } from '@/lib/prisma'
const quota = await prisma.quota.findUnique({ where: { id } })
const sale = await prisma.sale.create({ ... })
```

---

## 6. VALIDAÇÕES E TESTES

### Testes Obrigatórios:

```typescript
describe('Firewall de Simulação', () => {
  it('NÃO deve permitir simulação criar quota real', async () => {
    // Teste
  })

  it('NÃO deve permitir simulação criar venda real', async () => {
    // Teste
  })

  it('NÃO deve permitir simulação criar comissão real', async () => {
    // Teste
  })

  it('Simulação pode ler apenas índices e configs', async () => {
    // Teste
  })

  it('Operação real NÃO pode criar simulação via API real', async () => {
    // Teste
  })
})
```

---

## 7. EXPORTAÇÃO CONTROLADA (ÚNICA PONTE)

### ✅ Permitido:

1. **Exportar PDF da simulação**
   - `/api/simulation/[id]/export/pdf`
   - Gera PDF, não cria dados reais

2. **Exportar JSON da simulação**
   - `/api/simulation/[id]/export/json`
   - Gera JSON, não cria dados reais

3. **Gerar proposta (preview)**
   - `/api/simulation/[id]/proposal/preview`
   - Apenas visualização, não cria venda

### ❌ Proibido:

1. ❌ Criar venda a partir de simulação
2. ❌ Criar cota a partir de simulação
3. ❌ Gerar comissão a partir de simulação
4. ❌ Alterar cliente a partir de simulação

### Exceção (Manual, Auditado):

Se no futuro quiser permitir "Copiar simulação → Proposta", deve ser:

1. Botão EXPLÍCITO: "Gerar proposta REAL a partir desta simulação"
2. Requer aprovação ADMIN
3. Cria apenas rascunho (não venda ativa)
4. Audit log obrigatório
5. Separação completa: simulação → DTO → proposta (rascunho)

---

## 8. SCHEMA PRISMA ATUALIZADO

### Renomeações Necessárias:

```
Simulation → SimulationProject
SimulationRun → (manter)
MonthlySnapshot → SimulationSnapshot
EventLog → SimulationEvent

Quota → (manter ou renomear para RealQuota)
Sale → (manter ou renomear para RealSale)
```

### Remover FKs Perigosas:

```prisma
// ❌ REMOVER se existir:
model SimulationRun {
  quotaId String?  // ❌ REMOVER
  quota   Quota?   // ❌ REMOVER
}

// ✅ CORRETO:
model SimulationRun {
  quotaIds String  // JSON array de IDs (string, não FK)
}
```

---

## 9. UI SEPARADA

### Rotas:

```
/app/simulador/*
  - /app/simulador/projetos
  - /app/simulador/[id]/executar
  - /app/simulador/[id]/resultados
  - /app/simulador/[id]/exportar

/app/dashboard/*
  - /app/dashboard/cotas        (dados reais)
  - /app/dashboard/vendas       (dados reais)
  - /app/dashboard/comissoes    (dados reais)

/admin/operacao/*
  - /admin/operacao/clientes
  - /admin/operacao/vendas
  - /admin/operacao/relatorios
```

### Avisos Visuais:

```tsx
// Componente: SimulationWarning.tsx
<div className="bg-yellow-500/20 border border-yellow-500 p-4 mb-4">
  <WarningIcon />
  <strong>Ambiente de Simulação</strong>
  <p>Nenhum dado real é alterado. Este é um sandbox financeiro.</p>
</div>
```

---

## 10. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Renomear tabelas de simulação para `simulation_*`
- [ ] Remover TODAS as FKs entre simulation_* e real_*
- [ ] Criar pastas `/domain/simulation` e `/domain/core`
- [ ] Mover serviços para pastas corretas
- [ ] Criar middleware de firewall
- [ ] Atualizar rotas API (`/api/simulation/*` vs `/api/core/*`)
- [ ] Criar avisos visuais no simulador
- [ ] Criar testes de firewall
- [ ] Documentar exportações permitidas
- [ ] Validar que não há imports cruzados

---

**REGRA ABSOLUTA:** Se qualquer parte do simulador tocar dados reais, refaça a arquitetura.
