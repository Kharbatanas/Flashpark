import { differenceInHours, format, formatDuration } from 'date-fns'
import { fr } from 'date-fns/locale'

// Pricing
export function calculateBookingPrice(
  pricePerHour: number,
  startTime: Date,
  endTime: Date
): { totalPrice: number; platformFee: number; hostPayout: number; hours: number } {
  const hours = differenceInHours(endTime, startTime) || 1
  const totalPrice = Math.round(hours * pricePerHour * 100) / 100
  const platformFee = Math.round(totalPrice * 0.2 * 100) / 100
  const hostPayout = Math.round((totalPrice - platformFee) * 100) / 100
  return { totalPrice, platformFee, hostPayout, hours }
}

// Format price in EUR
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

// Format booking duration
export function formatBookingTime(startTime: Date, endTime: Date): string {
  return `${format(startTime, 'dd MMM, HH:mm', { locale: fr })} → ${format(endTime, 'HH:mm', { locale: fr })}`
}

// Distance formatting
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// Generate QR code payload for smart gate access
export function generateGatePayload(bookingId: string, spotId: string, timestamp: number): string {
  return JSON.stringify({ bookingId, spotId, timestamp, v: 1 })
}
