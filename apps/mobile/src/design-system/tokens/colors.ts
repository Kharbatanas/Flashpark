export interface ColorPalette {
  primary: string
  primaryMuted: string
  primaryLight: string
  success: string
  successMuted: string
  warning: string
  warningMuted: string
  danger: string
  dangerMuted: string
  background: string
  backgroundSecondary: string
  surface: string
  surfaceRaised: string
  border: string
  borderLight: string
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string
}

export const lightColors: ColorPalette = {
  primary: '#0540FF',
  primaryMuted: '#EFF6FF',
  primaryLight: '#EFF6FF',
  success: '#10B981',
  successMuted: '#ECFDF5',
  warning: '#F5A623',
  warningMuted: '#FFFBEB',
  danger: '#EF4444',
  dangerMuted: '#FEF2F2',
  background: '#F8FAFC',
  backgroundSecondary: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
}

export const darkColors: ColorPalette = {
  primary: '#0540FF',
  primaryMuted: '#1A1F4A',
  primaryLight: '#1A1F4A',
  success: '#10B981',
  successMuted: '#064E3B',
  warning: '#F5A623',
  warningMuted: '#3B2A0A',
  danger: '#EF4444',
  dangerMuted: '#450A0A',
  background: '#0F0F1A',
  backgroundSecondary: '#1F1F38',
  surface: '#1A1A2E',
  surfaceRaised: '#252540',
  border: '#2D2D4A',
  borderLight: '#1F1F38',
  text: '#F8FAFC',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textInverse: '#1A1A2E',
}
