/**
 * Testes para o serviço de email
 * Execute: npx tsx lib/services/emailService.test.ts
 */

import { getReservationConfirmationEmail } from './emailService'

// Teste do template de email
const testEmail = getReservationConfirmationEmail({
  userName: 'João Silva',
  userEmail: 'joao@example.com',
  experienceTitle: 'Experiência Premium - Autódromo de Interlagos',
  experienceDate: new Date('2024-03-15T14:00:00'),
  experienceTime: '14:00',
  location: 'Autódromo de Interlagos',
  address: 'Av. Senador Teotônio Vilela, 261 - Interlagos, São Paulo - SP',
  guestCount: 2,
  guests: [
    { name: 'João Silva', email: 'joao@example.com' },
    { name: 'Maria Silva', email: 'maria@example.com' },
  ],
  qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  reservationId: 'test-reservation-123',
  clubLevel: 'Ouro',
})

console.log('📧 Subject:', testEmail.subject)
console.log('✅ Template HTML gerado com sucesso!')
console.log('✅ Template Text gerado com sucesso!')
