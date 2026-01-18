# Arquitetura - Plataforma SaaS Prospere
## Portal Premium de Experiências, Benefícios e Acúmulo Patrimonial

**Versão:** 1.0  
**Data:** 2026-01-18  
**Status:** Planejamento Completo ✅

---

## 1. ARQUITETURA DE PASTAS

```
projeto-cliente-prospere/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   │
│   ├── (public)/
│   │   ├── page.tsx (home)
│   │   ├── experiencias/
│   │   │   ├── page.tsx (lista de experiências)
│   │   │   └── [slug]/
│   │   │       └── page.tsx (detalhes + reserva)
│   │   └── comparador/
│   │       └── page.tsx (comparador educativo)
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/ (cliente)
│   │   │   ├── page.tsx
│   │   │   ├── minhas-reservas/
│   │   │   ├── meu-patrimonio/
│   │   │   └── meus-badges/
│   │   │
│   │   ├── vendas/ (vendedor)
│   │   │   ├── page.tsx
│   │   │   ├── minhas-vendas/
│   │   │   └── minhas-comissoes/
│   │   │
│   │   └── admin/ (admin)
│   │       ├── page.tsx
│   │       ├── clientes/
│   │       ├── experiencias/
│   │       ├── vendas/
│   │       ├── comissoes/
│   │       ├── relatorios/
│   │       └── configuracoes/
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │
│   │   ├── club/
│   │   │   ├── status/route.ts (GET status do clube)
│   │   │   └── level/route.ts (GET nível atual)
│   │   │
│   │   ├── experiences/
│   │   │   ├── route.ts (GET lista, POST criar)
│   │   │   ├── [slug]/
│   │   │   │   ├── route.ts (GET detalhes)
│   │   │   │   └── eligibility/route.ts (POST verificar elegibilidade)
│   │   │   └── [id]/
│   │   │       └── reservations/route.ts (GET, POST reservas)
│   │   │
│   │   ├── reservations/
│   │   │   ├── route.ts (GET minhas reservas, POST criar)
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts (GET, PUT, DELETE)
│   │   │   │   ├── qrcode/route.ts (GET QR Code)
│   │   │   │   └── confirm/route.ts (POST confirmar)
│   │   │   └── [id]/guests/route.ts (POST adicionar convidados)
│   │   │
│   │   ├── sales/
│   │   │   ├── route.ts (GET vendas, POST criar)
│   │   │   ├── [id]/route.ts (GET, PUT)
│   │   │   └── [id]/commission/route.ts (GET comissão calculada)
│   │   │
│   │   ├── commissions/
│   │   │   ├── route.ts (GET comissões)
│   │   │   ├── calculate/route.ts (POST calcular)
│   │   │   ├── reconcile/route.ts (POST conciliar com CSV)
│   │   │   └── payouts/route.ts (GET, POST repasses)
│   │   │
│   │   ├── admin/
│   │   │   ├── experiences/
│   │   │   │   ├── route.ts (CRUD completo)
│   │   │   │   └── [id]/stats/route.ts (GET métricas)
│   │   │   ├── clients/
│   │   │   │   ├── route.ts (GET lista)
│   │   │   │   └── [id]/route.ts (GET perfil completo)
│   │   │   └── reports/
│   │   │       ├── dashboard/route.ts
│   │   │       ├── sales/route.ts
│   │   │       └── events/route.ts
│   │   │
│   │   └── indices/
│   │       ├── route.ts (GET índices)
│   │       ├── cdi/route.ts
│   │       ├── incc/route.ts
│   │       └── update/route.ts (POST atualizar - protegido)
│   │
│   └── cron/
│       ├── update-indices/route.ts (Vercel cron)
│       └── send-reminders/route.ts (Vercel cron)
│
├── components/
│   ├── (shared)/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   │
│   ├── (dashboard)/
│   │   ├── ClubStatusCard.tsx
│   │   ├── LevelProgress.tsx
│   │   ├── BenefitsList.tsx
│   │   ├── ExperienceCard.tsx
│   │   ├── ReservationCard.tsx
│   │   └── QRCodeDisplay.tsx
│   │
│   ├── (experiences)/
│   │   ├── ExperienceHero.tsx
│   │   ├── EligibilityCheck.tsx
│   │   ├── ReservationForm.tsx
│   │   ├── GuestForm.tsx
│   │   └── ExperienceGallery.tsx
│   │
│   ├── (admin)/
│   │   ├── ClientTable.tsx
│   │   ├── ExperienceManager.tsx
│   │   ├── SalesTable.tsx
│   │   ├── CommissionCalculator.tsx
│   │   └── ReportDashboard.tsx
│   │
│   └── (comparator)/
│       ├── ComparatorInputs.tsx
│       ├── ComparatorChart.tsx
│       └── ComparatorResults.tsx
│
├── lib/
│   ├── services/
│   │   ├── clubService.ts
│   │   ├── experienceService.ts
│   │   ├── reservationService.ts
│   │   ├── salesService.ts
│   │   ├── commissionService.ts
│   │   ├── indicesService.ts
│   │   └── qrService.ts
│   │
│   ├── validations/
│   │   ├── clubSchema.ts
│   │   ├── experienceSchema.ts
│   │   ├── reservationSchema.ts
│   │   ├── salesSchema.ts
│   │   └── commissionSchema.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── permissions.ts
│   │   └── qr.ts
│   │
│   └── hooks/
│       ├── useClubStatus.ts
│       ├── useReservations.ts
│       └── useCommissions.ts
│
├── config/
│   ├── clubLevels.json (níveis e regras)
│   ├── commissionPlan.json (regras de comissão)
│   └── site.ts (configurações gerais)
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── public/
    ├── images/
    │   └── experiences/
    └── qrcodes/
```

---

## 2. SCHEMA PRISMA COMPLETO

```prisma
// ============================================
// AUTENTICAÇÃO E PERFIS
// ============================================

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  passwordHash  String?
  image         String?
  role          String         @default("CLIENTE") // CLIENTE, VENDEDOR, PARCEIRO, LIDER, ADMIN, FINANCEIRO
  emailVerified DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  // NextAuth
  accounts      Account[]
  sessions      Session[]

  // Relacionamentos
  clientProfile ClientProfile?
  sellerProfile SellerProfile?
  clubLevels    UserClubLevel[]
  reservations  Reservation[]
  sales         Sale[] // vendas realizadas
  commissions   CommissionEntry[] // comissões recebidas
  badges        UserBadge[]
  auditLogs     AuditLog[]

  @@index([email])
  @@index([role])
  @@map("users")
}

model ClientProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  cpf                 String?
  phone               String?
  birthDate           DateTime?
  address             String?
  patrimonyEstimate   Float    @default(0)
  currentLevelId      String?
  achievedAt          DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  clubLevel           ClubLevel? @relation(fields: [currentLevelId], references: [id])
  quotas              Quota[]

  @@index([currentLevelId])
  @@map("client_profiles")
}

model SellerProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  cpf                 String?
  phone               String?
  leaderId            String? // ID do líder
  teamId              String? // ID do time
  commissionRate      Float    @default(0)
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  leader              User?    @relation("SellerLeader", fields: [leaderId], references: [id])
  team                Team?    @relation(fields: [teamId], references: [id])
  sales               Sale[]

  @@index([leaderId])
  @@index([teamId])
  @@map("seller_profiles")
}

model Team {
  id                  String   @id @default(cuid())
  name                String
  leaderId            String
  description         String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  leader              User     @relation("TeamLeader", fields: [leaderId], references: [id])
  sellers             SellerProfile[]

  @@index([leaderId])
  @@map("teams")
}

// ============================================
// CLUBE DE BENEFÍCIOS
// ============================================

model ClubLevel {
  id            String   @id @default(cuid())
  name          String   @unique // BRONZE, PRATA, OURO, PLATINA, DIAMANTE
  displayName   String
  minCreditBRL  Float    @default(0)
  maxCreditBRL  Float?
  color         String
  icon          String?
  description   String?
  benefits      String   // JSON array
  rules         String?  // JSON regras adicionais
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  clients       ClientProfile[]
  members       UserClubLevel[]
  experiences   Experience[]
  reservations  Reservation[]

  @@index([minCreditBRL])
  @@map("club_levels")
}

model UserClubLevel {
  id            String   @id @default(cuid())
  userId        String
  clubLevelId   String
  creditBRL     Float    @default(0)
  achievedAt    DateTime @default(now())
  expiresAt     DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  clubLevel     ClubLevel @relation(fields: [clubLevelId], references: [id])

  @@unique([userId, clubLevelId, achievedAt])
  @@index([userId])
  @@index([clubLevelId])
  @@map("user_club_levels")
}

// ============================================
// EXPERIÊNCIAS / EVENTOS
// ============================================

model Experience {
  id                String   @id @default(cuid())
  slug              String   @unique
  title             String
  description       String?
  longDescription   String?  @db.Text
  imageUrl          String?
  gallery           String?  // JSON array de URLs
  videoUrl          String?
  location          String?
  address           String?
  category          String?  // esporte, entretenimento, cultura, etc
  tags              String?  // JSON array
  status            String   @default("active") // active, inactive, sold_out, cancelled
  eligibilityRules  String?  // JSON regras de elegibilidade
  benefits          String?  // JSON benefícios por nível
  metadata          String?  // JSON dados extras (SEO, Open Graph)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  clubLevelId       String?
  clubLevel         ClubLevel? @relation(fields: [clubLevelId], references: [id])
  dates             ExperienceDate[]
  reservations      Reservation[]
  badges            Badge[]

  @@index([slug])
  @@index([status])
  @@index([category])
  @@map("experiences")
}

model ExperienceDate {
  id            String   @id @default(cuid())
  experienceId  String
  date          DateTime
  time          String?  // "14:00", "09:00 - 18:00"
  maxCapacity   Int
  capacityByLevel String? // JSON { "BRONZE": 10, "PRATA": 20, ... }
  availableSlots Int
  price         Float?   @default(0)
  status        String   @default("active") // active, sold_out, cancelled
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  experience    Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)
  reservations  Reservation[]

  @@index([experienceId])
  @@index([date])
  @@map("experience_dates")
}

model Reservation {
  id                String   @id @default(cuid())
  userId            String
  experienceId      String
  experienceDateId  String
  clubLevelId       String
  status            String   @default("pending") // pending, confirmed, cancelled, completed, no_show
  guestCount        Int      @default(1)
  maxGuests         Int      @default(1)
  qrCode            String?  @unique
  qrCodeImage       String?  // URL da imagem do QR
  reservationDate   DateTime?
  checkInAt         DateTime?
  checkOutAt        DateTime?
  notes             String?
  metadata          String?  // JSON dados extras
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  experience        Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)
  date              ExperienceDate @relation(fields: [experienceDateId], references: [id], onDelete: Cascade)
  clubLevel         ClubLevel @relation(fields: [clubLevelId], references: [id])
  guests            Guest[]
  badges            UserBadge[]

  @@index([userId])
  @@index([experienceId])
  @@index([experienceDateId])
  @@index([status])
  @@index([qrCode])
  @@map("reservations")
}

model Guest {
  id            String   @id @default(cuid())
  reservationId String
  name          String
  email         String?
  phone         String?
  cpf           String?
  birthDate     DateTime?
  isLead        Boolean  @default(false) // é um lead potencial?
  createdAt     DateTime @default(now())

  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)

  @@index([reservationId])
  @@map("guests")
}

// ============================================
// GAMIFICAÇÃO
// ============================================

model Badge {
  id            String   @id @default(cuid())
  name          String   @unique
  displayName   String
  description   String?
  icon          String?
  category      String?  // frequencia, meta, especial
  criteria      String   // JSON critérios de obtenção
  experienceId  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  experience    Experience? @relation(fields: [experienceId], references: [id])
  users         UserBadge[]

  @@index([category])
  @@map("badges")
}

model UserBadge {
  id            String   @id @default(cuid())
  userId        String
  badgeId       String
  reservationId String?
  achievedAt    DateTime @default(now())
  metadata      String?  // JSON dados extras

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge         Badge    @relation(fields: [badgeId], references: [id])
  reservation   Reservation? @relation(fields: [reservationId], references: [id])

  @@unique([userId, badgeId])
  @@index([userId])
  @@index([badgeId])
  @@map("user_badges")
}

// ============================================
// COTAS E PATRIMÔNIO
// ============================================

model Quota {
  id                String       @id @default(cuid())
  userId            String
  clientProfileId   String?
  importBatchId     String?
  administradora    String?
  empresa           String?
  grupo             String
  cota              String
  versao            String
  dataVenda         DateTime?
  situacaoCobranca  String
  contemplacao      String
  percentPago       Float        @default(0)
  percentAtraso     Float        @default(0)
  pclsPagar         Int          @default(0)
  pclsPagas         Int          @default(0)
  vlBem             Float        @default(0)
  vlParcela         Float        @default(0)
  vlQuitacao        Float        @default(0)
  vlReceber         Float        @default(0)
  tipoBem           String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  user              User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  clientProfile     ClientProfile? @relation(fields: [clientProfileId], references: [id])
  importBatch       ImportBatch? @relation(fields: [importBatchId], references: [id])

  @@index([userId])
  @@index([grupo, cota])
  @@map("quotas")
}

model ImportBatch {
  id         String        @id @default(cuid())
  userId     String
  sourceType String        @default("PDF")
  filename   String
  status     String
  parsedAt   DateTime?
  createdAt  DateTime      @default(now())
  errorsJson String?
  quotas     Quota[]

  @@index([userId])
  @@map("import_batches")
}

// ============================================
// VENDAS E COMISSÕES
// ============================================

model Sale {
  id                String   @id @default(cuid())
  clientId          String
  sellerId          String
  partnerId         String?
  quotaId           String?
  productType       String   // auto, imovel, moto, servicos
  creditAmount      Float
  installmentAmount Float
  term              Int      // prazo em meses
  status            String   @default("proposta") // proposta, ativa, contemplada, quitada, cancelada
  saleDate          DateTime?
  contemplationDate DateTime?
  commissionRate    Float?
  notes             String?
  metadata          String?  // JSON dados extras
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  client            User     @relation("ClientSales", fields: [clientId], references: [id])
  seller            User     @relation("SellerSales", fields: [sellerId], references: [id])
  partner           User?    @relation("PartnerSales", fields: [partnerId], references: [id])
  quota             Quota?   @relation(fields: [quotaId], references: [id])
  commissions       CommissionEntry[]
  payouts           PayoutEntry[]

  @@index([clientId])
  @@index([sellerId])
  @@index([partnerId])
  @@index([status])
  @@index([saleDate])
  @@map("sales")
}

model CommissionRule {
  id            String   @id @default(cuid())
  name          String
  description   String?
  levelId       String?  // nível de carreira do vendedor
  productType   String?  // auto, imovel, etc
  baseRate      Float    @default(0) // taxa base (%)
  splitRules    String   // JSON { "seller": 70, "leader": 20, "partner": 10 }
  overrideRules String?  // JSON regras de override
  bonusRules    String?  // JSON regras de bônus
  validFrom     DateTime @default(now())
  validUntil    DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  entries       CommissionEntry[]

  @@index([isActive])
  @@index([validFrom, validUntil])
  @@map("commission_rules")
}

model CommissionEntry {
  id                String   @id @default(cuid())
  saleId            String
  userId            String   // vendedor/parceiro/líder
  ruleId            String?
  role              String   // seller, leader, partner
  baseAmount        Float
  rate              Float
  amount            Float
  override          Float    @default(0)
  bonus             Float    @default(0)
  total             Float
  status            String   @default("pending") // pending, confirmed, paid, cancelled
  paidAt            DateTime?
  payoutId          String?
  notes             String?
  metadata          String?  // JSON dados extras
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  sale              Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  user              User     @relation(fields: [userId], references: [id])
  rule              CommissionRule? @relation(fields: [ruleId], references: [id])
  payout            Payout?  @relation(fields: [payoutId], references: [id])

  @@index([saleId])
  @@index([userId])
  @@index([status])
  @@index([payoutId])
  @@map("commission_entries")
}

model Payout {
  id                String   @id @default(cuid())
  userId            String
  period            String   // "2026-01", "2026-Q1", etc
  totalAmount       Float
  status            String   @default("pending") // pending, processing, paid, failed
  paidAt            DateTime?
  paymentMethod     String?  // pix, transferencia, boleto
  paymentReference  String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation("UserPayouts", fields: [userId], references: [id])
  entries           CommissionEntry[]
  sales             Sale[]

  @@index([userId])
  @@index([period])
  @@index([status])
  @@map("payouts")
}

// ============================================
// ÍNDICES E MARKET DATA
// ============================================

model IndexSeries {
  id            String   @id @default(cuid())
  tipo          String   // CDI, INCC, SELIC, IPCA, POUPANCA
  data          DateTime
  valor         Float
  fonte         String   @default("manual")
  periodo       String   @default("monthly")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([tipo, data, periodo])
  @@index([tipo, data])
  @@map("index_series")
}

// ============================================
// AUDITORIA E LOGS
// ============================================

model AuditLog {
  id            String   @id @default(cuid())
  userId        String?
  action        String   // CREATE, UPDATE, DELETE, LOGIN, etc
  entityType    String   // User, Sale, Reservation, etc
  entityId      String?
  changes       String?  // JSON antes/depois
  ipAddress     String?
  userAgent     String?
  metadata      String?  // JSON dados extras
  createdAt     DateTime @default(now())

  user          User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ============================================
// RELACIONAMENTOS ADICIONAIS USER
// ============================================

// Adicionar ao model User existente:
// - ClientSales (Sale[])
// - SellerSales (Sale[])
// - PartnerSales (Sale[])
// - UserPayouts (Payout[])
```

---

## 3. ROTAS E CONTRATOS API

### 3.1 Clube de Benefícios

**GET `/api/club/status`**
```typescript
Response: {
  currentLevel: ClubLevel
  nextLevel: ClubLevel | null
  currentCredit: number
  progressToNext: number
  creditToNext: number
  benefits: string[]
  badges: Badge[]
  reservationsCount: number
}
```

**GET `/api/club/level`**
```typescript
Response: {
  level: ClubLevel
  progress: number
  creditToNext: number
}
```

### 3.2 Experiências

**GET `/api/experiences`**
```typescript
Query: {
  category?: string
  status?: string
  level?: string
  search?: string
}
Response: Experience[]
```

**GET `/api/experiences/[slug]`**
```typescript
Response: Experience & {
  dates: ExperienceDate[]
  availability: Record<string, number>
  eligibility: boolean
}
```

**POST `/api/experiences/[slug]/eligibility`**
```typescript
Body: {
  experienceDateId: string
  guestCount: number
}
Response: {
  eligible: boolean
  reason?: string
  availableSlots: number
}
```

### 3.3 Reservas

**GET `/api/reservations`**
```typescript
Response: Reservation[] & {
  experience: Experience
  date: ExperienceDate
  guests: Guest[]
}
```

**POST `/api/reservations`**
```typescript
Body: {
  experienceId: string
  experienceDateId: string
  guestCount: number
  guests: GuestInput[]
}
Response: Reservation & {
  qrCode: string
  qrCodeImage: string
}
```

**GET `/api/reservations/[id]/qrcode`**
```typescript
Response: {
  qrCode: string
  qrCodeImage: string
  reservation: Reservation
}
```

### 3.4 Vendas e Comissões

**GET `/api/sales`**
```typescript
Query: {
  sellerId?: string
  clientId?: string
  status?: string
  period?: string
}
Response: Sale[] & {
  client: User
  seller: User
  commissions: CommissionEntry[]
}
```

**POST `/api/sales`**
```typescript
Body: {
  clientId: string
  sellerId: string
  partnerId?: string
  productType: string
  creditAmount: number
  installmentAmount: number
  term: number
}
Response: Sale
```

**GET `/api/commissions`**
```typescript
Query: {
  userId?: string
  period?: string
  status?: string
}
Response: CommissionEntry[] & {
  sale: Sale
  rule: CommissionRule
}
```

**POST `/api/commissions/reconcile`**
```typescript
Body: {
  csvFile: File // CSV da administradora
  period: string
}
Response: {
  matched: number
  unmatched: number
  entries: CommissionEntry[]
}
```

---

## 4. COMPONENTES E PÁGINAS

### 4.1 Páginas Públicas

**`app/(public)/page.tsx`** - Home
- Hero section
- Destaques de experiências
- Comparador educativo (preview)
- CTA para login/cadastro

**`app/(public)/experiencias/[slug]/page.tsx`** - Detalhes da Experiência
- Banner hero
- Descrição completa
- Galeria de imagens/vídeos
- Regras por nível
- Datas disponíveis
- Benefícios por nível
- Botão "Verificar Elegibilidade"
- Formulário de reserva (se elegível)
- SEO: Open Graph, JSON-LD

**`app/(public)/comparador/page.tsx`** - Comparador Educativo
- Inputs: valor mensal, prazo, estratégia
- Gráficos: Consórcio vs CDI vs Poupança
- Resultados comparativos
- Texto educativo

### 4.2 Dashboard Cliente

**`app/(dashboard)/dashboard/page.tsx`**
- Card de status do clube
- Barra de progresso para próximo nível
- Lista de benefícios
- Últimas reservas
- Badges conquistados
- Link para "Ver todas as experiências"

**`app/(dashboard)/dashboard/minhas-reservas/page.tsx`**
- Lista de reservas (confirmadas, pendentes, históricas)
- QR Codes para check-in
- Filtros por status

**`app/(dashboard)/dashboard/meu-patrimonio/page.tsx`**
- Resumo de patrimônio
- Simulador de acúmulo
- Evolução gráfica
- Comparação com índices

### 4.3 Dashboard Vendedor

**`app/(dashboard)/vendas/page.tsx`**
- Lista de vendas
- Filtros e busca
- Status de cada venda
- Comissões previstas

**`app/(dashboard)/vendas/minhas-comissoes/page.tsx`**
- Lista de comissões
- Filtros por período/status
- Total acumulado
- Histórico de repasses

### 4.4 Admin

**`app/(dashboard)/admin/page.tsx`** - Dashboard Admin
- Cards com métricas principais
- Gráficos de performance
- Ações rápidas

**`app/(dashboard)/admin/experiencias/page.tsx`** - Gerenciar Experiências
- Lista de experiências
- CRUD completo
- Upload de mídia
- Configurar datas e capacidade
- Métricas por experiência

**`app/(dashboard)/admin/clientes/page.tsx`** - Gerenciar Clientes
- Lista de clientes
- Filtros por nível/status
- Perfil completo
- Histórico de reservas e badges

**`app/(dashboard)/admin/comissoes/page.tsx`** - Gerenciar Comissões
- Lista de comissões
- Calculadora de comissão
- Conciliação com CSV
- Geração de repasses

**`app/(dashboard)/admin/relatorios/page.tsx`** - Relatórios
- Dashboard de relatórios
- Exportações PDF/Excel
- Gráficos e métricas

---

## 5. REGRAS DE NÍVEL E BENEFÍCIOS

### 5.1 Cálculo de Nível

**Método:** Baseado no acúmulo de patrimônio estimado (crédito total das cotas ativas)

**Fórmula:**
```typescript
totalCredit = sum(quotas.map(q => q.vlBem))
level = getLevelByCredit(totalCredit)
```

**Regras:**
- Bronze: 0 - 100k
- Prata: 100k - 500k
- Ouro: 500k - 1M
- Platina: 1M - 2M
- Diamante: > 2M

**Atualização:**
- Automática ao importar cotas
- Manual via Admin
- Diária via cron job

### 5.2 Benefícios por Nível

**Bronze:**
- Acesso a experiências básicas
- Descontos em parceiros (5%)
- Newsletter

**Prata:**
- Todas Bronze +
- Prioridade em reservas
- Descontos maiores (10%)
- Eventos VIP

**Ouro:**
- Todas Prata +
- Experiências premium
- Upgrades automáticos
- Mentoria

**Platina:**
- Todas Ouro +
- Experiências exclusivas
- Concierge personalizado
- Oportunidades de investimento

**Diamante:**
- Todas Platina +
- Experiências únicas personalizadas
- Gestor dedicado
- Eventos de elite

---

## 6. REGRAS DE RESERVA E CAPACIDADE

### 6.1 Elegibilidade

**Regras:**
1. Cliente deve ter nível suficiente
2. Experiência deve estar ativa
3. Deve haver vagas disponíveis na data
4. Limite de convidados por nível:
   - Bronze: 1 convidado
   - Prata: 2 convidados
   - Ouro: 3 convidados
   - Platina: 5 convidados
   - Diamante: ilimitado (até capacidade do evento)

### 6.2 Capacidade por Nível

**Distribuição de vagas:**
- Cada data tem capacidade total
- Vagas reservadas por nível (configurável)
- Exemplo: 100 vagas totais
  - Diamante: 20 vagas
  - Platina: 30 vagas
  - Ouro: 30 vagas
  - Prata: 15 vagas
  - Bronze: 5 vagas

### 6.3 Processo de Reserva

1. Cliente verifica elegibilidade
2. Seleciona data e horário
3. Informa número de convidados
4. Preenche dados dos convidados
5. Sistema valida:
   - Nível suficiente
   - Vagas disponíveis
   - Limite de convidados
6. Gera QR Code único
7. Envia e-mail de confirmação
8. Atualiza capacidade

### 6.4 QR Code

**Formato:**
- Único por reserva
- Contém: reservationId, userId, experienceId
- Imagem PNG gerada dinamicamente
- Armazenada em `/public/qrcodes/`

**Uso:**
- Check-in no evento
- Validação de elegibilidade
- Histórico de presença

---

## 7. PLANEJAMENTO DE IMPLEMENTAÇÃO

### **Fase 1: Fundação (Auth + DB)** - 6-8h
1. ✅ Schema Prisma completo
2. ⏳ Migrations
3. ⏳ NextAuth configurado
4. ⏳ Roles e permissões
5. ⏳ Middleware de proteção

### **Fase 2: Clube de Benefícios** - 8-10h
1. ⏳ Serviço de cálculo de nível
2. ⏳ Componente de status do clube
3. ⏳ Barra de progresso
4. ⏳ Lista de benefícios
5. ⏳ Dashboard do cliente

### **Fase 3: Experiências Públicas** - 8-10h
1. ⏳ Página de lista de experiências
2. ⏳ Página de detalhes (slug)
3. ⏳ Sistema de elegibilidade
4. ⏳ Formulário de reserva
5. ⏳ Geração de QR Code
6. ⏳ SEO (Open Graph, JSON-LD)

### **Fase 4: Reservas e QR** - 6-8h
1. ⏳ API de reservas
2. ⏳ Página "Minhas Reservas"
3. ⏳ Sistema de QR Code
4. ⏳ Check-in
5. ⏳ E-mails de confirmação

### **Fase 5: Admin Básico** - 10-12h
1. ⏳ CRUD de experiências
2. ⏳ CRUD de clientes
3. ⏳ Lista de vendas
4. ⏳ Dashboard admin
5. ⏳ Filtros e busca

### **Fase 6: Comissões e Conciliação** - 8-10h
1. ⏳ Calculadora de comissão
2. ⏳ Regras editáveis
3. ⏳ Conciliação com CSV
4. ⏳ Geração de repasses
5. ⏳ Histórico

### **Fase 7: Relatórios e Comparador** - 6-8h
1. ⏳ Comparador educativo
2. ⏳ Dashboard de relatórios
3. ⏳ Exportações PDF/Excel
4. ⏳ Gráficos e métricas

**Total estimado: 52-66 horas**

---

## 8. DECISÕES TÉCNICAS

### Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Auth:** NextAuth.js com PrismaAdapter
- **DB:** PostgreSQL (produção) + SQLite (dev)
- **UI:** Tailwind CSS + shadcn/ui
- **Gráficos:** Recharts
- **Validação:** Zod
- **QR Code:** qrcode + canvas
- **PDF:** jsPDF ou react-pdf
- **Excel:** xlsx

### Performance
- Cache de índices (24h)
- Lazy loading de imagens
- Paginação em listas grandes
- Indexação adequada no Prisma

### SEO
- Open Graph dinâmico
- JSON-LD para eventos
- Sitemap.xml
- Robots.txt

### Segurança
- Validação Zod em todas as APIs
- Rate limiting
- RBAC completo
- Audit logs
- Sanitização de inputs

---

**Pronto para implementação!** 🚀

Confirme se posso começar pela Fase 1 ou se há ajustes no planejamento.
