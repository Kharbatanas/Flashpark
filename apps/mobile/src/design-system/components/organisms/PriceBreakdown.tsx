import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '../atoms/AppText'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

interface PriceBreakdownProps {
  subtotal: number
  platformFee: number
  total: number
  extensionAmount?: number | null
}

interface LineProps {
  label: string
  amount: number
  color?: string
  bold?: boolean
}

function Line({ label, amount, color, bold }: LineProps) {
  const { colors } = useTheme()
  const textColor = color ?? colors.text
  return (
    <View style={styles.line}>
      <AppText
        variant="body"
        style={[{ color: colors.textSecondary }, bold && { fontWeight: '700', color: textColor }]}
      >
        {label}
      </AppText>
      <AppText
        variant="body"
        style={[{ color: textColor }, bold && { fontWeight: '700' }]}
      >
        {amount >= 0 ? '' : '–'}{Math.abs(amount).toFixed(2)}€
      </AppText>
    </View>
  )
}

export function PriceBreakdown({ subtotal, platformFee, total, extensionAmount }: PriceBreakdownProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Line label="Sous-total" amount={subtotal} />
      <Line label="Frais de service" amount={platformFee} />
      {extensionAmount != null && extensionAmount > 0 && (
        <Line label="Prolongation" amount={extensionAmount} color="#F5A623" />
      )}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Line label="Total" amount={total} bold />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing[1],
  },
})
