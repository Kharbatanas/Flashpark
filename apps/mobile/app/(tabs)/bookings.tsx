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
import { Calendar, MapPin, CarFront, Clock, ChevronRight, Star } from 'lucide-react-native'
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
    <View style={{ padding: 16, gap: 14 }}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: COLORS.white,
            borderWidth: 1,
            borderColor: COLORS.gray100,
          }}
        >
          <SkeletonBox width={90} height={110} borderRadius={0} />
          <View style={{ flex: 1, padding: 14, gap: 9 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SkeletonBox width="60%" height={15} borderRadius={4} />
              <SkeletonBox width="22%" height={22} borderRadius={20} />
            </View>
            <SkeletonBox width="45%" height={12} borderRadius={4} />
            <SkeletonBox width="70%" height={12} borderRadius={4} />
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
        <CarFront color={COLORS.primary} size={26} />
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

/* ---- Empty state per tab ---- */
function EmptyState({ tab, onCTA }: { tab: TabKey; onCTA: () => void }) {
  const configs: Record<TabKey, { icon: any; title: string; subtitle: string; cta: string }> = {
    current: {
      icon: <Clock color={COLORS.primary} size={32} />,
      title: 'Aucune reservation active',
      subtitle: "Vous n'avez pas de reservation en cours actuellement",
      cta: 'Explorer les places',
    },
    upcoming: {
      icon: <Calendar color={COLORS.primary} size={32} />,
      title: 'Rien de prevu',
      subtitle: 'Vous n\'avez pas de reservation a venir. Planifiez votre prochain trajet !',
      cta: 'Trouver une place',
    },
    past: {
      icon: <CarFront color={COLORS.primary} size={32} />,
      title: 'Aucune reservation passee',
      subtitle: 'Votre historique de reservations apparaitra ici',
      cta: 'Commencer a explorer',
    },
  }
  const cfg = configs[tab]
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconCircle}>{cfg.icon}</View>
      <Text style={styles.emptyTitle}>{cfg.title}</Text>
      <Text style={styles.emptySubtitle}>{cfg.subtitle}</Text>
      <TouchableOpacity style={styles.ctaBtn} onPress={onCTA} activeOpacity={0.8}>
        <Text style={styles.ctaBtnText}>{cfg.cta}</Text>
      </TouchableOpacity>
    </View>
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
      const { data: { user } } = await supabase.auth.getUser()

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

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reservations</Text>
        </View>
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <View key={tab.key} style={[styles.tab, tab.key === 'current' && styles.tabActive]}>
              <Text style={[styles.tabText, tab.key === 'current' && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </View>
          ))}
        </View>
        <BookingsSkeleton />
      </SafeAreaView>
    )
  }

  /* ---- Not logged in ---- */
  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reservations</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Calendar color={COLORS.primary} size={32} />
          </View>
          <Text style={styles.emptyTitle}>Connectez-vous</Text>
          <Text style={styles.emptySubtitle}>
            Connectez-vous pour consulter vos reservations
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  /* ---- Main screen ---- */
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reservations</Text>
        <View style={styles.headerCountPill}>
          <Text style={styles.headerCountText}>
            {bookings.length}
          </Text>
        </View>
      </View>

      {/* Segmented control tabs */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const count = filterBookings(bookings, tab.key).length
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.segment, isActive && styles.segmentActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.segmentBadge, isActive && styles.segmentBadgeActive]}>
                    <Text style={[styles.segmentBadgeText, isActive && styles.segmentBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState tab={activeTab} onCTA={() => router.push('/(tabs)/')} />
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
            const isCompleted = item.status === 'completed'

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/booking/${item.id}`)}
                activeOpacity={0.75}
              >
                {/* Photo */}
                <SpotPhoto uri={spot?.photo ?? null} style={styles.cardImage} />

                {/* Content */}
                <View style={styles.cardContent}>
                  {/* Top: title + status badge */}
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {spot?.title ?? 'Parking'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  {/* Address */}
                  {spot?.address && (
                    <View style={styles.addrRow}>
                      <MapPin color={COLORS.gray400} size={11} strokeWidth={2} />
                      <Text style={styles.cardAddr} numberOfLines={1}>
                        {spot.address}
                      </Text>
                    </View>
                  )}

                  {/* Dates */}
                  <View style={styles.cardDates}>
                    <Clock color={COLORS.gray400} size={11} strokeWidth={2} />
                    <Text style={styles.cardDateText} numberOfLines={1}>
                      {formatDateFR(item.start_time)} — {formatDateFR(item.end_time)}
                    </Text>
                  </View>

                  {/* Bottom: price + action */}
                  <View style={styles.cardBottom}>
                    <Text style={styles.price}>{formatPrice(item.total_price)} €</Text>
                    {isCompleted ? (
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={(e) => {
                          e.stopPropagation()
                          router.push(`/booking/review?bookingId=${item.id}&spotId=${item.spot_id}`)
                        }}
                        activeOpacity={0.8}
                      >
                        <Star color={COLORS.warning} size={11} fill={COLORS.warning} />
                        <Text style={styles.reviewBtnText}>Laisser un avis</Text>
                      </TouchableOpacity>
                    ) : (
                      <ChevronRight color={COLORS.gray300} size={16} />
                    )}
                  </View>
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.4,
  },
  headerCountPill: {
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  headerCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray500,
  },

  /* Segmented control */
  segmentWrap: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  segmentActive: {
    backgroundColor: COLORS.dark,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 3 },
    }),
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  segmentTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  segmentBadge: {
    backgroundColor: COLORS.gray200,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray500,
  },
  segmentBadgeTextActive: {
    color: COLORS.white,
  },

  /* Tab bar (used only in skeleton) */
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: COLORS.gray100,
  },
  tabActive: {
    backgroundColor: COLORS.dark,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  /* List */
  list: {
    padding: 16,
    gap: 14,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  cardImage: {
    width: 90,
    height: '100%' as any,
    minHeight: 110,
    backgroundColor: COLORS.gray200,
  },
  cardImagePlaceholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 6,
    justifyContent: 'space-between',
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
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
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
    gap: 5,
  },
  cardDateText: {
    fontSize: 12,
    color: COLORS.gray500,
    flex: 1,
    fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.2,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },

  /* Empty state */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 21,
  },
  ctaBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 30,
    paddingVertical: 13,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  ctaBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
})
