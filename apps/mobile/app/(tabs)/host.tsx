import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  LayoutDashboard,
  Plus,
  MapPin,
  TrendingUp,
  CalendarCheck,
  ListChecks,
  Clock,
  Check,
  X,
  CarFront,
  CalendarOff,
  ArrowLeft,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS, TYPE_LABELS, STATUS_CONFIG } from '../../lib/constants'

interface Spot {
  id: string
  title: string
  address: string
  price_per_hour: string
  type: string
  status: string
  photos: string[]
  rating: string | null
  review_count: number
}

interface HostBooking {
  id: string
  spot_id: string
  start_time: string
  end_time: string
  total_price: string
  status: string
  created_at: string
  driver: { full_name: string | null } | null
}

interface Stats {
  totalEarnings: number
  activeListings: number
  totalBookings: number
  pendingCount: number
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

/* ---- Skeleton ---- */
function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any
}) {
  return (
    <View style={[{ width: width as any, height, borderRadius, backgroundColor: COLORS.gray200 }, style]} />
  )
}

function HostSkeleton() {
  return (
    <View style={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <SkeletonBox width={200} height={24} borderRadius={6} />
        <SkeletonBox width={80} height={13} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.statsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.statCard, { gap: 8 }]}>
            <SkeletonBox width={36} height={36} borderRadius={10} />
            <SkeletonBox width="50%" height={22} borderRadius={4} />
            <SkeletonBox width="70%" height={12} borderRadius={4} />
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 8 }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ flexDirection: 'row', borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.white }}>
            <SkeletonBox width={76} height={76} borderRadius={0} />
            <View style={{ flex: 1, padding: 10, gap: 6 }}>
              <SkeletonBox width="60%" height={14} borderRadius={4} />
              <SkeletonBox width="40%" height={11} borderRadius={4} />
              <SkeletonBox width="30%" height={13} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default function HostScreen() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [hostBookings, setHostBookings] = useState<HostBooking[]>([])
  const [stats, setStats] = useState<Stats>({
    totalEarnings: 0,
    activeListings: 0,
    totalBookings: 0,
    pendingCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dbUserId, setDbUserId] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setDbUserId(null)
        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_id', user.id)
        .single()

      if (!dbUser) {
        setDbUserId(null)
        return
      }

      setDbUserId(dbUser.id)

      // Fetch host spots
      const { data: hostSpots } = await supabase
        .from('spots')
        .select('*')
        .eq('host_id', dbUser.id)
        .order('created_at', { ascending: false })

      if (!hostSpots) return
      setSpots(hostSpots)

      const activeListings = hostSpots.filter((s: any) => s.status === 'active').length
      const spotIds = hostSpots.map((s: any) => s.id)

      let totalEarnings = 0
      let totalBookings = 0
      let pendingCount = 0
      let bookingsData: HostBooking[] = []

      if (spotIds.length > 0) {
        // Fetch all bookings on host's spots for stats
        const { data: bkStats } = await supabase
          .from('bookings')
          .select('status, host_payout')
          .in('spot_id', spotIds)

        if (bkStats) {
          totalBookings = bkStats.length
          pendingCount = bkStats.filter((b: any) => b.status === 'pending').length
          totalEarnings = bkStats
            .filter((b: any) => b.status !== 'cancelled' && b.status !== 'refunded')
            .reduce((sum: number, b: any) => sum + Number(b.host_payout || 0), 0)
        }

        // Fetch upcoming/pending bookings with driver info
        const { data: bk } = await supabase
          .from('bookings')
          .select('*, driver:users!bookings_driver_id_fkey(full_name)')
          .in('spot_id', spotIds)
          .in('status', ['pending', 'confirmed', 'active'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (bk) {
          bookingsData = bk
        }
      }

      setHostBookings(bookingsData)
      setStats({ totalEarnings, activeListings, totalBookings, pendingCount })
    } catch {
      // Silently ignore
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function toggleSpot(id: string, currentStatus: string) {
    setToggling(id)
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('spots').update({ status: newStatus }).eq('id', id)
    if (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut de l\'annonce')
    } else {
      setSpots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      )
      setStats((prev) => ({
        ...prev,
        activeListings:
          newStatus === 'active'
            ? prev.activeListings + 1
            : prev.activeListings - 1,
      }))
    }
    setToggling(null)
  }

  async function handleAccept(bookingId: string) {
    setActionLoading(bookingId)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    if (error) {
      Alert.alert('Erreur', 'Impossible de confirmer la reservation')
    } else {
      setHostBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'confirmed' } : b
        )
      )
      setStats((prev) => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
      }))
    }
    setActionLoading(null)
  }

  async function handleReject(bookingId: string) {
    Alert.alert(
      'Refuser la reservation',
      'Voulez-vous vraiment refuser cette reservation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(bookingId)
            const { error } = await supabase
              .from('bookings')
              .update({ status: 'cancelled' })
              .eq('id', bookingId)

            if (error) {
              Alert.alert('Erreur', 'Impossible de refuser la reservation')
            } else {
              setHostBookings((prev) => prev.filter((b) => b.id !== bookingId))
              setStats((prev) => ({
                ...prev,
                pendingCount: Math.max(0, prev.pendingCount - 1),
              }))
            }
            setActionLoading(null)
          },
        },
      ]
    )
  }

  // --- Loading ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HostSkeleton />
      </SafeAreaView>
    )
  }

  // --- Not logged in ---
  if (!dbUserId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Tableau de bord hote</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <LayoutDashboard color={COLORS.gray300} size={36} />
          </View>
          <Text style={styles.emptyTitle}>Devenir hote</Text>
          <Text style={styles.emptySubtitle}>
            Connectez-vous pour proposer votre place de parking et commencer a gagner de l'argent
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

  // Build spot name map for bookings
  const spotNameMap: Record<string, string> = {}
  spots.forEach((s) => {
    spotNameMap[s.id] = s.title
  })

  const STAT_CARDS = [
    {
      label: 'Revenus',
      value: `${formatPrice(stats.totalEarnings)} €`,
      color: COLORS.success,
      bg: COLORS.successLight,
      icon: TrendingUp,
    },
    {
      label: 'Reservations',
      value: String(stats.totalBookings),
      color: COLORS.primary,
      bg: COLORS.primaryLight,
      icon: CalendarCheck,
    },
    {
      label: 'Annonces actives',
      value: String(stats.activeListings),
      color: COLORS.dark,
      bg: COLORS.gray100,
      icon: ListChecks,
    },
    {
      label: 'En attente',
      value: String(stats.pendingCount),
      color: COLORS.warning,
      bg: COLORS.warningLight,
      icon: Clock,
    },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <ArrowLeft color={COLORS.dark} size={20} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Tableau de bord hote</Text>
                  <Text style={styles.subtitle}>
                    {spots.length} annonce{spots.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {STAT_CARDS.map((s) => {
                const Icon = s.icon
                return (
                  <View key={s.label} style={styles.statCard}>
                    <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                      <Icon color={s.color} size={18} />
                    </View>
                    <Text style={[styles.statValue, { color: s.color }]}>
                      {s.value}
                    </Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                )
              })}
            </View>

            {/* Upcoming bookings section */}
            {hostBookings.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Prochaines reservations</Text>
                </View>
                {hostBookings.map((booking) => {
                  const status = STATUS_CONFIG[booking.status] ?? {
                    label: booking.status,
                    color: COLORS.gray500,
                    bg: COLORS.gray50,
                  }
                  const driverName =
                    booking.driver?.full_name || 'Conducteur'
                  const spotName = spotNameMap[booking.spot_id] || 'Place'
                  const isPending = booking.status === 'pending'
                  const isActioning = actionLoading === booking.id

                  return (
                    <View key={booking.id} style={styles.bookingCard}>
                      <View style={styles.bookingCardTop}>
                        <View style={styles.bookingCardAvatar}>
                          <Text style={styles.bookingCardAvatarText}>
                            {driverName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bookingCardName}>{driverName}</Text>
                          <Text style={styles.bookingCardSpot} numberOfLines={1}>
                            {spotName}
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: status.bg }]}>
                          <Text style={[styles.badgeText, { color: status.color }]}>
                            {status.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bookingCardDates}>
                        <Text style={styles.bookingCardDate}>
                          {formatDateFR(booking.start_time)} - {formatDateFR(booking.end_time)}
                        </Text>
                        <Text style={styles.bookingCardPrice}>
                          {formatPrice(booking.total_price)} €
                        </Text>
                      </View>

                      {isPending && (
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnReject]}
                            onPress={() => handleReject(booking.id)}
                            disabled={isActioning}
                            activeOpacity={0.7}
                          >
                            <X color={COLORS.danger} size={16} />
                            <Text style={styles.actionBtnRejectText}>Refuser</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnAccept]}
                            onPress={() => handleAccept(booking.id)}
                            disabled={isActioning}
                            activeOpacity={0.7}
                          >
                            {isActioning ? (
                              <ActivityIndicator color={COLORS.white} size="small" />
                            ) : (
                              <>
                                <Check color={COLORS.white} size={16} />
                                <Text style={styles.actionBtnAcceptText}>Accepter</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )
                })}
              </>
            )}

            {/* Quick actions */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
            </View>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/host/availability')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warningLight }]}>
                <CalendarOff color={COLORS.warning} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionTitle}>Gerer les disponibilites</Text>
                <Text style={styles.quickActionDesc}>Bloquer des creneaux sur vos annonces</Text>
              </View>
            </TouchableOpacity>

            {/* Listings section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes annonces</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/host/new')}
                activeOpacity={0.7}
              >
                <Plus color={COLORS.white} size={16} />
                <Text style={styles.addBtnText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const canToggle =
            item.status === 'active' || item.status === 'inactive'
          const photos = Array.isArray(item.photos) ? item.photos : []
          const photo = photos.length > 0 ? photos[0] : null

          return (
            <View style={styles.spotCard}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.spotPhoto} resizeMode="cover" />
              ) : (
                <View style={[styles.spotPhoto, styles.spotPhotoPlaceholder]}>
                  <CarFront color={COLORS.gray300} size={20} />
                </View>
              )}
              <View style={styles.spotBody}>
                <Text style={styles.spotTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.addrRow}>
                  <MapPin color={COLORS.gray400} size={12} />
                  <Text style={styles.spotAddr} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
                <View style={styles.spotFooter}>
                  <Text style={styles.spotPrice}>
                    {formatPrice(item.price_per_hour)} €/h
                  </Text>
                  <View style={styles.spotTypeBadge}>
                    <Text style={styles.spotTypeText}>
                      {TYPE_LABELS[item.type] ?? item.type}
                    </Text>
                  </View>
                </View>
              </View>
              {canToggle && (
                <View style={styles.toggleWrap}>
                  <Switch
                    value={item.status === 'active'}
                    onValueChange={() => toggleSpot(item.id, item.status)}
                    disabled={toggling === item.id}
                    trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                    thumbColor={COLORS.white}
                  />
                </View>
              )}
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyInline}>
            <View style={styles.emptyIconCircle}>
              <CarFront color={COLORS.gray300} size={28} />
            </View>
            <Text style={styles.emptyInlineTitle}>Aucune annonce</Text>
            <Text style={styles.emptyInlineSubtitle}>
              Ajoutez votre premiere place de parking
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
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
  listContent: {
    paddingBottom: 32,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 2,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },

  // Quick actions
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  quickActionDesc: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 1,
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },

  // Booking cards (host incoming)
  bookingCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  bookingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingCardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingCardAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bookingCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  bookingCardSpot: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 1,
  },
  bookingCardDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  bookingCardDate: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  bookingCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },

  // Action buttons (accept/reject)
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnAccept: {
    backgroundColor: COLORS.success,
  },
  actionBtnReject: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  actionBtnAcceptText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnRejectText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },

  // Badge
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Spot listing cards
  spotCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  spotPhoto: {
    width: 76,
    height: 76,
    backgroundColor: COLORS.gray200,
  },
  spotPhotoPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotBody: {
    flex: 1,
    padding: 10,
  },
  spotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  spotAddr: {
    fontSize: 11,
    color: COLORS.gray400,
    flex: 1,
  },
  spotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  spotPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  spotTypeBadge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  spotTypeText: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  toggleWrap: {
    justifyContent: 'center',
    paddingRight: 12,
  },

  // Empty states
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
  emptyInline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  emptyInlineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  emptyInlineSubtitle: {
    fontSize: 13,
    color: COLORS.gray400,
    textAlign: 'center',
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
