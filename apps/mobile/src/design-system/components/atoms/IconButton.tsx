import React from 'react'
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { typography } from '../../tokens/typography'
import { AppText } from './AppText'

type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps {
  icon: React.ReactNode
  onPress: () => void
  size?: IconButtonSize
  badge?: number | boolean
  disabled?: boolean
  variant?: 'filled' | 'ghost' | 'outline'
}

const sizeMap: Record<IconButtonSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
}

export function IconButton({
  icon,
  onPress,
  size = 'md',
  badge,
  disabled = false,
  variant = 'ghost',
}: IconButtonProps): React.JSX.Element {
  const { colors } = useTheme()
  const dimension = sizeMap[size]

  const handlePress = (): void => {
    if (disabled) return
    haptics.light()
    onPress()
  }

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
    backgroundColor:
      variant === 'filled'
        ? colors.primary
        : variant === 'outline'
        ? 'transparent'
        : 'transparent',
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderColor: variant === 'outline' ? colors.border : 'transparent',
  }

  const badgeCount = typeof badge === 'number' ? badge : undefined
  const showBadge = badge === true || (typeof badge === 'number' && badge > 0)

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
    >
      {icon}
      {showBadge && (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.danger },
            badgeCount != null && badgeCount > 9 ? styles.badgeLarge : null,
          ]}
        >
          {badgeCount != null && (
            <AppText
              variant="caption2"
              color={colors.textInverse}
              style={{ fontSize: 9, lineHeight: 10 }}
            >
              {badgeCount > 99 ? '99+' : String(badgeCount)}
            </AppText>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 16,
    height: 16,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeLarge: {
    minWidth: 20,
    height: 20,
  },
})
