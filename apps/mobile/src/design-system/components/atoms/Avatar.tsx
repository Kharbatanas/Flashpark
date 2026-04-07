import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { AppText } from './AppText'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  uri?: string | null
  initials?: string
  size?: AvatarSize
  verified?: boolean
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
}

const initialsFontSize: Record<AvatarSize, number> = {
  xs: 9,
  sm: 12,
  md: 15,
  lg: 20,
  xl: 28,
}

const badgeSize: Record<AvatarSize, number> = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 22,
}

export function Avatar({
  uri,
  initials,
  size = 'md',
  verified = false,
}: AvatarProps): React.JSX.Element {
  const { colors } = useTheme()
  const dimension = sizeMap[size]
  const fontSize = initialsFontSize[size]
  const badge = badgeSize[size]

  const derivedInitials = initials
    ? initials.slice(0, 2).toUpperCase()
    : '?'

  return (
    <View style={{ width: dimension, height: dimension }}>
      {uri != null ? (
        <Image
          source={{ uri }}
          style={{
            width: dimension,
            height: dimension,
            borderRadius: radii.full,
          }}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: dimension,
              height: dimension,
              borderRadius: radii.full,
              backgroundColor: colors.primaryMuted,
            },
          ]}
        >
          <AppText
            color={colors.primary}
            style={{ fontSize, lineHeight: fontSize * 1.2, fontWeight: '600' }}
          >
            {derivedInitials}
          </AppText>
        </View>
      )}

      {verified && (
        <View
          style={[
            styles.badge,
            {
              width: badge,
              height: badge,
              borderRadius: radii.full,
              backgroundColor: colors.success,
              borderColor: colors.surface,
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
  },
})
