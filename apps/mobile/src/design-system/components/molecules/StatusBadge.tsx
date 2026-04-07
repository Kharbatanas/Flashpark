import React from 'react'
import { StyleSheet, View } from 'react-native'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'
import { STATUS_CONFIG } from '../../../../lib/constants'

interface StatusBadgeProps {
  status: string
}

const FALLBACK = { label: 'Inconnu', color: '#6B7280', bg: '#F9FAFB' }

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status] ?? FALLBACK

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <AppText variant="caption1" color={config.color}>
        {config.label}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
})
