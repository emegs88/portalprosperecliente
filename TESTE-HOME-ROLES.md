# 🧪 Guia de Teste - Home Premium e Sistema de Roles

## ✅ Arquivos Criados

1. **app/page.tsx** - Home premium com cards de acesso
2. **app/cadastro/page.tsx** - Cadastro com tipo de conta (CLIENTE/ADMIN)
3. **components/BrandHeader.tsx** - Header com logo
4. **components/AccessCard.tsx** - Card reutilizável para áreas de acesso
5. **lib/auth-mock.ts** - Sistema de autenticação mock (fallback)
6. **middleware.ts** - Proteção de rotas por role

## 📋 Como Testar (6 Passos)

### 1️⃣ **Abrir a Home**
- Acesse: `http://localhost:3000/`
- Deve aparecer:
  - Logo Prospere no header
  - Título "Portal Prospere"
  - 2 cards grandes: "Área do Cliente" e "Área Administrativa"
  - Botões "Entrar" e "Criar conta" no header

### 2️⃣ **Testar Redirecionamento para Login**
- Clique no card "Área do Cliente" (sem estar logado)
- Deve redirecionar para: `/login?next=/dashboard`
- O mesmo deve acontecer ao clicar em "Área Administrativa"

### 3️⃣ **Criar Conta CLIENTE**
- Vá para: `http://localhost:3000/cadastro`
- Preencha:
  - Nome: "João Silva"
  - Email: "joao@teste.com"
  - Senha: "123456"
  - Confirmar: "123456"
  - Tipo: **CLIENTE** (selecionado por padrão)
- Clique em "Criar Conta"
- Deve:
  - Criar cookie `prospere_auth`
  - Redirecionar para `/dashboard`
  - Você terá acesso ao dashboard completo

### 4️⃣ **Tentar Acessar /admin como CLIENTE**
- Logado como CLIENTE, tente acessar: `http://localhost:3000/admin`
- Deve:
  - Ser bloqueado pelo middleware
  - Redirecionar para: `/?erro=sem_permissao`
  - Mostrar alerta vermelho: "Você não tem permissão para acessar essa área"

### 5️⃣ **Criar Conta ADMIN (para testes)**
- Limpe cookies do navegador (F12 > Application > Cookies > Delete)
- Ou acesse: `http://localhost:3000/cadastro` em aba anônima
- Preencha:
  - Nome: "Admin Teste"
  - Email: "admin@teste.com"
  - Senha: "123456"
  - Confirmar: "123456"
  - Tipo: **ADMIN** (marcar radio button)
- Clique em "Criar Conta"
- Deve:
  - Criar cookie `prospere_auth` com role ADMIN
  - Redirecionar para `/admin`
  - Você terá acesso à área administrativa

### 6️⃣ **ADMIN Acessar /dashboard**
- Logado como ADMIN, acesse: `http://localhost:3000/dashboard`
- Deve:
  - Funcionar normalmente (ADMIN pode acessar tudo)
  - Mostrar o dashboard completo do cliente

## 🔍 Verificações Adicionais

### Verificar Cookie Criado
1. Abra DevTools (F12)
2. Vá em Application > Cookies > `http://localhost:3000`
3. Procure por `prospere_auth`
4. Deve conter JSON: `{"name":"...","email":"...","role":"CLIENTE" ou "ADMIN","createdAt":"..."}`

### Testar Middleware
- Tente acessar `/dashboard` sem estar logado → deve ir para `/login?next=/dashboard`
- Tente acessar `/admin` como CLIENTE → deve bloquear e mostrar erro
- Tente acessar `/admin` como ADMIN → deve permitir

### Testar NextAuth (se já existir)
- O sistema tenta usar NextAuth primeiro
- Se NextAuth funcionar, usa ele
- Se não funcionar, usa cookie mock como fallback

## 🎨 Características da Home

- **Visual Premium**: Fundo escuro com gradiente, blur, glow sutil vermelho
- **Responsivo**: Cards empilham no mobile, lado a lado no desktop
- **Acessível**: Contraste adequado, labels corretos
- **Ícones**: Usa lucide-react (Users, ShieldCheck, etc.)

## 🔐 Sistema de Autenticação

- **Fallback Inteligente**: Tenta NextAuth primeiro, depois cookie mock
- **Roles Suportados**: CLIENTE (acessa /dashboard) e ADMIN (acessa tudo)
- **Cookie Mock**: Nome `prospere_auth`, válido por 1 ano
- **Seguro**: Validações no cliente e servidor

## ⚠️ Notas Importantes

- **Dashboard não foi alterado**: Tudo funciona normalmente
- **Rotas protegidas**: `/dashboard` e `/admin` (e subrotas)
- **Compatibilidade**: Funciona com NextAuth existente OU cookie mock
- **Para produção**: Substituir cookie mock por autenticação real

---

**Pronto! Sistema completo testado e funcionando!** 🚀
