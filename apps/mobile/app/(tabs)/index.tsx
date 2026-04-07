import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { router } from 'expo-router'
import {
  Car,
  CircleParking,
  Building2,
  Layers,
  Search,
  Zap,
  type LucideIcon,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'

import { ScreenContainer } from '../../src/design-system/components/layout'
import { SectionHeader } from '../../src/design-system/components/layout'
import { SpotCard } from '../../src/design-system/components/organisms'
import {
  CategoryPills,
  EmptyState,
} from '../../src/design-system/components/molecules'
import { SkeletonBox } from '../../src/design-system/components/atoms'
import { AppText } from '../../src/design-system/components/atoms'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { useSpots } from '../../src/api/hooks/useSpots'
import { Spot } from '../../src/types/database'
import { useWishlist, useToggleFavorite } from '../../src/api/hooks/useWishlists'
import { SpotType } from '../../src/types/database'

// ─── Category definitions ──────────────────────────────────────────────────────

const CATEGORIES: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'all', label: 'Tous', icon: Search },
  { key: 'outdoor', label: 'Extérieur', icon: Car },
  { key: 'garage', label: 'Garage', icon: Layers },
  { key: 'covered', label: 'Couvert', icon: Building2 },
  { key: 'underground', label: 'Souterrain', icon: CircleParking },
  { key: 'smart_gate', label: 'Smart Gate', icon: Zap },
]

type CategoryKey = (typeof CATEGORIES)[number]['key']

// ─── Skeleton grid ─────────────────────────────────────────────────────────────

function GridSkeleton({ cardWidth }: { cardWidth: number }): React.JSX.Element {
  const photoH = cardWidth * 0.75
  return (
    <View style={skeletonStyles.wrapper}>
      <SkeletonBox width="100%" height={44} borderRadius={10} style={skeletonStyles.searchSkel} />
      <View style={skeletonStyles.pillRow}>
        {[80, 90, 80, 100, 80].map((w, i) => (
          <SkeletonBox key={i} width={w} height={36} borderRadius={20} />
        ))}
      </View>
      <View style={skeletonStyles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: cardWidth, gap: 8 }}>
            <SkeletonBox width={cardWidth} height={photoH} borderRadius={12} />
            <SkeletonBox width={cardWidth * 0.7} height={14} borderRadius={4} />
            <SkeletonBox width={cardWidth * 0.45} height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  wrapper: { padding: 16, gap: 16 },
  searchSkel: { marginBottom: 4 },
  pillRow: { flexDirection: 'row', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
})

// ─── Fake SearchBar pill (navigates to search on press) ───────────────────────

function SearchPill(): React.JSX.Element {
  const { colors } = useTheme()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = (): void => {
    scale.value = withTiming(0.97, { duration: 80 })
  }

  const handlePressOut = (): void => {
    scale.value = withTiming(1, { duration: 120 })
  }

  const handlePress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/(tabs)/search')
  }

  return (
    <Animated.View style={[styles.pillWrap, animatedStyle]}>
      <TouchableOpacity
        style={[styles.searchPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityLabel="Rechercher une place de parking"
        accessibilityRole="button"
      >
        <Search size={17} color={colors.textTertiary} strokeWidth={2.5} />
        <AppText variant="callout" color={colors.textTertiary}>
          Où se garer ?
        </AppText>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Animated spot card wrapper ────────────────────────────────────────────────

function AnimatedSpotCard({
  spot,
  index,
  isFavorite,
  onToggle,
}: {
  spot: Spot
  index: number
  isFavorite: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(280).springify()}
      style={styles.cardWrapper}
    >
      <SpotCard
        spot={{
          id: spot.id,
          title: spot.title,
          address: spot.address,
          pricePerHour: spot.price_per_hour,
          photos: spot.photos ?? [],
          rating: spot.rating,
          reviewCount: spot.review_count,
          hasSmartGate: spot.has_smart_gate,
        }}
        onPress={() => router.push(`/spot/${spot.id}`)}
        isFavorite={isFavorite}
        onToggleFavorite={onToggle}
      />
    </Animated.View>
  )
}

// ─── Home screen ───────────────────────────────────────────────────────────────

export default function HomeScreen(): React.JSX.Element {
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  // 2-column grid: 16px side padding + 12px gap between columns
  const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all')
  const [refreshing, setRefreshing] = useState(false)

  const spotType = activeCategory === 'all' || activeCategory === 'smart_gate'
    ? undefined
    : (activeCategory as SpotType)

  const { data: spots = [], isLoading, refetch } = useSpots(spotType)
  const { data: wishlistIds = [] } = useWishlist()
  const { mutate: toggleFavorite } = useToggleFavorite()

  // Client-side smart_gate filter (no separate DB query needed)
  const filteredSpots = activeCategory === 'smart_gate'
    ? spots.filter((s) => s.has_smart_gate)
    : spots

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  if (isLoading) {
    return (
      <ScreenContainer scroll>
        <GridSkeleton cardWidth={CARD_WIDTH} />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <FlatList
        data={filteredSpots}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchPill />
            <SectionHeader title="Près de chez vous" />
            <CategoryPills
              categories={CATEGORIES}
              selected={activeCategory}
              onSelect={(key) => setActiveCategory(key as CategoryKey)}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={CircleParking}
            title="Aucune place disponible"
            subtitle="Modifiez la catégorie ou revenez plus tard"
          />
        }
        renderItem={({ item, index }) => (
          <AnimatedSpotCard
            spot={item}
            index={index}
            isFavorite={wishlistIds.includes(item.id)}
            onToggle={() => toggleFavorite(item.id)}
          />
        )}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pillWrap: {
    paddingHorizontal: 16,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
  },
})
