import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { X } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ExtensionPanel } from '../../../src/design-system/components/organisms/ExtensionPanel'
import { Toast } from '../../../src/design-system/components/molecules/Toast'
import { AppText } from '../../../src/design-system/components/atoms/AppText'
import { useTheme } from '../../../src/design-system/theme/useTheme'
import { useBooking, useExtendBooking } from '../../../src/api/hooks/useBookings'
import { spacing } from '../../../src/design-system/tokens/spacing'
import { Spot } from '../../../src/types/database'

export default function ExtendScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const [toastVisible, setToastVisible] = useState(false)

  const { data } = useBooking(id)
  const extendBooking = useExtendBooking()

  function handleExtend(additionalMinutes: number): void {
    if (!data) return
    const newEndTime = new Date(
      new Date(data.end_time).getTime() + additionalMinutes * 60000
    ).toISOString()
    const spot = data.spot as Spot | undefined
    const pricePerHour = spot?.price_per_hour ? parseFloat(spot.price_per_hour) : 0
    const additionalAmount = (additionalMinutes / 60) * pricePerHour

    extendBooking.mutate(
      { bookingId: id, new_end_time: newEndTime, additional_amount: additionalAmount },
      {
        onSuccess: () => {
          setToastVisible(true)
          setTimeout(() => router.back(), 1800)
        },
      }
    )
  }

  const spot = data?.spot as Spot | undefined
  const pricePerHour = spot?.price_per_hour ? parseFloat(spot.price_per_hour) : 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Modal close bar */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <AppText variant="headline" color={colors.text}>Prolonger</AppText>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} accessibilityLabel="Fermer">
          <X size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {data ? (
          <ExtensionPanel
            currentEndTime={data.end_time}
            originalEndTime={data.original_end_time ?? data.end_time}
            pricePerHour={pricePerHour}
            onExtend={handleExtend}
            loading={extendBooking.isPending}
          />
        ) : null}
      </View>

      <Toast
        message="Réservation prolongée avec succès"
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
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
})
