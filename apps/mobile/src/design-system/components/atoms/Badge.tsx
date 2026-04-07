import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { AppText } from './AppText'

type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
type BadgeVariant = 'dot' | 'label' | 'count'

interface BadgeProps {
  variant?: BadgeVariant
  color?: BadgeColor
  label?: string
  count?: number
}

export function Badge({
  variant = 'label',
  color = 'primary',
  label,
  count,
}: BadgeProps): React.JSX.Element {
  const { colors } = useTheme()

  const { bg, fg } = getColors(color, colors)

  if (variant === 'dot') {
    return (
      <View style={[styles.dot, { backgroundColor: bg }]} />
    )
  }

  if (variant === 'count') {
    const display = (count ?? 0) > 99 ? '99+' : String(count ?? 0)
    return (
      <View style={[styles.count, { backgroundColor: bg }]}>
        <AppText variant="caption2" color={fg} style={styles.countText}>
          {display}
        </AppText>
      </View>
    )
  }

  return (
    <View style={[styles.label, { backgroundColor: bg }]}>
      <AppText variant="caption2" color={fg}>
        {label}
      </AppText>
    </View>
  )
}

function getColors(
  color: BadgeColor,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: string; fg: string } {
  switch (color) {
    case 'primary':
      return { bg: colors.primaryMuted, fg: colors.primary }
    case 'success':
      return { bg: colors.successMuted, fg: colors.success }
    case 'warning':
      return { bg: colors.warningMuted, fg: colors.warning }
    case 'danger':
      return { bg: colors.dangerMuted, fg: colors.danger }
    case 'neutral':
      return { bg: colors.borderLight, fg: colors.textSecondary }
  }
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  countText: {
    lineHeight: 14,
  },
  label: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
})
