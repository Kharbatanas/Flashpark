import React, { useState } from 'react'
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { timingFast } from '../../tokens/animation'
import { typography } from '../../tokens/typography'
import { AppText } from './AppText'

interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  isPassword?: boolean
}

export function AppInput({
  label,
  error,
  helper,
  leftIcon,
  isPassword,
  value,
  onChangeText,
  ...rest
}: AppInputProps): React.JSX.Element {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [isSecure, setIsSecure] = useState(isPassword ?? false)

  const borderAnim = useSharedValue(0)

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1 ? colors.primary : (error ? colors.danger : colors.border),
  }))

  const handleFocus = (): void => {
    setIsFocused(true)
    borderAnim.value = withTiming(1, timingFast)
    rest.onFocus?.(undefined as never)
  }

  const handleBlur = (): void => {
    setIsFocused(false)
    borderAnim.value = withTiming(0, timingFast)
    rest.onBlur?.(undefined as never)
  }

  const handleClear = (): void => {
    onChangeText?.('')
  }

  const showClear = value != null && value.length > 0 && isFocused && !isPassword

  return (
    <View style={styles.wrapper}>
      {label != null && (
        <AppText variant="caption1" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      )}

      <Animated.View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.border },
          animatedBorder,
        ]}
      >
        {leftIcon != null && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              paddingLeft: leftIcon != null ? 0 : spacing[1],
            },
          ]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />

        {showClear && (
          <TouchableOpacity onPress={handleClear} style={styles.rightAction} hitSlop={8}>
            <AppText variant="caption1" color={colors.textSecondary}>✕</AppText>
          </TouchableOpacity>
        )}

        {isPassword === true && (
          <TouchableOpacity
            onPress={() => setIsSecure((s) => !s)}
            style={styles.rightAction}
            hitSlop={8}
          >
            <AppText variant="caption1" color={colors.textSecondary}>
              {isSecure ? 'Voir' : 'Cacher'}
            </AppText>
          </TouchableOpacity>
        )}
      </Animated.View>

      {error != null && (
        <AppText variant="caption2" color={colors.danger} style={styles.hint}>
          {error}
        </AppText>
      )}
      {error == null && helper != null && (
        <AppText variant="caption2" color={colors.textTertiary} style={styles.hint}>
          {helper}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing[1],
  },
  label: {
    marginBottom: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    minHeight: 48,
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    paddingVertical: spacing[3],
  },
  rightAction: {
    marginLeft: spacing[2],
    paddingHorizontal: spacing[1],
  },
  hint: {
    marginTop: 2,
  },
})
