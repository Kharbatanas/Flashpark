import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import { WifiOff } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { spacing } from '../../tokens/spacing'
import { timingNormal } from '../../tokens/animation'
import { AppText } from '../atoms/AppText'

export function OfflineBanner(): React.JSX.Element {
  const { colors } = useTheme()
  const translateY = useSharedValue(-60)
  const isOffline = useSharedValue(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = !state.isConnected
      isOffline.value = offline
      translateY.value = withTiming(offline ? 0 : -60, timingNormal)
    })
    return () => unsubscribe()
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View
      style={[
        styles.banner,
        animatedStyle,
        { backgroundColor: colors.warning },
      ]}
      accessibilityLiveRegion="polite"
    >
      <WifiOff size={14} color={colors.textInverse} strokeWidth={2} />
      <AppText variant="caption1" color={colors.textInverse}>
        Pas de connexion Internet
      </AppText>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    zIndex: 9998,
  },
})
