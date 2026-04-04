import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
} from 'lucide-react-native'
import { SafeMapView, SafeMarker } from '../../components/safe-map'
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

const TYPE_KEYS = Object.keys(TYPE_LABELS)

function getSpotPhoto(spot: Spot, index: number = 0): string {
  if (spot.photos && Array.isArray(spot.photos) && spot.photos.length > 0) {
    return spot.photos[0]
  }
  return PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length]
}

export default function SearchScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  const PHOTO_HEIGHT = (SCREEN_WIDTH - 40) * 0.6

  const [query, setQuery] = useState('')
  const [allSpots, setAllSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [priceSort, setPriceSort] = useState<PriceSort>('none')
  const [smartGateOnly, setSmartGateOnly] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Map
  const [selectedMarker, setSelectedMarker] = useState<Spot | null>(null)
  const mapRef = useRef<any>(null)

  const fetchSpots = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('spots')
      .select(
        'id, title, address, city, price_per_hour, type, rating, review_count, photos, has_smart_gate, latitude, longitude'
      )
      .eq('status', 'active')
      .order('review_count', { ascending: false })
      .limit(50)

    setAllSpots(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSpots()
  }, [fetchSpots])

  // Filtered + sorted spots
  const filteredSpots = (() => {
    let result = [...allSpots]

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      )
    }

    // Type filter
    if (selectedTypes.size > 0) {
      result = result.filter((s) => selectedTypes.has(s.type))
    }

    // Smart gate filter
    if (smartGateOnly) {
      result = result.filter((s) => s.has_smart_gate)
    }

    // Price sort
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
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
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

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const hasActiveFilters =
    selectedTypes.size > 0 || priceSort !== 'none' || smartGateOnly

  const clearFilters = () => {
    setSelectedTypes(new Set())
    setPriceSort('none')
    setSmartGateOnly(false)
    setQuery('')
  }

  const priceSortLabel =
    priceSort === 'asc' ? 'Prix ↑' : priceSort === 'desc' ? 'Prix ↓' : 'Prix'

  // Render a spot card for the list view
  const renderSpotCard = ({ item, index }: { item: Spot; index: number }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/spot/${item.id}`)}
      activeOpacity={0.9}
    >
      {/* Photo */}
      <View style={styles.cardPhotoWrap}>
        <Image
          source={{ uri: getSpotPhoto(item, index) }}
          style={[styles.cardPhoto, { height: PHOTO_HEIGHT }]}
          resizeMode="cover"
        />
        {/* Favorite button */}
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            color={favorites.has(item.id) ? COLORS.danger : COLORS.white}
            fill={favorites.has(item.id) ? COLORS.danger : 'transparent'}
            size={20}
          />
        </TouchableOpacity>

        {/* Type badge on photo */}
        <View style={styles.typeBadgeOnPhoto}>
          <Text style={styles.typeBadgeOnPhotoText}>
            {TYPE_LABELS[item.type] ?? item.type}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.rating && (
            <View style={styles.ratingRow}>
              <Star color={COLORS.warning} fill={COLORS.warning} size={13} />
              <Text style={styles.ratingText}>
                {Number(item.rating).toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>({item.review_count})</Text>
            </View>
          )}
        </View>

        <View style={styles.addressRow}>
          <MapPin color={COLORS.gray400} size={13} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address}, {item.city}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>
              {Number(item.price_per_hour).toFixed(2).replace('.', ',')} €
            </Text>
            <Text style={styles.priceUnit}> /heure</Text>
          </View>
          {item.has_smart_gate && (
            <View style={styles.smartGateBadge}>
              <Zap color={COLORS.primary} size={12} />
              <Text style={styles.smartGateText}>Smart Gate</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  // Map marker preview card
  const renderMarkerPreview = () => {
    if (!selectedMarker) return null
    const spot = selectedMarker
    return (
      <View style={styles.previewCard}>
        <TouchableOpacity
          style={styles.previewContent}
          onPress={() => router.push(`/spot/${spot.id}`)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: getSpotPhoto(spot) }}
            style={styles.previewPhoto}
            resizeMode="cover"
          />
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {spot.title}
            </Text>
            <View style={styles.addressRow}>
              <MapPin color={COLORS.gray400} size={11} />
              <Text style={styles.previewAddress} numberOfLines={1}>
                {spot.address}
              </Text>
            </View>
            <View style={styles.previewFooter}>
              <Text style={styles.previewPrice}>
                {Number(spot.price_per_hour).toFixed(2).replace('.', ',')} €
                <Text style={styles.previewPriceUnit}>/h</Text>
              </Text>
              {spot.rating && (
                <View style={styles.ratingRow}>
                  <Star color={COLORS.warning} fill={COLORS.warning} size={12} />
                  <Text style={styles.ratingText}>
                    {Number(spot.rating).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() => router.push(`/spot/${spot.id}`)}
            >
              <Text style={styles.previewBtnText}>Voir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.previewClose}
          onPress={() => setSelectedMarker(null)}
        >
          <X color={COLORS.gray500} size={18} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <Search color={COLORS.gray400} size={18} />
            <TextInput
              style={styles.input}
              placeholder="Adresse, quartier, ville..."
              placeholderTextColor={COLORS.gray400}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X color={COLORS.gray400} size={18} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <FlatList
          data={[
            // View toggle comes first, then filters
            ...TYPE_KEYS.map((k) => ({ key: k, label: TYPE_LABELS[k] })),
          ]}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          ListHeaderComponent={
            <View style={styles.chipRow}>
              {/* Price sort chip */}
              <TouchableOpacity
                style={[
                  styles.chip,
                  priceSort !== 'none' && styles.chipActive,
                ]}
                onPress={cyclePriceSort}
              >
                <ArrowUpDown
                  color={priceSort !== 'none' ? COLORS.white : COLORS.gray700}
                  size={14}
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
              >
                <Zap
                  color={smartGateOnly ? COLORS.white : COLORS.gray700}
                  size={14}
                />
                <Text
                  style={[
                    styles.chipText,
                    smartGateOnly && styles.chipTextActive,
                  ]}
                >
                  Smart Gate
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                selectedTypes.has(item.key) && styles.chipActive,
              ]}
              onPress={() => toggleType(item.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedTypes.has(item.key) && styles.chipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* View toggle + result count */}
        <View style={styles.viewToggleRow}>
          <View style={styles.resultInfo}>
            <Text style={styles.resultCount}>
              {filteredSpots.length} place{filteredSpots.length !== 1 ? 's' : ''}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>Effacer filtres</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === 'list' && styles.viewToggleBtnActive,
              ]}
              onPress={() => setViewMode('list')}
            >
              <List
                color={viewMode === 'list' ? COLORS.white : COLORS.gray500}
                size={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === 'map' && styles.viewToggleBtnActive,
              ]}
              onPress={() => {
                setViewMode('map')
                setSelectedMarker(null)
              }}
            >
              <MapIcon
                color={viewMode === 'map' ? COLORS.white : COLORS.gray500}
                size={16}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : viewMode === 'list' ? (
        filteredSpots.length === 0 ? (
          <View style={styles.centered}>
            <MapPin color={COLORS.gray300} size={48} />
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySubtitle}>
              Essayez de modifier vos filtres
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSpots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={renderSpotCard}
          />
        )
      ) : (
        // Map View
        <View style={styles.mapContainer}>
          <SafeMapView
            mapRef={mapRef}
            style={styles.map}
            initialRegion={NICE_REGION}
            showsUserLocation
            onPress={() => setSelectedMarker(null)}
          >
            {filteredSpots
              .filter((s) => s.latitude && s.longitude)
              .map((spot) =>
                SafeMarker ? (
                  <SafeMarker
                    key={spot.id}
                    coordinate={{
                      latitude: Number(spot.latitude),
                      longitude: Number(spot.longitude),
                    }}
                    onPress={() => setSelectedMarker(spot)}
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
                ) : null
              )}
          </SafeMapView>

          {/* Marker preview card */}
          {renderMarkerPreview()}
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
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Search
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
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
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray50,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
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

  // View toggle row
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray500,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 10,
    padding: 3,
  },
  viewToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },

  // List view
  listContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardPhotoWrap: {
    position: 'relative',
  },
  cardPhoto: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeOnPhoto: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeOnPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.dark,
  },

  // Card info
  cardInfo: {
    padding: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    flex: 1,
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.gray400,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.gray500,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  smartGateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smartGateText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Empty + centered
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray700,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.gray400,
  },

  // Map view
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Map markers (Airbnb-style price bubbles)
  markerBubble: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
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

  // Map preview card
  previewCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  previewContent: {
    flexDirection: 'row',
  },
  previewPhoto: {
    width: 110,
    height: 130,
    backgroundColor: COLORS.primaryLight,
  },
  previewInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  previewAddress: {
    fontSize: 12,
    color: COLORS.gray500,
    flex: 1,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  previewPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  previewPriceUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  previewBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  previewBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  previewClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
