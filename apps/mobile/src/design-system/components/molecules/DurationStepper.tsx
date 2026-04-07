import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { shadows } from '../../tokens/shadows'
import { AppText } from '../atoms/AppText'
import { PriceDisplay } from './PriceDisplay'

interface DurationStepperProps {
  hours: number
  minHours?: number
  maxHours?: number
  onChange: (hours: number) => void
  pricePerHour?: number
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}

export function DurationStepper({
  hours,
  minHours = 0.5,
  maxHours = 24,
  onChange,
  pricePerHour,
}: DurationStepperProps): React.JSX.Element {
  const { colors } = useTheme()
  const STEP = 0.5

  const canDecrement = hours > minHours
  const canIncrement = hours < maxHours

  const handleDecrement = (): void => {
    if (!canDecrement) return
    haptics.light()
    onChange(Math.max(minHours, hours - STEP))
  }

  const handleIncrement = (): void => {
    if (!canIncrement) return
    haptics.light()
    onChange(Math.min(maxHours, hours + STEP))
  }

  const totalPrice = pricePerHour != null ? pricePerHour * hours : null

  return (
    <View style={styles.container}>
      <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleDecrement}
          disabled={!canDecrement}
          style={[styles.btn, { opacity: canDecrement ? 1 : 0.35 }]}
          accessibilityLabel="Réduire la durée"
        >
          <Minus size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.valueWrap}>
          <AppText variant="title3" color={colors.text}>
            {formatDuration(hours)}
          </AppText>
        </View>

        <TouchableOpacity
          onPress={handleIncrement}
          disabled={!canIncrement}
          style={[styles.btn, { opacity: canIncrement ? 1 : 0.35 }]}
          accessibilityLabel="Augmenter la durée"
        >
          <Plus size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {totalPrice != null && (
        <View style={styles.total}>
          <AppText variant="callout" color={colors.textSecondary}>
            Total :
          </AppText>
          <PriceDisplay price={totalPrice} unit="/h" size="sm" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  btn: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    justifyContent: 'flex-end',
  },
})
