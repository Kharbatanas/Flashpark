import React, { useState } from 'react'
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native'
import { Image, ImageContentFit, ImageStyle } from 'expo-image'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { AppText } from './AppText'

interface OptimizedImageProps {
  uri: string
  width: DimensionValue
  height: DimensionValue
  borderRadius?: number
  contentFit?: ImageContentFit
  placeholder?: string
  style?: ImageStyle
}

export function OptimizedImage({
  uri,
  width,
  height,
  borderRadius = radii.md,
  contentFit = 'cover',
  placeholder,
  style,
}: OptimizedImageProps): React.JSX.Element {
  const { colors } = useTheme()
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <View
        style={[
          styles.errorContainer,
          {
            width,
            height,
            borderRadius,
            backgroundColor: colors.borderLight,
          } as ViewStyle,
        ]}
      >
        <AppText variant="caption2" color={colors.textTertiary}>
          Image indisponible
        </AppText>
      </View>
    )
  }

  return (
    <Image
      source={{ uri }}
      style={[{ width, height, borderRadius } as ImageStyle, style]}
      contentFit={contentFit}
      transition={300}
      placeholder={placeholder ? { uri: placeholder } : undefined}
      onError={() => setHasError(true)}
    />
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
