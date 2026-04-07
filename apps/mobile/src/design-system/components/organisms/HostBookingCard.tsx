import React from 'react'
import { StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { AppText } from '../atoms/AppText'
import { AppButton } from '../atoms/AppButton'
import { Avatar } from '../atoms/Avatar'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii, shadows } from '../../tokens'

interface HostBookingCardDriver {
  id: string
  fullName?: string | null
  avatarUrl?: string | null
}

interface HostBookingCardBooking {
  id: string
  startTime: string | Date
  endTime: string | Date
  totalPrice: string | number
  driver?: HostBookingCardDriver
  spotTitle?: string
}

interface HostBookingCardProps {
  booking: HostBookingCardBooking
  onAccept: () => void
  onReject: () => void
  loading?: boolean
}

function formatDateRange(start: string | Date, end: string | Date): string {
  const s = new Date(start)
  const e = new Date(end)
  const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
  return `${s.toLocaleDateString('fr-FR', dateOpts)} · ${s.toLocaleTimeString('fr-FR', timeOpts)} – ${e.toLocaleTimeString('fr-FR', timeOpts)}`
}

export function HostBookingCard({ booking, onAccept, onReject, loading = false }: HostBookingCardProps) {
  const { colors } = useTheme()

  const price = typeof booking.totalPrice === 'string'
    ? parseFloat(booking.totalPrice)
    : booking.totalPrice
  const driverName = booking.driver?.fullName ?? 'Conducteur'

  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onAccept()
  }

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onReject()
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Avatar
          uri={booking.driver?.avatarUrl}
          initials={driverName}
          size="md"
        />
        <View style={styles.driverInfo}>
          <AppText variant="label" style={{ color: colors.text }}>{driverName}</AppText>
          <AppText variant="caption" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {booking.spotTitle ?? 'Place de parking'}
          </AppText>
        </View>
        <AppText variant="heading3" style={{ color: colors.text }}>
          {price?.toFixed(2)}€
        </AppText>
      </View>

      <View style={[styles.dateRow, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.sm }]}>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          {formatDateRange(booking.startTime, booking.endTime)}
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Refuser"
          onPress={handleReject}
          variant="outline"
          disabled={loading}
          accessibilityLabel="Refuser cette réservation"
        />
        <AppButton
          title="Accepter"
          onPress={handleAccept}
          disabled={loading}
          accessibilityLabel="Accepter cette réservation"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  driverInfo: {
    flex: 1,
  },
  dateRow: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  actionBtn: {
    flex: 1,
  },
})
