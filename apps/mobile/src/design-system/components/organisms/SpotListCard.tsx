import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Zap } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { OptimizedImage } from '../atoms/OptimizedImage'
import { StarRating } from '../molecules/StarRating'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii, shadows } from '../../tokens'

interface Spot {
  id: string
  title: string
  address: string
  pricePerHour: string | number
  photos: string[]
  rating?: string | number | null
  reviewCount?: number
  hasSmartGate?: boolean
}

interface SpotListCardProps {
  spot: Spot
  onPress: () => void
}

export function SpotListCard({ spot, onPress }: SpotListCardProps) {
  const { colors } = useTheme()

  const photo = spot.photos?.[0]
  const price = typeof spot.pricePerHour === 'string'
    ? parseFloat(spot.pricePerHour)
    : spot.pricePerHour
  const rating = spot.rating ? parseFloat(String(spot.rating)) : null

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Place ${spot.title}, ${price?.toFixed(2)}€/h`}
    >
      <View style={styles.imageContainer}>
        <OptimizedImage
          uri={photo ?? ''}
          width={100}
          height={100}
        />
        {spot.hasSmartGate && (
          <View style={[styles.smartBadge, { backgroundColor: colors.primary }]}>
            <Zap size={9} color="#fff" strokeWidth={2.5} />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <AppText variant="label" numberOfLines={1} style={{ color: colors.text }}>
          {spot.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: colors.textSecondary }}>
          {spot.address}
        </AppText>
        {rating !== null && (
          <View style={styles.ratingRow}>
            <StarRating rating={rating} size={11} />
          </View>
        )}
        <AppText variant="label" style={[styles.price, { color: colors.primary }]}>
          {price?.toFixed(2)}€
          <AppText variant="caption" style={{ color: colors.textSecondary }}>/h</AppText>
        </AppText>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  smartBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    padding: spacing[2],
    gap: 3,
    justifyContent: 'center',
  },
  ratingRow: {
    marginVertical: 2,
  },
  price: {
    fontWeight: '700',
    marginTop: 2,
  },
})
