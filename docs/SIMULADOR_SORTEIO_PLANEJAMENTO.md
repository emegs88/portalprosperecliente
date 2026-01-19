# Simulador de Sorteio Prospere - Planejamento Completo

**Tipo:** Simulador Lúdico/Educativo  
**Localização:** `/simulador/sorteio`  
**Isolamento:** 100% Sandbox (não acessa dados reais)

---

## 1. ESTRUTURA DE PASTAS

```
projeto-cliente-prospere/
├── app/
│   ├── simulador/
│   │   └── sorteio/
│   │       ├── page.tsx                 # Landing (Tela 0)
│   │       ├── configuracao/
│   │       │   └── page.tsx             # Configuração (Tela 1)
│   │       ├── selecao/
│   │       │   └── page.tsx             # Seleção números (Tela 2)
│   │       ├── trios/
│   │       │   └── page.tsx             # Montar trios (Tela 3)
│   │       ├── sorteio/
│   │       │   └── page.tsx             # Máquina sorteio (Tela 4)
│   │       └── resultado/
│   │           └── page.tsx             # Resultado (Tela 5)
│   │
│   └── admin/
│       └── simulador-config/
│           └── page.tsx                 # Config admin (protegido)
│
├── components/
│   └── simulador/
│       └── sorteio/
│           ├── NumberGrid.tsx           # Grid 00-99
│           ├── SelectedChips.tsx        # Barra números selecionados
│           ├── TrioBuilder.tsx          # Drag & Drop trios
│           ├── DrawMachine.tsx          # Máquina sorteio animada
│           ├── ResultPanel.tsx          # Resultado comparação
│           ├── SessionStats.tsx         # Histórico sessão
│           ├── ConfigPanel.tsx          # Config admin
│           ├── Disclaimer.tsx           # Aviso fixo
│           └── ModeSelector.tsx         # Seleção modo
│
├── lib/
│   └── simulador/
│       └── sorteio/
│           ├── draw.ts                  # Funções sorteio
│           ├── match.ts                 # Comparação trios
│           ├── validation.ts            # Validações
│           ├── storage.ts               # LocalStorage helpers
│           └── config.ts                # Carregar config
│
├── schemas/
│   └── drawSimConfig.ts                 # Zod schema config
│
└── config/
    └── drawSimConfig.json               # Config padrão (editável)
```

---

## 2. COMPONENTES E PÁGINAS

### PÁGINAS (App Router)

**`/simulador/sorteio/page.tsx`** - Landing (Tela 0)
- Hero com logo Prospere
- Título e subtítulo
- CTAs principais
- Disclaimer
- Animações de entrada

**`/simulador/sorteio/configuracao/page.tsx`** - Configuração (Tela 1)
- ModoSelector (rápido/completo/sala)
- Accordion opções avançadas
- Salvar preferências

**`/simulador/sorteio/selecao/page.tsx`** - Seleção (Tela 2)
- NumberGrid
- SelectedChips
- Busca rápida
- Contador e limites

**`/simulador/sorteio/trios/page.tsx`** - Trios (Tela 3)
- TrioBuilder (drag & drop)
- Validações visuais
- Auto-montar trios

**`/simulador/sorteio/sorteio/page.tsx`** - Máquina (Tela 4)
- DrawMachine
- Controles play/pause
- Animação números

**`/simulador/sorteio/resultado/page.tsx`** - Resultado (Tela 5)
- ResultPanel
- Confetti (se ganhou)
- Mensagens educativas
- CTAs

**`/admin/simulador-config/page.tsx`** - Admin Config
- Textarea JSON
- Validação Zod
- Salvar config
- Proteção por senha (MVP)

### COMPONENTES

**`NumberGrid.tsx`**
- Grid de números (00-99 ou configurável)
- Seleção múltipla
- Highlight busca
- Teclado navegável
- Aria labels

**`SelectedChips.tsx`**
- Chips removíveis
- Contador
- Ordenação

**`TrioBuilder.tsx`**
- Drag & Drop (dnd-kit)
- Cards de trios
- Validação visual
- Auto-montar

**`DrawMachine.tsx`**
- Animação globo/roleta (framer-motion)
- Números girando
- Revelação sequencial
- Sons opcionais
- Barra progresso

**`ResultPanel.tsx`**
- Tabela comparação
- Status por trio
- Animação confete
- Mensagens educativas

**`SessionStats.tsx`**
- Painel lateral
- Tentativas
- Histórico últimos 10
- Melhor resultado

**`ConfigPanel.tsx`**
- Editor JSON
- Validação em tempo real
- Preview config
- Salvar/cancelar

**`Disclaimer.tsx`**
- Aviso fixo
- Sempre visível
- Estilo discreto mas claro

**`ModeSelector.tsx`**
- Cards de modo
- Descrições
- Seleção visual

---

## 3. SCHEMA DO CONFIG JSON + VALIDAÇÃO ZOD

### Config JSON (`config/drawSimConfig.json`)

```json
{
  "version": "1.0.0",
  "range": {
    "min": 0,
    "max": 99
  },
  "draw": {
    "count": 3,
    "seed": null
  },
  "trio": {
    "size": 3,
    "minTrios": 1,
    "maxTrios": 10
  },
  "selection": {
    "maxSelected": 30,
    "enableSearch": true,
    "enableQuickSelect": true
  },
  "animation": {
    "speed": "medium",
    "enableSounds": true,
    "soundVolume": 0.7,
    "enableConfetti": true,
    "revealDelay": 1000
  },
  "features": {
    "enableHistory": true,
    "enableStats": true,
    "enableEducativeText": true
  },
  "modes": {
    "rapido": {
      "enabled": true,
      "trioCount": 1,
      "drawCount": 3
    },
    "completo": {
      "enabled": true,
      "trioCount": 5,
      "drawCount": 3
    },
    "sala": {
      "enabled": true,
      "trioCount": 10,
      "drawCount": 3,
      "enableFullScreen": true,
      "enableRanking": true
    }
  },
  "ui": {
    "theme": "dark",
    "fontSize": "medium",
    "language": "pt-BR"
  },
  "disclaimer": {
    "text": "Simulação educativa. Não representa resultados reais ou garantia de contemplação.",
    "alwaysVisible": true
  }
}
```

### Validação Zod (`schemas/drawSimConfig.ts`)

```typescript
import { z } from 'zod'

export const DrawSimConfigSchema = z.object({
  version: z.string(),
  range: z.object({
    min: z.number().int().min(0).max(999),
    max: z.number().int().min(0).max(999),
  }).refine((data) => data.max > data.min, {
    message: "max deve ser maior que min"
  }),
  draw: z.object({
    count: z.number().int().min(1).max(10),
    seed: z.number().nullable().optional(),
  }),
  trio: z.object({
    size: z.number().int().min(2).max(5),
    minTrios: z.number().int().min(1),
    maxTrios: z.number().int().min(1).max(20),
  }),
  selection: z.object({
    maxSelected: z.number().int().min(1).max(100),
    enableSearch: z.boolean(),
    enableQuickSelect: z.boolean(),
  }),
  animation: z.object({
    speed: z.enum(["slow", "medium", "fast"]),
    enableSounds: z.boolean(),
    soundVolume: z.number().min(0).max(1),
    enableConfetti: z.boolean(),
    revealDelay: z.number().int().min(100).max(5000),
  }),
  features: z.object({
    enableHistory: z.boolean(),
    enableStats: z.boolean(),
    enableEducativeText: z.boolean(),
  }),
  modes: z.object({
    rapido: z.object({
      enabled: z.boolean(),
      trioCount: z.number().int().min(1),
      drawCount: z.number().int().min(1),
    }),
    completo: z.object({
      enabled: z.boolean(),
      trioCount: z.number().int().min(1),
      drawCount: z.number().int().min(1),
    }),
    sala: z.object({
      enabled: z.boolean(),
      trioCount: z.number().int().min(1),
      drawCount: z.number().int().min(1),
      enableFullScreen: z.boolean(),
      enableRanking: z.boolean(),
    }),
  }),
  ui: z.object({
    theme: z.enum(["dark", "light"]),
    fontSize: z.enum(["small", "medium", "large"]),
    language: z.string(),
  }),
  disclaimer: z.object({
    text: z.string().min(1),
    alwaysVisible: z.boolean(),
  }),
})

export type DrawSimConfig = z.infer<typeof DrawSimConfigSchema>
```

---

## 4. FLUXO COMPLETO DE TELAS

```
┌─────────────────────────────────────────┐
│  TELA 0: LANDING                        │
│  ┌───────────────────────────────────┐  │
│  │ Logo Prospere                     │  │
│  │ "Simulador de Sorteio Prospere"   │  │
│  │ Subtítulo educativo               │  │
│  │                                   │  │
│  │ [Iniciar Simulação]               │  │
│  │ [Falar com especialista]          │  │
│  │                                   │  │
│  │ ⚠️ Disclaimer                     │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  TELA 1: CONFIGURAÇÃO                   │
│  ┌───────────────────────────────────┐  │
│  │ Modo: [Rápido] [Completo] [Sala] │  │
│  │                                   │  │
│  │ ▼ Opções avançadas                │  │
│  │   - Universo: 00-99               │  │
│  │   - Qtd sorteados: 3              │  │
│  │   - Velocidade: média             │  │
│  │   - Sons: on                      │  │
│  │                                   │  │
│  │ [Continuar]                       │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  TELA 2: SELEÇÃO DE NÚMEROS             │
│  ┌───────────────────────────────────┐  │
│  │ Selecionados: [07] [18] [32]...  │  │
│  │                                   │  │
│  │ Grid 00-99                        │  │
│  │ [Selecionar aleatório] [Limpar]   │  │
│  │                                   │  │
│  │ Contador: 15/30                   │  │
│  │                                   │  │
│  │ [Avançar para trios]              │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  TELA 3: MONTAR TRIOS                   │
│  ┌───────────────────────────────────┐  │
│  │ Monte seus trios:                 │  │
│  │                                   │  │
│  │ ┌─────────┐ ┌─────────┐          │  │
│  │ │ Trio 1  │ │ Trio 2  │          │  │
│  │ │ [07][18]│ │ [32][45]│          │  │
│  │ │ [23] ✅ │ │ [67] ⏳ │          │  │
│  │ └─────────┘ └─────────┘          │  │
│  │                                   │  │
│  │ [Novo trio] [Auto-montar]        │  │
│  │ [Avançar para sorteio]           │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  TELA 4: MÁQUINA DE SORTEIO             │
│  ┌───────────────────────────────────┐  │
│  │         🎰 MÁQUINA 🎰             │  │
│  │                                   │  │
│  │    [Números girando...]          │  │
│  │                                   │  │
│  │    [Iniciar Sorteio]              │  │
│  │                                   │  │
│  │    ━━━━━━━━━━ Barra suspense     │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  TELA 5: RESULTADO                      │
│  ┌───────────────────────────────────┐  │
│  │ Sorteados: 07 - 18 - 32          │  │
│  │                                   │  │
│  │ ┌─────────────┬───────────┐      │  │
│  │ │ Trio 1      │ Acertou   │      │  │
│  │ │ 07-18-23    │ 2/3 ✅    │      │  │
│  │ └─────────────┴───────────┘      │  │
│  │                                   │  │
│  │ 🎉 Mensagem resultado             │  │
│  │ 📚 Texto educativo                │  │
│  │                                   │  │
│  │ [Simular novamente]               │  │
│  │ [Entender lance fixo/livre]       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 5. CHECKLIST DE ACESSIBILIDADE E RESPONSIVIDADE

### Acessibilidade

- [ ] Navegação por teclado (Tab, Enter, Espaço)
- [ ] Focus visível em todos elementos interativos
- [ ] Aria labels em botões e controles
- [ ] Aria live regions para sorteios (screen reader)
- [ ] Contraste mínimo 4.5:1 (WCAG AA)
- [ ] Textos alternativos em imagens
- [ ] Skip links para navegação rápida
- [ ] Suporte a leitores de tela
- [ ] Indicadores de estado (loading, error, success)
- [ ] Mensagens de erro descritivas

### Responsividade

- [ ] Mobile-first (320px+)
- [ ] Tablet (768px+)
- [ ] Desktop (1024px+)
- [ ] Large (1440px+)
- [ ] Grid responsivo (flex/grid)
- [ ] Fontes escaláveis (rem/em)
- [ ] Touch targets mínimo 44x44px
- [ ] Orientação landscape/portrait
- [ ] Menu mobile hambúrguer (se necessário)
- [ ] Imagens responsivas (next/image)

### Performance

- [ ] Lazy loading componentes
- [ ] Code splitting por rota
- [ ] Otimização de animações (will-change)
- [ ] Debounce em buscas
- [ ] Memoização cálculos pesados
- [ ] LocalStorage para persistência leve
- [ ] Compressão de assets

### UX/UI

- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Feedback visual em ações
- [ ] Animações suaves (não intrusivas)
- [ ] Confirmações em ações destrutivas
- [ ] Tooltips informativos
- [ ] Modais acessíveis

---

## 6. BIBLIOTECAS NECESSÁRIAS

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "zod": "^3.22.0",
    "framer-motion": "^10.16.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^7.0.0",
    "@dnd-kit/utilities": "^3.2.0",
    "canvas-confetti": "^1.9.0",
    "use-sound": "^4.0.0"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.6.0"
  }
}
```

---

## 7. FUNÇÕES PRINCIPAIS

### `lib/simulador/sorteio/draw.ts`

```typescript
/**
 * Sortear números únicos
 */
export function drawNumbers(
  count: number,
  min: number,
  max: number,
  exclude?: number[],
  seed?: number
): number[]

/**
 * Gerar seed a partir de timestamp
 */
export function generateSeed(): number

/**
 * Validar range de números
 */
export function validateRange(min: number, max: number): boolean
```

### `lib/simulador/sorteio/match.ts`

```typescript
/**
 * Comparar trios com números sorteados
 */
export function compareTrios(
  trios: number[][],
  drawn: number[]
): MatchResult[]

/**
 * Calcular acertos de um trio
 */
export function calculateMatches(
  trio: number[],
  drawn: number[]
): number

export interface MatchResult {
  trioIndex: number
  trio: number[]
  matches: number
  matchedNumbers: number[]
}
```

### `lib/simulador/sorteio/validation.ts`

```typescript
/**
 * Validar trio completo
 */
export function isValidTrio(
  trio: number[],
  requiredSize: number
): boolean

/**
 * Validar seleção de números
 */
export function isValidSelection(
  selected: number[],
  maxSelected: number
): boolean

/**
 * Validar que não há duplicatas em trios
 */
export function hasDuplicates(trios: number[][]): boolean
```

### `lib/simulador/sorteio/storage.ts`

```typescript
/**
 * Salvar sessão no LocalStorage
 */
export function saveSession(session: Session): void

/**
 * Carregar sessão do LocalStorage
 */
export function loadSession(): Session | null

/**
 * Limpar sessão
 */
export function clearSession(): void

export interface Session {
  selectedNumbers: number[]
  trios: number[][]
  history: DrawHistory[]
  stats: SessionStats
}

export interface DrawHistory {
  timestamp: number
  drawn: number[]
  results: MatchResult[]
}
```

### `lib/simulador/sorteio/config.ts`

```typescript
/**
 * Carregar config padrão
 */
export function loadDefaultConfig(): DrawSimConfig

/**
 * Carregar config do LocalStorage
 */
export function loadConfig(): DrawSimConfig

/**
 * Salvar config no LocalStorage
 */
export function saveConfig(config: DrawSimConfig): void

/**
 * Validar config
 */
export function validateConfig(config: unknown): DrawSimConfig
```

---

## 8. TIPOS TYPESCRIPT

```typescript
// types/simulador/sorteio.ts

export interface SimulationMode {
  id: 'rapido' | 'completo' | 'sala'
  name: string
  description: string
  enabled: boolean
}

export interface SelectedNumber {
  value: number
  selected: boolean
  inTrio: boolean
}

export interface Trio {
  id: string
  numbers: number[]
  isComplete: boolean
  matches?: number
}

export interface DrawResult {
  drawn: number[]
  timestamp: number
  seed?: number
}

export interface ComparisonResult {
  trioId: string
  trio: number[]
  matches: number
  matchedNumbers: number[]
  isWinner: boolean
}

export interface SessionStats {
  totalDraws: number
  bestResult: number
  lastDraw: number[] | null
  history: DrawHistory[]
}
```

---

## 9. DISCLAIMER E AVISOS

### Disclaimer Fixo (sempre visível)

```
⚠️ SIMULAÇÃO EDUCATIVA

Esta ferramenta é puramente educativa e lúdica. Não representa resultados 
reais de sorteios, não garante contemplação, e não promete probabilidades 
de ganho. Os sorteios simulados utilizam números aleatórios e não refletem 
o processo real de sorteios em consórcios.
```

### Avisos Contextuais

- Tela de resultado: "Este é um simulador educativo."
- Histórico: "Estatísticas apenas desta sessão local."
- Config admin: "Alterações afetam apenas a simulação."

---

**PRONTO PARA IMPLEMENTAÇÃO!** 🚀
