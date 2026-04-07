import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'

interface ListItemProps {
  icon?: React.ReactNode
  label: string
  value?: string
  onPress?: () => void
  showChevron?: boolean
  destructive?: boolean
}

export function ListItem({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false,
}: ListItemProps): React.JSX.Element {
  const { colors } = useTheme()

  const handlePress = (): void => {
    if (onPress == null) return
    haptics.light()
    onPress()
  }

  const labelColor = destructive ? colors.danger : colors.text

  const content = (
    <View style={styles.row}>
      {icon != null && <View style={styles.icon}>{icon}</View>}
      <AppText variant="callout" color={labelColor} style={styles.label}>
        {label}
      </AppText>
      <View style={styles.right}>
        {value != null && (
          <AppText variant="callout" color={colors.textSecondary}>
            {value}
          </AppText>
        )}
        {showChevron && onPress != null && (
          <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
        )}
      </View>
    </View>
  )

  if (onPress == null) {
    return <View style={styles.container}>{content}</View>
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={label}
    >
      {content}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  icon: {
    width: 24,
    alignItems: 'center',
  },
  label: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
})
