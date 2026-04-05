import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Switch,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ArrowLeft, Plus, Car, Star, Trash2, Zap, X, ChevronDown } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

const VEHICLE_TYPES = [
  { key: 'sedan', label: 'Berline' },
  { key: 'suv', label: 'SUV' },
  { key: 'coupe', label: 'Coupe' },
  { key: 'hatchback', label: 'Compacte' },
  { key: 'van', label: 'Monospace' },
  { key: 'truck', label: 'Pick-up' },
  { key: 'motorcycle', label: 'Moto' },
  { key: 'other', label: 'Autre' },
]

interface Vehicle {
  id: string
  license_plate: string
  brand: string
  model: string
  color: string | null
  type: string
  height_cm: number | null
  is_electric: boolean
  is_default: boolean
}

interface AddForm {
  license_plate: string
  brand: string
  model: string
  color: string
  type: string
  height_cm: string
  is_electric: boolean
  is_default: boolean
}

const EMPTY_FORM: AddForm = {
  license_plate: '',
  brand: '',
  model: '',
  color: '',
  type: 'sedan',
  height_cm: '',
  is_electric: false,
  is_default: false,
}

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_id', user.id)
        .single()

      if (!dbUser) { setLoading(false); return }

      setDbUserId(dbUser.id)

      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', dbUser.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      setVehicles(data ?? [])
    } catch {
      // Silently ignore
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadVehicles()
  }, [loadVehicles])

  async function handleDelete(vehicleId: string) {
    Alert.alert(
      'Supprimer le vehicule',
      'Voulez-vous vraiment supprimer ce vehicule ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
            if (error) {
              Alert.alert('Erreur', error.message)
            } else {
              setVehicles((prev) => prev.filter((v) => v.id !== vehicleId))
            }
          },
        },
      ]
    )
  }

  async function handleSetDefault(vehicleId: string) {
    if (!dbUserId) return
    // Unset all defaults for this user first
    await supabase.from('vehicles').update({ is_default: false }).eq('user_id', dbUserId)
    await supabase.from('vehicles').update({ is_default: true }).eq('id', vehicleId)
    setVehicles((prev) =>
      prev.map((v) => ({ ...v, is_default: v.id === vehicleId }))
    )
  }

  async function handleAddVehicle() {
    if (!dbUserId) return
    const plate = form.license_plate.trim().toUpperCase()
    const brand = form.brand.trim()
    const model = form.model.trim()

    if (!plate || !brand || !model) {
      Alert.alert('Erreur', 'La plaque, la marque et le modele sont obligatoires.')
      return
    }

    setSaving(true)

    // If setting as default, unset others
    if (form.is_default) {
      await supabase.from('vehicles').update({ is_default: false }).eq('user_id', dbUserId)
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        user_id: dbUserId,
        license_plate: plate,
        brand,
        model,
        color: form.color.trim() || null,
        type: form.type,
        height_cm: form.height_cm ? parseInt(form.height_cm, 10) : null,
        is_electric: form.is_electric,
        is_default: form.is_default,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      Alert.alert('Erreur', error.message)
    } else if (data) {
      setVehicles((prev) => {
        const updated = form.is_default ? prev.map((v) => ({ ...v, is_default: false })) : prev
        return [data, ...updated]
      })
      setShowAdd(false)
      setForm(EMPTY_FORM)
    }
  }

  const typeLabel = VEHICLE_TYPES.find((t) => t.key === form.type)?.label ?? 'Berline'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color={COLORS.dark} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes vehicules</Text>
        <TouchableOpacity
          style={styles.addIconBtn}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.7}
        >
          <Plus color={COLORS.primary} size={22} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Car color={COLORS.gray300} size={36} />
              </View>
              <Text style={styles.emptyTitle}>Aucun vehicule</Text>
              <Text style={styles.emptySubtitle}>
                Ajoutez votre vehicule pour faciliter vos reservations
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const typeObj = VEHICLE_TYPES.find((t) => t.key === item.type)
            return (
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleCardLeft}>
                  <View style={styles.vehicleIconWrap}>
                    <Car color={COLORS.primary} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.vehicleNameRow}>
                      <Text style={styles.vehicleName}>{item.brand} {item.model}</Text>
                      {item.is_default && (
                        <View style={styles.defaultBadge}>
                          <Star color={COLORS.warning} size={11} fill={COLORS.warning} />
                          <Text style={styles.defaultBadgeText}>Par defaut</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.vehiclePlate}>{item.license_plate}</Text>
                    <View style={styles.vehicleMeta}>
                      {typeObj && (
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{typeObj.label}</Text>
                        </View>
                      )}
                      {item.is_electric && (
                        <View style={[styles.typeBadge, { backgroundColor: COLORS.successLight }]}>
                          <Zap color={COLORS.success} size={10} fill={COLORS.success} />
                          <Text style={[styles.typeBadgeText, { color: COLORS.success }]}>Electrique</Text>
                        </View>
                      )}
                      {item.color ? (
                        <Text style={styles.vehicleColor}>{item.color}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
                <View style={styles.vehicleActions}>
                  {!item.is_default && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleSetDefault(item.id)}
                      activeOpacity={0.7}
                    >
                      <Star color={COLORS.gray400} size={18} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 color={COLORS.danger} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.8}
            >
              <Plus color={COLORS.primary} size={20} />
              <Text style={styles.addBtnText}>Ajouter un vehicule</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* Add Vehicle Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
              activeOpacity={0.7}
            >
              <X color={COLORS.dark} size={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ajouter un vehicule</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* License plate */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Plaque d'immatriculation *</Text>
              <TextInput
                style={styles.input}
                value={form.license_plate}
                onChangeText={(v) => setForm((f) => ({ ...f, license_plate: v }))}
                placeholder="AB-123-CD"
                placeholderTextColor={COLORS.gray400}
                autoCapitalize="characters"
              />
            </View>

            {/* Brand + Model */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Marque *</Text>
                <TextInput
                  style={styles.input}
                  value={form.brand}
                  onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))}
                  placeholder="Renault"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Modele *</Text>
                <TextInput
                  style={styles.input}
                  value={form.model}
                  onChangeText={(v) => setForm((f) => ({ ...f, model: v }))}
                  placeholder="Clio"
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
            </View>

            {/* Color */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Couleur</Text>
              <TextInput
                style={styles.input}
                value={form.color}
                onChangeText={(v) => setForm((f) => ({ ...f, color: v }))}
                placeholder="Blanc, Noir, Rouge..."
                placeholderTextColor={COLORS.gray400}
              />
            </View>

            {/* Type picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type de vehicule</Text>
              <TouchableOpacity
                style={[styles.input, styles.pickerBtn]}
                onPress={() => setShowTypePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 15, color: COLORS.dark }}>{typeLabel}</Text>
                <ChevronDown color={COLORS.gray400} size={18} />
              </TouchableOpacity>
            </View>

            {/* Height */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hauteur du vehicule (cm)</Text>
              <TextInput
                style={styles.input}
                value={form.height_cm}
                onChangeText={(v) => setForm((f) => ({ ...f, height_cm: v }))}
                placeholder="150"
                placeholderTextColor={COLORS.gray400}
                keyboardType="numeric"
              />
            </View>

            {/* Toggles */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Vehicule electrique</Text>
                  <Text style={styles.toggleDesc}>Affiche les places avec recharge EV</Text>
                </View>
                <Switch
                  value={form.is_electric}
                  onValueChange={(v) => setForm((f) => ({ ...f, is_electric: v }))}
                  trackColor={{ false: COLORS.gray300, true: COLORS.success }}
                  thumbColor={COLORS.white}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Vehicule par defaut</Text>
                  <Text style={styles.toggleDesc}>Utilise automatiquement pour les reservations</Text>
                </View>
                <Switch
                  value={form.is_default}
                  onValueChange={(v) => setForm((f) => ({ ...f, is_default: v }))}
                  trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddVehicle}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} size="small" />
                : <Text style={styles.saveBtnText}>Ajouter le vehicule</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Type picker modal */}
      <Modal visible={showTypePicker} animationType="slide" presentationStyle="pageSheet" transparent>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Type de vehicule</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <X color={COLORS.dark} size={20} />
              </TouchableOpacity>
            </View>
            {VEHICLE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.pickerOption, form.type === t.key && styles.pickerOptionActive]}
                onPress={() => { setForm((f) => ({ ...f, type: t.key })); setShowTypePicker(false) }}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerOptionText, form.type === t.key && { color: COLORS.primary, fontWeight: '700' }]}>
                  {t.label}
                </Text>
                {form.type === t.key && (
                  <View style={styles.pickerCheckDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },

  // Vehicle cards
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  vehicleCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.warningLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.warning,
  },
  vehiclePlate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray500,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  vehicleColor: {
    fontSize: 11,
    color: COLORS.gray400,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: COLORS.dangerLight,
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 6,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  formContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 48,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.dark,
    backgroundColor: COLORS.gray50,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  toggleDesc: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginHorizontal: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },

  // Type picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 16 },
    }),
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  pickerOptionText: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: '500',
  },
  pickerCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
})
