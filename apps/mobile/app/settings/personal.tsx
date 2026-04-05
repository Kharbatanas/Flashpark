import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ArrowLeft, User, Phone } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone_number: string | null
}

export default function PersonalInfoScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number')
        .eq('supabase_id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name ?? '')
        setPhone(data.phone_number ?? '')
      }
    } catch {
      // Silently ignore
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!profile) return
    const trimmedName = fullName.trim()
    if (!trimmedName) {
      Alert.alert('Erreur', 'Le nom ne peut pas etre vide.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        full_name: trimmedName,
        phone_number: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)
    if (error) {
      Alert.alert('Erreur', error.message)
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: trimmedName, phone_number: phone.trim() || null } : prev
      )
      Alert.alert('Succes', 'Vos informations ont ete mises a jour.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color={COLORS.dark} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informations personnelles</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card */}
          <View style={styles.card}>
            {/* Full name */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <User color={COLORS.primary} size={15} />
                <Text style={styles.labelText}>Nom complet</Text>
              </View>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom complet"
                placeholderTextColor={COLORS.gray400}
                autoCorrect={false}
              />
            </View>

            <View style={styles.divider} />

            {/* Email (read-only) */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Text style={[styles.labelText, { marginLeft: 0 }]}>Adresse email</Text>
              </View>
              <View style={[styles.input, styles.inputReadOnly]}>
                <Text style={styles.inputReadOnlyText}>{profile?.email ?? '-'}</Text>
              </View>
              <Text style={styles.fieldHint}>L'email ne peut pas etre modifie.</Text>
            </View>

            <View style={styles.divider} />

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabel}>
                <Phone color={COLORS.primary} size={15} />
                <Text style={styles.labelText}>Numero de telephone</Text>
              </View>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor={COLORS.gray400}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  fieldGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
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
  inputReadOnly: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
    justifyContent: 'center',
  },
  inputReadOnlyText: {
    fontSize: 15,
    color: COLORS.gray500,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.gray400,
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
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
})
