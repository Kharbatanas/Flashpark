import { useState, useEffect } from 'react'
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
