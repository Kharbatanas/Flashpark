import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Calendar, MapPin, CarFront } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS, STATUS_CONFIG, PLACEHOLDER_PHOTOS } from '../../lib/constants'

type TabKey = 'current' | 'upcoming' | 'past'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'current', label: 'En cours' },
  { key: 'upcoming', label: 'A venir' },
  { key: 'past', label: 'Passees' },
]

interface Booking {
  id: string
  spot_id: string
  start_time: string
  end_time: string
  total_price: string
  status: string
  created_at: string
}

interface SpotInfo {
  title: string
  address: string
  photo: string | null
}

function formatDateFR(d: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

function formatPrice(price: string | number): string {
  return Number(price).toFixed(2).replace('.', ',')
}

function filterBookings(bookings: Booking[], tab: TabKey): Booking[] {
  switch (tab) {
    case 'current':
      return bookings.filter((b) => b.status === 'active' || b.status === 'confirmed')
    case 'upcoming':
      return bookings.filter((b) => b.status === 'pending')
    case 'past':
      return bookings.filter(
        (b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'refunded'
      )
    default:
      return bookings
  }
}

/* ---- Skeleton ---- */
function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any
}) {
  return (
    <View style={[{ width: width as any, height, borderRadius, backgroundColor: COLORS.gray200 }, style]} />
  )
}

function BookingsSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: 'row', borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.white }}>
          <SkeletonBox width={100} height={120} borderRadius={0} />
          <View style={{ flex: 1, padding: 12, gap: 8 }}>
            <SkeletonBox width="70%" height={15} borderRadius={4} />
            <SkeletonBox width="50%" height={12} borderRadius={4} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <SkeletonBox width="40%" height={12} borderRadius={4} />
              <SkeletonBox width="40%" height={12} borderRadius={4} />
            </View>
            <SkeletonBox width="30%" height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  )
}

/* ---- Spot image with fallback ---- */
function SpotPhoto({ uri, style }: { uri: string | null; style: any }) {
  const [error, setError] = useState(false)

  if (!uri || error) {
    return (
      <View style={[style, styles.cardImagePlaceholder]}>
        <CarFront color={COLORS.gray300} size={24} />
      </View>
    )
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  )
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [spotMap, setSpotMap] = useState<Record<string, SpotInfo>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('current')

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setUserId(null)
        return
      }

      setUserId(user.id)

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_id', user.id)
        .single()

      if (!dbUser) return

      const { data } = await supabase
        .from('bookings')
        .select('id, spot_id, start_time, end_time, total_price, status, created_at')
        .eq('driver_id', dbUser.id)
        .order('created_at', { ascending: false })

      if (!data) return
      setBookings(data)

      // Fetch spot info (title, address, first photo)
      const spotIds = [...new Set(data.map((b) => b.spot_id))]
      if (spotIds.length > 0) {
        const { data: spots } = await supabase
          .from('spots')
          .select('id, title, address, photos')
          .in('id', spotIds)

        if (spots) {
          const map: Record<string, SpotInfo> = {}
          spots.forEach((s: any) => {
            const photos = Array.isArray(s.photos) ? s.photos : []
            map[s.id] = {
              title: s.title,
              address: s.address,
              photo: photos.length > 0 ? photos[0] : null,
            }
          })
          setSpotMap(map)
        }
      }
    } catch {
      // Silently ignore
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const filtered = filterBookings(bookings, activeTab)

  // --- Loading state ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Reservations</Text>
        </View>
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <View key={tab.key} style={[styles.tab, tab.key === 'current' && styles.tabActive]}>
              <SkeletonBox width={60} height={13} borderRadius={4} />
            </View>
          ))}
        </View>
        <BookingsSkeleton />
      </SafeAreaView>
    )
  }

  // --- Not logged in ---
  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Reservations</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Calendar color={COLORS.gray300} size={36} />
          </View>
          <Text style={styles.emptyTitle}>Connectez-vous</Text>
          <Text style={styles.emptySubtitle}>
            Connectez-vous pour voir vos reservations
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // --- Main screen ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reservations</Text>
        <Text style={styles.subtitle}>
          {bookings.length} reservation{bookings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Tab filters */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = filterBookings(bookings, tab.key).length
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <CarFront color={COLORS.gray300} size={36} />
          </View>
          <Text style={styles.emptyTitle}>Aucune reservation</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'current'
              ? 'Vous n\'avez pas de reservation en cours'
              : activeTab === 'upcoming'
                ? 'Aucune reservation a venir'
                : 'Aucune reservation passee'}
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(tabs)/')}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaBtnText}>Explorer les places</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={() => loadBookings(true)}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const spot = spotMap[item.spot_id]
            const status = STATUS_CONFIG[item.status] ?? {
              label: item.status,
              color: COLORS.gray500,
              bg: COLORS.gray50,
            }

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/booking/${item.id}`)}
                activeOpacity={0.7}
              >
                {/* Photo */}
                <SpotPhoto uri={spot?.photo ?? null} style={styles.cardImage} />

                {/* Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {spot?.title ?? 'Parking'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.badgeText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  {spot?.address && (
                    <View style={styles.addrRow}>
                      <MapPin color={COLORS.gray400} size={12} />
                      <Text style={styles.cardAddr} numberOfLines={1}>
                        {spot.address}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardDates}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Arrivee</Text>
                      <Text style={styles.dateValue}>
                        {formatDateFR(item.start_time)}
                      </Text>
                    </View>
                    <View style={styles.dateSep} />
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Depart</Text>
                      <Text style={styles.dateValue}>
                        {formatDateFR(item.end_time)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.price}>
                    {formatPrice(item.total_price)} €
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }}
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
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray400,
    marginTop: 2,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  tabBadge: {
    backgroundColor: COLORS.gray200,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  tabBadgeTextActive: {
    color: COLORS.white,
  },

  // List
  list: {
    padding: 16,
    gap: 12,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  cardImage: {
    width: 100,
    height: '100%' as any,
    minHeight: 120,
    backgroundColor: COLORS.gray200,
  },
  cardImagePlaceholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardAddr: {
    fontSize: 12,
    color: COLORS.gray400,
    flex: 1,
  },
  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: COLORS.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 1,
  },
  dateSep: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.gray200,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
    marginTop: 2,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
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
  ctaBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
})
