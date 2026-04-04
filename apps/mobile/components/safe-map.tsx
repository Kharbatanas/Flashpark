import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../lib/constants'

// Wrap MapView in a try-catch component since it can crash in Expo Go
// if Google Maps isn't configured on Android
let MapViewComponent: any = null
let MarkerComponent: any = null

try {
  const maps = require('react-native-maps')
  MapViewComponent = maps.default
  MarkerComponent = maps.Marker
} catch {
  // Maps not available
}

interface SafeMapProps {
  children?: React.ReactNode
  style?: any
  initialRegion?: any
  showsUserLocation?: boolean
  onPress?: () => void
  mapRef?: any
}

export function SafeMapView({ children, style, ...props }: SafeMapProps) {
  const [error, setError] = useState(false)

  if (!MapViewComponent || error) {
    return (
      <View style={[style, styles.fallback]}>
        <Text style={styles.fallbackIcon}>🗺️</Text>
        <Text style={styles.fallbackText}>Carte non disponible</Text>
        <Text style={styles.fallbackSub}>Utilisez la vue liste</Text>
      </View>
    )
  }

  return (
    <MapViewComponent
      style={style}
      onError={() => setError(true)}
      {...props}
    >
      {children}
    </MapViewComponent>
  )
}

export { MarkerComponent as SafeMarker }

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: { fontSize: 48, marginBottom: 8 },
  fallbackText: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  fallbackSub: { fontSize: 13, color: COLORS.gray400, marginTop: 4 },
})
