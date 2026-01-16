import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function getDaysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = d.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getUrgencyColor(daysUntil: number): string {
  if (daysUntil <= 1) return 'text-red-600 bg-red-50'
  if (daysUntil <= 3) return 'text-orange-600 bg-orange-50'
  if (daysUntil <= 7) return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}

export function calculateWinRate(won: number, total: number): number {
  if (total === 0) return 0
  return Math.round((won / total) * 100)
}

export function calculateBidDifference(ourBid: number, lowestBid: number): {
  amount: number
  percentage: number
} {
  const amount = ourBid - lowestBid
  const percentage = lowestBid > 0 ? ((amount / lowestBid) * 100) : 0
  return {
    amount,
    percentage: Math.round(percentage * 100) / 100,
  }
}
