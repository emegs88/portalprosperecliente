/**
 * Serviço de Geração de QR Code
 */

import QRCodeLib from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

export interface QRCodeData {
  code: string
  imageUrl: string
}

/**
 * Gerar QR Code único para reserva
 */
export async function generateQRCode(data: {
  userId: string
  experienceId: string
  experienceDateId: string
}): Promise<QRCodeData> {
  const code = `PROSPERE:${uuidv4()}:${data.userId}:${data.experienceId}:${data.experienceDateId}`
  
  try {
    // Gerar imagem do QR Code em base64
    const qrCodeDataUrl = await QRCodeLib.toDataURL(code, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Para produção, salvar em storage (S3, etc) e retornar URL
    // Por enquanto, retornar data URL
    return {
      code,
      imageUrl: qrCodeDataUrl,
    }
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Erro ao gerar QR Code')
  }
}

/**
 * Validar QR Code
 */
export function validateQRCode(qrCode: string): {
  valid: boolean
  userId?: string
  experienceId?: string
  experienceDateId?: string
} {
  try {
    const parts = qrCode.split(':')
    if (parts.length !== 5 || parts[0] !== 'PROSPERE') {
      return { valid: false }
    }

    return {
      valid: true,
      userId: parts[2],
      experienceId: parts[3],
      experienceDateId: parts[4],
    }
  } catch {
    return { valid: false }
  }
}
