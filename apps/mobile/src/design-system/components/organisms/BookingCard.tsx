import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { AppText } from '../atoms/AppText'
import { OptimizedImage } from '../atoms/OptimizedImage'
import { StatusBadge } from '../molecules/StatusBadge'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii, shadows } from '../../tokens'

type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'refunded'

interface BookingCardSpot {
  title: string
  photos: string[]
  address?: string
}

interface Booking {
  id: string
  status: BookingStatus
  startTime: string | Date
  endTime: string | Date
  totalPrice: string | number
  spot?: BookingCardSpot
}

interface BookingCardProps {
  booking: Booking
  onPress: () => void
}

function formatDateRange(start: string | Date, end: string | Date): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  const datePart = s.toLocaleDateString('fr-FR', opts)
  const startTime = s.toLocaleTimeString('fr-FR', timeOpts)
  const endTime = e.toLocaleTimeString('fr-FR', timeOpts)
  return `${datePart} · ${startTime} – ${endTime}`
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const { colors } = useTheme()

  const photo = booking.spot?.photos?.[0]
  const price = typeof booking.totalPrice === 'string'
    ? parseFloat(booking.totalPrice)
    : booking.totalPrice

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Réservation ${booking.spot?.title ?? ''}, ${booking.status}`}
    >
      <OptimizedImage
        uri={photo ?? ''}
        width={80}
        height={80}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <AppText variant="label" numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {booking.spot?.title ?? 'Place de parking'}
          </AppText>
          <StatusBadge status={booking.status} />
        </View>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          {formatDateRange(booking.startTime, booking.endTime)}
        </AppText>
        <AppText variant="label" style={[styles.price, { color: colors.text }]}>
          {price?.toFixed(2)}€
        </AppText>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  thumbnail: {
    width: 80,
    height: 80,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: spacing[2],
    gap: 4,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[1],
  },
  title: {
    flex: 1,
  },
  price: {
    fontWeight: '700',
    marginTop: 2,
  },
})
