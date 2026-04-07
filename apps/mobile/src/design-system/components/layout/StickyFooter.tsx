import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/useTheme'
import { spacing } from '../../tokens/spacing'

interface StickyFooterProps {
  children: React.ReactNode
}

export function StickyFooter({ children }: StickyFooterProps): React.JSX.Element {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const content = (
    <View
      style={[
        styles.inner,
        {
          paddingBottom: Math.max(insets.bottom, spacing[4]),
          borderTopColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  )

  if (Platform.OS === 'ios') {
    // Lazy import to avoid issues on Android
    const { BlurView } = require('expo-blur')
    return (
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.container}
      >
        {content}
      </BlurView>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inner: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
