import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { AppText } from './AppText'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface AppButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  accessibilityLabel?: string
}

const sizeConfig: Record<ButtonSize, { height: number; paddingH: number; textVariant: 'caption1' | 'callout' | 'headline' }> = {
  sm: { height: 36, paddingH: spacing[3], textVariant: 'caption1' },
  md: { height: 48, paddingH: spacing[5], textVariant: 'callout' },
  lg: { height: 56, paddingH: spacing[6], textVariant: 'headline' },
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
}: AppButtonProps): React.JSX.Element {
  const { colors } = useTheme()
  const scale = useSharedValue(1)
  const cfg = sizeConfig[size]

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = (): void => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 })
  }

  const handlePressOut = (): void => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 })
  }

  const handlePress = (): void => {
    if (disabled || loading) return
    haptics.light()
    onPress()
  }

  const containerStyle = getContainerStyle(variant, disabled, colors, cfg.height, cfg.paddingH)
  const labelColor = getLabelColor(variant, disabled, colors)

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[containerStyle, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color={labelColor} size="small" />
        ) : (
          <View style={styles.content}>
            {icon != null && <View style={styles.iconWrap}>{icon}</View>}
            <AppText variant={cfg.textVariant} color={labelColor}>
              {title}
            </AppText>
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

function getContainerStyle(
  variant: ButtonVariant,
  disabled: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
  height: number,
  paddingH: number
): ViewStyle {
  const base: ViewStyle = {
    height,
    paddingHorizontal: paddingH,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  }

  switch (variant) {
    case 'primary':
      return { ...base, backgroundColor: colors.primary }
    case 'secondary':
      return { ...base, backgroundColor: colors.primaryMuted }
    case 'outline':
      return { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary }
    case 'ghost':
      return { ...base, backgroundColor: 'transparent' }
    case 'danger':
      return { ...base, backgroundColor: colors.danger }
  }
}

function getLabelColor(
  variant: ButtonVariant,
  disabled: boolean,
  colors: ReturnType<typeof useTheme>['colors']
): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return colors.textInverse
    case 'secondary':
    case 'outline':
    case 'ghost':
      return colors.primary
  }
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: spacing[2],
  },
})
