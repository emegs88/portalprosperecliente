import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export function parseBrazilianNumber(value: string): number {
  return parseFloat(
    value
      .replace(/\./g, '')
      .replace(',', '.')
  )
}

export function parseBrazilianPercent(value: string): number {
  const parsed = parseFloat(value.replace(',', '.'))
  return parsed
}
