import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  RefreshControl,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Search, Star, MapPin, ChevronRight, Bell } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS, TYPE_LABELS, PLACEHOLDER_PHOTOS } from '../../lib/constants'

interface Spot {
  id: string
  title: string
  address: string
  city: string
  price_per_hour: string
  type: string
  rating: string | null
  review_count: number
  photos: string[] | null
  has_smart_gate: boolean
}

function getSpotPhoto(spot: Spot, index: number = 0): string {
  if (spot.photos && Array.isArray(spot.photos) && spot.photos.length > 0) {
    return spot.photos[0]
  }
  return PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length]
}

function formatPrice(price: string | number): string {
  return Number(price).toFixed(2).replace('.', ',')
}

/* ---- Skeleton shimmer placeholder ---- */
function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string
  height: number
  borderRadius?: number
  style?: any
}) {
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: COLORS.gray200,
        },
        style,
      ]}
    />
  )
}

function HomeSkeleton({ screenWidth }: { screenWidth: number }) {
  const cardW = screenWidth * 0.6
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonBox width={180} height={26} borderRadius={6} />
          <SkeletonBox width={200} height={14} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>

      {/* Search bar skeleton */}
      <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
        <SkeletonBox width="100%" height={48} borderRadius={14} />
      </View>

      {/* Nearby section skeleton */}
      <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
        <SkeletonBox width={120} height={18} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          {[0, 1].map((i) => (
            <View key={i} style={{ width: cardW, borderRadius: 16, overflow: 'hidden' }}>
              <SkeletonBox width={cardW} height={cardW * 0.55} borderRadius={0} />
              <View style={{ padding: 12, gap: 8 }}>
                <SkeletonBox width={cardW * 0.7} height={14} borderRadius={4} />
                <SkeletonBox width={cardW * 0.4} height={16} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Popular section skeleton */}
      <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
        <SkeletonBox width={150} height={18} borderRadius={6} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: 'row', marginTop: 12, borderRadius: 16, overflow: 'hidden' }}>
            <SkeletonBox width={100} height={100} borderRadius={0} />
            <View style={{ flex: 1, padding: 12, gap: 8 }}>
              <SkeletonBox width="80%" height={14} borderRadius={4} />
              <SkeletonBox width="60%" height={12} borderRadius={4} />
              <SkeletonBox width="40%" height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

/* ---- Spot photo with loading placeholder ---- */
function SpotImage({ uri, style, resizeMode = 'cover' }: { uri: string; style: any; resizeMode?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const fallbackUri = PLACEHOLDER_PHOTOS[0]

  return (
    <View style={style}>
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.gray200 }]} />
      )}
      <Image
        source={{ uri: error ? fallbackUri : uri }}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode={resizeMode as any}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error) setError(true)
        }}
      />
    </View>
  )
}

export default function HomeScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  const NEARBY_CARD_WIDTH = SCREEN_WIDTH * 0.6

  const [spots, setSpots] = useState<Spot[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unreadNotifs, setUnreadNotifs] = useState(0)

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const meta = user.user_metadata
        setUserName(meta?.first_name ?? meta?.full_name?.split(' ')[0] ?? null)
        setAvatarUrl(meta?.avatar_url ?? null)

        // Fetch unread notification count
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('supabase_id', user.id)
          .single()
        if (dbUser) {
          const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', dbUser.id)
            .is('read_at', null)
          setUnreadNotifs(count ?? 0)
        }
      }
    } catch {
      // Silently ignore auth errors
    }
  }, [])

  const fetchSpots = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('spots')
        .select('id, title, address, city, price_per_hour, type, rating, review_count, photos, has_smart_gate')
        .eq('status', 'active')
        .order('review_count', { ascending: false })
        .limit(20)

      setSpots(data ?? [])
    } catch {
      // Silently ignore fetch errors
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchUser(), fetchSpots()])
    setRefreshing(false)
  }, [fetchUser, fetchSpots])

  useEffect(() => {
    async function init() {
      await Promise.all([fetchUser(), fetchSpots()])
      setLoading(false)
    }
    init()
  }, [fetchUser, fetchSpots])

  const nearbySpots = spots.slice(0, 8)
  const popularSpots = spots.slice(0, 10)

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HomeSkeleton screenWidth={SCREEN_WIDTH} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Bonjour{userName ? ` ${userName}` : ''} 👋
            </Text>
            <Text style={styles.subtitle}>Trouvez votre place de parking</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
              style={styles.bellBtn}
            >
              <Bell color={COLORS.gray700} size={22} />
              {unreadNotifs > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userName ? userName[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.7}
        >
          <Search color={COLORS.gray400} size={20} />
          <Text style={styles.searchText}>Rechercher une place...</Text>
        </TouchableOpacity>

        {/* Nearby Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>A proximite</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/(tabs)/search')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ChevronRight color={COLORS.primary} size={16} />
            </TouchableOpacity>
          </View>

          {nearbySpots.length === 0 ? (
            <View style={styles.emptySection}>
              <MapPin color={COLORS.gray300} size={32} />
              <Text style={styles.emptySectionText}>Aucune place disponible</Text>
            </View>
          ) : (
            <FlatList
              data={nearbySpots}
              keyExtractor={(item) => `nearby-${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyList}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.nearbyCard, { width: NEARBY_CARD_WIDTH }]}
                  onPress={() => router.push(`/spot/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <SpotImage
                    uri={getSpotPhoto(item, index)}
                    style={[styles.nearbyPhoto, { height: NEARBY_CARD_WIDTH * 0.55 }]}
                  />
                  <View style={styles.nearbyBody}>
                    <Text style={styles.nearbyTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.nearbyRow}>
                      <Text style={styles.nearbyPrice}>
                        {formatPrice(item.price_per_hour)} €
                      </Text>
                      <Text style={styles.nearbyPriceUnit}>/heure</Text>
                    </View>
                    {item.rating && (
                      <View style={styles.ratingRow}>
                        <Star color={COLORS.warning} fill={COLORS.warning} size={12} />
                        <Text style={styles.ratingText}>
                          {Number(item.rating).toFixed(1)}
                        </Text>
                        <Text style={styles.reviewCount}>
                          ({item.review_count})
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Popular Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Places populaires</Text>
          </View>

          {popularSpots.length === 0 ? (
            <View style={styles.emptySection}>
              <Star color={COLORS.gray300} size={32} />
              <Text style={styles.emptySectionText}>Aucune place populaire</Text>
            </View>
          ) : (
            popularSpots.map((item, index) => (
              <TouchableOpacity
                key={`popular-${item.id}`}
                style={styles.popularCard}
                onPress={() => router.push(`/spot/${item.id}`)}
                activeOpacity={0.7}
              >
                <SpotImage
                  uri={getSpotPhoto(item, index)}
                  style={styles.popularPhoto}
                />
                <View style={styles.popularBody}>
                  <Text style={styles.popularTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.popularAddressRow}>
                    <MapPin color={COLORS.gray400} size={12} />
                    <Text style={styles.popularAddress} numberOfLines={1}>
                      {item.address}, {item.city}
                    </Text>
                  </View>
                  <View style={styles.popularFooter}>
                    <View style={styles.popularPriceRow}>
                      <Text style={styles.popularPrice}>
                        {formatPrice(item.price_per_hour)} €
                      </Text>
                      <Text style={styles.popularPriceUnit}>/heure</Text>
                    </View>
                    <View style={styles.popularMeta}>
                      <Text style={styles.typeBadge}>
                        {TYPE_LABELS[item.type] ?? item.type}
                      </Text>
                      {item.rating && (
                        <View style={styles.ratingRow}>
                          <Star color={COLORS.warning} fill={COLORS.warning} size={11} />
                          <Text style={styles.ratingText}>
                            {Number(item.rating).toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray200,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  searchText: {
    color: COLORS.gray400,
    fontSize: 15,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Empty section
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptySectionText: {
    fontSize: 14,
    color: COLORS.gray400,
    fontWeight: '500',
  },

  // Nearby Cards (horizontal)
  nearbyList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  nearbyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  nearbyPhoto: {
    width: '100%',
    backgroundColor: COLORS.gray200,
    overflow: 'hidden',
  },
  nearbyBody: {
    padding: 12,
  },
  nearbyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  nearbyPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  nearbyPriceUnit: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 2,
  },

  // Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.gray400,
  },

  // Popular Cards (vertical list)
  popularCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
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
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  popularPhoto: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.gray200,
    overflow: 'hidden',
  },
  popularBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  popularAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  popularAddress: {
    fontSize: 12,
    color: COLORS.gray500,
    flex: 1,
  },
  popularFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  popularPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  popularPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  popularPriceUnit: {
    fontSize: 11,
    color: COLORS.gray500,
    marginLeft: 2,
  },
  popularMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray500,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
})
