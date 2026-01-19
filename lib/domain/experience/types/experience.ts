/**
 * Types TypeScript para domínio de EXPERIÊNCIAS
 * (Já existe parcialmente, consolidando aqui)
 */

export type ExperienceStatus = 'active' | 'inactive' | 'archived'
export type ReservationStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'cancelled' 
  | 'checked_in' 
  | 'no_show'

export interface Experience {
  id: string
  slug: string
  title: string
  description?: string
  longDescription?: string
  imageUrl?: string
  gallery?: string[]
  videoUrl?: string
  location?: string
  address?: string
  category?: string
  tags?: string[]
  status: ExperienceStatus
  eligibilityRules?: Record<string, any>
  benefits?: string[]
  metadata?: Record<string, any>
  clubLevelId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ExperienceDate {
  id: string
  experienceId: string
  date: Date
  time?: string
  maxCapacity: number
  capacityByLevel?: Record<string, number>
  availableSlots: number
  price: number
  status: 'active' | 'full' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface Reservation {
  id: string
  userId: string
  experienceId: string
  experienceDateId: string
  clubLevelId: string
  status: ReservationStatus
  guestCount: number
  maxGuests: number
  qrCode?: string
  qrCodeImage?: string
  reservationDate?: Date
  checkInAt?: Date
  checkOutAt?: Date
  notes?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Guest {
  id: string
  reservationId: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  birthDate?: Date
  isLead: boolean
  createdAt: Date
}

export interface ClubLevel {
  id: string
  name: string
  displayName: string
  minCreditBRL: number
  maxCreditBRL?: number
  color: string
  icon?: string
  description?: string
  benefits: string[]
  rules?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
