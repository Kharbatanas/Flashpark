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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Search, Star, MapPin, ChevronRight } from 'lucide-react-native'
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

function getSpotPhoto(spot: Spot, index: number = 0): string | null {
  if (spot.photos && Array.isArray(spot.photos) && spot.photos.length > 0) {
    return spot.photos[0]
  }
  return PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length]
}

export default function HomeScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  const NEARBY_CARD_WIDTH = SCREEN_WIDTH * 0.6

  const [spots, setSpots] = useState<Spot[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const meta = user.user_metadata
      setUserName(meta?.first_name ?? meta?.full_name?.split(' ')[0] ?? null)
      setAvatarUrl(meta?.avatar_url ?? null)
    }
  }, [])

  const fetchSpots = useCallback(async () => {
    const { data } = await supabase
      .from('spots')
      .select('id, title, address, city, price_per_hour, type, rating, review_count, photos, has_smart_gate')
      .eq('status', 'active')
      .order('review_count', { ascending: false })
      .limit(20)

    setSpots(data ?? [])
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchUser(), fetchSpots()])
    setRefreshing(false)
  }, [fetchUser, fetchSpots])

  useEffect(() => {
    fetchUser()
    fetchSpots()
  }, [fetchUser, fetchSpots])

  const nearbySpots = spots.slice(0, 8)
  const popularSpots = spots.slice(0, 10)

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
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
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

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
        >
          <Search color={COLORS.gray400} size={20} />
          <Text style={styles.searchText}>Rechercher une place...</Text>
        </TouchableOpacity>

        {/* Nearby Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>À proximité</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ChevronRight color={COLORS.primary} size={16} />
            </TouchableOpacity>
          </View>

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
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: getSpotPhoto(item, index)! }}
                  style={[styles.nearbyPhoto, { height: NEARBY_CARD_WIDTH * 0.55 }]}
                />
                <View style={styles.nearbyBody}>
                  <Text style={styles.nearbyTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.nearbyRow}>
                    <Text style={styles.nearbyPrice}>
                      {Number(item.price_per_hour).toFixed(2).replace('.', ',')} €
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
        </View>

        {/* Popular Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Places populaires</Text>
          </View>

          {popularSpots.map((item, index) => (
            <TouchableOpacity
              key={`popular-${item.id}`}
              style={styles.popularCard}
              onPress={() => router.push(`/spot/${item.id}`)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: getSpotPhoto(item, index)! }}
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
                      {Number(item.price_per_hour).toFixed(2).replace('.', ',')} €
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
          ))}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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

  // Nearby Cards (horizontal)
  nearbyList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  nearbyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  nearbyPhoto: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  popularPhoto: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primaryLight,
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
