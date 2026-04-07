import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { AppText } from '../atoms/AppText'
import { AppButton } from '../atoms/AppButton'
import { DurationStepper } from '../molecules/DurationStepper'
import { PriceDisplay } from '../molecules/PriceDisplay'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

const MAX_EXTENSION_HOURS = 8
const STEP_MINUTES = 30

interface ExtensionPanelProps {
  currentEndTime: string | Date
  originalEndTime: string | Date
  pricePerHour: number
  onExtend: (additionalMinutes: number) => void
  loading?: boolean
}

export function ExtensionPanel({
  currentEndTime,
  originalEndTime,
  pricePerHour,
  onExtend,
  loading = false,
}: ExtensionPanelProps) {
  const { colors } = useTheme()
  const [steps, setSteps] = React.useState(1) // 1 step = 30 min

  const currentEnd = new Date(currentEndTime).getTime()
  const originalEnd = new Date(originalEndTime).getTime()
  const alreadyExtendedMs = Math.max(0, currentEnd - originalEnd)
  const alreadyExtendedMin = Math.floor(alreadyExtendedMs / 60000)
  const maxMoreMin = MAX_EXTENSION_HOURS * 60 - alreadyExtendedMin
  const maxSteps = Math.floor(maxMoreMin / STEP_MINUTES)

  const additionalMinutes = steps * STEP_MINUTES
  const extensionCost = useMemo(
    () => (additionalMinutes / 60) * pricePerHour,
    [additionalMinutes, pricePerHour],
  )

  const newEndTime = new Date(currentEnd + additionalMinutes * 60000)
  const newEndLabel = newEndTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onExtend(additionalMinutes)
  }

  const isAtMax = steps >= maxSteps

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="heading3" style={[styles.title, { color: colors.text }]}>
        Prolonger ma réservation
      </AppText>

      <DurationStepper
        hours={steps * (STEP_MINUTES / 60)}
        minHours={STEP_MINUTES / 60}
        maxHours={maxSteps * (STEP_MINUTES / 60)}
        onChange={(h) => setSteps(Math.round(h / (STEP_MINUTES / 60)))}
        pricePerHour={pricePerHour}
      />

      <View style={[styles.summary, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.md }]}>
        <View style={styles.summaryRow}>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            Durée ajoutée
          </AppText>
          <AppText variant="label" style={{ color: colors.text }}>
            {additionalMinutes >= 60
              ? `${Math.floor(additionalMinutes / 60)}h${additionalMinutes % 60 > 0 ? ` ${additionalMinutes % 60}min` : ''}`
              : `${additionalMinutes} min`}
          </AppText>
        </View>
        <View style={styles.summaryRow}>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            Nouvelle fin
          </AppText>
          <AppText variant="label" style={{ color: colors.primary }}>
            {newEndLabel}
          </AppText>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            Coût supplémentaire
          </AppText>
          <PriceDisplay price={extensionCost} />
        </View>
      </View>

      {isAtMax && (
        <AppText variant="caption" style={[styles.maxWarning, { color: '#F5A623' }]}>
          Limite de {MAX_EXTENSION_HOURS}h de prolongation atteinte
        </AppText>
      )}

      <AppButton
        title={`Prolonger · ${extensionCost.toFixed(2)}€`}
        onPress={handleConfirm}
        loading={loading}
        disabled={isAtMax && steps > maxSteps}
        accessibilityLabel={`Confirmer la prolongation de ${additionalMinutes} minutes pour ${extensionCost.toFixed(2)} euros`}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[6],
    gap: spacing[4],
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  summary: {
    padding: spacing[4],
    gap: spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  maxWarning: {
    textAlign: 'center',
    fontWeight: '600',
  },
  confirmBtn: {
    width: '100%',
  },
})
