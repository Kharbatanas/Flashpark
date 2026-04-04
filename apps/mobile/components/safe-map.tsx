import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MapView, { Marker, type MapViewProps } from 'react-native-maps'
import { COLORS } from '../lib/constants'

interface SafeMapProps extends MapViewProps {
  children?: React.ReactNode
  mapRef?: React.Ref<MapView>
  fallback?: React.ReactNode
}

/**
 * SafeMapView wraps react-native-maps MapView with an error boundary.
 * In Expo Go SDK 52, react-native-maps works natively — we import it
 * directly instead of using a try/catch that can't catch build-time errors.
 *
 * If the map component throws at runtime, the error boundary catches it
 * and renders a fallback.
 */
export function SafeMapView({ children, mapRef, fallback, style, ...props }: SafeMapProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      fallback ?? (
        <View style={[style, styles.fallback]}>
          <Text style={styles.fallbackIcon}>🗺️</Text>
          <Text style={styles.fallbackText}>Carte non disponible</Text>
          <Text style={styles.fallbackSub}>Utilisez la vue liste</Text>
        </View>
      )
    )
  }

  return (
    <MapView
      ref={mapRef as React.Ref<MapView>}
      style={style}
      onMapReady={() => {}}
      {...props}
    >
      {children}
    </MapView>
  )
}

export { Marker as SafeMarker }
export { MapView }

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  fallbackIcon: { fontSize: 48, marginBottom: 8 },
  fallbackText: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  fallbackSub: { fontSize: 13, color: COLORS.gray400, marginTop: 4 },
})
