import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'

function toDate(date: string | Date): Date {
  if (typeof date === 'string') return parseISO(date)
  return date
}

/**
 * Format a numeric price to French currency string.
 * @example formatPrice(3.5) → "3,50 €"
 */
export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return '— €'
  return num.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a date to French long form.
 * @example formatDateFR('2026-04-07') → "mardi 7 avril 2026"
 */
export function formatDateFR(date: string | Date): string {
  try {
    return format(toDate(date), 'EEEE d MMMM yyyy', { locale: fr })
  } catch {
    return '—'
  }
}

/**
 * Format a date to a short French form.
 * @example formatDateShortFR('2026-04-07') → "7 avr. 2026"
 */
export function formatDateShortFR(date: string | Date): string {
  try {
    return format(toDate(date), 'd MMM yyyy', { locale: fr })
  } catch {
    return '—'
  }
}

/**
 * Format a date to time only (24h).
 * @example formatTimeFR('2026-04-07T14:30:00Z') → "14:30"
 */
export function formatTimeFR(date: string | Date): string {
  try {
    return format(toDate(date), 'HH:mm', { locale: fr })
  } catch {
    return '—'
  }
}

/**
 * Format a date to short date + time.
 * @example formatDateTimeFR('2026-04-07T14:30:00Z') → "7 avr. 2026 à 14:30"
 */
export function formatDateTimeFR(date: string | Date): string {
  try {
    return format(toDate(date), "d MMM yyyy 'à' HH:mm", { locale: fr })
  } catch {
    return '—'
  }
}

/**
 * Format a date relative to now.
 * @example formatRelativeTime('2026-04-07T12:00:00Z') → "il y a 2h"
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const d = toDate(date)
    if (isToday(d)) {
      return formatDistanceToNow(d, { locale: fr, addSuffix: true })
    }
    if (isYesterday(d)) {
      return 'hier'
    }
    return formatDateShortFR(d)
  } catch {
    return '—'
  }
}

/**
 * Format a duration in hours to human-readable French format.
 * @example formatDuration(2.5) → "2h30"
 */
export function formatDuration(hours: number): string {
  if (hours <= 0) return '0h'
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}
