import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

export default function ReviewScreen() {
  const { bookingId, spotId } = useLocalSearchParams<{ bookingId: string; spotId: string }>()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function checkExisting() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('supabase_id', user.id)
          .single()

        if (!dbUser) return
        setUserId(dbUser.id)

        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('reviewer_id', dbUser.id)
          .single()

        if (existing) setAlreadyReviewed(true)
      } catch {
        // no existing review
      } finally {
        setChecking(false)
      }
    }
    checkExisting()
  }, [bookingId])

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez sélectionner une note entre 1 et 5 étoiles.')
      return
    }
    if (!userId || !bookingId || !spotId) {
      Alert.alert('Erreur', 'Informations manquantes.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        spot_id: spotId,
        reviewer_id: userId,
        rating,
        comment: comment.trim() || null,
      })

      if (error) throw new Error(error.message)

      Alert.alert(
        'Merci !',
        'Votre avis a été publié avec succès.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (alreadyReviewed) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={COLORS.dark} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Laisser un avis</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Star color={COLORS.warning} fill={COLORS.warning} size={48} />
          <Text style={styles.alreadyTitle}>Avis déjà publié</Text>
          <Text style={styles.alreadySubtitle}>
            Vous avez déjà laissé un avis pour cette réservation.
          </Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => router.back()}>
            <Text style={styles.submitBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laisser un avis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Star rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Votre note</Text>
          <Text style={styles.sectionSubtitle}>Évaluez votre expérience de stationnement</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Star
                  size={40}
                  color={star <= rating ? COLORS.warning : COLORS.gray300}
                  fill={star <= rating ? COLORS.warning : 'transparent'}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent'][rating]}
            </Text>
          )}
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Votre commentaire</Text>
          <TextInput
            style={styles.textarea}
            value={comment}
            onChangeText={setComment}
            placeholder="Partagez votre experience..."
            placeholderTextColor={COLORS.gray400}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{comment.length}/1000</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>Publier mon avis</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  alreadyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: 8,
  },
  alreadySubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  ratingSection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
    marginTop: 2,
  },
  commentSection: {
    gap: 8,
  },
  textarea: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.dark,
    minHeight: 120,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.gray400,
    textAlign: 'right',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
