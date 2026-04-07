import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { AppText } from '../atoms/AppText'
import { TypographyVariant } from '../../tokens/typography'

type PriceUnit = '/h' | '/jour' | '/mois'
type PriceSize = 'sm' | 'md' | 'lg'

interface PriceDisplayProps {
  price: number | string
  unit?: PriceUnit
  size?: PriceSize
  color?: string
}

const sizeMap: Record<PriceSize, { amount: TypographyVariant; unit: TypographyVariant }> = {
  sm: { amount: 'callout', unit: 'caption1' },
  md: { amount: 'headline', unit: 'callout' },
  lg: { amount: 'title2', unit: 'body' },
}

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return num.toFixed(2).replace('.', ',')
}

export function PriceDisplay({
  price,
  unit = '/h',
  size = 'md',
  color,
}: PriceDisplayProps): React.JSX.Element {
  const { colors } = useTheme()
  const textColor = color ?? colors.text
  const variantCfg = sizeMap[size]

  return (
    <View style={styles.row}>
      <AppText variant={variantCfg.amount} color={textColor}>
        {formatPrice(price)} €
      </AppText>
      <AppText variant={variantCfg.unit} color={colors.textSecondary}>
        {unit}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
})
