import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────

type SpotType = 'outdoor' | 'indoor' | 'garage' | 'covered' | 'underground'

interface FormState {
  type: SpotType | null
  address: string
  city: string
  latitude: string
  longitude: string
  title: string
  description: string
  amenities: string[]
  pricePerHour: string
  pricePerDay: string
  instantBook: boolean
  hasSmartGate: boolean
}

const TOTAL_STEPS = 4

const SPOT_TYPES: { value: SpotType; label: string; icon: string }[] = [
  { value: 'outdoor', label: 'Extérieur', icon: '☀️' },
  { value: 'indoor', label: 'Intérieur', icon: '🏢' },
  { value: 'garage', label: 'Garage', icon: '🏠' },
  { value: 'covered', label: 'Couvert', icon: '⛱️' },
  { value: 'underground', label: 'Souterrain', icon: '🚇' },
]

const AMENITY_LIST = [
  { key: 'lighting', label: 'Éclairage' },
  { key: 'security_camera', label: 'Caméra' },
  { key: 'covered', label: 'Couvert' },
  { key: 'ev_charging', label: 'Recharge EV' },
  { key: 'disabled_access', label: 'Accès PMR' },
  { key: '24h_access', label: '24h/24' },
]

const INITIAL: FormState = {
  type: null,
  address: '',
  city: 'Nice',
  latitude: '',
  longitude: '',
  title: '',
  description: '',
  amenities: [],
  pricePerHour: '',
  pricePerDay: '',
  instantBook: true,
  hasSmartGate: false,
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateStep(step: number, data: FormState): string | null {
  if (step === 1 && !data.type) return 'Sélectionnez un type de place'
  if (step === 2) {
    if (!data.address.trim()) return "L'adresse est requise"
    if (!data.city.trim()) return 'La ville est requise'
    if (!data.latitude || !data.longitude) return 'Les coordonnées GPS sont requises'
    if (isNaN(Number(data.latitude)) || isNaN(Number(data.longitude))) return 'Coordonnées GPS invalides'
  }
  if (step === 3 && data.title.trim().length < 5) return 'Le titre doit faire au moins 5 caractères'
  if (step === 4 && (!data.pricePerHour || Number(data.pricePerHour) <= 0)) return 'Le prix horaire est requis'
  return null
}

// ─── Step 1: Type ────────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: FormState; onChange: (type: SpotType) => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>Type de place</Text>
      <Text style={s.stepSub}>Quel type de parking proposez-vous ?</Text>
      <View style={s.typeGrid}>
        {SPOT_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[s.typeCard, data.type === t.value && s.typeCardActive]}
            onPress={() => onChange(t.value)}
          >
            <Text style={s.typeIcon}>{t.icon}</Text>
            <Text style={[s.typeLabel, data.type === t.value && s.typeLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

// ─── Step 2: Location ────────────────────────────────────────────────────────

function Step2({ data, onChange }: { data: FormState; onChange: (f: Partial<FormState>) => void }) {
  return (
    <View>
      <Text style={s.stepTitle}>Localisation</Text>
      <Text style={s.stepSub}>Adresse exacte de votre place</Text>

      <View style={s.fieldGroup}>
        <Text style={s.label}>Adresse complète *</Text>
        <TextInput
          style={s.input}
          value={data.address}
          onChangeText={(v) => onChange({ address: v })}
          placeholder="12 rue de la Paix, Nice"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.label}>Ville *</Text>
        <TextInput
          style={s.input}
          value={data.city}
          onChangeText={(v) => onChange({ city: v })}
          placeholder="Nice"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={s.row}>
        <View style={[s.fieldGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={s.label}>Latitude *</Text>
          <TextInput
            style={s.input}
            value={data.latitude}
            onChangeText={(v) => onChange({ latitude: v })}
            placeholder="43.7102"
            keyboardType="decimal-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={[s.fieldGroup, { flex: 1 }]}>
          <Text style={s.label}>Longitude *</Text>
          <TextInput
            style={s.input}
            value={data.longitude}
            onChangeText={(v) => onChange({ longitude: v })}
            placeholder="7.262"
            keyboardType="decimal-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {data.latitude && data.longitude && !isNaN(Number(data.latitude)) && (
        <View style={s.successBadge}>
          <Text style={s.successText}>
            ✓ Position : {Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  )
}

// ─── Step 3: Details ─────────────────────────────────────────────────────────

function Step3({ data, onChange }: { data: FormState; onChange: (f: Partial<FormState>) => void }) {
  function toggleAmenity(key: string) {
    const current = data.amenities
    onChange({
      amenities: current.includes(key) ? current.filter((a) => a !== key) : [...current, key],
    })
  }

  return (
    <View>
      <Text style={s.stepTitle}>Détails</Text>
      <Text style={s.stepSub}>Décrivez votre place</Text>

      <View style={s.fieldGroup}>
        <Text style={s.label}>Titre de l&apos;annonce *</Text>
        <TextInput
          style={s.input}
          value={data.title}
          onChangeText={(v) => onChange({ title: v })}
          placeholder="Place de parking sécurisée centre-ville"
          placeholderTextColor="#9CA3AF"
          maxLength={100}
        />
        <Text style={s.charCount}>{data.title.length}/100</Text>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.label}>Description</Text>
        <TextInput
          style={[s.input, s.textarea]}
          value={data.description}
          onChangeText={(v) => onChange({ description: v })}
          placeholder="Décrivez l'emplacement, l'accès..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={s.charCount}>{data.description.length}/500</Text>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.label}>Équipements</Text>
        <View style={s.amenityGrid}>
          {AMENITY_LIST.map((a) => {
            const selected = data.amenities.includes(a.key)
            return (
              <TouchableOpacity
                key={a.key}
                style={[s.amenityChip, selected && s.amenityChipActive]}
                onPress={() => toggleAmenity(a.key)}
              >
                <Text style={[s.amenityText, selected && s.amenityTextActive]}>{a.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Smart Gate</Text>
        <Switch
          value={data.hasSmartGate}
          onValueChange={(v) => onChange({ hasSmartGate: v })}
          trackColor={{ false: '#D1D5DB', true: '#0540FF' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  )
}

// ─── Step 4: Pricing ─────────────────────────────────────────────────────────

function Step4({ data, onChange }: { data: FormState; onChange: (f: Partial<FormState>) => void }) {
  const netPerHour = data.pricePerHour ? (Number(data.pricePerHour) * 0.95).toFixed(2).replace('.', ',') : '—'

  return (
    <View>
      <Text style={s.stepTitle}>Tarification</Text>
      <Text style={s.stepSub}>Fixez vos prix et préférences</Text>

      <View style={s.fieldGroup}>
        <Text style={s.label}>Prix à l&apos;heure (€) *</Text>
        <TextInput
          style={s.input}
          value={data.pricePerHour}
          onChangeText={(v) => onChange({ pricePerHour: v })}
          placeholder="3.50"
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={s.hint}>Vous recevez {netPerHour} €/h après frais (5 %)</Text>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.label}>Prix à la journée (€) — optionnel</Text>
        <TextInput
          style={s.input}
          value={data.pricePerDay}
          onChangeText={(v) => onChange({ pricePerDay: v })}
          placeholder="25"
          keyboardType="decimal-pad"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={s.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.switchLabel}>Réservation instantanée</Text>
          <Text style={s.switchSub}>Les conducteurs réservent sans approbation</Text>
        </View>
        <Switch
          value={data.instantBook}
          onValueChange={(v) => onChange({ instantBook: v })}
          trackColor={{ false: '#D1D5DB', true: '#0540FF' }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewListingScreen() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(fields: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...fields }))
    setError(null)
  }

  function handleNext() {
    const err = validateStep(step, form)
    if (err) { setError(err); return }
    setError(null)
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

    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('supabase_id', user.id)
        .single()
      if (!dbUser) throw new Error('Profil introuvable')

      const { error: insertError } = await supabase.from('spots').insert({
        host_id: dbUser.id,
        title: form.title,
        description: form.description || null,
        address: form.address,
        city: form.city,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        price_per_hour: Number(form.pricePerHour),
        price_per_day: form.pricePerDay ? Number(form.pricePerDay) : null,
        type: form.type,
        status: 'pending_review',
        has_smart_gate: form.hasSmartGate,
        amenities: form.amenities,
        instant_book: form.instantBook,
      })

      if (insertError) throw new Error(insertError.message)

      Alert.alert(
        'Annonce soumise !',
        'Votre annonce est en cours de révision. Elle sera publiée sous 24h.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.backText}>‹ {step === 1 ? 'Annuler' : 'Retour'}</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nouvelle annonce</Text>
          <Text style={s.stepCount}>{step}/{TOTAL_STEPS}</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress}%` as any }]} />
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && <Step1 data={form} onChange={(v) => update({ type: v })} />}
          {step === 2 && <Step2 data={form} onChange={update} />}
          {step === 3 && <Step3 data={form} onChange={update} />}
          {step === 4 && <Step4 data={form} onChange={update} />}

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer navigation */}
        <View style={s.footer}>
          {step < TOTAL_STEPS ? (
            <TouchableOpacity style={s.primaryBtn} onPress={handleNext}>
              <Text style={s.primaryBtnText}>Suivant →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.primaryBtn, s.submitBtn, submitting && s.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.primaryBtnText}>Publier l&apos;annonce ✓</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {},
  backText: { color: '#0540FF', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  stepCount: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  progressTrack: { height: 3, backgroundColor: '#E5E7EB' },
  progressFill: { height: 3, backgroundColor: '#0540FF' },
  scrollContent: { padding: 20, paddingBottom: 32 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  stepSub: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  // Type selector
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  typeCardActive: { borderColor: '#0540FF', backgroundColor: '#EFF6FF' },
  typeIcon: { fontSize: 28, marginBottom: 8 },
  typeLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  typeLabelActive: { color: '#0540FF' },
  // Fields
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A2E',
  },
  textarea: { height: 96, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  row: { flexDirection: 'row' },
  successBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  successText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  // Amenities
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  amenityChipActive: { borderColor: '#0540FF', backgroundColor: '#EFF6FF' },
  amenityText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  amenityTextActive: { color: '#0540FF' },
  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    marginBottom: 12,
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  switchSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  errorText: { fontSize: 13, color: '#DC2626', fontWeight: '500' },
  // Footer
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 16,
  },
  primaryBtn: {
    backgroundColor: '#0540FF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtn: { backgroundColor: '#10B981' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
})
