import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, CheckCircle } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DisputeForm } from '../../../src/design-system/components/organisms/DisputeForm'
import { Toast } from '../../../src/design-system/components/molecules/Toast'
import { AppText } from '../../../src/design-system/components/atoms/AppText'
import { useTheme } from '../../../src/design-system/theme/useTheme'
import { useCreateDispute, useDisputeByBooking } from '../../../src/api/hooks/useDisputes'
import { spacing } from '../../../src/design-system/tokens/spacing'
import { radii } from '../../../src/design-system/tokens/radii'
import { DisputeType } from '../../../src/types/database'

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  under_review: 'En cours d\'examen',
  resolved_refunded: 'Résolu — remboursé',
  resolved_rejected: 'Résolu — rejeté',
  resolved_compensation: 'Résolu — compensation',
}

export default function DisputeScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const [toastVisible, setToastVisible] = useState(false)

  const { data: existing, isLoading } = useDisputeByBooking(id)
  const createDispute = useCreateDispute()

  function handleSubmit(formData: { type: DisputeType; description: string; photos: string[] }): void {
    createDispute.mutate(
      { booking_id: id, ...formData },
      {
        onSuccess: () => {
          setToastVisible(true)
          setTimeout(() => router.back(), 2000)
        },
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
        <AppText variant="headline" color={colors.text}>Signaler un problème</AppText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.skeleton, { backgroundColor: colors.borderLight }]} />
          ))}
        </View>
      ) : existing ? (
        /* Existing dispute — show status card */
        <View style={styles.statusWrap}>
          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statusIconWrap, { backgroundColor: colors.primaryMuted }]}>
              <CheckCircle size={32} color={colors.primary} strokeWidth={1.5} />
            </View>
            <AppText variant="title3" color={colors.text} style={styles.centeredText}>
              Signalement déjà ouvert
            </AppText>
            <View style={[styles.statusPill, { backgroundColor: colors.borderLight }]}>
              <AppText variant="callout" color={colors.textSecondary}>
                Statut : {STATUS_LABELS[existing.status] ?? existing.status}
              </AppText>
            </View>
            {existing.description ? (
              <AppText variant="body" color={colors.textSecondary} style={styles.centeredText}>
                {existing.description}
              </AppText>
            ) : null}
          </View>
        </View>
      ) : (
        <DisputeForm
          onSubmit={handleSubmit}
          loading={createDispute.isPending}
        />
      )}

      <Toast
        message="Signalement envoyé avec succès"
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
  loadingWrap: {
    padding: spacing[4],
    gap: spacing[3],
  },
  skeleton: {
    height: 64,
    borderRadius: radii.lg,
  },
  statusWrap: {
    flex: 1,
    padding: spacing[5],
    justifyContent: 'center',
  },
  statusCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[4],
  },
  statusIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  centeredText: {
    textAlign: 'center',
  },
})
