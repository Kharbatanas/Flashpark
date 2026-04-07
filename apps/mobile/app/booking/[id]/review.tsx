import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Toast } from '../../../src/design-system/components/molecules/Toast'
import { StarRating } from '../../../src/design-system/components/molecules/StarRating'
import { AppText } from '../../../src/design-system/components/atoms/AppText'
import { AppButton } from '../../../src/design-system/components/atoms/AppButton'
import { useTheme } from '../../../src/design-system/theme/useTheme'
import { useBooking } from '../../../src/api/hooks/useBookings'
import { useCreateReview } from '../../../src/api/hooks/useReviews'
import { spacing } from '../../../src/design-system/tokens/spacing'
import { radii } from '../../../src/design-system/tokens/radii'
import { Spot } from '../../../src/types/database'

interface DimensionRatings {
  access: number
  accuracy: number
  cleanliness: number
}

const DIMENSION_LABELS: { key: keyof DimensionRatings; label: string }[] = [
  { key: 'access', label: 'Accès' },
  { key: 'accuracy', label: 'Conformité' },
  { key: 'cleanliness', label: 'Propreté' },
]

export default function ReviewScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const [ratings, setRatings] = useState<DimensionRatings>({ access: 0, accuracy: 0, cleanliness: 0 })
  const [comment, setComment] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const { data: booking } = useBooking(id)
  const createReview = useCreateReview()

  function setDimension(key: keyof DimensionRatings, value: number): void {
    setRatings((prev) => ({ ...prev, [key]: value }))
  }

  const allRated = Object.values(ratings).every((r) => r > 0)
  const spot = booking?.spot as Spot | undefined

  function handleSubmit(): void {
    if (!allRated) {
      Alert.alert('Note incomplète', 'Veuillez noter les 3 dimensions.')
      return
    }
    if (!booking?.spot_id) return

    createReview.mutate(
      {
        booking_id: id,
        spot_id: booking.spot_id,
        rating_access: ratings.access,
        rating_accuracy: ratings.accuracy,
        rating_cleanliness: ratings.cleanliness,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setToastVisible(true)
          setTimeout(() => router.back(), 1800)
        },
        onError: (err) => Alert.alert('Erreur', err.message),
      }
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Nav bar */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Laisser un avis</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Spot header */}
        {spot && (
          <View style={[styles.spotHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Star size={20} color="#F5A623" fill="#F5A623" strokeWidth={1.5} />
            <AppText variant="headline" color={colors.text} numberOfLines={2} style={{ flex: 1 }}>
              {spot.title}
            </AppText>
          </View>
        )}

        {/* Rating dimensions */}
        <View style={[styles.ratingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="title3" color={colors.text} style={styles.sectionTitle}>
            Votre évaluation
          </AppText>
          {DIMENSION_LABELS.map(({ key, label }) => (
            <View key={key} style={styles.dimensionRow}>
              <AppText variant="callout" color={colors.textSecondary} style={styles.dimensionLabel}>
                {label}
              </AppText>
              <StarRating
                rating={ratings[key]}
                size={32}
                interactive
                onRate={(value) => setDimension(key, value)}
              />
            </View>
          ))}
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <AppText variant="callout" color={colors.text} style={styles.sectionTitle}>
            Commentaire (optionnel)
          </AppText>
          <TextInput
            style={[
              styles.textarea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={comment}
            onChangeText={setComment}
            placeholder="Partagez votre expérience…"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
            accessibilityLabel="Zone de commentaire"
          />
          <AppText variant="caption1" color={colors.textSecondary} style={styles.charCount}>
            {comment.length}/1000
          </AppText>
        </View>

        {/* Submit */}
        <AppButton
          title="Publier mon avis"
          onPress={handleSubmit}
          loading={createReview.isPending}
          disabled={!allRated}
        />
      </ScrollView>

      <Toast
        message="Avis publié avec succès !"
        type="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  spotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  ratingsCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[5],
    gap: spacing[4],
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dimensionLabel: {
    width: 90,
  },
  commentSection: {
    gap: spacing[2],
  },
  textarea: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 120,
    fontSize: 14,
    lineHeight: 20,
  },
  charCount: {
    textAlign: 'right',
  },
})
