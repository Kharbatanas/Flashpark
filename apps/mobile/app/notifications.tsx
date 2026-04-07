import { StyleSheet, FlatList, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { ScreenContainer } from '../src/design-system/components/layout'
import { AppText } from '../src/design-system/components/atoms/AppText'
import { EmptyState } from '../src/design-system/components/molecules/EmptyState'
import { NotificationRow } from '../src/design-system/components/organisms/NotificationRow'
import { useTheme } from '../src/design-system/theme/useTheme'
import { spacing } from '../src/design-system/tokens/spacing'
import { useNotifications, useMarkAllRead } from '../src/api/hooks/useNotifications'
import { useRealtimeNotifications } from '../src/api/subscriptions'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { notificationKeys } from '../src/api/hooks/useNotifications'
import { useAuthStore } from '../src/stores/authStore'

type NotifType = 'booking_confirmed' | 'booking_cancelled' | 'message' | 'review' | 'payment' | 'reminder' | 'alert' | 'general'

function mapType(t: string): NotifType {
  if (t === 'booking_new' || t === 'booking_confirmed') return 'booking_confirmed'
  if (t === 'booking_cancelled') return 'booking_cancelled'
  if (t === 'message_new') return 'message'
  if (t === 'booking_reminder') return 'reminder'
  return 'general'
}

export default function NotificationsScreen() {
  const { colors } = useTheme()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications()
  const markAllMutation = useMarkAllRead()

  useRealtimeNotifications()

  const unreadCount = notifications.filter((n) => !n.read_at).length

  async function handlePress(notif: typeof notifications[0]) {
    if (!notif.read_at && user) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notif.id)
      qc.invalidateQueries({ queryKey: notificationKeys.mine(user.id) })
      qc.invalidateQueries({ queryKey: notificationKeys.unread(user.id) })
    }
    if (notif.data?.booking_id) { router.push('/booking/' + notif.data.booking_id as any) }
  }

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Retour">
          <AppText variant="callout" color={colors.primary}>Retour</AppText>
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Notifications</AppText>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            accessibilityLabel="Tout marquer comme lu"
          >
            <AppText variant="callout" color={colors.primary}>Tout lire</AppText>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Bell}
              title="Aucune notification"
              subtitle="Vous serez notifie des mises a jour de vos reservations"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <NotificationRow
            type={mapType(item.type)}
            title={item.title}
            body={item.body ?? ''}
            timestamp={item.created_at}
            isRead={item.read_at != null}
            onPress={() => handlePress(item)}
          />
        )}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 60 },
  spacer: { minWidth: 60 },
  list: { flexGrow: 1 },
})
