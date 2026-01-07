# 🚀 Prospere - Portal do Cliente - Versão Completa

Sistema completo de gestão de consórcios com importação de extratos PDF/Excel, dashboard interativo, simulações e relatórios patrimoniais.

## ✅ Status do Projeto

**Projeto 100% funcional e corrigido!**

- ✅ Build compilando sem erros
- ✅ Autenticação funcionando
- ✅ Todas as rotas API configuradas
- ✅ Dashboard completo
- ✅ Importação de PDF e Excel
- ✅ Simulações e projeções
- ✅ Prospere Vida (cashback)

## 🔐 Credenciais

### Cliente Rafael (Pré-cadastrado)
- **Email:** `rafael@prospere.com`
- **Senha:** `rafael123`

### Área Administrativa
- **URL:** `http://localhost:3000/upload-cadastro`
- **Senha:** `prospere2025`

## 📦 Instalação e Execução

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
```bash
# Gerar Prisma Client
npx prisma generate

# Executar Migrações
npx prisma migrate dev

# Popular banco com dados do Rafael
npm run db:seed:rafael
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz:
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="prospere-secret-key-change-in-production-2025"
```

### 4. Iniciar Servidor
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
projeto-cliente-prospere/
├── app/
│   ├── api/                    # Rotas da API
│   │   ├── auth/              # Autenticação
│   │   ├── admin/             # Área administrativa
│   │   ├── dashboard/         # Dados do dashboard
│   │   ├── cotas/             # Listagem de cotas
│   │   ├── patrimonio/        # Dados patrimoniais
│   │   ├── import/            # Importação PDF/Excel
│   │   ├── incc/              # Dados INCC
│   │   └── prospere-vida/     # Cashback
│   ├── dashboard/             # Página principal
│   ├── login/                 # Página de login
│   ├── cadastro/              # Cadastro público
│   └── upload-cadastro/       # Upload admin
├── components/
│   ├── dashboard/             # Componentes das abas
│   ├── ui/                    # Componentes shadcn/ui
│   └── Logo.tsx               # Logo Prospere
├── lib/
│   ├── services/              # Serviços (PDF, Excel, INCC)
│   ├── auth.ts                # Config NextAuth
│   └── prisma.ts              # Cliente Prisma
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   ├── fixtures/              # Dados de teste
│   └── migrations/            # Migrações
└── scripts/
    ├── seed-rafael.ts         # Seed do Rafael
    ├── reset-senhas.ts        # Reset de senhas
    └── test-login.ts          # Teste de login
```

## 🎯 Funcionalidades

### 1. Dashboard
- Cards de resumo (Total de Cotas, Crédito, Parcelas, etc.)
- Gráfico de Patrimônio Acumulado
- Fluxo de Caixa Mensal
- Cotas Mais Adiantadas
- Distribuição de Status e Tipo de Bem
- Alertas de Cotas Pendentes

### 2. Minhas Cotas
- Listagem paginada de todas as cotas
- Filtros por grupo, status, valor
- Detalhes completos de cada cota
- Simulador de venda

### 3. Patrimônio
- Patrimônio Atual (parcelas pagas)
- Patrimônio Base (valores do bem)
- Aporte Mensal
- Projeção com INCC
- Gráficos interativos

### 4. Simulações
- Simulador de venda de cotas
- Cálculo de ganho de capital
- ROI e lucro líquido
- Comparativo com investimentos alternativos (CDI, Poupança, Ações)
- Fluxo de caixa projetado

### 5. Importações
- Upload de PDF (extrato Âncora)
- Upload de Excel (.xlsx)
- Preview dos dados
- Edição manual de campos com erro
- Validação e tratamento de erros

### 6. Prospere Vida
- Cashback de 5% sobre parcelas pagas
- Projeção para 10 meses
- Gráfico de caixa doado acumulado
- Histórico de contribuições

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento

# Build e Deploy
npm run build            # Build de produção
npm run start            # Iniciar servidor de produção

# Banco de Dados
npm run db:migrate       # Executar migrações
npm run db:generate      # Gerar Prisma Client
npm run db:seed:rafael   # Popular com dados do Rafael
npm run db:reset-senhas  # Resetar senhas dos usuários
npm run db:studio        # Abrir Prisma Studio

# Testes
npx tsx scripts/test-login.ts  # Testar login
```

## 🔧 Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (desenvolvimento) / PostgreSQL (produção)
- **ORM:** Prisma
- **Autenticação:** NextAuth.js
- **UI:** Tailwind CSS + shadcn/ui
- **Gráficos:** Recharts
- **PDF:** pdf-parse
- **Excel:** xlsx (SheetJS)

## 📝 Notas Importantes

1. **Senhas:** Todas as senhas são hasheadas com bcrypt antes de salvar no banco
2. **Multi-tenancy:** Cada usuário só vê seus próprios dados
3. **Importação:** O sistema extrai automaticamente dados do PDF da Âncora
4. **INCC:** Integração com API pública para correção patrimonial
5. **Projeções:** Baseadas em dados reais do extrato, sem invenções

## 🐛 Troubleshooting

### Login não funciona
```bash
npm run db:reset-senhas
```

### Erro de build
```bash
npm run db:generate
npm run build
```

### Banco de dados vazio
```bash
npm run db:seed:rafael
```

### Servidor não inicia
```bash
# Limpar cache
rm -rf .next
npm install
npm run dev
```

## 📞 Suporte

Para mais informações, consulte:
- `SENHAS.md` - Todas as credenciais do sistema
- `README.md` - Documentação completa
- `VERCEL_DEPLOY.md` - Guia de deploy na Vercel

---

**Desenvolvido com ❤️ para Prospere Consórcios**
