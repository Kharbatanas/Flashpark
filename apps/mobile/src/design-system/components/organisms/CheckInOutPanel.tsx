import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Clock, LogIn, LogOut, AlertTriangle } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { AppButton } from '../atoms/AppButton'
import { CountdownTimer } from '../molecules/CountdownTimer'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled'

interface CheckInOutBooking {
  startTime: string | Date
  endTime: string | Date
  status: BookingStatus
  checkedInAt?: string | Date | null
}

interface CheckInOutPanelProps {
  booking: CheckInOutBooking
  onCheckIn: () => void
  onCheckOut: () => void
  loading?: boolean
}

const CHECK_IN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const NEAR_END_MS = 15 * 60 * 1000

type PanelState = 'pre_arrival' | 'check_in_available' | 'checked_in' | 'near_end' | 'overtime'

function getPanelState(booking: CheckInOutBooking): PanelState {
  const now = Date.now()
  const start = new Date(booking.startTime).getTime()
  const end = new Date(booking.endTime).getTime()

  if (booking.status === 'active') {
    if (now > end) return 'overtime'
    if (end - now <= NEAR_END_MS) return 'near_end'
    return 'checked_in'
  }

  if (booking.status === 'confirmed') {
    if (start - now <= CHECK_IN_WINDOW_MS && now <= end) return 'check_in_available'
    return 'pre_arrival'
  }

  return 'pre_arrival'
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0 min'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h} h ${m > 0 ? `${m} min` : ''}`
  return `${m} min`
}

export function CheckInOutPanel({ booking, onCheckIn, onCheckOut, loading = false }: CheckInOutPanelProps) {
  const { colors } = useTheme()
  const panelState = getPanelState(booking)
  const pulseOpacity = useSharedValue(1)

  useEffect(() => {
    if (panelState === 'overtime') {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        false,
      )
    } else {
      pulseOpacity.value = 1
    }
  }, [panelState])

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }))

  const handleCheckIn = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onCheckIn()
  }

  const handleCheckOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onCheckOut()
  }

  const msUntilStart = new Date(booking.startTime).getTime() - Date.now()

  if (panelState === 'pre_arrival') {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.backgroundSecondary }]}>
          <Clock size={28} color={colors.textSecondary} strokeWidth={2} />
        </View>
        <AppText variant="body" style={[styles.message, { color: colors.textSecondary }]}>
          Votre réservation commence dans
        </AppText>
        <AppText variant="heading2" style={[styles.countdown, { color: colors.text }]}>
          {formatCountdown(msUntilStart)}
        </AppText>
      </View>
    )
  }

  if (panelState === 'check_in_available') {
    return (
      <View style={[styles.container, { backgroundColor: '#ECFDF5', borderColor: '#10B981' + '40' }]}>
        <View style={[styles.iconWrap, { backgroundColor: '#10B98120' }]}>
          <LogIn size={28} color="#10B981" strokeWidth={2} />
        </View>
        <AppText variant="label" style={[styles.message, { color: '#10B981' }]}>
          Vous pouvez vous enregistrer
        </AppText>
        <AppButton
          title="Arrivé — Check-in"
          onPress={handleCheckIn}
          loading={loading}
          accessibilityLabel="Effectuer le check-in"
        />
      </View>
    )
  }

  if (panelState === 'checked_in') {
    return (
      <View style={[styles.container, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}>
        <AppText variant="label" style={[styles.message, { color: colors.primary }]}>
          Temps restant
        </AppText>
        <CountdownTimer targetDate={new Date(booking.endTime)} />
        <AppButton
          title="Check-out"
          onPress={handleCheckOut}
          loading={loading}
          variant="outline"
          accessibilityLabel="Effectuer le check-out"
        />
      </View>
    )
  }

  if (panelState === 'near_end') {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFBEB', borderColor: '#F5A62340' }]}>
        <View style={[styles.iconWrap, { backgroundColor: '#F5A62320' }]}>
          <AlertTriangle size={28} color="#F5A623" strokeWidth={2} />
        </View>
        <AppText variant="label" style={[styles.message, { color: '#F5A623' }]}>
          Moins de 15 min restantes
        </AppText>
        <CountdownTimer targetDate={new Date(booking.endTime)} />
        <AppButton
          title="Check-out"
          onPress={handleCheckOut}
          loading={loading}
          accessibilityLabel="Effectuer le check-out"
        />
      </View>
    )
  }

  // overtime
  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: '#FEF2F2', borderColor: '#EF444440' },
        pulseStyle,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: '#EF444420' }]}>
        <LogOut size={28} color="#EF4444" strokeWidth={2} />
      </View>
      <AppText variant="label" style={[styles.message, { color: '#EF4444' }]}>
        Temps dépassé — des frais supplémentaires s'appliquent
      </AppText>
      <AppButton
        title="Check-out maintenant"
        onPress={handleCheckOut}
        loading={loading}
        variant="danger"
        accessibilityLabel="Effectuer le check-out en urgence"
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  message: {
    textAlign: 'center',
  },
  countdown: {
    fontWeight: '800',
    textAlign: 'center',
  },
  actionBtn: {
    width: '100%',
    marginTop: spacing[1],
  },
})
