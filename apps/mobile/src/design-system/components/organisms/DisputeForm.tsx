import React, { useState } from 'react'
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Car, FileX, Lock, AlertTriangle, HelpCircle, Check, LucideProps } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { AppButton } from '../atoms/AppButton'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii, typography } from '../../tokens'

type DisputeType = 'spot_occupied' | 'spot_not_matching' | 'access_issue' | 'safety_concern' | 'other'

interface DisputeFormData {
  type: DisputeType
  description: string
  photos: string[]
}

interface DisputeFormProps {
  onSubmit: (data: DisputeFormData) => void
  loading?: boolean
}

interface DisputeOption {
  type: DisputeType
  label: string
  Icon: React.ComponentType<LucideProps>
}

const DISPUTE_OPTIONS: DisputeOption[] = [
  { type: 'spot_occupied', label: 'Place occupée', Icon: Car },
  { type: 'spot_not_matching', label: 'Non conforme à l\'annonce', Icon: FileX },
  { type: 'access_issue', label: 'Problème d\'accès', Icon: Lock },
  { type: 'safety_concern', label: 'Problème de sécurité', Icon: AlertTriangle },
  { type: 'other', label: 'Autre', Icon: HelpCircle },
]

const MIN_DESC = 10
const MAX_DESC = 1000
const MAX_PHOTOS = 5

export function DisputeForm({ onSubmit, loading = false }: DisputeFormProps) {
  const { colors } = useTheme()
  const [selectedType, setSelectedType] = useState<DisputeType | null>(null)
  const [description, setDescription] = useState('')
  const [photoUrls] = useState<string[]>([]) // photo management handled externally
  const [touched, setTouched] = useState(false)

  const isDescValid = description.trim().length >= MIN_DESC && description.length <= MAX_DESC
  const canSubmit = selectedType !== null && isDescValid && !loading

  const handleTypeSelect = (type: DisputeType) => {
    Haptics.selectionAsync()
    setSelectedType(type)
  }

  const handleSubmit = () => {
    setTouched(true)
    if (!canSubmit || !selectedType) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onSubmit({ type: selectedType, description: description.trim(), photos: photoUrls.slice(0, MAX_PHOTOS) })
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="label" style={[styles.sectionLabel, { color: colors.text }]}>
        Type de problème
      </AppText>

      {DISPUTE_OPTIONS.map(({ type, label, Icon }) => {
        const isSelected = selectedType === type
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.optionCard,
              {
                backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleTypeSelect(type)}
            accessibilityLabel={label}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <View style={[styles.optionIcon, { backgroundColor: isSelected ? colors.primary + '20' : colors.backgroundSecondary }]}>
              <Icon size={20} color={isSelected ? colors.primary : colors.textSecondary} strokeWidth={2} />
            </View>
            <AppText variant="body" style={[{ flex: 1, color: isSelected ? colors.primary : colors.text }, isSelected && styles.bold]}>
              {label}
            </AppText>
            {isSelected && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        )
      })}

      {touched && !selectedType && (
        <AppText variant="caption" style={styles.errorText}>
          Veuillez sélectionner un type de problème
        </AppText>
      )}

      <AppText variant="label" style={[styles.sectionLabel, { color: colors.text, marginTop: spacing[4] }]}>
        Description
      </AppText>
      <TextInput
        style={[
          styles.textarea,
          {
            backgroundColor: colors.surface,
            borderColor: touched && !isDescValid ? '#EF4444' : colors.border,
            color: colors.text,
            ...typography.body,
          },
        ]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez le problème en détail (min. 10 caractères)…"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={5}
        maxLength={MAX_DESC}
        textAlignVertical="top"
        accessibilityLabel="Description du problème"
      />
      <AppText variant="caption" style={[styles.charCount, { color: colors.textSecondary }]}>
        {description.length}/{MAX_DESC}
      </AppText>

      {touched && !isDescValid && (
        <AppText variant="caption" style={styles.errorText}>
          La description doit contenir au moins {MIN_DESC} caractères
        </AppText>
      )}

      <AppButton
        title="Soumettre le signalement"
        onPress={handleSubmit}
        loading={loading}
        disabled={!canSubmit && touched}
        accessibilityLabel="Soumettre le formulaire de litige"
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[2],
    paddingBottom: spacing[8],
  },
  sectionLabel: {
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bold: {
    fontWeight: '700',
  },
  textarea: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    minHeight: 120,
    marginTop: spacing[1],
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 2,
  },
  submitBtn: {
    marginTop: spacing[4],
    width: '100%',
  },
})
