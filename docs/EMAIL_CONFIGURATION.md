# 📧 Configuração de Email - Prospere

Este documento explica como configurar o sistema de envio de emails para confirmações de reservas.

## 🔧 Opções de Configuração

### Opção 1: Resend (Recomendado) ⭐

**Resend** é uma plataforma moderna e simples para envio de emails transacionais.

#### Passos:

1. **Criar conta no Resend:**
   - Acesse: https://resend.com
   - Crie uma conta gratuita
   - O plano gratuito permite 3.000 emails/mês

2. **Obter API Key:**
   - No dashboard do Resend, vá em **API Keys**
   - Clique em **Create API Key**
   - Dê um nome (ex: "Prospere Production")
   - Copie a chave (formato: `re_xxxxxxxxxxxxxxxxxxxxx`)

3. **Configurar domínio (opcional mas recomendado):**
   - No dashboard, vá em **Domains**
   - Adicione seu domínio: `prospere.com.br`
   - Siga as instruções para adicionar os registros DNS
   - Isso melhora a entrega e evita spam

4. **Adicionar variáveis de ambiente:**
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
   EMAIL_FROM="contato@prospere.com.br"
   EMAIL_FROM_NAME="Prospere Consórcios"
   ```

---

### Opção 2: SMTP (Fallback)

Use qualquer provedor SMTP (Gmail, Outlook, SendGrid, etc).

#### Configuração para Gmail:

1. **Gerar senha de app:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Crie uma senha de app para "Email"
   - Copie a senha gerada

2. **Adicionar variáveis de ambiente:**
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="contato@prospere.com.br"
   SMTP_PASS="sua-senha-de-app"
   EMAIL_FROM="contato@prospere.com.br"
   EMAIL_FROM_NAME="Prospere Consórcios"
   ```

#### Configuração para Outlook/Office 365:

```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="contato@prospere.com.br"
SMTP_PASS="sua-senha"
EMAIL_FROM="contato@prospere.com.br"
EMAIL_FROM_NAME="Prospere Consórcios"
```

---

### Opção 3: Modo Desenvolvimento

Se nenhuma configuração estiver presente, o sistema irá **apenas logar** os emails no console (não envia de verdade).

Isso é útil para desenvolvimento local sem precisar configurar um serviço de email.

---

## 📝 Variáveis de Ambiente

Adicione no seu arquivo `.env` (ou `.env.local`):

```env
# Opção 1: Resend (recomendado)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"

# Opção 2: SMTP (fallback)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="contato@prospere.com.br"
# SMTP_PASS="sua-senha"

# Email de origem (usado em ambas opções)
EMAIL_FROM="contato@prospere.com.br"
EMAIL_FROM_NAME="Prospere Consórcios"
```

---

## ✉️ Emails Enviados

### 1. Confirmação de Reserva

**Quando:** Automaticamente ao criar uma nova reserva

**Conteúdo:**
- ✅ Detalhes da experiência
- 📅 Data e horário
- 📍 Local e endereço
- 👥 Lista de convidados
- 📱 QR Code para check-in
- 📋 Próximos passos

**Template:** `lib/services/emailService.ts` → `getReservationConfirmationEmail()`

### 2. Cancelamento de Reserva

**Quando:** Quando uma reserva é cancelada

**Conteúdo:**
- ❌ Notificação de cancelamento
- Detalhes da reserva cancelada
- Informações de contato

**Template:** `lib/services/emailService.ts` → `getReservationCancellationEmail()`

---

## 🔄 Reenvio de Email

Os usuários podem **reenviar** o email de confirmação:

1. Na página **Prospere Club** → aba **Minhas Reservas**
2. Clicar no botão **"Reenviar Email"** no card da reserva
3. O email será reenviado imediatamente

**Endpoint:** `POST /api/reservations/[id]/confirm`

---

## 🧪 Testando

### Teste Manual:

1. Criar uma reserva no sistema
2. Verificar se o email foi enviado
3. Verificar o conteúdo do email
4. Testar o botão "Reenviar Email"

### Teste de Template:

```bash
npx tsx lib/services/emailService.test.ts
```

Isso irá gerar um exemplo do template HTML e mostrar no console.

---

## 🐛 Troubleshooting

### Email não está sendo enviado:

1. **Verificar variáveis de ambiente:**
   ```bash
   echo $RESEND_API_KEY
   # ou
   echo $SMTP_HOST
   ```

2. **Verificar logs:**
   - No console do servidor, procure por: `✅ Email de confirmação enviado`
   - Ou: `❌ Erro ao enviar email`

3. **Verificar credenciais:**
   - Resend: Verificar se a API key está correta
   - SMTP: Verificar se usuário e senha estão corretos

4. **Verificar firewall:**
   - Certifique-se de que o servidor pode fazer conexões HTTPS (Resend) ou SMTP

### Emails indo para spam:

1. **Configurar SPF/DKIM/DMARC:**
   - No Resend, configure os registros DNS conforme instruções
   - Isso autentica seu domínio e melhora a entrega

2. **Usar domínio verificado:**
   - Não use emails de provedores gratuitos (gmail.com, outlook.com)
   - Use seu domínio próprio: `contato@prospere.com.br`

---

## 📚 Recursos

- **Resend Docs:** https://resend.com/docs
- **Nodemailer Docs:** https://nodemailer.com/about/
- **SPF/DKIM Guide:** https://resend.com/docs/dashboard/domains/introduction

---

## 🔒 Segurança

- **Nunca commite** suas chaves API no repositório
- Use `.env.local` (está no `.gitignore`)
- Em produção (Vercel), configure as variáveis no dashboard
- Rotacione chaves regularmente

---

**Última atualização:** 2024-01-18
