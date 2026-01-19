import { z } from 'zod'

/**
 * Validações reutilizáveis
 */

export const emailSchema = z.string().email('Email inválido')

export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres')
  .max(100, 'Senha deve ter no máximo 100 caracteres')

export const currencySchema = z.number().min(0, 'Valor deve ser positivo')

export const percentSchema = z
  .number()
  .min(0, 'Percentual deve ser positivo')
  .max(100, 'Percentual não pode ser maior que 100%')

export const quotaSchema = z.object({
  id: z.string(),
  grupo: z.string(),
  cota: z.string(),
  vlBem: currencySchema,
  vlParcela: currencySchema,
  vlReceber: currencySchema,
  percentPago: percentSchema,
  contemplacao: z.string(),
  pclsPagar: z.number().int().min(0),
  pclsPagas: z.number().int().min(0),
})

export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  try {
    passwordSchema.parse(password)
    return { valid: true }
  } catch (error: any) {
    return { valid: false, error: error.errors[0]?.message }
  }
}
