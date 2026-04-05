import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  ArrowLeft, Bell, Calendar, MessageCircle,
  CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react-native'
import { supabase } from '../lib/supabase'
import { COLORS } from '../lib/constants'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  read_at: string | null
  booking_id: string | null
  created_at: string
}

const ICON_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  booking_new: { icon: Calendar, color: COLORS.primary, bg: COLORS.primaryLight },
  booking_confirmed: { icon: CheckCircle, color: COLORS.success, bg: COLORS.successLight },
  booking_cancelled: { icon: XCircle, color: COLORS.danger, bg: COLORS.dangerLight },
  booking_completed: { icon: CheckCircle, color: COLORS.gray500, bg: COLORS.gray100 },
  message_new: { icon: MessageCircle, color: COLORS.primary, bg: COLORS.primaryLight },
  booking_reminder: { icon: AlertTriangle, color: COLORS.warning, bg: COLORS.warningLight },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "A l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

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

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setNotifications(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function markAllRead() {
    if (!userId) return
    const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)

    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    )
  }

  async function handlePress(notif: Notification) {
    // Mark as read
    if (!notif.read_at) {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notif.id)

      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n)
      )
    }

    // Navigate to booking if applicable
    if (notif.booking_id) {
      router.push(`/booking/${notif.booking_id}`)
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        contentContainerStyle={styles.list}
        onRefresh={() => loadNotifications(true)}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Bell color={COLORS.gray300} size={36} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous serez notifie des mises a jour de vos reservations
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const config = ICON_MAP[item.type] ?? ICON_MAP.booking_new
          const Icon = config.icon
          const isUnread = !item.read_at

          return (
            <TouchableOpacity
              style={[styles.notifCard, isUnread && styles.notifUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                <Icon color={config.color} size={20} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTopRow}>
                  <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>
                {item.body && (
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                )}
                <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: COLORS.gray100,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  markAllBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  markAllText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  list: { padding: 12, gap: 8, flexGrow: 1 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, gap: 8,
  },
  emptyCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  emptySubtitle: { fontSize: 14, color: COLORS.gray400, textAlign: 'center', paddingHorizontal: 32 },
  notifCard: {
    flexDirection: 'row', gap: 12, padding: 14,
    backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.gray100,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  notifUnread: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary + '20' },
  notifIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1, gap: 3 },
  notifTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: COLORS.dark, flex: 1 },
  notifTitleUnread: { fontWeight: '700' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
  },
  notifBody: { fontSize: 13, color: COLORS.gray500, lineHeight: 18 },
  notifTime: { fontSize: 11, color: COLORS.gray400, marginTop: 2 },
})
