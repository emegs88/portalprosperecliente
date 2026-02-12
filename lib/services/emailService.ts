/**
 * Serviço de Email - Prospere
 * Suporta Resend (recomendado) e Nodemailer (fallback)
 */

const FROM_EMAIL = process.env.EMAIL_FROM || 'contato@prospere.com.br'
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Prospere Consórcios'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Enviar email usando Resend (preferido) ou Nodemailer (fallback)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // Tentar Resend primeiro
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const result = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || FROM_EMAIL,
      })

      if (result.error) {
        console.error('Resend error:', result.error)
        throw new Error(result.error.message || 'Erro ao enviar email via Resend')
      }

      return { success: true }
    } catch (error: any) {
      console.error('Resend failed, trying fallback:', error)
      // Continuar para fallback
    }
  }

  // Fallback: Nodemailer (SMTP)
  if (process.env.SMTP_HOST) {
    try {
      const nodemailer = await import('nodemailer')
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || FROM_EMAIL,
      })

      return { success: true }
    } catch (error: any) {
      console.error('SMTP fallback failed:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao enviar email' 
      }
    }
  }

  // Modo desenvolvimento: apenas log
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 [DEV] Email não enviado (sem config):', {
      to: options.to,
      subject: options.subject,
    })
    return { success: true } // Simular sucesso em dev
  }

  return { 
    success: false, 
    error: 'Serviço de email não configurado' 
  }
}

/**
 * Template de email de confirmação de reserva
 */
export function getReservationConfirmationEmail(data: {
  userName: string
  userEmail: string
  experienceTitle: string
  experienceDate: Date
  experienceTime?: string
  location?: string
  address?: string
  guestCount: number
  guests: Array<{ name: string; email?: string }>
  qrCode?: string
  reservationId: string
  clubLevel: string
}): { subject: string; html: string; text: string } {
  const dateFormatted = new Date(data.experienceDate).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const timeFormatted = data.experienceTime || 'A confirmar'

  const subject = `✅ Reserva Confirmada: ${data.experienceTitle} - Prospere`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Confirmada - Prospere</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #1F2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold;">✅ Reserva Confirmada!</h1>
              <p style="margin: 10px 0 0 0; color: #E0E7FF; font-size: 16px;">Prospere Consórcios</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="margin: 0 0 20px 0; color: #F3F4F6; font-size: 16px; line-height: 1.6;">
                Olá <strong>${data.userName}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #D1D5DB; font-size: 15px; line-height: 1.6;">
                Sua reserva foi <strong style="color: #10B981;">confirmada com sucesso!</strong>
              </p>

              <!-- Detalhes da Experiência -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px 0; color: #FFFFFF; font-size: 20px; font-weight: 600;">📅 Detalhes da Reserva</h2>
                    
                    <table role="presentation" width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0; width: 140px;">Experiência:</td>
                        <td style="color: #FFFFFF; font-size: 14px; font-weight: 500; padding: 8px 0;">${data.experienceTitle}</td>
                      </tr>
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0;">Data:</td>
                        <td style="color: #FFFFFF; font-size: 14px; font-weight: 500; padding: 8px 0;">${dateFormatted}</td>
                      </tr>
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0;">Horário:</td>
                        <td style="color: #FFFFFF; font-size: 14px; font-weight: 500; padding: 8px 0;">${timeFormatted}</td>
                      </tr>
                      ${data.location ? `
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0;">Local:</td>
                        <td style="color: #FFFFFF; font-size: 14px; font-weight: 500; padding: 8px 0;">${data.location}</td>
                      </tr>
                      ` : ''}
                      ${data.address ? `
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0;">Endereço:</td>
                        <td style="color: #FFFFFF; font-size: 14px; font-weight: 500; padding: 8px 0;">${data.address}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0;">Convidados:</td>
                        <td style="color: #FFFFFF; font-size: 14px; font-weight: 500; padding: 8px 0;">${data.guestCount} pessoa(s)</td>
                      </tr>
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0;">Nível Club:</td>
                        <td style="color: #3B82F6; font-size: 14px; font-weight: 500; padding: 8px 0;">${data.clubLevel}</td>
                      </tr>
                      <tr>
                        <td style="color: #9CA3AF; font-size: 14px; padding: 8px 0;">ID Reserva:</td>
                        <td style="color: #9CA3AF; font-size: 12px; font-family: monospace; padding: 8px 0;">${data.reservationId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Lista de Convidados -->
              ${data.guests.length > 0 ? `
              <div style="background-color: #111827; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">👥 Convidados</h3>
                <ul style="margin: 0; padding-left: 20px; color: #D1D5DB; font-size: 14px; line-height: 1.8;">
                  ${data.guests.map(g => `<li>${g.name}${g.email ? ` (${g.email})` : ''}</li>`).join('')}
                </ul>
              </div>
              ` : ''}

              ${data.qrCode ? `
              <!-- QR Code -->
              <div style="background-color: #111827; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
                <h3 style="margin: 0 0 15px 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">📱 Seu QR Code</h3>
                <p style="margin: 0 0 20px 0; color: #9CA3AF; font-size: 14px;">
                  Apresente este QR Code no dia do evento para check-in
                </p>
                <div style="background-color: #FFFFFF; padding: 20px; border-radius: 8px; display: inline-block;">
                  <img src="${data.qrCode}" alt="QR Code" style="max-width: 250px; height: auto;" />
                </div>
              </div>
              ` : ''}

              <!-- Próximos Passos -->
              <div style="background-color: #1E3A8A; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">📋 Próximos Passos</h3>
                <ul style="margin: 0; padding-left: 20px; color: #E0E7FF; font-size: 14px; line-height: 1.8;">
                  <li>Confirme sua presença com pelo menos 24h de antecedência</li>
                  <li>Chegue com 15 minutos de antecedência</li>
                  <li>Apresente o QR Code no check-in</li>
                  <li>Em caso de dúvidas, entre em contato conosco</li>
                </ul>
              </div>

              <!-- Contato -->
              <div style="border-top: 1px solid #374151; padding-top: 30px; text-align: center;">
                <p style="margin: 0 0 15px 0; color: #9CA3AF; font-size: 14px;">
                  Precisa de ajuda? Entre em contato:
                </p>
                <p style="margin: 0; color: #3B82F6; font-size: 16px; font-weight: 500;">
                  📧 ${FROM_EMAIL}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 30px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 12px;">
                © ${new Date().getFullYear()} Prospere Consórcios. Todos os direitos reservados.
              </p>
              <p style="margin: 0; color: #4B5563; font-size: 11px;">
                Esta é uma mensagem automática. Por favor, não responda este email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
✅ RESERVA CONFIRMADA - PROSPERE CONSÓRCIOS

Olá ${data.userName},

Sua reserva foi confirmada com sucesso!

📅 DETALHES DA RESERVA:
- Experiência: ${data.experienceTitle}
- Data: ${dateFormatted}
- Horário: ${timeFormatted}
${data.location ? `- Local: ${data.location}\n` : ''}
${data.address ? `- Endereço: ${data.address}\n` : ''}
- Convidados: ${data.guestCount} pessoa(s)
- Nível Club: ${data.clubLevel}
- ID Reserva: ${data.reservationId}

${data.guests.length > 0 ? `\n👥 CONVIDADOS:\n${data.guests.map(g => `- ${g.name}${g.email ? ` (${g.email})` : ''}`).join('\n')}\n` : ''}

📋 PRÓXIMOS PASSOS:
- Confirme sua presença com pelo menos 24h de antecedência
- Chegue com 15 minutos de antecedência
- Apresente o QR Code no check-in
- Em caso de dúvidas, entre em contato conosco

📧 Contato: ${FROM_EMAIL}

© ${new Date().getFullYear()} Prospere Consórcios. Todos os direitos reservados.
  `.trim()

  return { subject, html, text }
}

/**
 * Template de email de boas-vindas com link para definir senha
 */
export function getWelcomeSetPasswordEmail(data: {
  clientName: string
  clientEmail: string
  token: string
  vendedorNome: string
  totalCotas: number
  totalCredito: number
}): { subject: string; html: string; text: string } {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const setPasswordUrl = `${baseUrl}/definir-senha?token=${data.token}&email=${encodeURIComponent(data.clientEmail)}`

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const subject = `Bem-vindo ao Portal Prospere - Defina sua senha`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #1F2937; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold;">Bem-vindo ao Portal Prospere!</h1>
              <p style="margin: 10px 0 0 0; color: #E0E7FF; font-size: 16px;">Seu consultor cadastrou suas cotas</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #F3F4F6; font-size: 16px;">
                Ol&aacute; <strong>${data.clientName}</strong>,
              </p>
              <p style="margin: 0 0 25px 0; color: #D1D5DB; font-size: 15px; line-height: 1.6;">
                O consultor <strong style="color: #60A5FA;">${data.vendedorNome}</strong> cadastrou suas cotas de cons&oacute;rcio no portal Prospere.
              </p>
              <table role="presentation" width="100%" style="background-color: #111827; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr><td>
                  <h3 style="margin: 0 0 15px 0; color: #FFFFFF; font-size: 18px;">Resumo:</h3>
                  <table role="presentation" width="100%" cellpadding="5">
                    <tr>
                      <td style="color: #9CA3AF; font-size: 14px;">Total de cotas:</td>
                      <td style="color: #FFFFFF; font-size: 14px; font-weight: bold; text-align: right;">${data.totalCotas}</td>
                    </tr>
                    <tr>
                      <td style="color: #9CA3AF; font-size: 14px;">Cr&eacute;dito total:</td>
                      <td style="color: #10B981; font-size: 14px; font-weight: bold; text-align: right;">${formatCurrency(data.totalCredito)}</td>
                    </tr>
                  </table>
                </td></tr>
              </table>
              <table role="presentation" width="100%" style="margin-bottom: 30px;">
                <tr><td align="center">
                  <a href="${setPasswordUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: #FFFFFF; font-size: 18px; font-weight: bold; padding: 16px 40px; border-radius: 8px; text-decoration: none;">
                    Definir Minha Senha
                  </a>
                </td></tr>
              </table>
              <p style="margin: 0 0 10px 0; color: #9CA3AF; font-size: 13px; text-align: center;">
                Este link expira em 72 horas.
              </p>
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                Se o bot&atilde;o n&atilde;o funcionar, copie: <span style="color: #60A5FA; word-break: break-all;">${setPasswordUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #111827; padding: 25px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0; color: #6B7280; font-size: 12px;">&copy; ${new Date().getFullYear()} Prospere Cons&oacute;rcios.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
BEM-VINDO AO PORTAL PROSPERE!

Olá ${data.clientName},

O consultor ${data.vendedorNome} cadastrou suas ${data.totalCotas} cotas (crédito total: ${formatCurrency(data.totalCredito)}) no portal Prospere.

Defina sua senha: ${setPasswordUrl}

Este link expira em 72 horas.

© ${new Date().getFullYear()} Prospere Consórcios.
  `.trim()

  return { subject, html, text }
}

/**
 * Template de email de cancelamento de reserva
 */
export function getReservationCancellationEmail(data: {
  userName: string
  experienceTitle: string
  experienceDate: Date
  reservationId: string
}): { subject: string; html: string; text: string } {
  const dateFormatted = new Date(data.experienceDate).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const subject = `❌ Reserva Cancelada: ${data.experienceTitle} - Prospere`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva Cancelada - Prospere</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #1F2937; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: bold;">❌ Reserva Cancelada</h1>
              <p style="margin: 10px 0 0 0; color: #FEE2E2; font-size: 16px;">Prospere Consórcios</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #F3F4F6; font-size: 16px;">
                Olá <strong>${data.userName}</strong>,
              </p>
              <p style="margin: 0 0 30px 0; color: #D1D5DB; font-size: 15px; line-height: 1.6;">
                Sua reserva para <strong>${data.experienceTitle}</strong> em <strong>${dateFormatted}</strong> foi cancelada.
              </p>
              <p style="margin: 0 0 30px 0; color: #D1D5DB; font-size: 15px; line-height: 1.6;">
                Se você não solicitou este cancelamento ou tem dúvidas, entre em contato conosco.
              </p>
              <p style="margin: 0; color: #3B82F6; font-size: 16px; font-weight: 500; text-align: center;">
                📧 ${FROM_EMAIL}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
❌ RESERVA CANCELADA - PROSPERE CONSÓRCIOS

Olá ${data.userName},

Sua reserva para ${data.experienceTitle} em ${dateFormatted} foi cancelada.

Se você não solicitou este cancelamento ou tem dúvidas, entre em contato conosco.

📧 Contato: ${FROM_EMAIL}
  `.trim()

  return { subject, html, text }
}
