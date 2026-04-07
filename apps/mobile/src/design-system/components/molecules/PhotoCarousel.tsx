import React, { useRef, useState } from 'react'
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { AppText } from '../atoms/AppText'

interface PhotoCarouselProps {
  photos: string[]
  height?: number
}

const SCREEN_WIDTH = Dimensions.get('window').width

export function PhotoCarousel({
  photos,
  height = 240,
}: PhotoCarouselProps): React.JSX.Element {
  const { colors } = useTheme()
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const x = e.nativeEvent.contentOffset.x
    const index = Math.round(x / SCREEN_WIDTH)
    setActiveIndex(index)
  }

  if (photos.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          { height, backgroundColor: colors.borderLight },
        ]}
      >
        <AppText variant="callout" color={colors.textTertiary}>
          Aucune photo
        </AppText>
      </View>
    )
  }

  return (
    <View style={{ height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        accessibilityLabel={`Galerie de ${photos.length} photos`}
      >
        {photos.map((uri, index) => (
          <Image
            key={`${uri}-${index}`}
            source={{ uri }}
            style={[styles.photo, { width: SCREEN_WIDTH, height }]}
            contentFit="cover"
            transition={200}
          />
        ))}
      </ScrollView>

      {photos.length > 1 && (
        <>
          <View style={styles.dotsContainer}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === activeIndex
                        ? colors.textInverse
                        : 'rgba(255,255,255,0.5)',
                    width: index === activeIndex ? 16 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.counter}>
            <AppText variant="caption2" color={colors.textInverse}>
              {activeIndex + 1}/{photos.length}
            </AppText>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {},
  dotsContainer: {
    position: 'absolute',
    bottom: spacing[3],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[1],
  },
  dot: {
    height: 6,
    borderRadius: radii.full,
  },
  counter: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },
})
