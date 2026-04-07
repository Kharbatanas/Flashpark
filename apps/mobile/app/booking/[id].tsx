import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, MessageCircle, AlertCircle, XCircle, MapPin } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BookingDetailHero } from '../../src/design-system/components/organisms/BookingDetailHero'
import { QRCodeDisplay } from '../../src/design-system/components/molecules/QRCodeDisplay'
import { CheckInOutPanel } from '../../src/design-system/components/organisms/CheckInOutPanel'
import { ExtensionPanel } from '../../src/design-system/components/organisms/ExtensionPanel'
import { AccessInstructions } from '../../src/design-system/components/organisms/AccessInstructions'
import { CancellationPolicyBanner } from '../../src/design-system/components/organisms/CancellationPolicyBanner'
import { PriceBreakdown } from '../../src/design-system/components/organisms/PriceBreakdown'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { EmptyState } from '../../src/design-system/components/molecules/EmptyState'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { useBooking, useCheckIn, useCheckOut, useCancelBooking } from '../../src/api/hooks/useBookings'
import { useRealtimeBookingStatus } from '../../src/api/subscriptions/useRealtimeBookingStatus'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'

const CANCELLABLE_STATUSES = ['pending', 'confirmed']
const SHOW_ACCESS_STATUSES = ['confirmed', 'active']
const SHOW_QR_STATUSES = ['confirmed', 'active']

export default function BookingDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const [showExtend, setShowExtend] = useState(false)

  const { data, isLoading, error } = useBooking(id)
  useRealtimeBookingStatus(id)

  const checkIn = useCheckIn(id)
  const checkOut = useCheckOut(id)
  const cancel = useCancelBooking()

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
            <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.skeleton, { backgroundColor: colors.borderLight }]} />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  if (error || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <TouchableOpacity
          style={[styles.backBtn, { margin: spacing[4] }]}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <EmptyState
          icon={AlertCircle}
          title="Réservation introuvable"
          subtitle="Cette réservation n'existe pas ou a été supprimée"
          actionLabel="Mes réservations"
          onAction={() => router.push('/(tabs)/bookings')}
        />
      </SafeAreaView>
    )
  }

  const { status, spot, qr_code, start_time, end_time, checked_in_at,
          total_price, platform_fee, host_payout, original_end_time } = data
  const canCancel = CANCELLABLE_STATUSES.includes(status)
  const showAccess = SHOW_ACCESS_STATUSES.includes(status)
  const showQR = SHOW_QR_STATUSES.includes(status) && Boolean(qr_code)
  const showExtensionPanel = status === 'active'

  const pricePerHour = spot?.price_per_hour ? parseFloat(spot.price_per_hour) : 0
  const extensionAmount =
    original_end_time
      ? Math.max(0, parseFloat(total_price) - parseFloat(host_payout) - parseFloat(platform_fee))
      : null

  function handleCancel(): void {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            cancel.mutate(
              { bookingId: id, cancelled_by: 'driver' },
              { onError: (err) => Alert.alert('Erreur', err.message) }
            )
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Nav bar */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Réservation</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <BookingDetailHero
          status={status}
          spotTitle={spot?.title ?? 'Place de parking'}
          subtitle={spot?.address}
        />

        {/* QR Code */}
        {showQR && (
          <QRCodeDisplay
            value={qr_code!}
            label="Présentez ce code à votre arrivée"
          />
        )}

        {/* Check-in/out panel */}
        {(status === 'confirmed' || status === 'active') && (
          <CheckInOutPanel
            booking={{ startTime: start_time, endTime: end_time, status, checkedInAt: checked_in_at }}
            onCheckIn={() => checkIn.mutate(undefined, { onError: (e) => Alert.alert('Erreur', e.message) })}
            onCheckOut={() => checkOut.mutate(undefined, { onError: (e) => Alert.alert('Erreur', e.message) })}
            loading={checkIn.isPending || checkOut.isPending}
          />
        )}

        {/* Extension panel */}
        {showExtensionPanel && (
          showExtend ? (
            <ExtensionPanel
              currentEndTime={end_time}
              originalEndTime={original_end_time ?? end_time}
              pricePerHour={pricePerHour}
              onExtend={(additionalMinutes) => {
                const newEnd = new Date(new Date(end_time).getTime() + additionalMinutes * 60000).toISOString()
                router.push(`/booking/${id}/extend`)
                setShowExtend(false)
              }}
            />
          ) : (
            <AppButton
              title="Prolonger ma réservation"
              onPress={() => setShowExtend(true)}
              variant="secondary"
            />
          )
        )}

        {/* Access instructions */}
        {showAccess && spot && (
          <AccessInstructions
            spot={{
              accessInstructions: spot.access_instructions,
              accessPhotos: spot.access_photos,
              floorNumber: spot.floor_number,
              spotNumber: spot.spot_number,
              buildingCode: spot.building_code,
              gpsPinLat: spot.gps_pin_lat,
              gpsPinLng: spot.gps_pin_lng,
            }}
          />
        )}

        {/* Spot info card */}
        {spot && (
          <View style={[styles.spotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.spotIconWrap, { backgroundColor: colors.primaryMuted }]}>
              <MapPin size={16} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headline" color={colors.text}>{spot.title}</AppText>
              <AppText variant="callout" color={colors.textSecondary}>
                {spot.address}{spot.city ? `, ${spot.city}` : ''}
              </AppText>
            </View>
          </View>
        )}

        {/* Cancellation policy */}
        {spot?.cancellation_policy && (
          <CancellationPolicyBanner policy={spot.cancellation_policy} />
        )}

        {/* Price breakdown */}
        <PriceBreakdown
          subtotal={parseFloat(host_payout)}
          platformFee={parseFloat(platform_fee)}
          total={parseFloat(total_price)}
          extensionAmount={extensionAmount}
        />

        {/* Action buttons */}
        <View style={styles.actions}>
          <AppButton
            title="Contacter l'hôte"
            onPress={() => router.push(`/booking/${id}/chat`)}
            variant="outline"
            icon={<MessageCircle size={16} color={colors.primary} strokeWidth={2} />}
          />

          <AppButton
            title="Signaler un problème"
            onPress={() => router.push(`/booking/${id}/dispute`)}
            variant="ghost"
            icon={<AlertCircle size={16} color={colors.textSecondary} strokeWidth={2} />}
          />

          {canCancel && (
            <AppButton
              title="Annuler la réservation"
              onPress={handleCancel}
              variant="danger"
              loading={cancel.isPending}
              icon={<XCircle size={16} color="#fff" strokeWidth={2} />}
            />
          )}
        </View>
      </ScrollView>
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
    gap: spacing[4],
  },
  skeleton: {
    height: 120,
    borderRadius: radii.xl,
  },
  scroll: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  spotIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
})
