# 🔐 Senhas do Sistema

## Usuários Cadastrados

### Rafael (Cliente)
- **Email:** `rafael@prospere.com`
- **Senha:** `rafael123`
- **Role:** client

## Área Administrativa

### Upload de Clientes
- **URL:** `http://localhost:3000/upload-cadastro`
- **Senha:** `prospere2025`

## Comandos Úteis

### Resetar Senhas
```bash
npm run db:reset-senhas
```

### Testar Login
```bash
npx tsx scripts/test-login.ts
```

### Recriar Usuário Rafael
```bash
npm run db:seed:rafael
```

## Troubleshooting

### Se o login não funcionar:

1. **Verifique se o servidor está rodando:**
   ```bash
   npm run dev
   ```

2. **Resetar senhas:**
   ```bash
   npm run db:reset-senhas
   ```

3. **Verificar usuários no banco:**
   ```bash
   npx prisma studio
   ```

4. **Limpar cache do NextAuth:**
   - Limpe o cache do navegador
   - Use modo anônimo/privado
   - Reinicie o servidor

5. **Verificar logs do servidor:**
   - Os logs mostrarão se a senha está correta ou não
   - Procure por: `✅ Login bem-sucedido` ou `❌ Senha incorreta`

## Criar Novo Usuário

### Via Interface Web
1. Acesse: `http://localhost:3000/cadastro`
2. Preencha os dados
3. Crie sua conta

### Via Admin (com Extrato)
1. Acesse: `http://localhost:3000/upload-cadastro`
2. Senha: `prospere2025`
3. Preencha dados do cliente + upload do extrato
