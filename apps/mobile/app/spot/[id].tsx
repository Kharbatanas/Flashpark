import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
  Share,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
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
  Car,
  ChevronDown,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import {
  COLORS,
  TYPE_LABELS,
  AMENITY_LABELS,
  PLACEHOLDER_PHOTOS,
} from '../../lib/constants'

const PHOTO_HEIGHT = 320

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
  parking_instructions: string | null
  host_id: string | null
}

interface HostInfo {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  created_at: string
}

interface Vehicle {
  id: string
  license_plate: string
  brand: string | null
  model: string | null
  vehicle_height: string | null
}

function formatPrice(price: string | number): string {
  return Number(price).toFixed(2).replace('.', ',')
}

function roundToNext30(date: Date): Date {
  const ms = 30 * 60 * 1000
  return new Date(Math.ceil(date.getTime() / ms) * ms)
}

/* ---- Skeleton ---- */
function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any
}) {
  return (
    <View style={[{ width: width as any, height, borderRadius, backgroundColor: COLORS.gray200 }, style]} />
  )
}

function DetailSkeleton({ screenWidth }: { screenWidth: number }) {
  return (
    <View style={styles.container}>
      <SkeletonBox width={screenWidth} height={PHOTO_HEIGHT} borderRadius={0} />
      <View style={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox width="35%" height={32} borderRadius={6} />
          <SkeletonBox width="28%" height={22} borderRadius={20} />
        </View>
        <SkeletonBox width="75%" height={26} borderRadius={6} />
        <SkeletonBox width="55%" height={16} borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <SkeletonBox width={90} height={34} borderRadius={20} />
          <SkeletonBox width={110} height={34} borderRadius={20} />
        </View>
        <SkeletonBox width="100%" height={1} borderRadius={0} style={{ marginVertical: 8 }} />
        <SkeletonBox width="100%" height={80} borderRadius={12} />
        <SkeletonBox width="100%" height={1} borderRadius={0} style={{ marginVertical: 4 }} />
        <SkeletonBox width="40%" height={18} borderRadius={4} />
        <SkeletonBox width="100%" height={100} borderRadius={14} />
      </View>
    </View>
  )
}

/* ---- Image with loading / error handling ---- */
function CarouselImage({ uri, width }: { uri: string; width: number }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const fallbackUri = PLACEHOLDER_PHOTOS[0]

  return (
    <View style={[styles.carouselImage, { width }]}>
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.gray200 }]} />
      )}
      <Image
        source={{ uri: error ? fallbackUri : uri }}
        style={[StyleSheet.absoluteFill, { width, height: PHOTO_HEIGHT }]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={() => { if (!error) setError(true) }}
      />
      {/* Gradient overlay at bottom */}
      <View style={styles.carouselGradient} />
    </View>
  )
}

/* ---- Expandable description ---- */
function ExpandableText({ text, maxLines = 3 }: { text: string; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)

  return (
    <View>
      <Text
        style={styles.description}
        numberOfLines={expanded ? undefined : maxLines}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines.length > maxLines) setShowToggle(true)
        }}
      >
        {text}
      </Text>
      {showToggle && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
          style={styles.readMoreBtn}
        >
          <Text style={styles.readMoreText}>
            {expanded ? 'Reduire' : 'Lire la suite'}
          </Text>
          <ChevronDown
            color={COLORS.primary}
            size={14}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      )}
    </View>
  )
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [showVehiclePicker, setShowVehiclePicker] = useState(false)
  const likeScale = useRef(new Animated.Value(1)).current

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
    loadVehicles()
  }, [id])

  async function loadVehicles() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_id', user.id)
        .single()
      if (!dbUser) return

      const { data } = await supabase
        .from('vehicles')
        .select('id, license_plate, brand, model, vehicle_height')
        .eq('user_id', dbUser.id)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setVehicles(data)
        setSelectedVehicle(data[0].id)
      }
    } catch {
      // vehicles table may not exist yet
    }
  }

  async function loadSpot() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('spots')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setSpot({
          ...data,
          photos: Array.isArray(data.photos) ? data.photos : [],
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
        })
        if (data.host_id) {
          const { data: hostData } = await supabase
            .from('users')
            .select('id, first_name, last_name, avatar_url, created_at')
            .eq('id', data.host_id)
            .single()
          if (hostData) setHost(hostData)
        }
      }
    } catch {
      // Silently fail
    }
    setLoading(false)
  }

  async function handleShare() {
    if (!spot) return
    await Share.share({
      message: `Regarde cette place de parking sur Flashpark : "${spot.title}" a ${spot.address}, ${spot.city} — ${formatPrice(pricePerHour)} €/h`,
    })
  }

  function handleLike() {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.35, useNativeDriver: true, speed: 50 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start()
    setLiked(!liked)
  }

  async function handleReserve() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour reserver.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
      ])
      return
    }

    if (!spot) return

    if (defaultStart <= new Date()) {
      Alert.alert('Erreur', "L'heure de debut doit etre dans le futur")
      return
    }

    setBooking(true)

    try {
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

      // Check vehicle height against max_vehicle_height
      if (selectedVehicle && spot.max_vehicle_height) {
        const vehicle = vehicles.find(v => v.id === selectedVehicle)
        if (vehicle?.vehicle_height && Number(vehicle.vehicle_height) > Number(spot.max_vehicle_height)) {
          setBooking(false)
          Alert.alert(
            'Vehicule trop haut',
            `Votre vehicule (${Number(vehicle.vehicle_height).toFixed(1)}m) depasse la hauteur max de ${Number(spot.max_vehicle_height).toFixed(1)}m.`
          )
          return
        }
      }

      // Check for booking conflicts
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('spot_id', spot.id)
        .not('status', 'in', '("cancelled","refunded")')
        .or(`and(start_time.gte.${defaultStart.toISOString()},start_time.lte.${defaultEnd.toISOString()}),and(end_time.gte.${defaultStart.toISOString()},end_time.lte.${defaultEnd.toISOString()}),and(start_time.lte.${defaultStart.toISOString()},end_time.gte.${defaultEnd.toISOString()})`)
        .limit(1)

      if (conflicts && conflicts.length > 0) {
        setBooking(false)
        Alert.alert('Creneau indisponible', "Ce creneau est deja reserve. Essayez d'autres horaires.")
        return
      }

      // Check host availability (blocked slots)
      const { data: blocked } = await supabase
        .from('availability')
        .select('id')
        .eq('spot_id', spot.id)
        .eq('is_available', false)
        .or(`and(start_time.gte.${defaultStart.toISOString()},start_time.lte.${defaultEnd.toISOString()}),and(end_time.gte.${defaultStart.toISOString()},end_time.lte.${defaultEnd.toISOString()}),and(start_time.lte.${defaultStart.toISOString()},end_time.gte.${defaultEnd.toISOString()})`)
        .limit(1)

      if (blocked && blocked.length > 0) {
        setBooking(false)
        Alert.alert('Creneau bloque', "Ce creneau est indisponible (bloque par l'hote).")
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
          ...(selectedVehicle ? { vehicle_id: selectedVehicle } : {}),
        })
        .select('id')
        .single()

      setBooking(false)

      if (error) {
        if (error.message.includes('unique') || error.message.includes('conflict')) {
          Alert.alert('Creneau indisponible', "Ce creneau vient d'etre reserve par quelqu'un d'autre.")
        } else {
          Alert.alert('Erreur', error.message)
        }
      } else if (newBooking) {
        router.push(`/booking/${newBooking.id}`)
      }
    } catch (err: any) {
      setBooking(false)
      Alert.alert('Erreur', err?.message ?? 'Une erreur est survenue')
    }
  }

  const onScroll = useCallback(
    (e: any) => {
      const x = e.nativeEvent.contentOffset.x
      const idx = Math.round(x / SCREEN_WIDTH)
      setPhotoIndex(idx)
    },
    [SCREEN_WIDTH]
  )

  /* ---------- Loading state ---------- */
  if (loading) {
    return <DetailSkeleton screenWidth={SCREEN_WIDTH} />
  }

  /* ---------- Not found ---------- */
  if (!spot) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.floatingBack} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <MapPin color={COLORS.gray300} size={36} />
          </View>
          <Text style={styles.emptyTitle}>Parking introuvable</Text>
          <Text style={styles.emptySubtitle}>Cette place n'existe plus ou a ete supprimee</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyBtnText}>Retour</Text>
          </TouchableOpacity>
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
        <View style={[styles.carouselWrap, { height: PHOTO_HEIGHT }]}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <CarouselImage uri={item} width={SCREEN_WIDTH} />
            )}
          />

          {/* Dot indicators */}
          {photos.length > 1 && (
            <View style={styles.dotsRow}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === photoIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Photo counter pill */}
          {photos.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {photoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}

          {/* Floating back button */}
          <TouchableOpacity
            style={styles.floatingBack}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft color={COLORS.dark} size={20} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Floating share + heart */}
          <View style={styles.floatingRight}>
            <TouchableOpacity style={styles.floatingBtn} onPress={handleShare} activeOpacity={0.8}>
              <Share2 color={COLORS.dark} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingBtn}
              onPress={handleLike}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <Heart
                  color={liked ? COLORS.danger : COLORS.dark}
                  fill={liked ? COLORS.danger : 'transparent'}
                  size={18}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Body ===== */}
        <View style={styles.body}>

          {/* Price + Rating row */}
          <View style={styles.priceRatingRow}>
            <Text style={styles.heroPrice}>
              {formatPrice(pricePerHour)} €
              <Text style={styles.heroPriceUnit}>/h</Text>
            </Text>
            {ratingValue !== null && (
              <View style={styles.ratingPill}>
                <Star size={13} color={COLORS.warning} fill={COLORS.warning} />
                <Text style={styles.ratingText}>{ratingValue.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({spot.review_count})</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{spot.title}</Text>

          {/* Address */}
          <View style={styles.addrRow}>
            <MapPin color={COLORS.gray400} size={14} strokeWidth={2} />
            <Text style={styles.addr}>
              {spot.address}, {spot.city}
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{TYPE_LABELS[spot.type] ?? spot.type}</Text>
            </View>
            {spot.has_smart_gate && (
              <View style={[styles.badge, styles.badgeSuccess]}>
                <Zap color={COLORS.success} size={11} fill={COLORS.success} />
                <Text style={[styles.badgeText, { color: COLORS.success }]}>Smart Gate</Text>
              </View>
            )}
            {spot.instant_book && (
              <View style={[styles.badge, styles.badgePrimary]}>
                <Clock color={COLORS.primary} size={11} />
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>Instantane</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Host card */}
          {host && (
            <>
              <View style={styles.hostCard}>
                <View style={styles.hostAvatarWrap}>
                  {host.avatar_url ? (
                    <Image source={{ uri: host.avatar_url }} style={styles.hostAvatarImg} />
                  ) : (
                    <User color={COLORS.gray400} size={22} />
                  )}
                </View>
                <View style={styles.hostInfo}>
                  <Text style={styles.hostName}>
                    {host.first_name} {host.last_name?.charAt(0)}.
                  </Text>
                  <Text style={styles.hostSince}>
                    Hote depuis{' '}
                    {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(host.created_at))}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <CheckCircle color={COLORS.success} size={14} fill={COLORS.successLight} />
                  <Text style={styles.verifiedText}>Verifie</Text>
                </View>
                <ChevronRight color={COLORS.gray300} size={18} />
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Description (expandable) */}
          {spot.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <ExpandableText text={spot.description} maxLines={3} />
              <View style={styles.divider} />
            </>
          )}

          {/* Amenities 2-column grid */}
          {spot.amenities && spot.amenities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Equipements & Securite</Text>
              <View style={styles.amenitiesGrid}>
                {spot.amenities.map((a) => {
                  const info = AMENITY_LABELS[a]
                  return (
                    <View
                      key={a}
                      style={[styles.amenityCard, { width: (SCREEN_WIDTH - 48 - 10) / 2 }]}
                    >
                      <Text style={styles.amenityIcon}>{info?.icon ?? '✓'}</Text>
                      <Text style={styles.amenityLabel}>{info?.label ?? a}</Text>
                    </View>
                  )
                })}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Max vehicle height */}
          {spot.max_vehicle_height && (
            <>
              <View style={styles.heightCard}>
                <View style={styles.heightIconWrap}>
                  <Shield color={COLORS.primary} size={16} />
                </View>
                <Text style={styles.heightText}>
                  Hauteur maximale :{' '}
                  <Text style={{ fontWeight: '700', color: COLORS.dark }}>
                    {Number(spot.max_vehicle_height).toFixed(1).replace('.', ',')} m
                  </Text>
                </Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Parking instructions */}
          {spot.parking_instructions && (
            <>
              <View style={styles.instructionsBox}>
                <View style={styles.instructionsHeader}>
                  <Info color={COLORS.primary} size={15} />
                  <Text style={styles.instructionsLabel}>Instructions d'acces</Text>
                </View>
                <Text style={styles.instructionsText}>{spot.parking_instructions}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Cancellation policy */}
          <View style={styles.cancellationBox}>
            <View style={styles.cancellationHeader}>
              <AlertCircle color={COLORS.gray500} size={15} />
              <Text style={styles.cancellationLabel}>Politique d'annulation</Text>
            </View>
            <Text style={styles.cancellationText}>
              Annulation gratuite jusqu'a 24h avant le debut. Au-dela, le montant total est du.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== Sticky Booking Footer ===== */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          {/* Price left */}
          <View>
            <Text style={styles.footerPriceMain}>
              {formatPrice(pricePerHour)} €
              <Text style={styles.footerPriceUnit}>/h</Text>
            </Text>
          </View>

          {/* Duration stepper */}
          <View style={styles.durationSelector}>
            <TouchableOpacity
              style={[styles.durationBtn, hours <= 1 && styles.durationBtnDisabled]}
              onPress={() => setHours(Math.max(1, hours - 1))}
              disabled={hours <= 1}
              activeOpacity={0.7}
            >
              <Minus color={hours <= 1 ? COLORS.gray300 : COLORS.dark} size={15} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.durationText}>{hours}h</Text>
            <TouchableOpacity
              style={[styles.durationBtn, hours >= 24 && styles.durationBtnDisabled]}
              onPress={() => setHours(Math.min(24, hours + 1))}
              disabled={hours >= 24}
              activeOpacity={0.7}
            >
              <Plus color={hours >= 24 ? COLORS.gray300 : COLORS.dark} size={15} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle selector */}
        {vehicles.length > 0 && (
          <View style={styles.vehicleSection}>
            <TouchableOpacity
              style={styles.vehicleSelector}
              onPress={() => setShowVehiclePicker(!showVehiclePicker)}
              activeOpacity={0.7}
            >
              <Car color={COLORS.primary} size={15} />
              <Text style={styles.vehicleSelectorText} numberOfLines={1}>
                {selectedVehicle
                  ? (() => {
                      const v = vehicles.find(veh => veh.id === selectedVehicle)
                      return v ? `${v.brand ?? ''} ${v.model ?? ''} — ${v.license_plate}`.trim() : 'Selectionner'
                    })()
                  : 'Selectionner un vehicule'}
              </Text>
              <ChevronDown
                color={COLORS.gray400}
                size={15}
                style={{ transform: [{ rotate: showVehiclePicker ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
            {showVehiclePicker && (
              <View style={styles.vehicleDropdown}>
                {vehicles.map((v, idx) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleOption,
                      v.id === selectedVehicle && styles.vehicleOptionActive,
                      idx < vehicles.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
                    ]}
                    onPress={() => {
                      setSelectedVehicle(v.id)
                      setShowVehiclePicker(false)
                    }}
                    activeOpacity={0.7}
                  >
                    <Car color={v.id === selectedVehicle ? COLORS.primary : COLORS.gray400} size={14} />
                    <Text style={[
                      styles.vehicleOptionText,
                      v.id === selectedVehicle && { color: COLORS.primary, fontWeight: '700' },
                    ]}>
                      {v.brand ?? ''} {v.model ?? ''} — {v.license_plate}
                    </Text>
                    {v.id === selectedVehicle && (
                      <CheckCircle color={COLORS.primary} size={14} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Total row */}
        <View style={styles.footerTotalRow}>
          <Text style={styles.footerTotalLabel}>
            Total ({hours}h · {formatPrice(fee)} € de frais inclus)
          </Text>
          <Text style={styles.footerTotalValue}>{formatPrice(total)} €</Text>
        </View>

        {/* Reserve button */}
        <TouchableOpacity
          style={[styles.reserveBtn, booking && styles.reserveBtnLoading]}
          onPress={handleReserve}
          disabled={booking}
          activeOpacity={0.85}
        >
          {booking ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.reserveBtnText}>
              {spot.instant_book ? 'Reserver maintenant' : 'Demander une reservation'}
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
  scroll: {
    paddingBottom: 220,
  },

  /* ---- Carousel ---- */
  carouselWrap: {
    position: 'relative',
    backgroundColor: COLORS.gray200,
    overflow: 'hidden',
  },
  carouselImage: {
    height: PHOTO_HEIGHT,
    overflow: 'hidden',
  },
  carouselGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    // Simulated gradient using opacity layers
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 20,
    borderRadius: 4,
  },
  photoCounter: {
    position: 'absolute',
    bottom: 18,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoCounterText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* ---- Floating buttons ---- */
  floatingBack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 20,
    left: 16,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 5 },
    }),
  },
  floatingRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 20,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 10,
  },
  floatingBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 5 },
    }),
  },

  /* ---- Body ---- */
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 14,
  },

  /* Price + Rating */
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPrice: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.5,
  },
  heroPriceUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray400,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warningLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.dark,
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.gray400,
  },

  /* Title + address */
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -2,
  },
  addr: {
    fontSize: 14,
    color: COLORS.gray500,
    flex: 1,
    lineHeight: 20,
  },

  /* Badges */
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
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
    backgroundColor: COLORS.gray100,
    marginVertical: 6,
  },

  /* Section title */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
    letterSpacing: -0.2,
  },

  /* Description */
  description: {
    fontSize: 15,
    color: COLORS.gray500,
    lineHeight: 24,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  /* Host card */
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 18,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  hostAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  hostAvatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },

  /* Amenities 2-col grid */
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
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
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
  },
  heightIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5,64,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heightText: {
    fontSize: 14,
    color: COLORS.gray700,
    flex: 1,
  },

  /* Parking instructions box */
  instructionsBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(5,64,255,0.1)',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.gray700,
    lineHeight: 22,
  },

  /* Cancellation policy */
  cancellationBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 16,
    padding: 16,
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cancellationLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cancellationText: {
    fontSize: 13,
    color: COLORS.gray500,
    lineHeight: 20,
  },

  /* ---- Sticky footer ---- */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 10 },
    }),
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footerPriceMain: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: -0.3,
  },
  footerPriceUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray400,
  },

  /* Duration stepper */
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 3,
    backgroundColor: COLORS.gray50,
  },
  durationBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  durationBtnDisabled: {
    borderColor: COLORS.gray100,
    backgroundColor: COLORS.gray50,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.dark,
    minWidth: 34,
    textAlign: 'center',
  },

  /* Vehicle selector */
  vehicleSection: {
    marginBottom: 10,
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(5,64,255,0.12)',
  },
  vehicleSelectorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '600',
  },
  vehicleDropdown: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  vehicleOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  vehicleOptionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '500',
  },

  /* Footer total */
  footerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
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
    letterSpacing: -0.3,
  },

  /* Reserve button */
  reserveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  reserveBtnLoading: {
    opacity: 0.7,
  },
  reserveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  /* Empty state */
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
})
