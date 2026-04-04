export const COLORS = {
  primary: '#0540FF',
  primaryLight: '#EFF6FF',
  dark: '#1A1A2E',
  darkSecondary: '#0F0F1A',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F5A623',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  white: '#FFFFFF',
  background: '#F8FAFC',
} as const

export const TYPE_LABELS: Record<string, string> = {
  outdoor: 'Extérieur',
  indoor: 'Intérieur',
  garage: 'Garage',
  covered: 'Couvert',
  underground: 'Souterrain',
}

export const TYPE_ICONS: Record<string, string> = {
  outdoor: '🌤️',
  indoor: '🏢',
  garage: '🏠',
  covered: '⛱️',
  underground: '🚇',
}

export const AMENITY_LABELS: Record<string, { icon: string; label: string }> = {
  lighting: { icon: '💡', label: 'Éclairage' },
  security_camera: { icon: '📷', label: 'Caméra' },
  covered: { icon: '🏠', label: 'Couvert' },
  ev_charging: { icon: '⚡', label: 'Recharge EV' },
  disabled_access: { icon: '♿', label: 'Accès PMR' },
  '24h_access': { icon: '🕐', label: '24h/24' },
}

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente',  color: '#F5A623', bg: '#FFFBEB' },
  confirmed: { label: 'Confirmée',   color: '#0540FF', bg: '#EFF6FF' },
  active:    { label: 'Active',      color: '#10B981', bg: '#ECFDF5' },
  completed: { label: 'Terminée',    color: '#6B7280', bg: '#F9FAFB' },
  cancelled: { label: 'Annulée',     color: '#EF4444', bg: '#FEF2F2' },
  refunded:  { label: 'Remboursée',  color: '#6B7280', bg: '#F9FAFB' },
}

export const NICE_REGION = {
  latitude: 43.7102,
  longitude: 7.262,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
}

// Placeholder photos from picsum.photos (free, no API key needed)
export const PLACEHOLDER_PHOTOS = [
  'https://picsum.photos/seed/park1/400/300',
  'https://picsum.photos/seed/park2/400/300',
  'https://picsum.photos/seed/park3/400/300',
  'https://picsum.photos/seed/park4/400/300',
  'https://picsum.photos/seed/park5/400/300',
  'https://picsum.photos/seed/park6/400/300',
  'https://picsum.photos/seed/park7/400/300',
  'https://picsum.photos/seed/park8/400/300',
  'https://picsum.photos/seed/park9/400/300',
  'https://picsum.photos/seed/park10/400/300',
]
