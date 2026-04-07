import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Heart, Zap } from 'lucide-react-native'
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

interface SpotCardProps {
  spot: Spot
  onPress: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export function SpotCard({ spot, onPress, isFavorite = false, onToggleFavorite }: SpotCardProps) {
  const { colors } = useTheme()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 })
  }

  const handleHeartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggleFavorite?.()
  }

  const photo = spot.photos?.[0]
  const price = typeof spot.pricePerHour === 'string'
    ? parseFloat(spot.pricePerHour)
    : spot.pricePerHour
  const rating = spot.rating ? parseFloat(String(spot.rating)) : null

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessibilityLabel={`Place ${spot.title}, ${price?.toFixed(2)}€/h`}
    >
      <View style={styles.imageContainer}>
        <OptimizedImage
          uri={photo ?? ''}
          width="100%"
          height="100%"
        />
        {spot.hasSmartGate && (
          <View style={[styles.smartBadge, { backgroundColor: colors.primary }]}>
            <Zap size={10} color="#fff" strokeWidth={2.5} />
            <AppText variant="caption" style={styles.smartText}>Smart</AppText>
          </View>
        )}
        <TouchableOpacity
          style={[styles.heartBtn, { backgroundColor: colors.surface }]}
          onPress={handleHeartPress}
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={18}
            color={isFavorite ? '#EF4444' : colors.textSecondary}
            fill={isFavorite ? '#EF4444' : 'none'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <AppText variant="label" numberOfLines={1} style={{ color: colors.text }}>
          {spot.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={[styles.address, { color: colors.textSecondary }]}>
          {spot.address}
        </AppText>
        <View style={styles.footer}>
          {rating !== null && (
            <StarRating rating={rating} size={12} showLabel={false} />
          )}
          <AppText variant="label" style={[styles.price, { color: colors.text }]}>
            {price?.toFixed(2)}€
            <AppText variant="caption" style={{ color: colors.textSecondary }}>/h</AppText>
          </AppText>
        </View>
      </View>
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  smartBadge: {
    position: 'absolute',
    top: spacing[1],
    left: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  smartText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heartBtn: {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  info: {
    padding: spacing[2],
    gap: 3,
  },
  address: {
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  price: {
    fontWeight: '700',
  },
})
