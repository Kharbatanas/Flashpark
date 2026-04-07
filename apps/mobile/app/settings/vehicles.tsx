import { useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView,
  StyleSheet, Switch, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Plus, Car, Star, Trash2, Zap, X, ChevronDown } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppInput } from '../../src/design-system/components/atoms/AppInput'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { EmptyState } from '../../src/design-system/components/molecules/EmptyState'
import { VehicleCard } from '../../src/design-system/components/molecules/VehicleCard'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { useVehicles, useCreateVehicle, useDeleteVehicle, useUpdateVehicle } from '../../src/api/hooks/useVehicles'

type VehicleType = 'car' | 'truck' | 'motorcycle' | 'other'
type SizeCategory = 'compact' | 'standard' | 'large' | 'xl'

const VEHICLE_TYPES: { key: VehicleType; label: string }[] = [
  { key: 'car', label: 'Voiture' },
  { key: 'truck', label: 'Camionnette' },
  { key: 'motorcycle', label: 'Moto' },
  { key: 'other', label: 'Autre' },
]

interface AddForm {
  license_plate: string; brand: string; model: string; color: string
  type: VehicleType; width: string; length: string; height: string
  size_category: SizeCategory; is_electric: boolean; is_default: boolean
}
const EMPTY_FORM: AddForm = {
  license_plate: '', brand: '', model: '', color: '',
  type: 'car', width: '', length: '', height: '',
  size_category: 'standard', is_electric: false, is_default: false,
}

export default function VehiclesScreen() {
  const { colors } = useTheme()
  const { data: vehicles = [], isLoading, refetch, isRefetching } = useVehicles()
  const createMutation = useCreateVehicle()
  const deleteMutation = useDeleteVehicle()
  const updateMutation = useUpdateVehicle()
  const [showAdd, setShowAdd] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)

  function updateForm(fields: Partial<AddForm>) { setForm((p) => ({ ...p, ...fields })) }

  async function handleAdd() {
    const plate = form.license_plate.trim().toUpperCase()
    if (!plate || !form.brand.trim()) {
      Alert.alert('Erreur', 'La plaque et la marque sont obligatoires.')
      return
    }
    try {
      await createMutation.mutateAsync({
        license_plate: plate,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        color: form.color.trim() || undefined,
        type: form.type as any,
        width: form.width ? Number(form.width) : undefined,
        length: form.length ? Number(form.length) : undefined,
        height: form.height ? Number(form.height) : undefined,
        size_category: form.size_category as any,
        is_electric: form.is_electric,
        is_default: form.is_default,
      })
      setShowAdd(false)
      setForm(EMPTY_FORM)
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d ajouter le vehicule.')
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce vehicule ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await deleteMutation.mutateAsync(id) }
        catch (e) { Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible.') }
      }},
    ])
  }

  async function handleSetDefault(id: string) {
    try { await updateMutation.mutateAsync({ id, is_default: true }) }
    catch (e) { Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible.') }
  }

  const typeLabel = VEHICLE_TYPES.find((t) => t.key === form.type)?.label ?? 'Voiture'

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Fermer">
          <AppText variant="callout" color={colors.primary}>Fermer</AppText>
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Mes vehicules</AppText>
        <TouchableOpacity
          style={[styles.addIconBtn, { backgroundColor: colors.primaryMuted }]}
          onPress={() => setShowAdd(true)}
          accessibilityLabel="Ajouter un vehicule"
        >
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={Car}
              title="Aucun vehicule"
              subtitle="Ajoutez votre vehicule pour faciliter vos reservations"
              actionLabel="Ajouter un vehicule"
              onAction={() => setShowAdd(true)}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.vehicleRow}>
              <View style={{ flex: 1 }}>
                <VehicleCard
                  vehicle={{
                    id: item.id,
                    plate: item.license_plate,
                    brand: item.brand ?? undefined,
                    model: item.model ?? undefined,
                    type: item.type as any,
                    width: item.width != null ? parseFloat(item.width) : undefined,
                    length: item.length != null ? parseFloat(item.length) : undefined,
                    height: item.height != null ? parseFloat(item.height) : undefined,
                  }}
                />
              </View>
              <View style={styles.vehicleActions}>
                {!item.is_default && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.borderLight }]}
                    onPress={() => handleSetDefault(item.id)}
                    accessibilityLabel="Definir comme vehicule par defaut"
                  >
                    <Star size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.dangerMuted }]}
                  onPress={() => handleDelete(item.id)}
                  accessibilityLabel="Supprimer ce vehicule"
                >
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={
            vehicles.length > 0 ? (
              <TouchableOpacity
                style={[styles.addBtn, { borderColor: colors.primary }]}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.8}
                accessibilityLabel="Ajouter un vehicule"
              >
                <Plus size={18} color={colors.primary} />
                <AppText variant="callout" color={colors.primary}>Ajouter un vehicule</AppText>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.borderLight }]}
              onPress={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
              accessibilityLabel="Fermer"
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
            <AppText variant="headline" color={colors.text}>Ajouter un vehicule</AppText>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AppInput label="Plaque d immatriculation *" value={form.license_plate}
              onChangeText={(v) => updateForm({ license_plate: v })} placeholder="AB-123-CD"
              autoCapitalize="characters" accessibilityLabel="Plaque d immatriculation" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppInput label="Marque *" value={form.brand} onChangeText={(v) => updateForm({ brand: v })} placeholder="Renault" accessibilityLabel="Marque" />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Modele" value={form.model} onChangeText={(v) => updateForm({ model: v })} placeholder="Clio" accessibilityLabel="Modele" />
              </View>
            </View>
            <AppInput label="Couleur" value={form.color} onChangeText={(v) => updateForm({ color: v })} placeholder="Blanc, Noir..." accessibilityLabel="Couleur" />

            <View>
              <AppText variant="caption1" color={colors.textSecondary} style={styles.inputLabel}>Type de vehicule</AppText>
              <TouchableOpacity
                style={[styles.pickerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setShowTypePicker(true)} accessibilityLabel="Type de vehicule"
              >
                <AppText variant="callout" color={colors.text}>{typeLabel}</AppText>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppInput label="Largeur (m)" value={form.width} onChangeText={(v) => updateForm({ width: v })} placeholder="1.8" keyboardType="decimal-pad" accessibilityLabel="Largeur" />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Longueur (m)" value={form.length} onChangeText={(v) => updateForm({ length: v })} placeholder="4.5" keyboardType="decimal-pad" accessibilityLabel="Longueur" />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label="Hauteur (m)" value={form.height} onChangeText={(v) => updateForm({ height: v })} placeholder="1.5" keyboardType="decimal-pad" accessibilityLabel="Hauteur" />
              </View>
            </View>

            <View style={[styles.toggleCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="callout" color={colors.text}>Vehicule electrique</AppText>
                  <AppText variant="caption1" color={colors.textSecondary}>Affiche les places avec recharge EV</AppText>
                </View>
                <Switch value={form.is_electric} onValueChange={(v) => updateForm({ is_electric: v })}
                  trackColor={{ false: colors.border, true: colors.success }} thumbColor={colors.surface} />
              </View>
              <View style={[styles.toggleDivider, { backgroundColor: colors.borderLight }]} />
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="callout" color={colors.text}>Vehicule par defaut</AppText>
                  <AppText variant="caption1" color={colors.textSecondary}>Utilise automatiquement pour les reservations</AppText>
                </View>
                <Switch value={form.is_default} onValueChange={(v) => updateForm({ is_default: v })}
                  trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
              </View>
            </View>

            <AppButton title="Ajouter le vehicule" onPress={handleAdd} variant="primary" size="lg" loading={createMutation.isPending} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showTypePicker} animationType="slide" transparent>
        <TouchableOpacity style={styles.pickerOverlay} onPress={() => setShowTypePicker(false)} activeOpacity={1}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <AppText variant="headline" color={colors.text}>Type de vehicule</AppText>
              <TouchableOpacity onPress={() => setShowTypePicker(false)} accessibilityLabel="Fermer">
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            {VEHICLE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.pickerOption, { borderBottomColor: colors.borderLight }, form.type === t.key && { backgroundColor: colors.primaryMuted }]}
                onPress={() => { updateForm({ type: t.key }); setShowTypePicker(false) }}
                accessibilityLabel={t.label}
              >
                <AppText variant="callout" color={form.type === t.key ? colors.primary : colors.text}>{t.label}</AppText>
                {form.type === t.key && <View style={[styles.checkDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing[4], gap: spacing[3], flexGrow: 1 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  vehicleActions: { flexDirection: 'row', gap: spacing[2] },
  actionBtn: { width: 36, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: radii.lg, paddingVertical: spacing[4], marginTop: spacing[2],
  },
  modal: { flex: 1 },
  formContent: { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[12] },
  row: { flexDirection: 'row', gap: spacing[3] },
  inputLabel: { marginBottom: spacing[1] },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderRadius: radii.md, paddingHorizontal: spacing[3], height: 48,
  },
  toggleCard: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3] },
  toggleDivider: { height: 1, marginHorizontal: spacing[4] },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1,
  },
  checkDot: { width: 8, height: 8, borderRadius: 4 },
})
