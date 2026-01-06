# Deploy na Vercel - Instruções

## 📋 Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel:

### 1. Acesse o Projeto na Vercel
- Vá em: Settings → Environment Variables

### 2. Adicione as Variáveis:

```
DATABASE_URL=postgresql://usuario:senha@host:5432/database?schema=public
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=uma-chave-secreta-aleatoria-aqui
NODE_ENV=production
```

### 3. Banco de Dados PostgreSQL

A Vercel não fornece PostgreSQL nativo. Você precisa usar um dos seguintes:

**Opção 1: Vercel Postgres (Recomendado)**
- Adicione o addon Vercel Postgres no projeto
- A variável `DATABASE_URL` será criada automaticamente

**Opção 2: Serviços Externos**
- Neon (https://neon.tech) - Grátis
- Supabase (https://supabase.com) - Grátis
- Railway (https://railway.app) - Grátis com limites
- Render (https://render.com) - Grátis com limites

### 4. Executar Migrações

Após o primeiro deploy, você precisa executar as migrações:

```bash
# Instale a Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Execute as migrações
npx prisma migrate deploy
```

Ou use o script de build da Vercel que já está configurado.

### 5. Build Command

O projeto já está configurado com:
- `postinstall`: Gera o Prisma Client automaticamente
- `build`: Executa `prisma generate && next build`

## ✅ Checklist de Deploy

- [ ] Variável `DATABASE_URL` configurada
- [ ] Variável `NEXTAUTH_URL` configurada (URL do seu projeto)
- [ ] Variável `NEXTAUTH_SECRET` configurada (chave aleatória)
- [ ] Banco de dados PostgreSQL criado e acessível
- [ ] Migrações executadas
- [ ] Deploy realizado com sucesso

## 🚨 Solução de Problemas

### Erro: "Prisma Client not generated"
- Verifique se o script `postinstall` está no package.json
- Verifique se o Prisma está nas dependências

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Verifique se o banco permite conexões externas (IP whitelist)
- Use SSL: `?sslmode=require` na URL se necessário

### Erro: "Module not found"
- Verifique se todas as dependências estão no `package.json`
- Limpe o cache: `vercel --force`
