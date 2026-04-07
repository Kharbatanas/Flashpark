import React, { useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Calendar, Clock, CarFront } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { SegmentedControl, EmptyState } from '../../src/design-system/components/molecules'
import { BookingCard } from '../../src/design-system/components/organisms'
import { AppText } from '../../src/design-system/components/atoms'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { useBookings } from '../../src/api/hooks/useBookings'
import { Booking } from '../../src/types/database'
import { spacing } from '../../src/design-system/tokens/spacing'

const SEGMENTS = ['En cours', 'À venir', 'Passées']
const SEGMENT_STATUSES = [
  ['active', 'confirmed'],
  ['pending'],
  ['completed', 'cancelled', 'refunded'],
]

function filterBookings(bookings: Booking[], tabIndex: number): Booking[] {
  const allowed = SEGMENT_STATUSES[tabIndex]
  return bookings.filter((b) => allowed.includes(b.status))
}

const EMPTY_CONFIGS = [
  { icon: Clock, title: 'Aucune réservation active', subtitle: "Vous n'avez pas de réservation en cours" },
  { icon: Calendar, title: 'Rien de prévu', subtitle: 'Planifiez votre prochain stationnement !' },
  { icon: CarFront, title: 'Aucune réservation passée', subtitle: 'Votre historique apparaîtra ici' },
]

export default function BookingsScreen(): React.JSX.Element {
  const { colors } = useTheme()
  const [tabIndex, setTabIndex] = useState(0)
  const { data: bookings = [], isLoading, refetch, isRefetching } = useBookings()

  const filtered = filterBookings(bookings, tabIndex)
  const emptyConfig = EMPTY_CONFIGS[tabIndex]

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <AppText variant="title1" color={colors.text}>
          Réservations
        </AppText>
      </View>

      <View style={[styles.segmentWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <SegmentedControl
          segments={SEGMENTS}
          selectedIndex={tabIndex}
          onChange={setTabIndex}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeleton, { backgroundColor: colors.borderLight }]} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            filtered.length === 0 && styles.listEmpty,
          ]}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={emptyConfig.icon}
              title={emptyConfig.title}
              subtitle={emptyConfig.subtitle}
              actionLabel="Explorer les places"
              onAction={() => router.push('/(tabs)/' as any)}
            />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={{
                id: item.id,
                status: item.status,
                startTime: item.start_time,
                endTime: item.end_time,
                totalPrice: item.total_price,
                spot: undefined,
              }}
              onPress={() => router.push(`/booking/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        />
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentWrap: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingWrap: {
    padding: spacing[4],
    gap: spacing[3],
  },
  skeleton: {
    height: 80,
    borderRadius: 12,
  },
})
