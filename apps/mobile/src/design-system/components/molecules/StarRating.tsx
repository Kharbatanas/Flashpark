import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Star } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: number
  interactive?: boolean
  onRate?: (rating: number) => void
  showLabel?: boolean
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 20,
  interactive = false,
  onRate,
  showLabel = false,
}: StarRatingProps): React.JSX.Element {
  const { colors } = useTheme()
  const STAR_COLOR = '#F5A623'

  const handlePress = (index: number): void => {
    if (!interactive || onRate == null) return
    haptics.light()
    onRate(index + 1)
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const filled = rating >= index + 1
        const partial = !filled && rating > index

        return (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(index)}
            disabled={!interactive}
            hitSlop={4}
            style={{ marginRight: index < maxStars - 1 ? spacing[1] : 0 }}
            accessibilityLabel={`${index + 1} étoile${index > 0 ? 's' : ''}`}
          >
            <Star
              size={size}
              color={STAR_COLOR}
              fill={filled || partial ? STAR_COLOR : 'none'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        )
      })}
      {showLabel && (
        <AppText
          variant="caption1"
          color={colors.textSecondary}
          style={styles.label}
        >
          {rating.toFixed(1)}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: spacing[1],
  },
})
