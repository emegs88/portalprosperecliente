# 🧪 Guia de Teste Completo - Sistema Portal Prospere

## ✅ PASSO A PASSO PARA TESTAR

### 1️⃣ **Verificar se o servidor está rodando**
```bash
# Ver processos na porta 3000
lsof -ti:3000

# Se não estiver rodando, iniciar:
npm run dev
```

### 2️⃣ **Abrir o navegador**
- URL: `http://localhost:3000`
- Se não abrir, verificar console do navegador (F12)
- Se mostrar erro, verificar terminal do servidor

### 3️⃣ **Testar Home Page (`/`)**
- Deve aparecer:
  - Logo Prospere no topo
  - Título "Portal Prospere"
  - 2 cards: "Área do Cliente" e "Área Administrativa"
  - Botões "Entrar" e "Criar conta"

### 4️⃣ **Testar Login**
- Ir para `/login`
- Credenciais:
  - **ADMIN**: `admin@prospere.com` / `Admin@12345`
  - **CLIENT**: `cliente@prospere.com` / `Cliente@12345`
- Deve redirecionar após login

### 5️⃣ **Testar Dashboard**
- Após login, deve ir para `/dashboard`
- Deve mostrar:
  - Header com logo e nome do usuário
  - Tabs: Dashboard, Cotas, Patrimônio, etc.
  - Dados do dashboard

### 6️⃣ **Testar RBAC**
- **Como CLIENT**:
  - Pode acessar `/dashboard` ✅
  - Pode acessar `/cliente` ✅
  - NÃO pode acessar `/admin` ❌ (deve bloquear)
- **Como ADMIN**:
  - Pode acessar `/dashboard` ✅
  - Pode acessar `/cliente` ✅
  - Pode acessar `/admin` ✅

## 🔧 SE NÃO ESTIVER FUNCIONANDO

### Problema: Página em branco
```bash
# 1. Parar servidor (Ctrl+C)
# 2. Limpar cache e node_modules (opcional)
rm -rf .next node_modules/.cache
# 3. Reinstalar (se necessário)
npm install
# 4. Rebuild
npm run build
# 5. Iniciar novamente
npm run dev
```

### Problema: Erro de autenticação
```bash
# Verificar se usuários foram criados
npm run seed

# Verificar banco
npx prisma studio
```

### Problema: Erro de compilação
```bash
# Verificar erros
npm run build

# Verificar TypeScript
npx tsc --noEmit
```

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Servidor rodando na porta 3000
- [ ] Home page carrega (`/`)
- [ ] Login funciona
- [ ] Dashboard carrega após login
- [ ] Middleware bloqueia acesso não autorizado
- [ ] Logout funciona
- [ ] Navegação entre páginas funciona

## 🌐 URLs IMPORTANTES

- **Home**: `http://localhost:3000/`
- **Login**: `http://localhost:3000/login`
- **Cadastro**: `http://localhost:3000/cadastro`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Admin**: `http://localhost:3000/admin`
- **Cliente**: `http://localhost:3000/cliente`
- **Importar**: `http://localhost:3000/admin/importar`
- **Erro**: `http://localhost:3000/erro-sem-permissao`

---

**Última atualização**: Sistema simplificado e funcional ✅
