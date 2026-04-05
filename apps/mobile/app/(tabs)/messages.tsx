import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { MessageCircle } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

interface Conversation {
  bookingId: string
  otherPersonName: string
  otherPersonInitials: string
  lastMessage: string
  lastMessageAt: string
  unread: boolean
  spotTitle: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "A l'instant"
  if (mins < 60) return `Il y a ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function SkeletonRow() {
  return (
    <View style={styles.convRow}>
      <View style={[styles.avatar, { backgroundColor: COLORS.gray200 }]} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: '50%', height: 14, borderRadius: 4, backgroundColor: COLORS.gray200 }} />
        <View style={{ width: '80%', height: 12, borderRadius: 4, backgroundColor: COLORS.gray200 }} />
      </View>
    </View>
  )
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dbUserId, setDbUserId] = useState<string | null>(null)

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_id', user.id)
        .single()

      if (!dbUser) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      setDbUserId(dbUser.id)
      const myId = dbUser.id

      // Fetch bookings as driver
      const { data: driverBookings } = await supabase
        .from('bookings')
        .select('id, spot_id, host_id, driver_id, spots(title), host:users!bookings_host_id_fkey(full_name)')
        .eq('driver_id', myId)

      // Fetch bookings as host
      const { data: hostBookings } = await supabase
        .from('bookings')
        .select('id, spot_id, host_id, driver_id, spots(title), driver:users!bookings_driver_id_fkey(full_name)')
        .eq('host_id', myId)

      const allBookings = [
        ...(driverBookings ?? []).map((b: any) => ({
          bookingId: b.id,
          otherPersonName: b.host?.full_name ?? 'Hote',
          spotTitle: b.spots?.title ?? 'Place de parking',
          isHost: false,
        })),
        ...(hostBookings ?? []).map((b: any) => ({
          bookingId: b.id,
          otherPersonName: b.driver?.full_name ?? 'Conducteur',
          spotTitle: b.spots?.title ?? 'Place de parking',
          isHost: true,
        })),
      ]

      if (allBookings.length === 0) {
        setConversations([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      const bookingIds = allBookings.map((b) => b.bookingId)

      // Fetch latest message per booking
      const { data: messages } = await supabase
        .from('messages')
        .select('booking_id, content, created_at, sender_id, read_at')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false })

      // Group: one message per booking (latest)
      const latestByBooking: Record<string, any> = {}
      for (const msg of messages ?? []) {
        if (!latestByBooking[msg.booking_id]) {
          latestByBooking[msg.booking_id] = msg
        }
      }

      const convs: Conversation[] = allBookings
        .filter((b) => !!latestByBooking[b.bookingId])
        .map((b) => {
          const msg = latestByBooking[b.bookingId]
          const unread = msg.sender_id !== myId && !msg.read_at
          return {
            bookingId: b.bookingId,
            otherPersonName: b.otherPersonName,
            otherPersonInitials: getInitials(b.otherPersonName),
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unread,
            spotTitle: b.spotTitle,
          }
        })
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

      setConversations(convs)
    } catch {
      // Silently ignore
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.bookingId}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadConversations(true)}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <MessageCircle color={COLORS.gray300} size={40} />
              </View>
              <Text style={styles.emptyTitle}>Aucun message</Text>
              <Text style={styles.emptySubtitle}>
                Vos conversations avec les hotes et conducteurs apparaitront ici
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convRow}
              onPress={() => router.push(`/booking/chat?bookingId=${item.bookingId}`)}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={[styles.avatar, item.unread && styles.avatarUnread]}>
                <Text style={[styles.avatarText, item.unread && { color: COLORS.white }]}>
                  {item.otherPersonInitials}
                </Text>
              </View>

              {/* Text */}
              <View style={styles.convBody}>
                <View style={styles.convTopRow}>
                  <Text style={[styles.convName, item.unread && styles.convNameUnread]}>
                    {item.otherPersonName}
                  </Text>
                  <Text style={[styles.convTime, item.unread && { color: COLORS.primary }]}>
                    {timeAgo(item.lastMessageAt)}
                  </Text>
                </View>
                <View style={styles.convBottomRow}>
                  <Text
                    style={[styles.convPreview, item.unread && styles.convPreviewUnread]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                  {item.unread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.convSpot} numberOfLines={1}>{item.spotTitle}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
  },

  // Conversation rows
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginLeft: 76,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: {
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  convBody: {
    flex: 1,
    gap: 2,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  convNameUnread: {
    fontWeight: '800',
  },
  convTime: {
    fontSize: 12,
    color: COLORS.gray400,
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  convPreview: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray400,
    lineHeight: 18,
  },
  convPreviewUnread: {
    color: COLORS.dark,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  convSpot: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 1,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 20,
  },
})
