import { useState, useRef } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { Sun, Building2, Home, Umbrella, CircleParking } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { MAPBOX_TOKEN } from '../../lib/constants'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { useAuthStore } from '../../src/stores/authStore'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppInput } from '../../src/design-system/components/atoms/AppInput'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'

type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'
type SizeCategory = 'compact' | 'standard' | 'large' | 'xl'
type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

interface FormState {
  type: SpotType | null
  address: string; city: string; latitude: string; longitude: string
  title: string; description: string; amenities: string[]; photos: string[]
  hasSmartGate: boolean; instantBook: boolean
  pricePerHour: string; pricePerDay: string
  widthCm: string; lengthCm: string; maxHeightCm: string
  sizeCategory: SizeCategory; cancellationPolicy: CancellationPolicy
  accessInstructions: string; floor: string; spotNumber: string
  buildingCode: string; ownershipProofUrl: string
}

const TOTAL_STEPS = 5
const SPOT_TYPES: { value: SpotType; label: string; Icon: any }[] = [
  { value: 'outdoor', label: 'Exterieur', Icon: Sun },
  { value: 'indoor', label: 'Interieur', Icon: Building2 },
  { value: 'garage', label: 'Garage', Icon: Home },
  { value: 'covered', label: 'Couvert', Icon: Umbrella },
  { value: 'underground', label: 'Souterrain', Icon: CircleParking },
]
const AMENITY_LIST = [
  { key: 'lighting', label: 'Eclairage' },
  { key: 'security_camera', label: 'Camera' },
  { key: 'ev_charging', label: 'Recharge EV' },
  { key: 'disabled_access', label: 'Acces PMR' },
  { key: '24h_access', label: '24h/24' },
]
const SIZE_CATEGORIES: { value: SizeCategory; label: string }[] = [
  { value: 'compact', label: 'Compact (< 4.5m)' },
  { value: 'standard', label: 'Standard (4.5-5m)' },
  { value: 'large', label: 'Grand (5-6m)' },
  { value: 'xl', label: 'XL (> 6m)' },
]
const CANCELLATION_POLICIES: { value: CancellationPolicy; label: string; desc: string }[] = [
  { value: 'flexible', label: 'Flexible', desc: 'Remboursement 24h avant' },
  { value: 'moderate', label: 'Moderee', desc: 'Remboursement 5j avant' },
  { value: 'strict', label: 'Stricte', desc: 'Non remboursable' },
]
const INITIAL: FormState = {
  type: null, address: '', city: '', latitude: '', longitude: '',
  title: '', description: '', amenities: [], photos: [],
  hasSmartGate: false, instantBook: true,
  pricePerHour: '', pricePerDay: '',
  widthCm: '', lengthCm: '', maxHeightCm: '',
  sizeCategory: 'standard', cancellationPolicy: 'flexible',
  accessInstructions: '', floor: '', spotNumber: '', buildingCode: '', ownershipProofUrl: '',
}

function validateStep(step: number, d: FormState): string | null {
  if (step === 1 && !d.type) return 'Selectionnez un type de place'
  if (step === 2) {
    if (!d.address.trim()) return "L adresse est requise"
    if (!d.city.trim()) return 'La ville est requise'
    if (!d.latitude || !d.longitude) return 'Les coordonnees GPS sont requises'
  }
  if (step === 3 && d.title.trim().length < 5) return 'Le titre doit faire au moins 5 caracteres'
  if (step === 4 && (!d.pricePerHour || Number(d.pricePerHour) <= 0)) return 'Le prix horaire est requis'
  return null
}

interface StepProps { data: FormState; onChange: (f: Partial<FormState>) => void }

function Step1({ data, onChange }: StepProps) {
  const { colors } = useTheme()
  return (
    <View style={ss.stepBody}>
      <AppText variant="heading2" color={colors.text}>Type de place</AppText>
      <AppText variant="callout" color={colors.textSecondary}>Quel type de parking proposez-vous ?</AppText>
      <View style={ss.typeGrid}>
        {SPOT_TYPES.map((t) => {
          const active = data.type === t.value
          return (
            <TouchableOpacity
              key={t.value}
              style={[ss.typeCard, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryMuted : colors.surface }]}
              onPress={() => onChange({ type: t.value })}
              accessibilityLabel={t.label}
            >
              <t.Icon size={24} color={active ? colors.primary : colors.textSecondary} />
              <AppText variant="caption1" color={active ? colors.primary : colors.textSecondary}>{t.label}</AppText>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

interface MapboxFeature { place_name: string; center: [number, number]; context?: { id: string; text: string }[] }

function Step2({ data, onChange }: StepProps) {
  const { colors } = useTheme()
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [fetching, setFetching] = useState(false)
  const [locating, setLocating] = useState(false)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function fetchSuggestions(text: string) {
    if (debRef.current) clearTimeout(debRef.current)
    if (text.trim().length < 3 || !MAPBOX_TOKEN) { setSuggestions([]); return }
    debRef.current = setTimeout(async () => {
      setFetching(true)
      try {
        const r = await fetch(
          'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(text) + '.json?access_token=' + MAPBOX_TOKEN + '&country=fr&language=fr&types=address,place&limit=5'
        )
        const j = await r.json()
        setSuggestions(j.features ?? [])
      } catch { setSuggestions([]) }
      finally { setFetching(false) }
    }, 300)
  }

  function extractCity(f: MapboxFeature): string {
    const place = f.context?.find((c) => c.id.startsWith('place'))
    return place?.text ?? f.place_name.split(',')[0]
  }

  function handleSelect(f: MapboxFeature) {
    setSuggestions([])
    onChange({ address: f.place_name, city: extractCity(f), latitude: String(f.center[1]), longitude: String(f.center[0]) })
  }

  async function geolocate() {
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission refusee', 'Activez la localisation.'); return }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const { latitude, longitude } = loc.coords
      if (MAPBOX_TOKEN) {
        const r = await fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + longitude + ',' + latitude + '.json?access_token=' + MAPBOX_TOKEN + '&language=fr&limit=1')
        const j = await r.json()
        if (j.features?.[0]) { handleSelect(j.features[0]); return }
      }
      onChange({ latitude: String(latitude), longitude: String(longitude) })
    } catch { Alert.alert('Erreur', 'Impossible de recuperer votre position.') }
    finally { setLocating(false) }
  }

  return (
    <View style={ss.stepBody}>
      <AppText variant="heading2" color={colors.text}>Localisation</AppText>
      <AppText variant="callout" color={colors.textSecondary}>Adresse exacte de votre place</AppText>
      <View style={ss.fieldGroup}>
        <AppText variant="caption1" color={colors.textSecondary}>Adresse complete *</AppText>
        <TextInput
          style={[ss.rawInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          value={data.address}
          onChangeText={(v) => { onChange({ address: v }); fetchSuggestions(v) }}
          placeholder="Tapez une adresse en France..."
          placeholderTextColor={colors.textTertiary}
        />
        {fetching && <ActivityIndicator size="small" color={colors.primary} style={ss.loadingIndicator} />}
      </View>
      {suggestions.length > 0 && (
        <View style={[ss.suggestions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {suggestions.map((f, i) => (
            <TouchableOpacity key={i} style={[ss.suggestion, { borderBottomColor: colors.borderLight }]} onPress={() => handleSelect(f)}>
              <AppText variant="callout" color={colors.text} numberOfLines={2}>{f.place_name}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <AppInput label="Ville *" value={data.city} onChangeText={(v) => onChange({ city: v })} placeholder="Remplie automatiquement" />
      <TouchableOpacity onPress={geolocate} disabled={locating} style={ss.geoBtn}>
        {locating && <ActivityIndicator size="small" color={colors.primary} />}
        <AppText variant="callout" color={colors.primary}>Utiliser ma position</AppText>
      </TouchableOpacity>
      {data.latitude !== '' && data.longitude !== '' && (
        <View style={[ss.successBadge, { backgroundColor: colors.successMuted }]}>
          <AppText variant="caption1" color={colors.success}>
            Position : {Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)}
          </AppText>
        </View>
      )}
    </View>
  )
}

function Step3({ data, onChange }: StepProps) {
  const { colors } = useTheme()
  function toggleAmenity(key: string) {
    onChange({ amenities: data.amenities.includes(key) ? data.amenities.filter((a) => a !== key) : [...data.amenities, key] })
  }
  return (
    <View style={ss.stepBody}>
      <AppText variant="heading2" color={colors.text}>Details</AppText>
      <AppText variant="callout" color={colors.textSecondary}>Decrivez votre place</AppText>
      <AppInput label="Titre de l annonce *" value={data.title} onChangeText={(v) => onChange({ title: v })}
        placeholder="Place securisee centre-ville" maxLength={100} />
      <AppInput label="Description" value={data.description} onChangeText={(v) => onChange({ description: v })}
        placeholder="Acces, equipements..." maxLength={500} multiline numberOfLines={4} />
      <View>
        <AppText variant="caption1" color={colors.textSecondary} style={{ marginBottom: spacing[2] }}>Equipements</AppText>
        <View style={ss.chipRow}>
          {AMENITY_LIST.map((a) => {
            const sel = data.amenities.includes(a.key)
            return (
              <TouchableOpacity
                key={a.key}
                style={[ss.chip, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primaryMuted : colors.surface }]}
                onPress={() => toggleAmenity(a.key)}
                accessibilityLabel={a.label}
              >
                <AppText variant="caption1" color={sel ? colors.primary : colors.textSecondary}>{a.label}</AppText>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
      <View style={[ss.switchRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <AppText variant="callout" color={colors.text}>Smart Gate</AppText>
        <Switch value={data.hasSmartGate} onValueChange={(v) => onChange({ hasSmartGate: v })}
          trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
      </View>
    </View>
  )
}

function Step4({ data, onChange }: StepProps) {
  const { colors } = useTheme()
  const net = data.pricePerHour ? (Number(data.pricePerHour) * 0.95).toFixed(2) : '--'
  return (
    <View style={ss.stepBody}>
      <AppText variant="heading2" color={colors.text}>Tarification</AppText>
      <AppText variant="callout" color={colors.textSecondary}>Fixez vos prix et preferences</AppText>
      <AppInput label="Prix a l heure (EUR) *" value={data.pricePerHour} onChangeText={(v) => onChange({ pricePerHour: v })}
        placeholder="3.50" keyboardType="decimal-pad" helper={'Vous recevez ' + net + ' EUR/h apres frais (5 %)'} />
      <AppInput label="Prix a la journee (EUR) - optionnel" value={data.pricePerDay} onChangeText={(v) => onChange({ pricePerDay: v })}
        placeholder="25" keyboardType="decimal-pad" />
      <View style={[ss.switchRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="callout" color={colors.text}>Reservation instantanee</AppText>
          <AppText variant="caption1" color={colors.textSecondary}>Les conducteurs reservent sans approbation</AppText>
        </View>
        <Switch value={data.instantBook} onValueChange={(v) => onChange({ instantBook: v })}
          trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
      </View>
    </View>
  )
}

function Step5({ data, onChange }: StepProps) {
  const { colors } = useTheme()
  return (
    <View style={ss.stepBody}>
      <AppText variant="heading2" color={colors.text}>Dimensions et acces</AppText>
      <AppText variant="callout" color={colors.textSecondary}>Informations complementaires</AppText>
      <View style={ss.rowFields}>
        <View style={{ flex: 1 }}>
          <AppInput label="Largeur (cm)" value={data.widthCm} onChangeText={(v) => onChange({ widthCm: v })} placeholder="240" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput label="Longueur (cm)" value={data.lengthCm} onChangeText={(v) => onChange({ lengthCm: v })} placeholder="500" keyboardType="numeric" />
        </View>
      </View>
      <AppInput label="Hauteur maximale (cm)" value={data.maxHeightCm} onChangeText={(v) => onChange({ maxHeightCm: v })} placeholder="200" keyboardType="numeric" />
      <View>
        <AppText variant="caption1" color={colors.textSecondary} style={{ marginBottom: spacing[2] }}>Categorie de taille</AppText>
        {SIZE_CATEGORIES.map((s) => {
          const sel = data.sizeCategory === s.value
          return (
            <TouchableOpacity key={s.value}
              style={[ss.radioRow, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primaryMuted : colors.surface }]}
              onPress={() => onChange({ sizeCategory: s.value })} accessibilityLabel={s.label}
            >
              <View style={[ss.radio, { borderColor: sel ? colors.primary : colors.border }]}>
                {sel && <View style={[ss.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
              <AppText variant="callout" color={sel ? colors.primary : colors.text}>{s.label}</AppText>
            </TouchableOpacity>
          )
        })}
      </View>
      <View>
        <AppText variant="caption1" color={colors.textSecondary} style={{ marginBottom: spacing[2] }}>Politique d annulation</AppText>
        {CANCELLATION_POLICIES.map((p) => {
          const sel = data.cancellationPolicy === p.value
          return (
            <TouchableOpacity key={p.value}
              style={[ss.radioRow, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primaryMuted : colors.surface }]}
              onPress={() => onChange({ cancellationPolicy: p.value })} accessibilityLabel={p.label}
            >
              <View style={[ss.radio, { borderColor: sel ? colors.primary : colors.border }]}>
                {sel && <View style={[ss.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
              <View>
                <AppText variant="callout" color={sel ? colors.primary : colors.text}>{p.label}</AppText>
                <AppText variant="caption1" color={colors.textSecondary}>{p.desc}</AppText>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
      <AppInput label="Instructions d acces" value={data.accessInstructions} onChangeText={(v) => onChange({ accessInstructions: v })}
        placeholder="Code d entree, emplacement exact..." multiline numberOfLines={3} />
      <View style={ss.rowFields}>
        <View style={{ flex: 1 }}>
          <AppInput label="Etage" value={data.floor} onChangeText={(v) => onChange({ floor: v })} placeholder="-1" keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput label="N. de place" value={data.spotNumber} onChangeText={(v) => onChange({ spotNumber: v })} placeholder="A12" />
        </View>
      </View>
      <AppInput label="Code batiment" value={data.buildingCode} onChangeText={(v) => onChange({ buildingCode: v })} placeholder="1234" />
      <AppInput label="URL justificatif propriete" value={data.ownershipProofUrl} onChangeText={(v) => onChange({ ownershipProofUrl: v })}
        placeholder="https://..." keyboardType="url" autoCapitalize="none" />
    </View>
  )
}

export default function NewListingScreen() {
  const { colors } = useTheme()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(fields: Partial<FormState>) {
    setForm((p) => ({ ...p, ...fields }))
    setError(null)
  }

  function handleNext() {
    const err = validateStep(step, form)
    if (err) { setError(err); return }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setError(null)
    if (step === 1) { router.back(); return }
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    const err = validateStep(step, form)
    if (err) { setError(err); return }
    if (!user) { setError('Non authentifie'); return }
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('spots').insert({
        host_id: user.id, title: form.title, description: form.description || null,
        address: form.address, city: form.city,
        latitude: Number(form.latitude), longitude: Number(form.longitude),
        price_per_hour: Number(form.pricePerHour),
        price_per_day: form.pricePerDay ? Number(form.pricePerDay) : null,
        type: form.type, status: 'pending_review',
        has_smart_gate: form.hasSmartGate, amenities: form.amenities, instant_book: form.instantBook,
        width_cm: form.widthCm ? Number(form.widthCm) : null,
        length_cm: form.lengthCm ? Number(form.lengthCm) : null,
        max_height_cm: form.maxHeightCm ? Number(form.maxHeightCm) : null,
        size_category: form.sizeCategory, cancellation_policy: form.cancellationPolicy,
        access_instructions: form.accessInstructions || null,
        floor: form.floor || null, spot_number: form.spotNumber || null,
        building_code: form.buildingCode || null, ownership_proof_url: form.ownershipProofUrl || null,
      })
      if (insertError) throw new Error(insertError.message)
      Alert.alert('Annonce soumise !', 'Votre annonce est en cours de revision. Elle sera publiee sous 24h.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue')
    } finally { setSubmitting(false) }
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <SafeAreaView style={[ss.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[ss.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AppText variant="callout" color={colors.primary}>{step === 1 ? 'Annuler' : '< Retour'}</AppText>
          </TouchableOpacity>
          <AppText variant="headline" color={colors.text}>Nouvelle annonce</AppText>
          <AppText variant="caption1" color={colors.textTertiary}>{step}/{TOTAL_STEPS}</AppText>
        </View>
        <View style={[ss.progressTrack, { backgroundColor: colors.borderLight }]}>
          <View style={{ height: 3, width: (progress + '%') as any, backgroundColor: colors.primary }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={ss.scrollContent} keyboardShouldPersistTaps="handled">
          {step === 1 && <Step1 data={form} onChange={update} />}
          {step === 2 && <Step2 data={form} onChange={update} />}
          {step === 3 && <Step3 data={form} onChange={update} />}
          {step === 4 && <Step4 data={form} onChange={update} />}
          {step === 5 && <Step5 data={form} onChange={update} />}
          {error != null && (
            <View style={[ss.errorBox, { backgroundColor: colors.dangerMuted, borderColor: colors.danger + '40' }]}>
              <AppText variant="callout" color={colors.danger}>{error}</AppText>
            </View>
          )}
        </ScrollView>
        <View style={[ss.footer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          {step < TOTAL_STEPS ? (
            <AppButton title="Suivant" onPress={handleNext} variant="primary" size="lg" />
          ) : (
            <AppButton title="Publier l annonce" onPress={handleSubmit} variant="primary" size="lg" loading={submitting} disabled={submitting} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const ss = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1 },
  progressTrack: { height: 3 },
  scrollContent: { padding: spacing[5], paddingBottom: spacing[8] },
  stepBody: { gap: spacing[4] },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  typeCard: { width: '47%', borderWidth: 2, borderRadius: radii.lg, alignItems: 'center', paddingVertical: spacing[5], gap: spacing[2] },
  fieldGroup: { gap: spacing[1], position: 'relative' },
  rawInput: { borderWidth: 1.5, borderRadius: radii.md, paddingHorizontal: spacing[3], paddingVertical: spacing[3], fontSize: 15, minHeight: 48 },
  loadingIndicator: { position: 'absolute', right: 12, bottom: 12 },
  suggestions: { borderWidth: 1, borderRadius: radii.md, overflow: 'hidden', marginTop: -spacing[2] },
  suggestion: { padding: spacing[3], borderBottomWidth: 1 },
  geoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  successBadge: { borderRadius: radii.sm, padding: spacing[3] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { borderWidth: 1, borderRadius: radii.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[3], borderRadius: radii.md, borderWidth: 1 },
  rowFields: { flexDirection: 'row', gap: spacing[3] },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radii.md, borderWidth: 1, marginBottom: spacing[2] },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  errorBox: { borderWidth: 1, borderRadius: radii.md, padding: spacing[3], marginTop: spacing[2] },
  footer: { borderTopWidth: 1, padding: spacing[4] },
})
