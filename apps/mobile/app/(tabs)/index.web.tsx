'use client'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function MapScreenWeb() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🅿️</Text>
        <Text style={styles.title}>Flashpark</Text>
        <Text style={styles.sub}>La carte est disponible sur l&apos;app mobile</Text>
        <TouchableOpacity style={styles.btn} onPress={() => window.open('http://localhost:3000/map', '_blank')}>
          <Text style={styles.btnText}>Voir la carte web →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emoji: { fontSize: 64 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A2E' },
  sub: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  btn: { marginTop: 8, backgroundColor: '#0540FF', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
})
