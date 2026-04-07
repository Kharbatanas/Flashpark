import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'

interface SectionHeaderProps {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps): React.JSX.Element {
  const { colors } = useTheme()

  const handleAction = (): void => {
    if (onAction == null) return
    haptics.light()
    onAction()
  }

  return (
    <View style={styles.container}>
      <AppText variant="title3" color={colors.text}>
        {title}
      </AppText>
      {actionLabel != null && onAction != null && (
        <TouchableOpacity
          onPress={handleAction}
          hitSlop={8}
          accessibilityLabel={actionLabel}
        >
          <AppText variant="callout" color={colors.primary}>
            {actionLabel}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
})
