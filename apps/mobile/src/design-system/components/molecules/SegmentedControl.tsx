import React, { useEffect } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '../../theme/useTheme'
import { haptics } from '../../tokens/haptics'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { springSnappy } from '../../tokens/animation'
import { AppText } from '../atoms/AppText'

interface SegmentedControlProps {
  segments: string[]
  selectedIndex: number
  onChange: (index: number) => void
}

export function SegmentedControl({
  segments,
  selectedIndex,
  onChange,
}: SegmentedControlProps): React.JSX.Element {
  const { colors } = useTheme()
  const translateX = useSharedValue(0)
  const segmentWidth = useSharedValue(0)

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segmentWidth.value,
  }))

  useEffect(() => {
    translateX.value = withSpring(selectedIndex * segmentWidth.value, springSnappy)
  }, [selectedIndex, segmentWidth.value])

  const handleLayout = (width: number): void => {
    segmentWidth.value = width / segments.length
    translateX.value = selectedIndex * (width / segments.length)
  }

  const handlePress = (index: number): void => {
    if (index === selectedIndex) return
    haptics.selection()
    translateX.value = withSpring(index * segmentWidth.value, springSnappy)
    onChange(index)
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.borderLight }]}
      onLayout={(e) => handleLayout(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[
          styles.indicator,
          indicatorStyle,
          { backgroundColor: colors.surface },
        ]}
      />
      {segments.map((label, index) => (
        <TouchableOpacity
          key={label}
          style={styles.segment}
          onPress={() => handlePress(index)}
          accessibilityLabel={label}
          accessibilityRole="tab"
          accessibilityState={{ selected: index === selectedIndex }}
        >
          <AppText
            variant="callout"
            color={index === selectedIndex ? colors.text : colors.textSecondary}
          >
            {label}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.md,
    padding: 3,
    position: 'relative',
    height: 40,
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: radii.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
