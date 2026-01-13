# 🚀 Quick Start - Portal Prospere

Guia rápido para começar a desenvolver ou fazer deploy.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 14+ (ou use SQLite para desenvolvimento local)
- npm ou yarn

## 🛠️ Setup Local (Desenvolvimento)

### 1. Clone e Instale

```bash
git clone <seu-repositorio>
cd projeto-cliente-prospere
npm install
```

### 2. Configure Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` e configure:

```env
# Para desenvolvimento local com PostgreSQL:
DATABASE_URL="postgresql://usuario:senha@localhost:5432/portal_prospere?schema=public"

# OU para SQLite (mais simples para desenvolvimento):
# DATABASE_URL="file:./dev.db"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="prospere-secret-key-change-in-production-2025"
NODE_ENV="development"
```

### 3. Execute Migrações

```bash
npm run db:migrate
```

### 4. Popule o Banco (Opcional)

```bash
npm run db:seed
```

### 5. Inicie o Servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

### 6. Login de Teste

- **Admin**: `admin@prospere.com.br` / `admin123`
- **Cliente**: `cliente@prospere.com.br` / `cliente123`

## 🌐 Deploy na Vercel (Produção)

### Opção 1: Vercel Postgres (Recomendado - Mais Fácil)

1. **No painel da Vercel:**
   - Acesse seu projeto
   - Vá em **Storage** → **Create Database** → **Postgres**
   - A variável `DATABASE_URL` será criada automaticamente

2. **Configure outras variáveis** (Settings → Environment Variables):
   ```
   NEXTAUTH_URL=https://seu-projeto.vercel.app
   NEXTAUTH_SECRET=uma-chave-secreta-aleatoria
   NODE_ENV=production
   ```

3. **Faça deploy:**
   - Push para GitHub ou conecte o repositório
   - A Vercel fará deploy automático
   - Migrações são executadas automaticamente

### Opção 2: Banco Externo (Neon, Supabase)

1. **Crie banco no Neon ou Supabase:**
   - Neon: https://neon.tech
   - Supabase: https://supabase.com

2. **Copie a connection string**

3. **Configure na Vercel:**
   - Settings → Environment Variables
   - Adicione `DATABASE_URL` com a connection string
   - Configure outras variáveis (NEXTAUTH_URL, NEXTAUTH_SECRET, etc.)

4. **Faça deploy**

## 📚 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Banco de Dados
npm run db:migrate       # Executa migrações
npm run db:seed          # Popula banco com dados iniciais
npm run db:studio        # Abre Prisma Studio

# Build
npm run build            # Build para produção
npm run start            # Inicia servidor de produção

# Lint
npm run lint             # Verifica erros de código
```

## 🔧 Troubleshooting

### Erro: "DATABASE_URL not found"
- Verifique se o arquivo `.env` existe e está configurado
- Certifique-se de que a variável está no formato correto

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

### Erro no Deploy Vercel: "DATABASE_URL not found"
- Configure a variável no painel da Vercel
- Verifique se está disponível para Production, Preview e Development

### SQLite não funciona na Vercel
- SQLite não funciona na Vercel (sistema de arquivos efêmero)
- Use PostgreSQL (Vercel Postgres, Neon, Supabase)

## 📖 Documentação Completa

- [README.md](../README.md) - Documentação completa
- [VERCEL_DEPLOY.md](../VERCEL_DEPLOY.md) - Guia detalhado de deploy
- [CORRECAO_DEPLOY_VERCEL.md](./CORRECAO_DEPLOY_VERCEL.md) - Solução de problemas

---

**Última atualização:** 2026-01-13
