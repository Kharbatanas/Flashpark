import React, { useEffect } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { timingNormal } from '../../tokens/animation'

interface ProgressBarProps {
  progress: number // 0–1
  height?: number
  color?: string
  trackColor?: string
  style?: ViewStyle
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  trackColor,
  style,
}: ProgressBarProps): React.JSX.Element {
  const { colors } = useTheme()
  const width = useSharedValue(0)

  const clampedProgress = Math.min(1, Math.max(0, progress))

  useEffect(() => {
    width.value = withTiming(clampedProgress, timingNormal)
  }, [clampedProgress, width])

  const animatedFill = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }))

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor ?? colors.borderLight,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: color ?? colors.primary,
          },
          animatedFill,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
})
