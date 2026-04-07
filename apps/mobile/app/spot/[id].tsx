import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, Heart, Lock, MapPin, Share2 } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { Share } from 'react-native'

import { ScreenContainer } from '../../src/design-system/components/layout'
import { StickyFooter } from '../../src/design-system/components/layout'
import {
  AccessInstructions,
  CancellationPolicyBanner,
  ReviewCard,
  SpotDimensionsCard,
} from '../../src/design-system/components/organisms'
import {
  DurationStepper,
  EmptyState,
  MultiDimensionRating,
  PhotoCarousel,
  PriceDisplay,
  StarRating,
} from '../../src/design-system/components/molecules'
import { SkeletonBox } from '../../src/design-system/components/atoms'
import { AppButton, AppText, Avatar, Badge, Chip } from '../../src/design-system/components/atoms'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { useSpot } from '../../src/api/hooks/useSpots'
import { useSpotReviews } from '../../src/api/hooks/useReviews'
import { useWishlist, useToggleFavorite } from '../../src/api/hooks/useWishlists'
import { useVehicles } from '../../src/api/hooks/useVehicles'
import { useBookings } from '../../src/api/hooks/useBookings'
import { useUserProfile } from '../../src/api/hooks/useAuth'
import { AMENITY_LABELS, TYPE_LABELS } from '../../lib/constants'
import { CancellationPolicy } from '../../src/types/database'

const PHOTO_HEIGHT = 300
const MAX_REVIEWS_SHOWN = 3
const PLATFORM_FEE_RATE = 0.2

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton(): React.JSX.Element {
  return (
    <View style={skeletonStyles.container}>
      <SkeletonBox width="100%" height={PHOTO_HEIGHT} borderRadius={0} />
      <View style={skeletonStyles.body}>
        <SkeletonBox width="60%" height={28} borderRadius={6} />
        <SkeletonBox width="80%" height={18} borderRadius={4} />
        <View style={skeletonStyles.row}>
          <SkeletonBox width={80} height={32} borderRadius={20} />
          <SkeletonBox width={100} height={32} borderRadius={20} />
        </View>
        <SkeletonBox width="100%" height={1} borderRadius={0} />
        <SkeletonBox width="100%" height={80} borderRadius={12} />
        <SkeletonBox width="100%" height={120} borderRadius={12} />
      </View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 20, gap: 16 },
  row: { flexDirection: 'row', gap: 8 },
})

// ─── Photo overlay buttons ─────────────────────────────────────────────────────

interface PhotoOverlayProps {
  isFavorite: boolean
  onBack: () => void
  onToggleFavorite: () => void
  onShare: () => void
}

function PhotoOverlay({ isFavorite, onBack, onToggleFavorite, onShare }: PhotoOverlayProps): React.JSX.Element {
  const { colors } = useTheme()
  return (
    <>
      <TouchableOpacity
        style={[overlayStyles.btn, overlayStyles.backBtn]}
        onPress={onBack}
        accessibilityLabel="Retour"
      >
        <ArrowLeft size={20} color={colors.textInverse} strokeWidth={2.5} />
      </TouchableOpacity>
      <View style={overlayStyles.rightBtns}>
        <TouchableOpacity
          style={overlayStyles.btn}
          onPress={onShare}
          accessibilityLabel="Partager cette place"
        >
          <Share2 size={18} color={colors.textInverse} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={overlayStyles.btn}
          onPress={onToggleFavorite}
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            size={18}
            color={isFavorite ? '#EF4444' : colors.textInverse}
            fill={isFavorite ? '#EF4444' : 'none'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
    </>
  )
}

const overlayStyles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
  },
  rightBtns: {
    position: 'absolute',
    top: 12,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
})

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider(): React.JSX.Element {
  const { colors } = useTheme()
  return <View style={[divStyles.line, { backgroundColor: colors.border }]} />
}

const divStyles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
})

// ─── Gated access instructions ─────────────────────────────────────────────────

function GatedAccessInstructions({ spotId, spot }: { spotId: string; spot: Parameters<typeof AccessInstructions>[0]['spot'] }): React.JSX.Element {
  const { colors } = useTheme()
  const { data: bookings = [] } = useBookings()

  const hasBooking = bookings.some(
    (b) => b.spot_id === spotId && ['confirmed', 'active', 'completed'].includes(b.status)
  )

  if (hasBooking) {
    return <AccessInstructions spot={spot} />
  }

  return (
    <View style={[gateStyles.container, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '30' }]}>
      <Lock size={20} color={colors.primary} strokeWidth={2} />
      <View style={gateStyles.text}>
        <AppText variant="label" color={colors.text}>
          Instructions d'accès
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Réservez pour voir les instructions d'accès à cette place
        </AppText>
      </View>
    </View>
  )
}

const gateStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: { flex: 1, gap: 3 },
})

// ─── Review summary ────────────────────────────────────────────────────────────

function ReviewSummary({ reviews }: { reviews: ReturnType<typeof useSpotReviews>['data'] }): React.JSX.Element | null {
  const { colors } = useTheme()
  if (!reviews || reviews.length === 0) return null

  const avg = (key: 'rating_access' | 'rating_accuracy' | 'rating_cleanliness'): number => {
    const vals = reviews.map((r) => r[key]).filter((v): v is number => v != null)
    if (vals.length === 0) return 0
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  return (
    <MultiDimensionRating
      ratings={{
        access: avg('rating_access'),
        accuracy: avg('rating_accuracy'),
        cleanliness: avg('rating_cleanliness'),
      }}
    />
  )
}

// ─── Host section ──────────────────────────────────────────────────────────────

function HostSection({ hostId }: { hostId: string }): React.JSX.Element {
  const { colors } = useTheme()
  const { data: host } = useUserProfile(hostId)

  if (!host) return <SkeletonBox width="100%" height={64} borderRadius={12} />

  const memberSince = new Date(host.created_at).getFullYear()

  return (
    <View style={[hostStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Avatar
        uri={host.avatar_url}
        initials={host.full_name?.slice(0, 2) ?? 'H'}
        size="lg"
        verified={host.is_verified}
      />
      <View style={hostStyles.info}>
        <AppText variant="label" color={colors.text}>
          {host.full_name ?? 'Hôte'}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Membre depuis {memberSince}
        </AppText>
      </View>
    </View>
  )
}

const hostStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  info: { flex: 1, gap: 3 },
})

// ─── Spot Detail screen ────────────────────────────────────────────────────────

export default function SpotDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()

  const [hours, setHours] = useState(2)

  const { data: spot, isLoading, isError } = useSpot(id)
  const { data: reviews = [] } = useSpotReviews(id)
  const { data: wishlistIds = [] } = useWishlist()
  const { mutate: toggleFavorite } = useToggleFavorite()
  const { data: vehicles = [] } = useVehicles()

  const isFavorite = wishlistIds.includes(id)
  const defaultVehicle = vehicles.find((v) => v.is_default) ?? vehicles[0] ?? null

  const pricePerHour = spot ? parseFloat(spot.price_per_hour) : 0
  const subtotal = Math.round(hours * pricePerHour * 100) / 100
  const fee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100
  const total = subtotal + fee

  const handleToggleFavorite = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleFavorite(id)
  }

  const handleShare = (): void => {
    Share.share({ message: `Découvrez cette place de parking sur FlashPark : flashpark://spot/${id}` })
  }

  const handleBook = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push(`/booking/new?spotId=${id}&hours=${hours}`)
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <DetailSkeleton />
      </ScreenContainer>
    )
  }

  if (isError || !spot) {
    return (
      <ScreenContainer scroll>
        <EmptyState
          icon={MapPin}
          title="Place introuvable"
          subtitle="Cette place n'existe pas ou a été supprimée"
          actionLabel="Retour"
          onAction={() => router.back()}
        />
      </ScreenContainer>
    )
  }

  const rating = spot.rating ? parseFloat(spot.rating) : null
  const shownReviews = reviews.slice(0, MAX_REVIEWS_SHOWN)
  const typeLabel = TYPE_LABELS[spot.type] ?? spot.type

  const accessSpot = {
    accessInstructions: spot.access_instructions,
    accessPhotos: spot.access_photos ?? [],
    floorNumber: spot.floor_number,
    spotNumber: spot.spot_number,
    buildingCode: spot.building_code,
    gpsPinLat: spot.gps_pin_lat,
    gpsPinLng: spot.gps_pin_lng,
  }

  const vehicleDims = defaultVehicle
    ? {
        width: defaultVehicle.width,
        length: defaultVehicle.length,
        height: defaultVehicle.height,
        brand: defaultVehicle.brand,
        model: defaultVehicle.model,
      }
    : null

  return (
    <ScreenContainer>
      {/* Main scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo carousel with overlaid buttons */}
        <View style={{ height: PHOTO_HEIGHT, position: 'relative' }}>
          <PhotoCarousel photos={spot.photos ?? []} height={PHOTO_HEIGHT} />
          <PhotoOverlay
            isFavorite={isFavorite}
            onBack={() => router.back()}
            onToggleFavorite={handleToggleFavorite}
            onShare={handleShare}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title + type badge + rating */}
          <View style={styles.titleRow}>
            <AppText variant="title2" color={colors.text} style={styles.title}>
              {spot.title}
            </AppText>
            <Chip label={typeLabel} />
          </View>

          <View style={styles.metaRow}>
            <MapPin size={14} color={colors.textTertiary} strokeWidth={2} />
            <AppText variant="callout" color={colors.textSecondary} numberOfLines={1} style={styles.address}>
              {spot.address}, {spot.city}
            </AppText>
          </View>

          {rating !== null ? (
            <View style={styles.ratingRow}>
              <StarRating rating={rating} size={16} showLabel />
              <AppText variant="callout" color={colors.textSecondary}>
                ({spot.review_count} {spot.review_count === 1 ? 'avis' : 'avis'})
              </AppText>
            </View>
          ) : (
            <AppText variant="callout" color={colors.textTertiary}>
              Aucun avis pour le moment
            </AppText>
          )}

          <PriceDisplay price={pricePerHour} unit="/h" size="lg" />

          <Divider />

          {/* Description */}
          {spot.description && (
            <>
              <AppText variant="body" color={colors.text} style={styles.description}>
                {spot.description}
              </AppText>
              <Divider />
            </>
          )}

          {/* Amenities */}
          {spot.amenities && spot.amenities.length > 0 && (
            <>
              <AppText variant="title3" color={colors.text} style={styles.sectionTitle}>
                Équipements
              </AppText>
              <View style={styles.amenitiesRow}>
                {spot.amenities.map((key) => {
                  const amenity = AMENITY_LABELS[key]
                  if (!amenity) return null
                  return (
                    <Chip
                      key={key}
                      label={`${amenity.icon} ${amenity.label}`}
                    />
                  )
                })}
              </View>
              <Divider />
            </>
          )}

          {/* Dimensions + vehicle compatibility */}
          <AppText variant="title3" color={colors.text} style={styles.sectionTitle}>
            Dimensions
          </AppText>
          <SpotDimensionsCard
            spot={{
              width: spot.width,
              length: spot.length,
              maxVehicleHeight: spot.max_vehicle_height,
            }}
            vehicle={vehicleDims}
          />

          <Divider />

          {/* Cancellation policy */}
          <AppText variant="title3" color={colors.text} style={styles.sectionTitle}>
            Politique d'annulation
          </AppText>
          <CancellationPolicyBanner policy={spot.cancellation_policy as CancellationPolicy} />

          <Divider />

          {/* Access instructions (gated) */}
          <GatedAccessInstructions spotId={id} spot={accessSpot} />

          <Divider />

          {/* Reviews */}
          {reviews.length > 0 && (
            <>
              <View style={styles.reviewsHeader}>
                <AppText variant="title3" color={colors.text}>
                  Avis ({spot.review_count})
                </AppText>
                {rating !== null && (
                  <StarRating rating={rating} size={14} />
                )}
              </View>

              <ReviewSummary reviews={reviews} />

              <View style={styles.reviewsList}>
                {shownReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    createdAt={review.created_at}
                    overallRating={null}
                    dimensions={{
                      ratingAccess: review.rating_access,
                      ratingAccuracy: review.rating_accuracy,
                      ratingCleanliness: review.rating_cleanliness,
                    }}
                    comment={review.comment}
                  />
                ))}
              </View>

              {reviews.length > MAX_REVIEWS_SHOWN && (
                <TouchableOpacity
                  style={styles.moreReviews}
                  onPress={() => router.push(`/spot/${id}/reviews`)}
                  accessibilityLabel="Voir tous les avis"
                >
                  <AppText variant="callout" color={colors.primary}>
                    Voir tous les avis ({reviews.length})
                  </AppText>
                </TouchableOpacity>
              )}

              <Divider />
            </>
          )}

          {/* Host info */}
          {spot.host_id && (
            <>
              <AppText variant="title3" color={colors.text} style={styles.sectionTitle}>
                Votre hôte
              </AppText>
              <HostSection hostId={spot.host_id} />
            </>
          )}

          {/* Bottom spacing for sticky footer */}
          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>

      {/* Sticky booking footer */}
      <StickyFooter>
        <View style={styles.footerContent}>
          <DurationStepper
            hours={hours}
            minHours={0.5}
            maxHours={24}
            onChange={setHours}
            pricePerHour={pricePerHour}
          />
          <View style={styles.footerSummary}>
            <View>
              <AppText variant="caption" color={colors.textSecondary}>
                Total estimé (frais inclus)
              </AppText>
              <AppText variant="headline" color={colors.text}>
                {total.toFixed(2).replace('.', ',')} €
              </AppText>
            </View>
            <View style={styles.bookBtn}>
              <AppButton
                title="Réserver"
                onPress={handleBook}
                variant="primary"
                size="lg"
              />
            </View>
          </View>
        </View>
      </StickyFooter>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  description: {
    lineHeight: 24,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsList: {
    gap: 12,
  },
  moreReviews: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerSpacer: {
    height: 160,
  },
  footerContent: {
    gap: 12,
  },
  footerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bookBtn: {
    flex: 1,
  },
})
