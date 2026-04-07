import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import { CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, LucideProps } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'refunded'

interface BookingDetailHeroProps {
  status: BookingStatus
  spotTitle: string
  subtitle?: string
}

interface StatusConfig {
  Icon: React.ComponentType<LucideProps>
  color: string
  bg: string
  label: string
  animate: 'bounce' | 'pulse' | 'none'
}

function getStatusConfig(status: BookingStatus): StatusConfig {
  switch (status) {
    case 'confirmed':
      return { Icon: CheckCircle, color: '#10B981', bg: '#ECFDF5', label: 'Confirmée', animate: 'bounce' }
    case 'active':
      return { Icon: Clock, color: '#0540FF', bg: '#EFF6FF', label: 'En cours', animate: 'pulse' }
    case 'completed':
      return { Icon: CheckCircle, color: '#6B7280', bg: '#F9FAFB', label: 'Terminée', animate: 'none' }
    case 'cancelled':
      return { Icon: XCircle, color: '#EF4444', bg: '#FEF2F2', label: 'Annulée', animate: 'none' }
    case 'refunded':
      return { Icon: RefreshCw, color: '#6B7280', bg: '#F9FAFB', label: 'Remboursée', animate: 'none' }
    default:
      return { Icon: AlertCircle, color: '#F5A623', bg: '#FFFBEB', label: 'En attente', animate: 'none' }
  }
}

export function BookingDetailHero({ status, spotTitle, subtitle }: BookingDetailHeroProps) {
  const { colors } = useTheme()
  const config = getStatusConfig(status)

  const scale = useSharedValue(0.5)
  const opacity = useSharedValue(0)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    scale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 200 }))
    opacity.value = withTiming(1, { duration: 300 })

    if (config.animate === 'pulse') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        false,
      )
    }
  }, [status])

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Animated.View style={[styles.iconWrap, iconAnimStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + '20' }]}>
          <config.Icon size={52} color={config.color} strokeWidth={1.5} />
        </View>
      </Animated.View>

      <AppText variant="heading2" style={[styles.statusLabel, { color: config.color }]}>
        {config.label}
      </AppText>
      <AppText
        variant="label"
        numberOfLines={2}
        style={[styles.spotTitle, { color: colors.text }]}
      >
        {spotTitle}
      </AppText>
      {subtitle && (
        <AppText variant="caption" style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
    borderRadius: radii.xl,
  },
  iconWrap: {
    marginBottom: spacing[1],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontWeight: '800',
    textAlign: 'center',
  },
  spotTitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
  },
})
