import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
  RefreshControl,
  ScrollView,
  Keyboard,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import {
  Search,
  MapPin,
  Star,
  Heart,
  List,
  Map as MapIcon,
  X,
  Zap,
  ArrowUpDown,
  Clock,
  BookOpen,
} from 'lucide-react-native'
import { SafeMapView, SafeMarker } from '../../components/safe-map'
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { supabase } from '../../lib/supabase'
import {
  COLORS,
  TYPE_LABELS,
  NICE_REGION,
  PLACEHOLDER_PHOTOS,
} from '../../lib/constants'

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
  latitude?: number
  longitude?: number
}

type ViewMode = 'list' | 'map'
type PriceSort = 'none' | 'asc' | 'desc'

const RECENT_KEY = 'flashpark_recent_searches'
const MAX_RECENT = 6

const TYPE_FILTER_KEYS = Object.keys(TYPE_LABELS)

function getSpotPhoto(spot: Spot, index: number = 0): string {
  if (spot.photos && Array.isArray(spot.photos) && spot.photos.length > 0) {
    return spot.photos[0]
  }
  return PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length]
}

function formatPrice(price: string | number): string {
  return Number(price).toFixed(2).replace('.', ',')
}

/* ---- Skeleton ---- */
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
        { width: width as any, height, borderRadius, backgroundColor: COLORS.gray200 },
        style,
      ]}
    />
  )
}

function SearchSkeleton({ screenWidth }: { screenWidth: number }) {
  const cardW = (screenWidth - 16 * 2 - 12) / 2
  const photoH = cardW * 0.75
  return (
    <View style={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: cardW, gap: 8 }}>
            <SkeletonBox width={cardW} height={photoH} borderRadius={12} />
            <SkeletonBox width={cardW * 0.7} height={13} borderRadius={4} />
            <SkeletonBox width={cardW * 0.4} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  )
}

/* ---- Image with loading state ---- */
function SpotImage({ uri, style }: { uri: string; style: any }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const fallbackUri = PLACEHOLDER_PHOTOS[0]

  return (
    <View style={style}>
      {!loaded && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: COLORS.gray200, borderRadius: 12 },
          ]}
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

/* ---- Grid card (same design as Home) ---- */
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
  const photoHeight = cardWidth * 0.75

  return (
    <TouchableOpacity
      style={[styles.gridCard, { width: cardWidth }]}
      onPress={() => router.push(`/spot/${item.id}`)}
      activeOpacity={0.92}
    >
      <View style={[styles.gridPhotoWrap, { height: photoHeight }]}>
        <SpotImage
          uri={getSpotPhoto(item, index)}
          style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
        />
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
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            {formatPrice(item.price_per_hour)} €
          </Text>
          <Text style={styles.priceBadgeUnit}>/h</Text>
        </View>
      </View>
      <View style={styles.gridCardInfo}>
        <Text style={styles.gridCardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.rating ? (
          <View style={styles.ratingRow}>
            <Star color={COLORS.warning} fill={COLORS.warning} size={11} />
            <Text style={styles.ratingText}>
              {Number(item.rating).toFixed(1)}
            </Text>
          </View>
        ) : (
          <View style={styles.ratingRow}>
            <Star color={COLORS.gray300} size={11} />
            <Text style={styles.newText}>Nouveau</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

/* ---- Map bottom sheet card (horizontal compact) ---- */
function MapSpotCard({ item }: { item: Spot }) {
  return (
    <TouchableOpacity
      style={styles.mapCard}
      onPress={() => router.push(`/spot/${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.mapCardPhoto}>
        <SpotImage
          uri={getSpotPhoto(item)}
          style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
        />
      </View>
      <View style={styles.mapCardInfo}>
        <Text style={styles.mapCardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.addressRow}>
          <MapPin color={COLORS.gray400} size={11} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <View style={styles.mapCardFooter}>
          <Text style={styles.mapCardPrice}>
            {formatPrice(item.price_per_hour)} €
            <Text style={styles.mapCardPriceUnit}>/h</Text>
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
        {item.has_smart_gate && (
          <View style={styles.smartGateBadge}>
            <Zap color={COLORS.primary} size={11} />
            <Text style={styles.smartGateText}>Smart Gate</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function SearchScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2

  const [query, setQuery] = useState('')
  const [allSpots, setAllSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [mapAvailable, setMapAvailable] = useState(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [priceSort, setPriceSort] = useState<PriceSort>('none')
  const [smartGateOnly, setSmartGateOnly] = useState(false)
  const [instantBookOnly, setInstantBookOnly] = useState(false)

  // Map
  const [selectedMarker, setSelectedMarker] = useState<Spot | null>(null)
  const mapRef = useRef<any>(null)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const listRef = useRef<FlatList>(null)

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<TextInput>(null)

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
          'id, title, address, city, price_per_hour, type, rating, review_count, photos, has_smart_gate, latitude, longitude'
        )
        .eq('status', 'active')
        .order('review_count', { ascending: false })
        .limit(50)

      setAllSpots(data ?? [])
    } catch {
      // Silently ignore
    }
  }, [])

  const loadRecentSearches = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY)
      if (raw) setRecentSearches(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const saveSearch = useCallback(async (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY)
      const prev: string[] = raw ? JSON.parse(raw) : []
      const updated = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(
        0,
        MAX_RECENT
      )
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      setRecentSearches(updated)
    } catch {
      // ignore
    }
  }, [])

  const removeRecentSearch = useCallback(async (term: string) => {
    try {
      const updated = recentSearches.filter((s) => s !== term)
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated))
      setRecentSearches(updated)
    } catch {
      // ignore
    }
  }, [recentSearches])

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
          fetchFavorites(dbUser.id)
        }
      }
      await Promise.all([fetchSpots(), loadRecentSearches()])
      setLoading(false)
    }
    init()
  }, [fetchSpots, loadRecentSearches, fetchFavorites])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchSpots()
    setRefreshing(false)
  }, [fetchSpots])

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) saveSearch(query)
    Keyboard.dismiss()
  }, [query, saveSearch])

  const applyRecentSearch = useCallback((term: string) => {
    setQuery(term)
    Keyboard.dismiss()
  }, [])

  // Filtered + sorted spots
  const filteredSpots = (() => {
    let result = [...allSpots]

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      )
    }

    if (selectedTypes.size > 0) {
      result = result.filter((s) => selectedTypes.has(s.type))
    }

    if (smartGateOnly) {
      result = result.filter((s) => s.has_smart_gate)
    }

    if (priceSort === 'asc') {
      result.sort((a, b) => Number(a.price_per_hour) - Number(b.price_per_hour))
    } else if (priceSort === 'desc') {
      result.sort((a, b) => Number(b.price_per_hour) - Number(a.price_per_hour))
    }

    return result
  })()

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const cyclePriceSort = () => {
    setPriceSort((prev) => {
      if (prev === 'none') return 'asc'
      if (prev === 'asc') return 'desc'
      return 'none'
    })
  }

  const hasActiveFilters =
    selectedTypes.size > 0 || priceSort !== 'none' || smartGateOnly || instantBookOnly

  const clearFilters = () => {
    setSelectedTypes(new Set())
    setPriceSort('none')
    setSmartGateOnly(false)
    setInstantBookOnly(false)
  }

  const priceSortLabel =
    priceSort === 'asc' ? 'Prix ↑' : priceSort === 'desc' ? 'Prix ↓' : 'Prix'

  const handleMapError = useCallback(() => {
    setMapAvailable(false)
    setViewMode('list')
  }, [])

  // When a marker is tapped in map mode, snap sheet up slightly
  const handleMarkerPress = useCallback((spot: Spot) => {
    setSelectedMarker(spot)
    bottomSheetRef.current?.snapToIndex(1)
  }, [])

  const showEmpty = !loading && filteredSpots.length === 0
  const showRecent = query === '' && recentSearches.length > 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Search color={COLORS.gray400} size={18} strokeWidth={2.5} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Adresse, quartier, ville..."
              placeholderTextColor={COLORS.gray400}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X color={COLORS.gray400} size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        >
          {/* Type filter chips */}
          {TYPE_FILTER_KEYS.map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.chip, selectedTypes.has(k) && styles.chipActive]}
              onPress={() => toggleType(k)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedTypes.has(k) && styles.chipTextActive,
                ]}
              >
                {TYPE_LABELS[k]}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Price sort chip */}
          <TouchableOpacity
            style={[styles.chip, priceSort !== 'none' && styles.chipActive]}
            onPress={cyclePriceSort}
            activeOpacity={0.7}
          >
            <ArrowUpDown
              color={priceSort !== 'none' ? COLORS.white : COLORS.gray700}
              size={13}
            />
            <Text
              style={[
                styles.chipText,
                priceSort !== 'none' && styles.chipTextActive,
              ]}
            >
              {priceSortLabel}
            </Text>
          </TouchableOpacity>

          {/* Smart Gate chip */}
          <TouchableOpacity
            style={[styles.chip, smartGateOnly && styles.chipActive]}
            onPress={() => setSmartGateOnly(!smartGateOnly)}
            activeOpacity={0.7}
          >
            <Zap
              color={smartGateOnly ? COLORS.white : COLORS.gray700}
              size={13}
            />
            <Text
              style={[styles.chipText, smartGateOnly && styles.chipTextActive]}
            >
              Smart Gate
            </Text>
          </TouchableOpacity>

          {/* Instant book chip */}
          <TouchableOpacity
            style={[styles.chip, instantBookOnly && styles.chipActive]}
            onPress={() => setInstantBookOnly(!instantBookOnly)}
            activeOpacity={0.7}
          >
            <BookOpen
              color={instantBookOnly ? COLORS.white : COLORS.gray700}
              size={13}
            />
            <Text
              style={[
                styles.chipText,
                instantBookOnly && styles.chipTextActive,
              ]}
            >
              Réservation instant
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Result count + clear */}
        {!loading && (
          <View style={styles.resultsBar}>
            <Text style={styles.resultCount}>
              {filteredSpots.length} place{filteredSpots.length !== 1 ? 's' : ''}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
                <Text style={styles.clearText}>Effacer filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content area */}
      {loading ? (
        <SearchSkeleton screenWidth={SCREEN_WIDTH} />
      ) : viewMode === 'list' ? (
        <>
          {/* Recent searches (shown when input empty and no text) */}
          {showRecent && (
            <View style={styles.recentWrap}>
              <Text style={styles.recentTitle}>Recherches récentes</Text>
              {recentSearches.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.recentItem}
                  onPress={() => applyRecentSearch(term)}
                  activeOpacity={0.7}
                >
                  <Clock color={COLORS.gray400} size={15} />
                  <Text style={styles.recentText}>{term}</Text>
                  <TouchableOpacity
                    onPress={() => removeRecentSearch(term)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <X color={COLORS.gray300} size={14} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showEmpty ? (
            <View style={styles.centered}>
              <MapPin color={COLORS.gray300} size={48} />
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptySubtitle}>
                Essayez de modifier vos filtres
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={clearFilters}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyBtnText}>Effacer les filtres</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={filteredSpots}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                  colors={[COLORS.primary]}
                />
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
          )}
        </>
      ) : (
        /* Map view with bottom sheet */
        <View style={styles.mapContainer}>
          <SafeMapView
            mapRef={mapRef}
            style={styles.map}
            initialRegion={NICE_REGION}
            showsUserLocation
            onPress={() => setSelectedMarker(null)}
            fallback={
              <View style={styles.map} onLayout={handleMapError} />
            }
          >
            {filteredSpots
              .filter((s) => s.latitude && s.longitude)
              .map((spot) => (
                <SafeMarker
                  key={spot.id}
                  coordinate={{
                    latitude: Number(spot.latitude),
                    longitude: Number(spot.longitude),
                  }}
                  onPress={() => handleMarkerPress(spot)}
                >
                  <View
                    style={[
                      styles.markerBubble,
                      selectedMarker?.id === spot.id &&
                        styles.markerBubbleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.markerText,
                        selectedMarker?.id === spot.id &&
                          styles.markerTextSelected,
                      ]}
                    >
                      {Number(spot.price_per_hour).toFixed(0)}€
                    </Text>
                  </View>
                </SafeMarker>
              ))}
          </SafeMapView>

          {/* Bottom sheet with spot cards */}
          <BottomSheet
            ref={bottomSheetRef}
            snapPoints={['20%', '45%', '85%']}
            index={1}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.sheetHandle}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {filteredSpots.length} place{filteredSpots.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <BottomSheetFlatList
              data={filteredSpots}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.sheetList}
              renderItem={({ item }) => <MapSpotCard item={item} />}
            />
          </BottomSheet>
        </View>
      )}

      {/* Floating List/Map toggle */}
      {!loading && (
        <View
          style={[
            styles.toggleWrap,
            {
              bottom:
                viewMode === 'map'
                  ? insets.bottom + 16
                  : insets.bottom + 24,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.togglePill}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === 'list' && styles.toggleBtnActive,
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <List
                color={viewMode === 'list' ? COLORS.white : COLORS.gray700}
                size={15}
              />
              <Text
                style={[
                  styles.toggleBtnText,
                  viewMode === 'list' && styles.toggleBtnTextActive,
                ]}
              >
                Liste
              </Text>
            </TouchableOpacity>

            {mapAvailable && (
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  viewMode === 'map' && styles.toggleBtnActive,
                ]}
                onPress={() => {
                  setViewMode('map')
                  setSelectedMarker(null)
                  Keyboard.dismiss()
                }}
                activeOpacity={0.8}
              >
                <MapIcon
                  color={viewMode === 'map' ? COLORS.white : COLORS.gray700}
                  size={15}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    viewMode === 'map' && styles.toggleBtnTextActive,
                  ]}
                >
                  Carte
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  // Search input
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },

  // Filter chips
  chipList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  chipTextActive: {
    color: COLORS.white,
  },

  // Result bar
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Recent searches
  recentWrap: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
  },

  // List grid
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  newText: {
    fontSize: 11,
    color: COLORS.gray400,
    fontWeight: '500',
  },

  // Map
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerBubble: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  markerBubbleSelected: {
    backgroundColor: COLORS.dark,
    borderColor: COLORS.dark,
  },
  markerText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.dark,
  },
  markerTextSelected: {
    color: COLORS.white,
  },

  // Bottom sheet
  sheetBackground: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    backgroundColor: COLORS.gray300,
    width: 40,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  sheetList: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // Map bottom sheet card
  mapCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  mapCardPhoto: {
    width: 90,
    height: 90,
    backgroundColor: COLORS.gray200,
    position: 'relative',
  },
  mapCardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  mapCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.gray500,
    flex: 1,
  },
  mapCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  mapCardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  mapCardPriceUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  smartGateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  smartGateText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Empty
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // Floating toggle pill
  toggleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 26,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.dark,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  toggleBtnTextActive: {
    color: COLORS.white,
  },
})
