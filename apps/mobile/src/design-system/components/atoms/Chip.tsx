import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { AppText } from './AppText'

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  leadingIcon?: React.ReactNode
  disabled?: boolean
}

export function Chip({
  label,
  selected = false,
  onPress,
  leadingIcon,
  disabled = false,
}: ChipProps): React.JSX.Element {
  const { colors } = useTheme()

  const handlePress = (): void => {
    if (disabled || onPress == null) return
    haptics.selection()
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || onPress == null}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {leadingIcon != null && (
        <View style={styles.icon}>{leadingIcon}</View>
      )}
      <AppText
        variant="callout"
        color={selected ? colors.textInverse : colors.textSecondary}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radii.full,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing[1],
  },
})
