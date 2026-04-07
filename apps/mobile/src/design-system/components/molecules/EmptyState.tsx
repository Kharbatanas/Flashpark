import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { spacing } from '../../tokens/spacing'
import { radii } from '../../tokens/radii'
import { AppText } from '../atoms/AppText'
import { AppButton } from '../atoms/AppButton'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <Icon size={32} color={colors.primary} strokeWidth={1.5} />
      </View>
      <AppText variant="title3" color={colors.text} style={styles.title}>
        {title}
      </AppText>
      {subtitle != null && (
        <AppText
          variant="callout"
          color={colors.textSecondary}
          style={styles.subtitle}
        >
          {subtitle}
        </AppText>
      )}
      {actionLabel != null && onAction != null && (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
    gap: spacing[3],
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
})
