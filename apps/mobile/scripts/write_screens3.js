/* eslint-disable */
const fs = require('fs');
const path = require('path');
const base = path.resolve(__dirname, '..');
function w(relPath, content) {
  const full = path.join(base, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('wrote', relPath);
}

// ──────────────────────────────────────────────────────────────
// notifications.tsx
// ──────────────────────────────────────────────────────────────
w('app/notifications.tsx', `import { StyleSheet, FlatList, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { ScreenContainer } from '../src/design-system/components/layout'
import { AppText } from '../src/design-system/components/atoms/AppText'
import { EmptyState } from '../src/design-system/components/molecules/EmptyState'
import { NotificationRow } from '../src/design-system/components/organisms/NotificationRow'
import { useTheme } from '../src/design-system/theme/useTheme'
import { spacing } from '../src/design-system/tokens/spacing'
import { useNotifications, useMarkAllRead } from '../src/api/hooks/useNotifications'
import { useRealtimeNotifications } from '../src/api/subscriptions'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { notificationKeys } from '../src/api/hooks/useNotifications'
import { useAuthStore } from '../src/stores/authStore'

type NotifType = 'booking_confirmed' | 'booking_cancelled' | 'message' | 'review' | 'payment' | 'reminder' | 'alert' | 'general'

function mapType(t: string): NotifType {
  if (t === 'booking_new' || t === 'booking_confirmed') return 'booking_confirmed'
  if (t === 'booking_cancelled') return 'booking_cancelled'
  if (t === 'message_new') return 'message'
  if (t === 'booking_reminder') return 'reminder'
  return 'general'
}

export default function NotificationsScreen() {
  const { colors } = useTheme()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications()
  const markAllMutation = useMarkAllRead()

  useRealtimeNotifications()

  const unreadCount = notifications.filter((n) => !n.read_at).length

  async function handlePress(notif: typeof notifications[0]) {
    if (!notif.read_at && user) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notif.id)
      qc.invalidateQueries({ queryKey: notificationKeys.mine(user.id) })
      qc.invalidateQueries({ queryKey: notificationKeys.unread(user.id) })
    }
    if (notif.booking_id) { router.push('/booking/' + notif.booking_id as any) }
  }

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Retour">
          <AppText variant="callout" color={colors.primary}>Retour</AppText>
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Notifications</AppText>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            accessibilityLabel="Tout marquer comme lu"
          >
            <AppText variant="callout" color={colors.primary}>Tout lire</AppText>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Bell}
              title="Aucune notification"
              subtitle="Vous serez notifie des mises a jour de vos reservations"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <NotificationRow
            type={mapType(item.type)}
            title={item.title}
            body={item.body ?? ''}
            timestamp={item.created_at}
            isRead={item.read_at != null}
            onPress={() => handlePress(item)}
          />
        )}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 60 },
  spacer: { minWidth: 60 },
  list: { flexGrow: 1 },
})
`);

// ──────────────────────────────────────────────────────────────
// settings/personal.tsx
// ──────────────────────────────────────────────────────────────
w('app/settings/personal.tsx', `import { useState, useEffect } from 'react'
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { User, Phone } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppInput } from '../../src/design-system/components/atoms/AppInput'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { MenuCard } from '../../src/design-system/components/molecules/MenuCard'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { useCurrentUser } from '../../src/api/hooks/useAuth'
import { useAuthStore } from '../../src/stores/authStore'
import { supabase } from '../../lib/supabase'

export default function PersonalInfoScreen() {
  const { colors } = useTheme()
  const user = useCurrentUser()
  const { refreshUser } = useAuthStore()

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [phone, setPhone] = useState(user?.phone_number ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '')
      setPhone(user.phone_number ?? '')
    }
  }, [user?.id])

  if (!user) {
    return (
      <ScreenContainer>
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      </ScreenContainer>
    )
  }

  async function handleSave() {
    const trimmedName = fullName.trim()
    if (!trimmedName) { Alert.alert('Erreur', 'Le nom ne peut pas etre vide.'); return }
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({ full_name: trimmedName, phone_number: phone.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', user!.id)
    setSaving(false)
    if (error) {
      Alert.alert('Erreur', error.message)
    } else {
      await refreshUser()
      Alert.alert('Succes', 'Vos informations ont ete mises a jour.', [{ text: 'OK', onPress: () => router.back() }])
    }
  }

  return (
    <ScreenContainer scroll edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Fermer">
          <AppText variant="callout" color={colors.primary}>Fermer</AppText>
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Informations personnelles</AppText>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={[styles.avatarWrap, { backgroundColor: colors.primaryMuted }]}>
          <User size={40} color={colors.primary} strokeWidth={1.5} />
        </View>
        <TouchableOpacity accessibilityLabel="Changer la photo de profil">
          <AppText variant="callout" color={colors.primary} style={styles.centered}>Changer la photo</AppText>
        </TouchableOpacity>

        <View style={styles.form}>
          <AppInput
            label="Nom complet"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Votre nom complet"
            autoCorrect={false}
            autoCapitalize="words"
            accessibilityLabel="Nom complet"
          />
          <View style={[styles.readonlyField, { backgroundColor: colors.borderLight, borderRadius: radii.md, borderColor: colors.border }]}>
            <AppText variant="caption1" color={colors.textSecondary} style={styles.readonlyLabel}>ADRESSE EMAIL</AppText>
            <AppText variant="body" color={colors.textSecondary}>{user.email}</AppText>
            <AppText variant="caption2" color={colors.textTertiary}>L email ne peut pas etre modifie.</AppText>
          </View>
          <AppInput
            label="Numero de telephone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+33 6 12 34 56 78"
            keyboardType="phone-pad"
            accessibilityLabel="Numero de telephone"
          />
        </View>

        <AppButton
          title="Enregistrer les modifications"
          onPress={handleSave}
          variant="primary"
          size="lg"
          loading={saving}
        />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spacer: { minWidth: 60 },
  content: { padding: spacing[4], gap: spacing[4] },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
  form: { gap: spacing[3] },
  readonlyField: { padding: spacing[3], gap: 4, borderWidth: 1.5 },
  readonlyLabel: { letterSpacing: 0.5 },
})
`);

// ──────────────────────────────────────────────────────────────
// settings/vehicles.tsx
// ──────────────────────────────────────────────────────────────
w('app/settings/vehicles.tsx', `import { useState } from 'react'
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
                    plate: item.license_plate ?? '',
                    brand: item.brand,
                    model: item.model,
                    type: item.type as any,
                    width: item.width_cm ? item.width_cm / 100 : undefined,
                    length: item.length_cm ? item.length_cm / 100 : undefined,
                    height: item.height_cm ? item.height_cm / 100 : undefined,
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
`);

// ──────────────────────────────────────────────────────────────
// help/index.tsx
// ──────────────────────────────────────────────────────────────
w('app/help/index.tsx', `import { useState } from 'react'
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { HelpCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { SectionHeader } from '../../src/design-system/components/layout/SectionHeader'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { MenuCard } from '../../src/design-system/components/molecules/MenuCard'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { shadows } from '../../src/design-system/tokens/shadows'

interface FAQItem { question: string; answer: string }

const FAQ: FAQItem[] = [
  { question: 'Comment reserver une place ?', answer: 'Recherchez une place via Recherche ou la carte. Selectionnez une place, choisissez vos dates et heures, puis confirmez. Vous recevrez une confirmation par notification et email.' },
  { question: 'Comment fonctionne le paiement ?', answer: 'Le paiement est securise par Stripe. Vos coordonnees bancaires ne sont jamais stockees sur nos serveurs. Une commission de 20 % est prelevee sur chaque transaction.' },
  { question: 'Comment annuler une reservation ?', answer: 'Accedez a Reservations, selectionnez la reservation concernee, puis appuyez sur Annuler. Les conditions dependent de la politique choisie.' },
  { question: 'Comment devenir hote ?', answer: 'Rendez-vous dans votre profil et appuyez sur Devenir hote. Vous devrez renseigner les details de votre place, puis soumettre votre annonce pour validation sous 24h.' },
  { question: 'Comment fonctionne le Smart Gate ?', answer: 'Le Smart Gate est une barriere connectee qui s ouvre automatiquement via un QR code unique genere dans l application.' },
  { question: 'Comment contacter le support ?', answer: 'Notre equipe support est disponible du lundi au vendredi de 9h a 18h. Ecrivez-nous a support@flashpark.fr. Nous repondons sous 24h.' },
]

function AccordionItem({ item }: { item: FAQItem }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <TouchableOpacity
      style={[styles.accordion, { backgroundColor: colors.surface, borderColor: open ? colors.primary : colors.border }]}
      onPress={() => setOpen((p) => !p)}
      activeOpacity={0.75}
      accessibilityLabel={item.question}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={styles.accordionHeader}>
        <AppText variant="callout" color={open ? colors.primary : colors.text} style={{ flex: 1 }}>{item.question}</AppText>
        {open
          ? <ChevronUp size={18} color={colors.primary} strokeWidth={2.5} />
          : <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.5} />
        }
      </View>
      {open && (
        <AppText variant="callout" color={colors.textSecondary} style={styles.accordionAnswer}>{item.answer}</AppText>
      )}
    </TouchableOpacity>
  )
}

export default function HelpScreen() {
  const { colors } = useTheme()

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Retour">
          <AppText variant="callout" color={colors.primary}>Retour</AppText>
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Centre d aide</AppText>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '20' }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
            <HelpCircle size={28} color={colors.primary} strokeWidth={2} />
          </View>
          <AppText variant="title3" color={colors.text} style={styles.centered}>Comment pouvons-nous vous aider ?</AppText>
          <AppText variant="callout" color={colors.textSecondary} style={styles.centered}>Trouvez des reponses aux questions frequentes ci-dessous</AppText>
        </View>

        <SectionHeader title="Questions frequentes" />
        <View style={styles.faqList}>
          {FAQ.map((item, i) => <AccordionItem key={i} item={item} />)}
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.sm }]}>
          <View style={styles.contactHeader}>
            <Mail size={20} color={colors.primary} strokeWidth={2} />
            <AppText variant="title3" color={colors.text}>Besoin d aide ?</AppText>
          </View>
          <AppText variant="callout" color={colors.textSecondary}>
            Vous ne trouvez pas la reponse ? Notre equipe est la pour vous.
          </AppText>
          <AppButton
            title="support@flashpark.fr"
            onPress={() => Linking.openURL('mailto:support@flashpark.fr')}
            variant="primary"
            size="md"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spacer: { minWidth: 60 },
  content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
  hero: { borderWidth: 1, borderRadius: radii.xl, padding: spacing[6], alignItems: 'center', gap: spacing[2] },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[1] },
  centered: { textAlign: 'center' },
  faqList: { gap: spacing[3] },
  accordion: { borderWidth: 1.5, borderRadius: radii.lg, padding: spacing[4] },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  accordionAnswer: { marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: 'rgba(5,64,255,0.15)', lineHeight: 22 },
  contactCard: { borderWidth: 1, borderRadius: radii.xl, padding: spacing[5], gap: spacing[3] },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
})
`);

console.log('notifications.tsx, personal.tsx, vehicles.tsx, help/index.tsx written');
