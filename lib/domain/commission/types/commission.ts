/**
 * Types TypeScript para domínio de COMISSÕES
 */

export type CommissionRole = 'seller' | 'leader' | 'partner'

export type CommissionStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'paid' 
  | 'cancelled'

export type PayoutStatus = 
  | 'pending' 
  | 'generated' 
  | 'approved' 
  | 'paid' 
  | 'failed'

export type ReconciliationStatus = 
  | 'pending' 
  | 'reviewed' 
  | 'approved'

export interface CommissionSplit {
  seller: number
  leader?: number
  partner?: number
}

export interface BonusRules {
  minCredit?: number
  bonusRate?: number
  minSales?: number
  bonusAmount?: number
}

export interface CommissionRule {
  id: string
  name: string
  description?: string
  levelId?: string
  productType?: string
  baseRate: number
  splitRules: CommissionSplit
  bonusRules?: BonusRules
  overrideRules?: Record<string, any>
  validFrom: Date
  validUntil?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CommissionEntry {
  id: string
  saleId: string
  userId: string
  role: CommissionRole
  ruleId?: string
  baseAmount: number
  rate: number
  amount: number
  override: number
  bonus: number
  total: number
  status: CommissionStatus
  paidAt?: Date
  payoutId?: string
  notes?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ReconciliationRow {
  /** Linha do CSV */
  rowNumber: number
  saleId?: string
  creditAmount: number
  commissionAmount: number
  date: Date
  clientName?: string
  sellerName?: string
  matched: boolean
  commissionEntryId?: string
  error?: string
}

export interface ReconciliationResult {
  reconciliationId: string
  totalRows: number
  matched: number
  unmatched: number
  unmatchedRows: ReconciliationRow[]
  errors: string[]
}

export interface Payout {
  id: string
  userId: string
  period: string // "2023-10"
  totalAmount: number
  status: PayoutStatus
  paidAt?: Date
  paymentMethod?: string
  paymentReference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface PayoutEntry {
  id: string
  payoutId: string
  saleId: string
  commissionEntryId: string
  amount: number
  createdAt: Date
}

export interface CommissionSummary {
  totalPending: number
  totalConfirmed: number
  totalPaid: number
  totalAmount: number
  entries: CommissionEntry[]
}
