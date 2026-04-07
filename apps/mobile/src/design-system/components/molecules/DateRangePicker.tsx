import React, { useState } from 'react'
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Calendar, Clock } from 'lucide-react-native'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { shadows } from '../../tokens/shadows'
import { AppText } from '../atoms/AppText'

// DateTimePicker is a peer dependency of Expo SDK — resolved at runtime
// Install: npx expo install @react-native-community/datetimepicker
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DateTimePicker = (() => {
  try {
    return require('@react-native-community/datetimepicker').default
  } catch {
    return null
  }
})()

interface DateRangePickerProps {
  startDate: Date
  endDate: Date
  onStartChange: (date: Date) => void
  onEndChange: (date: Date) => void
  minDate?: Date
}

type PickerMode = 'date' | 'time'
type ActiveField = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  minDate,
}: DateRangePickerProps): React.JSX.Element {
  const { colors } = useTheme()
  const [activeField, setActiveField] = useState<ActiveField>(null)

  const pickerMode: PickerMode =
    activeField === 'startTime' || activeField === 'endTime' ? 'time' : 'date'

  const pickerValue =
    activeField === 'startDate' || activeField === 'startTime'
      ? startDate
      : endDate

  const handlePickerChange = (_: unknown, date?: Date): void => {
    if (date == null) {
      setActiveField(null)
      return
    }
    if (activeField === 'startDate' || activeField === 'startTime') {
      onStartChange(date)
    } else {
      onEndChange(date)
    }
    if (Platform.OS === 'android') {
      setActiveField(null)
    }
  }

  const openField = (field: ActiveField): void => {
    haptics.light()
    setActiveField(field)
  }

  return (
    <View style={styles.container}>
      <DateField
        label="Début"
        date={startDate}
        onDatePress={() => openField('startDate')}
        onTimePress={() => openField('startTime')}
        colors={colors}
      />
      <DateField
        label="Fin"
        date={endDate}
        onDatePress={() => openField('endDate')}
        onTimePress={() => openField('endTime')}
        colors={colors}
      />
      {activeField != null && DateTimePicker != null && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
          minimumDate={minDate}
          locale="fr-FR"
        />
      )}
    </View>
  )
}

interface DateFieldProps {
  label: string
  date: Date
  onDatePress: () => void
  onTimePress: () => void
  colors: ReturnType<typeof useTheme>['colors']
}

function DateField({ label, date, onDatePress, onTimePress, colors }: DateFieldProps) {
  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="caption1" color={colors.textTertiary} style={styles.fieldLabel}>
        {label}
      </AppText>
      <View style={styles.fieldRow}>
        <TouchableOpacity
          onPress={onDatePress}
          style={styles.fieldPart}
          accessibilityLabel={`Sélectionner la date de ${label.toLowerCase()}`}
        >
          <Calendar size={14} color={colors.primary} strokeWidth={2} />
          <AppText variant="callout" color={colors.text} style={styles.fieldText}>
            {format(date, 'dd MMM', { locale: fr })}
          </AppText>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          onPress={onTimePress}
          style={styles.fieldPart}
          accessibilityLabel={`Sélectionner l'heure de ${label.toLowerCase()}`}
        >
          <Clock size={14} color={colors.primary} strokeWidth={2} />
          <AppText variant="callout" color={colors.text} style={styles.fieldText}>
            {format(date, 'HH:mm')}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  field: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing[3],
    ...shadows.sm,
  },
  fieldLabel: {
    marginBottom: spacing[1],
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldPart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  fieldText: {
    marginLeft: spacing[1],
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: spacing[3],
  },
})
