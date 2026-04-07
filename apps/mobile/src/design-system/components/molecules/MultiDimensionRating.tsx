import React from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { timingNormal } from '../../tokens/animation'
import { AppText } from '../atoms/AppText'

interface DimensionRatings {
  access: number
  accuracy: number
  cleanliness: number
}

interface MultiDimensionRatingProps {
  ratings: DimensionRatings
}

const DIMENSION_LABELS: Record<keyof DimensionRatings, string> = {
  access: 'Accès',
  accuracy: 'Précision',
  cleanliness: 'Propreté',
}

function RatingBar({
  label,
  value,
}: {
  label: string
  value: number
}): React.JSX.Element {
  const { colors } = useTheme()
  const width = useSharedValue(0)

  React.useEffect(() => {
    width.value = withTiming((value / 5) * 100, timingNormal)
  }, [value])

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as `${number}%`,
  }))

  return (
    <View style={styles.row}>
      <AppText
        variant="callout"
        color={colors.textSecondary}
        style={styles.rowLabel}
      >
        {label}
      </AppText>
      <View
        style={[styles.track, { backgroundColor: colors.borderLight }]}
      >
        <Animated.View
          style={[
            styles.fill,
            fillStyle,
            { backgroundColor: colors.primary },
          ]}
        />
      </View>
      <AppText
        variant="caption1"
        color={colors.text}
        style={styles.value}
      >
        {value.toFixed(1)}
      </AppText>
    </View>
  )
}

export function MultiDimensionRating({
  ratings,
}: MultiDimensionRatingProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {(Object.keys(DIMENSION_LABELS) as Array<keyof DimensionRatings>).map(
        (key) => (
          <RatingBar
            key={key}
            label={DIMENSION_LABELS[key]}
            value={ratings[key]}
          />
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  rowLabel: {
    width: 72,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
  },
  value: {
    width: 28,
    textAlign: 'right',
  },
})
