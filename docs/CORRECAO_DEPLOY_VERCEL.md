# 🔧 Correção do Deploy na Vercel - DATABASE_URL

## ❌ Problema Atual

O build está falhando com o erro:
```
Erro: Variável de ambiente não encontrada: DATABASE_URL
Código de erro: P1012
```

## 🔍 Causa

O schema do Prisma está configurado para usar SQLite, mas:
1. A variável `DATABASE_URL` não está configurada na Vercel
2. **SQLite NÃO funciona bem na Vercel** (sistema de arquivos efêmero)

## ✅ Solução Recomendada: Migrar para PostgreSQL

### Opção 1: Vercel Postgres (Mais Fácil)

1. **No painel da Vercel:**
   - Acesse seu projeto
   - Vá em **Storage** → **Create Database** → **Postgres**
   - Ou vá em **Settings** → **Storage** → **Create Database**

2. **A variável `DATABASE_URL` será criada automaticamente**

3. **Atualizar o schema do Prisma:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Criar e executar migrações:**
   ```bash
   npx prisma migrate dev --name init
   ```

### Opção 2: Banco de Dados Externo (Neon, Supabase, etc.)

#### Usando Neon (Gratuito)

1. **Criar conta no Neon:**
   - Acesse: https://neon.tech
   - Crie um projeto
   - Copie a connection string (DATABASE_URL)

2. **Configurar na Vercel:**
   - Acesse: Settings → Environment Variables
   - Adicione:
     ```
     DATABASE_URL=postgresql://usuario:senha@host/database?sslmode=require
     ```

3. **Atualizar o schema do Prisma** (mesmo que Opção 1)

#### Usando Supabase (Gratuito)

1. **Criar projeto no Supabase:**
   - Acesse: https://supabase.com
   - Crie um projeto
   - Vá em Settings → Database
   - Copie a connection string

2. **Configurar na Vercel** (mesmo processo que Neon)

## 📝 Passo a Passo Completo

### 1. Atualizar Schema do Prisma

Edite `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Mudar de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Instalar Dependências (se necessário)

```bash
npm install @prisma/client pg
```

### 3. Criar Nova Migração

```bash
npx prisma migrate dev --name migrate_to_postgresql
```

### 4. Configurar Variáveis na Vercel

**No painel da Vercel:**

1. Acesse seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Adicione:

   ```
   DATABASE_URL=postgresql://... (conexão do seu banco)
   NEXTAUTH_URL=https://seu-projeto.vercel.app
   NEXTAUTH_SECRET=sua-chave-secreta-aleatoria
   NODE_ENV=production
   ```

4. Selecione os ambientes: **Production**, **Preview**, **Development**
5. Clique em **Save**

### 5. Executar Migrações na Vercel

Após configurar a `DATABASE_URL`, você pode:

**Opção A: Via Vercel CLI (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Linkar projeto
vercel link

# Executar migrações
npx prisma migrate deploy
```

**Opção B: Adicionar no package.json**

Adicione no `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && prisma generate && next build"
  }
}
```

A Vercel executará automaticamente após cada deploy.

### 6. Fazer Novo Deploy

- Faça commit e push das mudanças
- A Vercel fará deploy automático
- Ou force um novo deploy: **Deployments** → **Redeploy**

## ⚠️ Alternativa Temporária (NÃO RECOMENDADO)

Se quiser manter SQLite temporariamente (apenas para testes):

1. Na Vercel, configure:
   ```
   DATABASE_URL=file:./prisma/dev.db
   ```

2. **PROBLEMA:** SQLite não funciona bem na Vercel porque:
   - Sistema de arquivos é efêmero
   - Dados serão perdidos a cada deploy
   - Não é adequado para produção

## 📋 Checklist de Correção

- [ ] Atualizar `prisma/schema.prisma` para PostgreSQL
- [ ] Criar banco de dados (Vercel Postgres, Neon, ou Supabase)
- [ ] Configurar `DATABASE_URL` na Vercel
- [ ] Configurar `NEXTAUTH_URL` na Vercel
- [ ] Configurar `NEXTAUTH_SECRET` na Vercel
- [ ] Executar migrações
- [ ] Fazer novo deploy
- [ ] Verificar logs do deploy

## 🆘 Solução de Problemas

### Erro: "relation does not exist"
- Execute as migrações: `npx prisma migrate deploy`

### Erro: "Connection refused"
- Verifique se a `DATABASE_URL` está correta
- Verifique se o banco permite conexões externas (IP whitelist)

### Erro: "SSL required"
- Adicione `?sslmode=require` no final da `DATABASE_URL`

## 📚 Referências

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma com PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)

---

**Última atualização:** 2026-01-13
