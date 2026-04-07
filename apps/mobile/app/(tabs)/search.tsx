import { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import {
  Car,
  CircleParking,
  Clock,
  Search,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'

import { ScreenContainer } from '../../src/design-system/components/layout'
import { SpotCard } from '../../src/design-system/components/organisms'
import {
  BottomSheetModal,
  CategoryPills,
  EmptyState,
  SearchBar,
  SegmentedControl,
} from '../../src/design-system/components/molecules'
import { AppButton, AppText, Chip, SkeletonBox } from '../../src/design-system/components/atoms'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { useSearchSpots } from '../../src/api/hooks/useSpots'
import { useWishlist, useToggleFavorite } from '../../src/api/hooks/useWishlists'
import { SafeMapView, SafeMarker } from '../../components/safe-map'
import { NICE_REGION, TYPE_LABELS } from '../../lib/constants'
import { SpotFilters, SpotType } from '../../src/types/database'

// ─── Constants ─────────────────────────────────────────────────────────────────

const RECENT_KEY = 'flashpark_recent_searches'
const MAX_RECENT = 6

const CATEGORY_DEFS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'outdoor', label: 'Extérieur', icon: Car },
  { key: 'garage', label: 'Garage', icon: CircleParking },
  { key: 'covered', label: 'Couvert', icon: CircleParking },
  { key: 'underground', label: 'Souterrain', icon: CircleParking },
]

// ─── Skeleton placeholders ─────────────────────────────────────────────────────

function SearchSkeleton({ screenWidth }: { screenWidth: number }): React.JSX.Element {
  const cardW = (screenWidth - 16 * 2 - 12) / 2
  const photoH = cardW * 0.75
  return (
    <View style={skeletonStyles.wrapper}>
      <View style={skeletonStyles.pillRow}>
        {[80, 90, 80, 100].map((w, i) => (
          <SkeletonBox key={i} width={w} height={36} borderRadius={20} />
        ))}
      </View>
      <View style={skeletonStyles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: cardW, gap: 8 }}>
            <SkeletonBox width={cardW} height={photoH} borderRadius={12} />
            <SkeletonBox width={cardW * 0.7} height={14} borderRadius={4} />
            <SkeletonBox width={cardW * 0.45} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  wrapper: { padding: 16, gap: 16 },
  pillRow: { flexDirection: 'row', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
})

// ─── Recent searches list ──────────────────────────────────────────────────────

function RecentSearches({
  items,
  onSelect,
}: {
  items: string[]
  onSelect: (term: string) => void
}): React.JSX.Element | null {
  const { colors } = useTheme()
  if (items.length === 0) return null

  return (
    <View style={recentStyles.container}>
      <AppText variant="label" color={colors.text} style={recentStyles.title}>
        Recherches récentes
      </AppText>
      {items.map((term) => (
        <TouchableOpacity
          key={term}
          style={recentStyles.row}
          onPress={() => onSelect(term)}
          accessibilityLabel={`Rechercher ${term}`}
        >
          <Clock size={16} color={colors.textTertiary} strokeWidth={2} />
          <AppText variant="callout" color={colors.textSecondary}>
            {term}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const recentStyles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 4, paddingTop: 8 },
  title: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
})

// ─── Filters sheet content ─────────────────────────────────────────────────────

const TYPE_FILTER_KEYS = Object.keys(TYPE_LABELS) as SpotType[]
const PRICE_OPTIONS = [
  { label: 'Tous', min: undefined, max: undefined },
  { label: '< 2 €/h', min: undefined, max: 2 },
  { label: '2–5 €/h', min: 2, max: 5 },
  { label: '> 5 €/h', min: 5, max: undefined },
]

interface FilterState {
  type?: SpotType
  minPrice?: number
  maxPrice?: number
  instantBook: boolean
}

function FiltersContent({
  filters,
  onChange,
  onClose,
}: {
  filters: FilterState
  onChange: (f: FilterState) => void
  onClose: () => void
}): React.JSX.Element {
  const { colors } = useTheme()
  const [local, setLocal] = useState<FilterState>(filters)

  const apply = (): void => {
    onChange(local)
    onClose()
  }

  const reset = (): void => {
    const cleared: FilterState = { instantBook: false }
    setLocal(cleared)
    onChange(cleared)
    onClose()
  }

  return (
    <ScrollView style={filtersStyles.scroll} contentContainerStyle={filtersStyles.content}>
      <AppText variant="title3" color={colors.text} style={filtersStyles.section}>
        Type de place
      </AppText>
      <View style={filtersStyles.chips}>
        {TYPE_FILTER_KEYS.map((key) => (
          <Chip
            key={key}
            label={TYPE_LABELS[key]}
            selected={local.type === key}
            onPress={() => setLocal((p) => ({ ...p, type: p.type === key ? undefined : key }))}
          />
        ))}
      </View>

      <AppText variant="title3" color={colors.text} style={[filtersStyles.section, { marginTop: 20 }]}>
        Prix par heure
      </AppText>
      <View style={filtersStyles.chips}>
        {PRICE_OPTIONS.map((opt) => (
          <Chip
            key={opt.label}
            label={opt.label}
            selected={local.minPrice === opt.min && local.maxPrice === opt.max}
            onPress={() => setLocal((p) => ({ ...p, minPrice: opt.min, maxPrice: opt.max }))}
          />
        ))}
      </View>

      <View style={filtersStyles.instantRow}>
        <AppText variant="callout" color={colors.text}>
          Réservation instantanée
        </AppText>
        <Chip
          label={local.instantBook ? 'Activé' : 'Désactivé'}
          selected={local.instantBook}
          onPress={() => setLocal((p) => ({ ...p, instantBook: !p.instantBook }))}
        />
      </View>

      <View style={filtersStyles.actions}>
        <AppButton title="Réinitialiser" onPress={reset} variant="ghost" size="md" />
        <AppButton title="Appliquer" onPress={apply} variant="primary" size="md" />
      </View>
    </ScrollView>
  )
}

const filtersStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  instantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    justifyContent: 'flex-end',
  },
})

// ─── Search screen ─────────────────────────────────────────────────────────────

export default function SearchScreen(): React.JSX.Element {
  const { colors } = useTheme()

  const [query, setQuery] = useState('')
  const [viewIndex, setViewIndex] = useState(0) // 0 = list, 1 = map
  const [filters, setFilters] = useState<FilterState>({ instantBook: false })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)

  // Load recent searches on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => {
        if (raw) setRecentSearches(JSON.parse(raw))
      })
      .catch(() => {})
  }, [])

  const saveRecent = useCallback(async (term: string): Promise<void> => {
    const trimmed = term.trim()
    if (!trimmed) return
    const updated = [trimmed, ...recentSearches.filter((r) => r !== trimmed)].slice(0, MAX_RECENT)
    setRecentSearches(updated)
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated)).catch(() => {})
  }, [recentSearches])

  // Merge category into API filters
  const apiFilters: SpotFilters = {
    type: filters.type ?? (activeCategory as SpotType | undefined),
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    instantBook: filters.instantBook || undefined,
  }

  const { data: spots = [], isFetching } = useSearchSpots(query, apiFilters)
  const { data: wishlistIds = [] } = useWishlist()
  const { mutate: toggleFavorite } = useToggleFavorite()

  const handleQueryChange = (text: string): void => {
    setQuery(text)
  }

  const handleBlur = (): void => {
    if (query.trim().length >= 2) {
      saveRecent(query.trim())
    }
  }

  const handleSelectRecent = (term: string): void => {
    Haptics.selectionAsync()
    setQuery(term)
  }

  const showRecents = query.length === 0 && recentSearches.length > 0
  const showResults = query.length >= 2
  const showEmpty = showResults && !isFetching && spots.length === 0

  return (
    <ScreenContainer>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarWrap}>
            <SearchBar
              value={query}
              onChangeText={handleQueryChange}
              onBlur={handleBlur}
              placeholder="Adresse, quartier, ville…"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setFiltersOpen(true)
            }}
            accessibilityLabel="Ouvrir les filtres"
          >
            <SlidersHorizontal size={18} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <SegmentedControl
          segments={['Liste', 'Carte']}
          selectedIndex={viewIndex}
          onChange={setViewIndex}
        />

        <CategoryPills
          categories={CATEGORY_DEFS}
          selected={activeCategory ?? ''}
          onSelect={(key) => setActiveCategory((prev) => (prev === key ? undefined : key))}
        />
      </View>

      {/* Body */}
      {viewIndex === 0 ? (
        // ── List view ──
        <FlatList
          data={showResults ? spots : []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showRecents ? (
              <RecentSearches items={recentSearches} onSelect={handleSelectRecent} />
            ) : null
          }
          ListEmptyComponent={
            showEmpty ? (
              <EmptyState
                icon={Search}
                title="Aucun résultat"
                subtitle={`Aucune place pour "${query}"`}
              />
            ) : isFetching && showResults ? (
              <SearchSkeleton screenWidth={undefined as unknown as number} />
            ) : !showResults && !showRecents ? (
              <EmptyState
                icon={Search}
                title="Recherchez une place"
                subtitle="Saisissez une adresse ou un quartier pour commencer"
              />
            ) : null
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <SpotCard
                spot={{
                  id: item.id,
                  title: item.title,
                  address: item.address,
                  pricePerHour: item.price_per_hour,
                  photos: item.photos ?? [],
                  rating: item.rating,
                  reviewCount: item.review_count,
                  hasSmartGate: item.has_smart_gate,
                }}
                onPress={() => router.push(`/spot/${item.id}`)}
                isFavorite={wishlistIds.includes(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            </View>
          )}
        />
      ) : (
        // ── Map view ──
        <View style={styles.mapContainer}>
          <SafeMapView
            style={styles.map}
            initialRegion={NICE_REGION}
            showsUserLocation
          >
            {spots.map((spot) => {
              const lat = parseFloat(spot.latitude)
              const lng = parseFloat(spot.longitude)
              if (isNaN(lat) || isNaN(lng)) return null
              return (
                <SafeMarker
                  key={spot.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  onPress={() => router.push(`/spot/${spot.id}`)}
                  title={spot.title}
                >
                  <View style={[styles.priceMarker, { backgroundColor: colors.primary }]}>
                    <AppText variant="caption" color={colors.textInverse} style={styles.markerText}>
                      {parseFloat(spot.price_per_hour).toFixed(0)}€
                    </AppText>
                  </View>
                </SafeMarker>
              )
            })}
          </SafeMapView>

          {showEmpty && (
            <View style={[styles.mapEmptyBanner, { backgroundColor: colors.surface }]}>
              <AppText variant="callout" color={colors.textSecondary}>
                Aucune place pour "{query}"
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Filters bottom sheet */}
      <BottomSheetModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        snapPoints={['60%', '90%']}
        title="Filtres"
      >
        <FiltersContent
          filters={filters}
          onChange={setFilters}
          onClose={() => setFiltersOpen(false)}
        />
      </BottomSheetModal>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  topBar: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBarWrap: {
    flex: 1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  priceMarker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    fontWeight: '700',
  },
  mapEmptyBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
})
