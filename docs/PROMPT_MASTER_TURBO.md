# 🚀 PROMPT MASTER - ECOSSISTEMA PROSPERE TURBO

## COMANDO ÚNICO PARA O CURSOR

---

Você é um arquiteto de software e engenheiro full-stack sênior.  
Quero criar o **ECOSSISTEMA PROSPERE TURBO completo** (produto de mercado), com simuladores (sandbox), portal do cliente, portal vendedor/parceiro, experiências e admin operacional com comissões/conciliação.

---

## 🚨 REGRA ABSOLUTA #1 — NÃO MISTURAR DADOS

**SIMULAÇÕES (SANDBOX) NUNCA PODEM:**
- ✅ Escrever/ler tabelas reais de cotas, vendas, comissões
- ✅ Usar dados reais de clientes em simulações
- ✅ Alterar dados operacionais

**SEPARAÇÃO OBRIGATÓRIA:**
- **Bancos/tabelas:** `simulation_*` vs `real_*` (e `experience_*` / `commission_*`)
- **Rotas:** `/api/simulation/*` vs `/api/core/*` vs `/api/experience/*`
- **Services:** `domain/simulation` **NÃO IMPORTA** `domain/core`
- **Types:** `types/simulation/*` vs `types/core/*`

**FIREWALL LÓGICO:**
- Middleware bloqueia cross-domain calls
- Services têm validação de `isSimulation` flag
- Exports permitidos: PDF, JSON, proposta (não cria venda real)

---

## 📦 STACK (JÁ INSTALADO)

- ✅ **Next.js App Router** + TypeScript
- ✅ **Tailwind** + shadcn/ui
- ✅ **Recharts** (gráficos)
- ✅ **Auth.js (NextAuth)** - Já configurado
- ✅ **PostgreSQL** (prod) + **SQLite** (dev) + **Prisma** - Já configurado
- ✅ **Zod** (validação)
- ✅ Export PDF/Excel (pdf-parse, xlsx, jsPDF)
- ✅ Jobs cron (Vercel cron ou node-cron)

---

## 🧩 MÓDULOS DO SISTEMA

### **A) SIMULADORES (SANDBOX)** - `/app/simulador/*` + `/api/simulation/*`

1. **Imóveis com Tranches + Garantia**
   - Configurar tranches (crédito inicial + garantia)
   - Simulação de pagamento de garantia + contemplação
   - Comparação de estratégias (garantia alta vs baixa)

2. **Veículos** (similar a imóveis, adaptado)

3. **Frota Garantida**
   - Múltiplas cotas, contemplações, vendas
   - Análise de frota como patrimônio

4. **Sorteio Educativo** ✅ (já existe em `/simulador/sorteio`)

5. **Lance (Embutido vs Livre)**
   - Simular lance fixo vs lance livre
   - Comparação de custo/benefício

6. **Acúmulo Patrimonial** ✅ (já existe parcialmente)

7. **Comparador CDI/Poupança/INCC**
   - Comparação educativa
   - Não promete retorno real

**REGRAS SANDBOX:**
- Disclaimer visível em TODOS os simuladores
- Dados salvos em `simulation_projects`, `simulation_runs`, `simulation_snapshots`
- NUNCA escreve em `quotas` (real), `sales` (real), `commission_entries` (real)

---

### **B) CORE REAL** - `/app/dashboard/*` + `/api/core/*` + `/api/cotas/*`

- **Clientes:** cadastro, perfil, histórico
- **Cotas reais:** cadastro manual, importação PDF/Excel ✅ (já existe)
- **Vendas:** funil completo (lead → proposta → ativa → contemplada)
- **Timeline mensal:** pagamentos, assembleias, contemplações
- **Export PDF/Excel:** extrato de cotas, histórico

**TABELAS:** `quotas`, `sales`, `client_profiles`, `import_batches`

---

### **C) COMISSÕES** - `/app/admin/comissoes/*` + `/api/commission/*`

- **Regras editáveis:** JSON config (já existe em `config/commissionPlan.json`)
- **Split:** vendedor/líder/parceiro (percentuais configuráveis)
- **Status:** estimada → confirmada → paga
- **Conciliação CSV:** upload extrato administrativo, matching automático
- **Repasse:** gerar lote de pagamentos, status, comprovantes
- **Histórico:** auditoria completa

**TABELAS:** `commission_rules`, `commission_entries`, `payouts`, `payout_entries`

---

### **D) EXPERIÊNCIAS/CLUBE** - `/app/experiencias/*` + `/api/experience/*` + `/api/club/*`

- **Eventos:** rodeio, interlagos, etc. (CRUD admin)
- **Níveis:** Bronze → Diamond (já existe em `config/clubLevels.json`)
- **Reservas:** criar, confirmar, QR Code ✅ (já existe)
- **Convidados:** lista de participantes
- **Check-in:** scan QR Code, status
- **Relatórios:** participação, conversão reserva → venda

**TABELAS:** `experiences`, `experience_dates`, `reservations`, `guests`, `club_levels`, `user_club_levels`

---

### **E) ADMIN** - `/app/admin/*` + `/api/admin/*`

**Dashboard:**
- KPIs: vendas, comissões, reservas, clube
- Funil visual (lead → venda)

**Módulos:**
- Clientes: lista, perfil, histórico
- Vendas: funil completo, status, filtros
- Experiências: CRUD, datas, capacidade
- Reservas: lista, check-in, relatórios
- Comissões: regras, entradas, conciliação, repasse
- Ranking: vendedores, parceiros, líderes
- Relatórios: PDF/Excel exportáveis

**RBAC:** Verificar role antes de acessar (já existe parcialmente)

---

## ⚙️ CONFIG SEM CÓDIGO

**Arquivos JSON editáveis via Admin (com validação Zod):**

1. **`config/simulators.json`** - Configuração de simuladores
   ```json
   {
     "imoveis": {
       "steps": ["tranches", "garantia", "prazo", "resultados"],
       "validations": {...},
       "defaults": {...}
     }
   }
   ```

2. **`config/clubLevels.json`** ✅ (já existe)

3. **`config/commissionPlan.json`** ✅ (já existe)

4. **`config/experienceTemplates.json`** - Templates de eventos

**Admin pode editar via UI (textarea + validação Zod)**

---

## 📊 ÍNDICES FINANCEIROS

**CDI Automático:**
- Endpoint: `/api/indices/cdi` ✅ (já existe)
- Cache em DB (`index_series`)
- Job diário atualiza
- Fallback manual se API falhar

**INCC Plugável:**
- Endpoint: `/api/indices/incc` ✅ (já existe)
- Preparado para API futura
- Fallback manual

**UI:** Mostrar fonte e última atualização

---

## ✅ ENTREGA OBRIGATÓRIA ANTES DO CÓDIGO

**Me devolva em texto:**

1. **Estrutura de pastas proposta** (com domínios `/domain/simulation`, `/domain/core`, `/domain/commission`, `/domain/experience`, `/domain/admin`)

2. **Lista de rotas/telas** (por perfil: cliente/vendedor/admin)

3. **Schema Prisma completo** (ou rascunho de tabelas) mostrando claramente:
   - `simulation_*` tables
   - `real_*` tables (já existem, verificar separação)
   - `experience_*` tables (já existem)
   - `commission_*` tables (já existem)

4. **Types TypeScript principais** (interfaces)

5. **Pseudocódigo do motor de simulação** (monthly snapshots + event log)

6. **Pseudocódigo do motor de comissão** e conciliação CSV

7. **Ordem de implementação em 10 commits pequenos**

**Somente depois disso, você começa a codar.**

---

## 🏗️ FASES DE IMPLEMENTAÇÃO

**Fase 1: Base** (Auth + Prisma + RBAC + layout)
- ✅ Auth já existe (NextAuth)
- ⏳ Ajustar RBAC completo
- ⏳ Layout base admin/cliente

**Fase 2: Simuladores sandbox**
- Hub de simuladores
- 1 simulador completo: Imóveis (tranches+garantia)
- Expandir depois

**Fase 3: Portal do cliente**
- Carteira de cotas ✅ (já existe)
- Timeline mensal ⏳
- Export PDF/Excel ⏳

**Fase 4: Experiências**
- CRUD admin ✅ (parcial)
- Reservas ✅ (já existe)
- QR + check-in ✅ (já existe)
- Relatórios ⏳

**Fase 5: Vendas (core real) + Funil**
- Funil visual ⏳
- Status de vendas ⏳
- Timeline ⏳

**Fase 6: Comissões**
- Regras editáveis ✅ (estrutura existe)
- Cálculo automático ⏳
- Conciliação CSV ⏳
- Repasse ⏳

**Fase 7: Relatórios + Histórico + Comparadores**
- Export PDF/Excel ⏳
- Histórico de simulações ⏳
- Comparadores avançados ⏳

**Fase 8: Polimento premium + Testes + Performance**
- Testes automatizados ⏳
- Performance ⏳
- LGPD ⏳

---

## 🎯 REGRAS DE TRABALHO

- ✅ Nunca reescrever arquivos sem mostrar diff mental do que mudou
- ✅ Não apagar módulos existentes: refatorar incremental
- ✅ Criar commits pequenos (descritos no chat)
- ✅ Qualquer parte "simulação" deve ser sandbox
- ✅ API de índices: implementar cache e fallback manual
- ✅ UI premium: cards, stepper, badges, dashboard com KPIs
- ✅ Sempre validar com Zod antes de salvar
- ✅ Logs imutáveis para auditoria

---

## ⚠️ IMPORTANTE

- Sempre que tiver escolha, **preferir simplicidade** e entregar primeiro o que é "MVP de produção"
- Nada de inventar probabilidade real no sorteio; é educativo e com disclaimer fixo
- **Sandbox NUNCA altera dados reais**
- Testes incrementais: cada fase testável isoladamente

---

**AGORA: execute a etapa "ENTREGA OBRIGATÓRIA ANTES DO CÓDIGO"**
