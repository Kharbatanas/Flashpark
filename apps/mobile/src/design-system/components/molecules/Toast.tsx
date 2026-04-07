import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { shadows } from '../../tokens/shadows'
import { timingFast, timingNormal } from '../../tokens/animation'
import { AppText } from '../atoms/AppText'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  visible: boolean
  onDismiss?: () => void
}

const TOAST_DURATION = 3000

const TYPE_CONFIG: Record<ToastType, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: '#10B981' },
  error: { icon: AlertCircle, color: '#EF4444' },
  warning: { icon: AlertTriangle, color: '#F5A623' },
  info: { icon: Info, color: '#3B82F6' },
}

export function Toast({
  message,
  type = 'info',
  visible,
  onDismiss,
}: ToastProps): React.JSX.Element {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(-100)
  const opacity = useSharedValue(0)

  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, timingNormal)
      opacity.value = withSequence(
        withTiming(1, timingFast),
        withDelay(TOAST_DURATION, withTiming(0, timingNormal, (finished) => {
          if (finished && onDismiss) {
            runOnJS(onDismiss)()
          }
        }))
      )
    } else {
      translateY.value = withTiming(-100, timingNormal)
      opacity.value = withTiming(0, timingFast)
    }
  }, [visible])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          top: insets.top + spacing[3],
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      accessibilityRole="alert"
    >
      <Icon size={18} color={config.color} strokeWidth={2} />
      <AppText variant="callout" color={colors.text} style={styles.message}>
        {message}
      </AppText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    zIndex: 9999,
    ...shadows.lg,
  },
  message: {
    flex: 1,
  },
})
