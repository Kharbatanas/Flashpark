import { useState, useEffect, useCallback, useRef } from 'react'
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
  Platform,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  Search,
  Star,
  Heart,
  Car,
  Home as HomeIcon,
  Building2,
  CircleParking,
  Zap,
} from 'lucide-react-native'
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

// Category definitions for the horizontal tab pills
const CATEGORIES = [
  { key: 'all', label: 'Tous', Icon: Search },
  { key: 'outdoor', label: 'Extérieur', Icon: Car },
  { key: 'garage', label: 'Garage', Icon: HomeIcon },
  { key: 'covered', label: 'Couvert', Icon: Building2 },
  { key: 'underground', label: 'Souterrain', Icon: CircleParking },
  { key: 'smart_gate', label: 'Smart Gate', Icon: Zap },
] as const

function getSpotPhoto(spot: Spot, index: number = 0): string {
  if (spot.photos && Array.isArray(spot.photos) && spot.photos.length > 0) {
    return spot.photos[0]
  }
  return PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length]
}

function getPhotoCount(spot: Spot): number {
  if (spot.photos && Array.isArray(spot.photos)) return spot.photos.length
  return 1
}

function formatPrice(price: string | number): string {
  return Number(price).toFixed(2).replace('.', ',')
}

/* ---- Skeleton shimmer placeholder ---- */
function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
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

function GridSkeleton({ cardWidth }: { cardWidth: number }) {
  const photoHeight = cardWidth * 0.75 // 4:3 ratio
  return (
    <View style={skeletonStyles.wrapper}>
      {/* Search bar skeleton */}
      <SkeletonBox
        width="100%"
        height={52}
        borderRadius={26}
        style={{ marginBottom: 20 }}
      />
      {/* Category pills skeleton */}
      <View style={skeletonStyles.pillRow}>
        {[80, 90, 80, 100, 80].map((w, i) => (
          <SkeletonBox key={i} width={w} height={36} borderRadius={20} />
        ))}
      </View>
      {/* Grid skeleton */}
      <View style={skeletonStyles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[skeletonStyles.gridItem, { width: cardWidth }]}>
            <SkeletonBox
              width={cardWidth}
              height={photoHeight}
              borderRadius={12}
            />
            <SkeletonBox
              width={cardWidth * 0.7}
              height={14}
              borderRadius={4}
              style={{ marginTop: 10 }}
            />
            <SkeletonBox
              width={cardWidth * 0.45}
              height={12}
              borderRadius={4}
              style={{ marginTop: 6 }}
            />
          </View>
        ))}
      </View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  wrapper: {
    padding: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    // width set dynamically
  },
})

/* ---- Spot image with loading placeholder ---- */
function SpotImage({
  uri,
  style,
}: {
  uri: string
  style: any
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const fallbackUri = PLACEHOLDER_PHOTOS[0]

  return (
    <View style={style}>
      {!loaded && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.gray200, borderRadius: 12 }]}
        />
      )}
      <Image
        source={{ uri: error ? fallbackUri : uri }}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error) setError(true)
        }}
      />
    </View>
  )
}

/* ---- Grid card (Airbnb listing style) ---- */
function SpotCard({
  item,
  index,
  cardWidth,
  isFavorite,
  onToggleFavorite,
}: {
  item: Spot
  index: number
  cardWidth: number
  isFavorite: boolean
  onToggleFavorite: (spotId: string) => void
}) {
  const photoHeight = cardWidth * 0.75 // 4:3
  const photoCount = getPhotoCount(item)

  return (
    <TouchableOpacity
      style={[styles.gridCard, { width: cardWidth }]}
      onPress={() => router.push(`/spot/${item.id}`)}
      activeOpacity={0.92}
    >
      {/* Photo */}
      <View
        style={[
          styles.gridPhotoWrap,
          { height: photoHeight },
        ]}
      >
        <SpotImage
          uri={getSpotPhoto(item, index)}
          style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
        />

        {/* Photo dots */}
        {photoCount > 1 && (
          <View style={styles.photoDots}>
            {Array.from({ length: Math.min(photoCount, 5) }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.photoDot,
                  i === 0 && styles.photoDotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Heart button */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => onToggleFavorite(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Heart
            color={isFavorite ? COLORS.danger : COLORS.white}
            fill={isFavorite ? COLORS.danger : 'transparent'}
            size={18}
            strokeWidth={2.5}
          />
        </TouchableOpacity>

        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            {formatPrice(item.price_per_hour)} €
          </Text>
          <Text style={styles.priceBadgeUnit}>/h</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.gridCardInfo}>
        <Text style={styles.gridCardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.rating ? (
          <View style={styles.gridCardRating}>
            <Star
              color={COLORS.warning}
              fill={COLORS.warning}
              size={11}
            />
            <Text style={styles.gridCardRatingText}>
              {Number(item.rating).toFixed(1)}
            </Text>
          </View>
        ) : (
          <View style={styles.gridCardRating}>
            <Star color={COLORS.gray300} size={11} />
            <Text style={styles.gridCardNewText}>Nouveau</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  // 2-column grid: 16px padding each side + 12px gap between
  const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2

  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchFavorites = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('spot_id')
        .eq('user_id', userId)
      if (data) {
        setFavorites(new Set(data.map((w: { spot_id: string }) => w.spot_id)))
      }
    } catch {
      // ignore
    }
  }, [])

  const toggleFavorite = useCallback(async (spotId: string) => {
    if (!currentUserId) return
    const isLiked = favorites.has(spotId)
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev)
      if (isLiked) next.delete(spotId)
      else next.add(spotId)
      return next
    })
    try {
      if (isLiked) {
        const { data: existing } = await supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('spot_id', spotId)
          .single()
        if (existing) {
          await supabase.from('wishlists').delete().eq('id', existing.id)
        }
      } else {
        await supabase.from('wishlists').insert({ user_id: currentUserId, spot_id: spotId })
      }
    } catch {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev)
        if (isLiked) next.add(spotId)
        else next.delete(spotId)
        return next
      })
    }
  }, [currentUserId, favorites])

  const fetchSpots = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('spots')
        .select(
          'id, title, address, city, price_per_hour, type, rating, review_count, photos, has_smart_gate'
        )
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
    await fetchSpots()
    setRefreshing(false)
  }, [fetchSpots])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('supabase_id', user.id)
          .single()
        if (dbUser) {
          setCurrentUserId(dbUser.id)
          await fetchFavorites(dbUser.id)
        }
      }
      await fetchSpots()
      setLoading(false)
    }
    init()
  }, [fetchSpots, fetchFavorites])

  // Filter spots by active category
  const filteredSpots = (() => {
    if (activeCategory === 'all') return spots
    if (activeCategory === 'smart_gate') return spots.filter((s) => s.has_smart_gate)
    return spots.filter((s) => s.type === activeCategory)
  })()

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        >
          <GridSkeleton cardWidth={CARD_WIDTH} />
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky search bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchPill}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.85}
        >
          <Search color={COLORS.gray400} size={17} strokeWidth={2.5} />
          <Text style={styles.searchPillText}>Ou se garer?</Text>
        </TouchableOpacity>
      </View>

      {/* Category tabs + grid */}
      <FlatList
        data={filteredSpots}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          /* Category pills */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            style={styles.categoryScroll}
          >
            {CATEGORIES.map(({ key, label, Icon }) => {
              const isActive = activeCategory === key
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryPill,
                    isActive && styles.categoryPillActive,
                  ]}
                  onPress={() => setActiveCategory(key)}
                  activeOpacity={0.75}
                >
                  <Icon
                    color={isActive ? COLORS.primary : COLORS.gray500}
                    size={15}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      isActive && styles.categoryLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {isActive && <View style={styles.categoryUnderline} />}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <CircleParking color={COLORS.gray300} size={48} />
            <Text style={styles.emptyTitle}>Aucune place disponible</Text>
            <Text style={styles.emptySubtitle}>
              Modifiez la catégorie ou revenez plus tard
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <SpotCard
            item={item}
            index={index}
            cardWidth={CARD_WIDTH}
            isFavorite={favorites.has(item.id)}
            onToggleFavorite={toggleFavorite}
          />
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Top search bar
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: COLORS.background,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  searchPillText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray400,
  },

  // Category pills
  categoryScroll: {
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 0,
    gap: 6,
    paddingBottom: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  categoryPillActive: {
    borderColor: COLORS.dark,
    borderWidth: 2,
    backgroundColor: COLORS.white,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  categoryLabelActive: {
    fontWeight: '700',
    color: COLORS.dark,
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: COLORS.dark,
    borderRadius: 1,
  },

  // Grid list
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 20,
  },

  // Grid card
  gridCard: {
    // width set dynamically
  },
  gridPhotoWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray200,
    position: 'relative',
  },
  photoDots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  photoDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  photoDotActive: {
    backgroundColor: COLORS.white,
    width: 6,
    height: 6,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  priceBadgeUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  gridCardInfo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
    marginRight: 6,
  },
  gridCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridCardRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  gridCardNewText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '500',
  },

  // Empty state
  emptyWrap: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 19,
  },
})
