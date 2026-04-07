export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
} as const

export type RadiusKey = keyof typeof radii
export type RadiusValue = (typeof radii)[RadiusKey]
