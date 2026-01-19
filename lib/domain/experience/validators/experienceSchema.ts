/**
 * Zod schemas para validação de experiências
 */

import { z } from 'zod'

export const experienceStatusSchema = z.enum(['active', 'inactive', 'archived'])

export const reservationStatusSchema = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'checked_in',
  'no_show',
])

export const experienceSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  imageUrl: z.string().url().optional(),
  gallery: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: experienceStatusSchema,
  eligibilityRules: z.record(z.string(), z.any()).optional(),
  benefits: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  clubLevelId: z.string().optional(),
})

export const experienceDateSchema = z.object({
  id: z.string(),
  experienceId: z.string(),
  date: z.date(),
  time: z.string().optional(),
  maxCapacity: z.number().int().positive(),
  capacityByLevel: z.record(z.string(), z.number().int().positive()).optional(),
  availableSlots: z.number().int().min(0),
  price: z.number().min(0),
  status: z.enum(['active', 'full', 'cancelled']),
})

export const reservationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  experienceId: z.string(),
  experienceDateId: z.string(),
  clubLevelId: z.string(),
  status: reservationStatusSchema,
  guestCount: z.number().int().positive(),
  maxGuests: z.number().int().positive(),
  qrCode: z.string().optional(),
  qrCodeImage: z.string().optional(),
  reservationDate: z.date().optional(),
  checkInAt: z.date().optional(),
  checkOutAt: z.date().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const guestSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.date().optional(),
  isLead: z.boolean().default(false),
})

export const clubLevelSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  displayName: z.string().min(1),
  minCreditBRL: z.number().min(0),
  maxCreditBRL: z.number().positive().nullable(),
  color: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  benefits: z.array(z.string()),
  rules: z.record(z.string(), z.any()).optional(),
})
