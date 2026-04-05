import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  ArrowLeft, Calendar, Clock, Plus, Trash2, Lock, Unlock,
} from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

interface SpotOption {
  id: string
  title: string
}

interface AvailabilitySlot {
  id: string
  spot_id: string
  start_time: string
  end_time: string
  is_available: boolean
}

function formatDateTimeFR(d: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export default function HostAvailabilityScreen() {
  const [spots, setSpots] = useState<SpotOption[]>([])
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadSpots()
  }, [])

  useEffect(() => {
    if (selectedSpot) loadSlots()
  }, [selectedSpot])

  async function loadSpots() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: dbUser } = await supabase
        .from('users').select('id').eq('supabase_id', user.id).single()
      if (!dbUser) return

      const { data } = await supabase
        .from('spots')
        .select('id, title')
        .eq('host_id', dbUser.id)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setSpots(data)
        setSelectedSpot(data[0].id)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function loadSlots() {
    if (!selectedSpot) return
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('spot_id', selectedSpot)
      .order('start_time', { ascending: true })

    if (data) setSlots(data)
  }

  async function addBlockedSlot() {
    if (!selectedSpot) return
    setAdding(true)

    // Block the next 24h by default
    const start = new Date()
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

    const { error } = await supabase.from('availability').insert({
      spot_id: selectedSpot,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      is_available: false,
    })

    if (error) {
      Alert.alert('Erreur', error.message)
    } else {
      loadSlots()
    }
    setAdding(false)
  }

  async function deleteSlot(slotId: string) {
    Alert.alert('Supprimer', 'Supprimer ce creneau ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('availability').delete().eq('id', slotId)
          setSlots(prev => prev.filter(s => s.id !== slotId))
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disponibilites</Text>
        <TouchableOpacity
          style={styles.addSlotBtn}
          onPress={addBlockedSlot}
          disabled={adding || !selectedSpot}
          activeOpacity={0.7}
        >
          {adding ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Plus color={COLORS.white} size={16} />
              <Text style={styles.addSlotText}>Bloquer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Spot selector */}
      {spots.length > 1 && (
        <View style={styles.spotSelector}>
          {spots.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.spotTab, s.id === selectedSpot && styles.spotTabActive]}
              onPress={() => setSelectedSpot(s.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.spotTabText,
                s.id === selectedSpot && styles.spotTabTextActive,
              ]} numberOfLines={1}>
                {s.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Lock color={COLORS.warning} size={16} />
        <Text style={styles.infoText}>
          Les creneaux bloques empechent les reservations pendant cette periode.
        </Text>
      </View>

      {/* Slots list */}
      <FlatList
        data={slots}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        onRefresh={loadSlots}
        refreshing={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Calendar color={COLORS.gray300} size={36} />
            <Text style={styles.emptyTitle}>Aucun creneau</Text>
            <Text style={styles.emptySubtitle}>
              Appuyez sur "Bloquer" pour creer un creneau d'indisponibilite
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.slotCard, !item.is_available && styles.slotBlocked]}>
            <View style={styles.slotIcon}>
              {item.is_available ? (
                <Unlock color={COLORS.success} size={18} />
              ) : (
                <Lock color={COLORS.danger} size={18} />
              )}
            </View>
            <View style={styles.slotContent}>
              <Text style={styles.slotStatus}>
                {item.is_available ? 'Disponible' : 'Bloque'}
              </Text>
              <View style={styles.slotTimeRow}>
                <Clock color={COLORS.gray400} size={13} />
                <Text style={styles.slotTime}>
                  {formatDateTimeFR(item.start_time)} → {formatDateTimeFR(item.end_time)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => deleteSlot(item.id)}
              style={styles.deleteBtn}
              activeOpacity={0.7}
            >
              <Trash2 color={COLORS.danger} size={18} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: COLORS.gray100,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  addSlotBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.danger, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addSlotText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  spotSelector: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.gray100,
  },
  spotTab: {
    flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.gray100,
    alignItems: 'center',
  },
  spotTabActive: { backgroundColor: COLORS.primary },
  spotTabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray500 },
  spotTabTextActive: { color: COLORS.white },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12, padding: 12,
    backgroundColor: COLORS.warningLight, borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.gray700, lineHeight: 17 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  empty: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  emptySubtitle: { fontSize: 13, color: COLORS.gray400, textAlign: 'center', paddingHorizontal: 32 },
  slotCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.white, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.gray100,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  slotBlocked: { borderColor: COLORS.danger + '30', backgroundColor: COLORS.dangerLight },
  slotIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.gray50,
    alignItems: 'center', justifyContent: 'center',
  },
  slotContent: { flex: 1, gap: 4 },
  slotStatus: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotTime: { fontSize: 12, color: COLORS.gray500 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.dangerLight,
    alignItems: 'center', justifyContent: 'center',
  },
})
