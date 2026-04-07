import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Plus, TrendingUp, Car, CalendarCheck, Clock, LayoutDashboard } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { SectionHeader } from '../../src/design-system/components/layout/SectionHeader'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { EmptyState } from '../../src/design-system/components/molecules/EmptyState'
import { HostBookingCard } from '../../src/design-system/components/organisms/HostBookingCard'
import { SpotListingCard } from '../../src/design-system/components/organisms/SpotListingCard'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { useHostStats, useHostBookings, useHostListings, useAcceptBooking, useRejectBooking } from '../../src/api/hooks/useHost'
import { useAuthStore } from '../../src/stores/authStore'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { hostKeys } from '../../src/api/hooks/useHost'

export default function HostScreen() {
  const { colors } = useTheme()
  const { isAuthenticated, user } = useAuthStore()
  const qc = useQueryClient()

  const { data: stats } = useHostStats()
  const { data: pending = [], isLoading: bookingsLoading } = useHostBookings('pending')
  const { data: listings = [], isLoading: listingsLoading } = useHostListings()
  const acceptMutation = useAcceptBooking()
  const rejectMutation = useRejectBooking()

  const isRefreshing = bookingsLoading || listingsLoading

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: hostKeys.all })
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={LayoutDashboard}
          title="Devenir hote"
          subtitle="Connectez-vous pour proposer votre place de parking et commencer a gagner de l argent"
          actionLabel="Se connecter"
          onAction={() => router.push('/(auth)/login')}
        />
      </ScreenContainer>
    )
  }

  const STAT_CARDS = [
    { label: 'Revenus du mois', value: stats ? stats.total_earnings.toFixed(2) + ' EUR' : '--', color: colors.success, Icon: TrendingUp },
    { label: 'Places actives', value: stats ? String(stats.active_spots) : '--', color: colors.primary, Icon: Car },
    { label: 'Reservations', value: stats ? String(stats.total_bookings) : '--', color: colors.text, Icon: CalendarCheck },
    { label: 'En attente', value: stats ? String(stats.pending_bookings) : '--', color: colors.warning, Icon: Clock },
  ]

  return (
    <ScreenContainer scroll refreshing={isRefreshing} onRefresh={handleRefresh} style={styles.container}>
      <View style={styles.header}>
        <AppText variant="heading1" color={colors.text}>Tableau de bord</AppText>
        <AppText variant="callout" color={colors.textSecondary}>
          {listings.length} annonce{listings.length !== 1 ? 's' : ''}
        </AppText>
      </View>

      <View style={styles.statsGrid}>
        {STAT_CARDS.map((s) => {
          const Icon = s.Icon
          return (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon size={18} color={s.color} strokeWidth={2} />
              <AppText variant="heading2" style={{ color: s.color }}>{s.value}</AppText>
              <AppText variant="caption1" color={colors.textSecondary}>{s.label}</AppText>
            </View>
          )
        })}
      </View>

      {pending.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Reservations a traiter" />
          {pending.map((booking) => (
            <HostBookingCard
              key={booking.id}
              booking={{
                id: booking.id,
                startTime: booking.start_time,
                endTime: booking.end_time,
                totalPrice: booking.total_price,
                spotTitle: booking.spot_id,
              }}
              onAccept={() => acceptMutation.mutate(booking.id)}
              onReject={() => rejectMutation.mutate(booking.id)}
              loading={acceptMutation.isPending || rejectMutation.isPending}
            />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader
          title="Mes annonces"
          actionLabel="Ajouter"
          onAction={() => router.push('/host/new')}
        />
        {listings.length === 0 ? (
          <EmptyState
            icon={Car}
            title="Aucune annonce"
            subtitle="Ajoutez votre premiere place de parking"
          />
        ) : (
          listings.map((spot) => (
            <SpotListingCard
              key={spot.id}
              spot={{
                id: spot.id,
                title: spot.title,
                address: spot.address,
                pricePerHour: spot.price_per_hour,
                photos: Array.isArray(spot.photos) ? spot.photos : [],
                status: spot.status as any,
              }}
              onEdit={() => {}}
              onToggleStatus={async (active) => {
                await supabase.from('spots').update({ status: active ? 'active' : 'inactive' }).eq('id', spot.id)
                qc.invalidateQueries({ queryKey: hostKeys.listings(user?.id ?? '') })
              }}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  header: { padding: spacing[4], gap: 4 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3],
    paddingHorizontal: spacing[4],
  },
  statCard: {
    width: '47%',
    borderRadius: radii.lg, borderWidth: 1, padding: spacing[3], gap: spacing[1],
  },
  section: { gap: spacing[3], paddingHorizontal: spacing[4] },
})
