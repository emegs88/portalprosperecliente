# 🚀 Prompts de Evolução - Ecossistema Prospere

Este documento contém os 3 prompts organizados para evolução do produto em níveis: **MVP → PRO → TURBO**.

---

## 🎯 PROMPT 1 — MVP (Base forte, funcional e vendável)

### Objetivo
Ter algo usável, bonito, educativo e que já gere leads, simulações e propostas.

### Escopo MVP

#### 1) SITE + EDUCAÇÃO
- Landing pages: consórcio, como funciona, experiências, simuladores
- Glossário de consórcio (educativo)
- Páginas de experiências (Rodeio, Interlagos etc)

#### 2) SIMULADORES (SANDBOX)
- Simulador de parcelas (prazo, crédito, taxa)
- Simulador de sorteio (lúdico)
- Simulador simples de lance (embutido x livre)
- Comparação básica: consórcio x poupança x CDI (educativa)

**REGRAS:**
- Tudo sandbox, sem dados reais
- Disclaimer visível

#### 3) CAPTAÇÃO
- Formulário de lead
- Integração WhatsApp
- Exportação CSV de leads

#### 4) VISUAL
- Dark premium
- Mobile first
- Performance alta

### Entrega Antes do Código
- [ ] Mapa de páginas
- [ ] Componentes
- [ ] Estrutura de pastas
- [ ] Regras dos simuladores

Depois codar e deixar pronto pra deploy.

---

## ⚙️ PROMPT 2 — PRO (Produto real, portal e operação)

### Objetivo
Virar plataforma de consórcio, com cliente, vendedor, vendas e controle.

### Escopo PRO

#### 1) AUTENTICAÇÃO E PORTAIS
- Login: cliente, vendedor, parceiro, admin
- RBAC e segurança

#### 2) PORTAL DO CLIENTE
- Carteira de cotas
- Timeline mensal (pagamentos, assembleias, contemplações)
- Simulador de acúmulo patrimonial
- Alertas e histórico
- Export PDF/Excel

#### 3) ADMIN OPERAÇÃO
- Cadastro de vendas
- Cadastro de clientes
- Funil (lead → proposta → ativa)
- Upload de extratos CSV
- Conciliação manual/semi-auto

#### 4) COMISSÕES
- Regras editáveis
- Geração automática
- Status: estimada/confirmada/paga

#### 5) EXPERIÊNCIAS
- Reservas
- Níveis de benefícios
- QR Code e check-in
- Relatórios de participação

#### 6) ÍNDICES
- CDI automático
- INCC plugável
- Cache + fallback manual

**REGRAS:**
- SIMULADOR separado da OPERAÇÃO
- Logs e trilha de auditoria

### Entrega Antes do Código
- [ ] Schema do banco
- [ ] Arquitetura
- [ ] Fluxos
- [ ] Plano de migração do MVP

---

## 🧠 PROMPT 3 — TURBO (Máquina, escala e diferencial)

### Objetivo
Virar referência, com dados, estratégia, engajamento e monetização.

### Escopo TURBO

#### 1) SIMULADORES AVANÇADOS (SANDBOX)
- Tranches
- Garantia
- Frota
- Veículos
- Carta contemplada como alavanca
- Corte, assunção, comparador de estratégias

#### 2) DADOS & INTELIGÊNCIA
- Comparação de cenários
- Histórico de simulações
- Indicadores de eficiência patrimonial
- Rankings internos

#### 3) OPERAÇÃO "MÁQUINA"
- CRM completo
- Metas por vendedor
- Ranking
- Importação em lote
- Conciliação avançada
- Repasse com comprovantes
- Logs imutáveis

#### 4) CLUBE PROSPERE
- Benefícios por nível
- Gamificação
- Experiências integradas
- Conversão reserva → venda

#### 5) PRODUTO
- Multi-empresa
- Multi-admin
- Configuração sem código (regras, níveis, comissões, simuladores)
- Exportadores avançados
- APIs internas prontas

#### 6) COMPLIANCE & ESCALA
- LGPD
- Observabilidade
- Testes automatizados
- Controle de versões
- Arquitetura modular

### Entrega Antes do Código
- [ ] Blueprint do sistema
- [ ] Módulos
- [ ] Camadas
- [ ] Contratos de dados
- [ ] Roadmap de releases

---

## 🏁 Como Usar na Prática

1. **MVP** → Põe no ar → Usa comercialmente
2. **PRO** → Vira sistema de operação
3. **TURBO** → Vira diferencial de mercado

---

## 📊 Status Atual do Projeto

### ✅ Já Implementado (Estado Atual)

#### MVP
- ✅ Simulador de sorteio (lúdico/educativo)
- ✅ Simulador de acúmulo de patrimônio (básico)
- ✅ Landing pages básicas
- ✅ Visual dark premium
- ✅ Mobile responsive

#### PRO (Parcial)
- ✅ Autenticação (NextAuth)
- ✅ Portal do cliente (dashboard, cotas, importações)
- ✅ Importação de PDF/Excel com OCR
- ✅ Prospere Club (níveis, benefícios, experiências)
- ✅ Reservas com QR Code
- ✅ Comissões (estrutura básica)
- ✅ Índices (CDI/INCC) - endpoints básicos
- ✅ Exportação básica

#### TURBO (Parcial)
- ✅ Estrutura de simulação avançada (parcial)
- ✅ Histórico de simulações
- ✅ Comparação com CDI/Poupança (parcial)
- ✅ Separação sandbox vs operação

### ❌ Faltando Implementar

#### MVP
- ❌ Landing pages completas (consórcio, como funciona)
- ❌ Glossário de consórcio
- ❌ Páginas de experiências públicas
- ❌ Simulador de lance (embutido x livre)
- ❌ Formulário de lead com WhatsApp
- ❌ Exportação CSV de leads

#### PRO
- ❌ Timeline mensal completa
- ❌ Funil de vendas (lead → proposta → ativa)
- ❌ Upload de extratos CSV
- ❌ Conciliação avançada
- ❌ Status de comissões completo
- ❌ Índices automáticos (cache + job)

#### TURBO
- ❌ Simuladores avançados (tranches, garantia, frota)
- ❌ Comparador de estratégias
- ❌ CRM completo
- ❌ Metas e rankings
- ❌ Multi-empresa
- ❌ Configuração sem código
- ❌ LGPD completo
- ❌ Testes automatizados

---

## 🎯 Próximos Passos Sugeridos

1. **Completar MVP**: Focar em landing pages, glossário e captação de leads
2. **Evoluir para PRO**: Timeline mensal, funil de vendas, conciliação
3. **Escalar para TURBO**: Simuladores avançados, CRM, multi-empresa

Qual nível você quer focar primeiro?
