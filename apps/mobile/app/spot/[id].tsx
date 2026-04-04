import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Share,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft,
  Star,
  Zap,
  MapPin,
  Heart,
  Share2,
  Shield,
  Clock,
  Minus,
  Plus,
  ChevronRight,
  User,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import {
  COLORS,
  TYPE_LABELS,
  AMENITY_LABELS,
  PLACEHOLDER_PHOTOS,
} from '../../lib/constants'

const PHOTO_HEIGHT = 280

interface Spot {
  id: string
  title: string
  description: string | null
  address: string
  city: string
  price_per_hour: string
  price_per_day: string | null
  type: string
  status: string
  has_smart_gate: boolean
  photos: string[]
  amenities: string[]
  instant_book: boolean
  rating: string | null
  review_count: number
  max_vehicle_height: string | null
  host_id: string | null
}

interface HostInfo {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  created_at: string
}

function roundToNext30(date: Date): Date {
  const ms = 30 * 60 * 1000
  return new Date(Math.ceil(date.getTime() / ms) * ms)
}

export default function SpotDetailScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [spot, setSpot] = useState<Spot | null>(null)
  const [host, setHost] = useState<HostInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [liked, setLiked] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [hours, setHours] = useState(2)

  const pricePerHour = spot ? Number(spot.price_per_hour) : 0
  const subtotal = Math.round(hours * pricePerHour * 100) / 100
  const fee = Math.round(subtotal * 0.2 * 100) / 100
  const total = subtotal + fee

  const defaultStart = useMemo(() => roundToNext30(new Date()), [])
  const defaultEnd = useMemo(
    () => new Date(defaultStart.getTime() + hours * 60 * 60 * 1000),
    [defaultStart, hours]
  )

  useEffect(() => {
    if (id) loadSpot()
  }, [id])

  async function loadSpot() {
    setLoading(true)
    const { data } = await supabase
      .from('spots')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setSpot(data)
      // Load host info
      if (data.host_id) {
        const { data: hostData } = await supabase
          .from('users')
          .select('id, first_name, last_name, avatar_url, created_at')
          .eq('id', data.host_id)
          .single()
        if (hostData) setHost(hostData)
      }
    }
    setLoading(false)
  }

  async function handleShare() {
    if (!spot) return
    await Share.share({
      message: `Regarde cette place de parking sur Flashpark : "${spot.title}" a ${spot.address}, ${spot.city} — ${pricePerHour.toFixed(2).replace('.', ',')} €/h`,
    })
  }

  async function handleReserve() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour réserver.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }

    if (!spot) return
    setBooking(true)

    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_id', user.id)
      .single()

    if (!dbUser) {
      setBooking(false)
      Alert.alert('Erreur', 'Profil introuvable. Veuillez vous reconnecter.')
      return
    }

    const totalPrice = total
    const platformFee = fee
    const hostPayout = subtotal

    const { data: newBooking, error } = await supabase
      .from('bookings')
      .insert({
        driver_id: dbUser.id,
        spot_id: spot.id,
        start_time: defaultStart.toISOString(),
        end_time: defaultEnd.toISOString(),
        total_price: String(totalPrice),
        platform_fee: String(platformFee),
        host_payout: String(hostPayout),
        status: 'pending',
      })
      .select('id')
      .single()

    setBooking(false)

    if (error) {
      Alert.alert('Erreur', error.message)
    } else if (newBooking) {
      router.push(`/booking/${newBooking.id}`)
    }
  }

  const onScroll = useCallback(
    (e: any) => {
      const x = e.nativeEvent.contentOffset.x
      const idx = Math.round(x / SCREEN_WIDTH)
      setPhotoIndex(idx)
    },
    []
  )

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  /* ---------- Not found ---------- */
  if (!spot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.floatingBack} onPress={() => router.back()}>
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Parking introuvable</Text>
        </View>
      </SafeAreaView>
    )
  }

  const photos =
    spot.photos && spot.photos.length > 0
      ? spot.photos
      : PLACEHOLDER_PHOTOS.slice(0, 3)

  const ratingValue = spot.rating ? Number(spot.rating) : null

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ===== Photo Carousel ===== */}
        <View style={styles.carouselWrap}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={[styles.carouselImage, { width: SCREEN_WIDTH }]}
                resizeMode="cover"
              />
            )}
          />

          {/* Page indicators */}
          {photos.length > 1 && (
            <View style={styles.dotsRow}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === photoIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Floating back button */}
          <TouchableOpacity
            style={styles.floatingBack}
            onPress={() => router.back()}
          >
            <ArrowLeft color={COLORS.dark} size={22} />
          </TouchableOpacity>

          {/* Floating share + favorite */}
          <View style={styles.floatingRight}>
            <TouchableOpacity style={styles.floatingBtn} onPress={handleShare}>
              <Share2 color={COLORS.dark} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingBtn}
              onPress={() => setLiked(!liked)}
            >
              <Heart
                color={liked ? COLORS.danger : COLORS.dark}
                fill={liked ? COLORS.danger : 'transparent'}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Body ===== */}
        <View style={styles.body}>
          {/* Price + Rating */}
          <View style={styles.priceRatingRow}>
            <Text style={styles.heroPrice}>
              {pricePerHour.toFixed(2).replace('.', ',')} €
              <Text style={styles.heroPriceUnit}>/h</Text>
            </Text>
            {ratingValue !== null && (
              <View style={styles.ratingBadge}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    color={COLORS.warning}
                    fill={ratingValue >= s ? COLORS.warning : 'transparent'}
                  />
                ))}
                <Text style={styles.ratingText}>
                  {ratingValue.toFixed(1)}
                </Text>
                <Text style={styles.reviewCount}>
                  ({spot.review_count})
                </Text>
              </View>
            )}
          </View>

          {/* Title + address */}
          <Text style={styles.title}>{spot.title}</Text>
          <View style={styles.addrRow}>
            <MapPin color={COLORS.gray400} size={14} />
            <Text style={styles.addr}>
              {spot.address}, {spot.city}
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {TYPE_LABELS[spot.type] ?? spot.type}
              </Text>
            </View>
            {spot.has_smart_gate && (
              <View style={[styles.badge, styles.badgeSuccess]}>
                <Zap color={COLORS.success} size={12} />
                <Text style={[styles.badgeText, { color: COLORS.success }]}>
                  Smart Gate
                </Text>
              </View>
            )}
            {spot.instant_book && (
              <View style={[styles.badge, styles.badgePrimary]}>
                <Clock color={COLORS.primary} size={12} />
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>
                  Réservation instantanée
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          {spot.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{spot.description}</Text>
              <View style={styles.divider} />
            </>
          )}

          {/* Amenities grid */}
          {spot.amenities && spot.amenities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                Equipements & Securite
              </Text>
              <View style={styles.amenitiesGrid}>
                {spot.amenities.map((a) => {
                  const info = AMENITY_LABELS[a]
                  return (
                    <View key={a} style={[styles.amenityCard, { width: (SCREEN_WIDTH - 40 - 10) / 2 }]}>
                      <Text style={styles.amenityIcon}>
                        {info?.icon ?? '✓'}
                      </Text>
                      <Text style={styles.amenityLabel}>
                        {info?.label ?? a}
                      </Text>
                    </View>
                  )
                })}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Max height */}
          {spot.max_vehicle_height && (
            <>
              <View style={styles.heightCard}>
                <Shield color={COLORS.gray500} size={16} />
                <Text style={styles.heightText}>
                  Hauteur maximale :{' '}
                  {Number(spot.max_vehicle_height).toFixed(1)} m
                </Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Host info card */}
          {host && (
            <>
              <Text style={styles.sectionTitle}>Votre hote</Text>
              <View style={styles.hostCard}>
                <View style={styles.hostAvatar}>
                  {host.avatar_url ? (
                    <Image
                      source={{ uri: host.avatar_url }}
                      style={styles.hostAvatarImg}
                    />
                  ) : (
                    <User color={COLORS.gray400} size={24} />
                  )}
                </View>
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>
                    {host.first_name} {host.last_name?.charAt(0)}.
                  </Text>
                  <Text style={styles.hostSince}>
                    Membre depuis{' '}
                    {new Intl.DateTimeFormat('fr-FR', {
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(host.created_at))}
                  </Text>
                </View>
                <ChevronRight color={COLORS.gray300} size={20} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* ===== Sticky Booking Footer ===== */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <View style={styles.footerPriceWrap}>
            <Text style={styles.footerPriceMain}>
              {pricePerHour.toFixed(2).replace('.', ',')} €
              <Text style={styles.footerPriceUnit}>/h</Text>
            </Text>
          </View>

          {/* Duration selector */}
          <View style={styles.durationSelector}>
            <TouchableOpacity
              style={styles.durationBtn}
              onPress={() => setHours(Math.max(1, hours - 1))}
              disabled={hours <= 1}
            >
              <Minus
                color={hours <= 1 ? COLORS.gray300 : COLORS.dark}
                size={16}
              />
            </TouchableOpacity>
            <Text style={styles.durationText}>{hours}h</Text>
            <TouchableOpacity
              style={styles.durationBtn}
              onPress={() => setHours(Math.min(24, hours + 1))}
              disabled={hours >= 24}
            >
              <Plus
                color={hours >= 24 ? COLORS.gray300 : COLORS.dark}
                size={16}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerTotalRow}>
          <Text style={styles.footerTotalLabel}>
            Total ({hours}h dont {fee.toFixed(2).replace('.', ',')} € de frais)
          </Text>
          <Text style={styles.footerTotalValue}>
            {total.toFixed(2).replace('.', ',')} €
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.reserveBtn, booking && { opacity: 0.6 }]}
          onPress={handleReserve}
          disabled={booking}
          activeOpacity={0.8}
        >
          {booking ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.reserveBtnText}>
              {spot.instant_book
                ? 'Reserver maintenant'
                : 'Demander une reservation'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingBottom: 200,
  },

  /* Carousel */
  carouselWrap: {
    position: 'relative',
    height: PHOTO_HEIGHT,
    backgroundColor: COLORS.primaryLight,
  },
  carouselImage: {
    height: PHOTO_HEIGHT,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 20,
  },

  /* Floating buttons */
  floatingBack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    left: 16,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  floatingRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 10,
  },
  floatingBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  /* Body */
  body: {
    padding: 20,
    gap: 12,
  },

  /* Price + Rating */
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.dark,
  },
  heroPriceUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: COLORS.gray400,
  },

  /* Title + address */
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addr: {
    fontSize: 14,
    color: COLORS.gray500,
    flex: 1,
  },

  /* Badges */
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successLight,
  },
  badgePrimary: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.gray500,
    fontWeight: '600',
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 4,
  },

  /* Sections */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray500,
    lineHeight: 22,
  },

  /* Amenities grid — 2 columns */
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  amenityIcon: {
    fontSize: 20,
  },
  amenityLabel: {
    fontSize: 13,
    color: COLORS.gray700,
    fontWeight: '500',
    flex: 1,
  },

  /* Height card */
  heightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 14,
    padding: 14,
  },
  heightText: {
    fontSize: 14,
    color: COLORS.gray700,
  },

  /* Host card */
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 16,
    padding: 16,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hostAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  hostSince: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 2,
  },

  /* Sticky footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  footerPriceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  footerPriceMain: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
  },
  footerPriceUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray500,
  },

  /* Duration selector */
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    minWidth: 32,
    textAlign: 'center',
  },

  /* Footer total */
  footerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: COLORS.gray400,
    flex: 1,
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
  },

  /* Reserve button */
  reserveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  reserveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },

  /* Empty state */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray400,
  },
})
