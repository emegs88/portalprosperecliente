# Portal do Cliente Prospere

Plataforma web para gestão de consórcios do Grupo Prospere.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js (Credentials + JWT)
- **Parser PDF**: pdf-parse

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## 🛠️ Instalação

1. **Configure o banco de dados**

Edite o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/portal_prospere?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="prospere-secret-key-change-in-production-2025"
```

2. **Execute as migrações**

```bash
npm run db:migrate
```

3. **Execute o seed (cria usuários admin)**

```bash
npm run db:seed
```

4. **Crie a pasta de uploads** (já criada automaticamente)

## 🏃 Executando

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### Login de Teste

- **Email**: `admin@prospere.com.br`
- **Senha**: `admin123`

- **Email**: `cliente@prospere.com.br`  
- **Senha**: `cliente123`

## 📁 Estrutura do Projeto

```
projeto-cliente-prospere/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Página principal
│   ├── login/             # Página de login
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   └── dashboard/        # Componentes do dashboard
├── lib/                   # Utilitários e serviços
│   ├── services/         # Serviços (parser PDF, etc)
│   ├── prisma.ts         # Cliente Prisma
│   └── utils.ts          # Funções utilitárias
├── prisma/               # Schema e migrations
│   ├── schema.prisma     # Schema do banco
│   └── seed.ts           # Seed do banco
└── uploads/              # Arquivos PDF enviados
```

## 🎯 Funcionalidades Implementadas

- ✅ Autenticação multi-tenant
- ✅ Upload e parsing de PDF (formato Âncora)
- ✅ Dashboard com gráficos (Recharts)
- ✅ Visualização de cotas
- ✅ Importação de extratos
- ✅ Interface responsiva com tema Prospere (preto/vermelho/branco)

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run db:migrate` - Executa migrações
- `npm run db:seed` - Popula banco com dados iniciais
- `npm run db:studio` - Abre Prisma Studio

## 📝 Notas Importantes

- O parser PDF foi otimizado para o formato "Relatório de Cotas do Cliente" da Âncora
- Valores são normalizados do formato brasileiro (vírgula decimal) para formato numérico
- O sistema é multi-tenant: cada usuário só vê seus próprios dados
- Os dados são protegidos por autenticação JWT

## 🚢 Deploy na Vercel

### Pré-requisitos
- Conta na Vercel (https://vercel.com)
- Banco de dados PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)

### Passo a Passo

1. **Conecte o repositório**
   - Acesse https://vercel.com/new
   - Importe o repositório: `emegs88/portalprosperecliente`

2. **Configure Banco de Dados**
   - **Opção 1 (Recomendado)**: Vercel Postgres
     - No painel da Vercel: **Storage** → **Create Database** → **Postgres**
     - A variável `DATABASE_URL` será criada automaticamente
   - **Opção 2**: Serviços Externos
     - Neon (https://neon.tech) - Gratuito
     - Supabase (https://supabase.com) - Gratuito
     - Copie a connection string do seu banco

3. **Configure Variáveis de Ambiente** (Settings → Environment Variables):
   ```
   DATABASE_URL=postgresql://usuario:senha@host:5432/database?schema=public
   NEXTAUTH_URL=https://seu-projeto.vercel.app
   NEXTAUTH_SECRET=sua-chave-secreta-aleatoria-aqui
   NODE_ENV=production
   ```
   ⚠️ **IMPORTANTE**: Se usar Vercel Postgres, a `DATABASE_URL` já estará configurada automaticamente.

4. **Execute Migrações**
   - As migrações são executadas automaticamente durante o build (ver `vercel.json`)
   - Ou execute manualmente: `npx prisma migrate deploy`

5. **Deploy Automático**
   - A Vercel detecta automaticamente o Next.js
   - O build executa: `prisma generate && prisma migrate deploy && next build`
   - O build roda automaticamente com `prisma generate && prisma migrate deploy && next build`

5. **Após o Deploy**
   - Acesse sua aplicação em: `https://seu-projeto.vercel.app`
   - Faça login com qualquer email (autenticação temporária configurada)

📖 **Veja mais detalhes em**: [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

## 📄 Licença

Copyright © 2025 Grupo Prospere. Todos os direitos reservados.
