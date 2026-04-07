import { Platform, ViewStyle } from 'react-native'

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>

const makeShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
): ShadowStyle =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  }) as ShadowStyle

export const shadows = {
  sm: makeShadow('#000', 1, 0.06, 3, 2),
  md: makeShadow('#000', 4, 0.1, 8, 6),
  lg: makeShadow('#000', 8, 0.14, 16, 12),
} as const

export const coloredShadow = (color: string): ShadowStyle =>
  makeShadow(color, 4, 0.35, 10, 8)

export type ShadowKey = keyof typeof shadows
