import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppInput } from '../../src/design-system/components/atoms/AppInput'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { SegmentedControl } from '../../src/design-system/components/molecules/SegmentedControl'
import { Toast } from '../../src/design-system/components/molecules/Toast'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { useAuthStore } from '../../src/stores/authStore'

type ToastState = { visible: boolean; message: string; type: 'error' | 'success' | 'info' }
const INITIAL_TOAST: ToastState = { visible: false, message: '', type: 'info' }

export default function LoginScreen() {
  const { colors } = useTheme()
  const { signInWithEmail, signUp, signInWithGoogle, signInWithMagicLink } = useAuthStore()
  const [modeIndex, setModeIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [magicEmail, setMagicEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>(INITIAL_TOAST)
  const isLogin = modeIndex === 0

  function showToast(message: string, type: ToastState['type'] = 'error') {
    setToast({ visible: true, message, type })
  }
  function dismissToast() { setToast((p) => ({ ...p, visible: false })) }

  function validate(): string | null {
    if (!email.trim()) return 'Veuillez entrer votre adresse email.'
    if (!password.trim()) return 'Veuillez entrer votre mot de passe.'
    if (password.length < 6) return 'Le mot de passe doit avoir au moins 6 caracteres.'
    if (!isLogin && !fullName.trim()) return 'Veuillez entrer votre nom complet.'
    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { showToast(err); return }
    setLoading(true)
    try {
      if (isLogin) {
        await signInWithEmail(email.trim(), password)
        router.replace('/(tabs)/' as any)
      } else {
        await signUp(email.trim(), password, fullName.trim())
        showToast('Compte cree ! Verifiez vos emails pour confirmer.', 'success')
        setModeIndex(0)
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally { setLoading(false) }
  }

  async function handleGoogle() {
    setLoading(true)
    try { await signInWithGoogle() }
    catch (e) { showToast(e instanceof Error ? e.message : 'Connexion Google impossible.') }
    finally { setLoading(false) }
  }

  async function handleMagicLink() {
    if (!magicEmail.trim()) { showToast('Veuillez entrer votre email.'); return }
    setLoading(true)
    try {
      await signInWithMagicLink(magicEmail.trim())
      showToast('Lien de connexion envoye !', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Envoi impossible.')
    } finally { setLoading(false) }
  }

  return (
    <ScreenContainer scroll edges={['top', 'bottom']}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={dismissToast} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <AppText variant="largeTitle" style={{ color: colors.text }}>
              Flash<AppText variant="largeTitle" color={colors.primary}>park</AppText>
            </AppText>
            <AppText variant="callout" color={colors.textSecondary} style={styles.centered}>
              Trouvez votre parking en un eclair
            </AppText>
          </View>

          <SegmentedControl
            segments={['Connexion', 'Inscription']}
            selectedIndex={modeIndex}
            onChange={setModeIndex}
          />

          <View style={styles.form}>
            {!isLogin && (
              <AppInput label="Nom complet" value={fullName} onChangeText={setFullName}
                placeholder="Jean Dupont" autoCorrect={false} autoCapitalize="words"
                accessibilityLabel="Nom complet" />
            )}
            <AppInput label="Adresse email" value={email} onChangeText={setEmail}
              placeholder="vous@exemple.fr" keyboardType="email-address" autoCapitalize="none"
              autoComplete="email" accessibilityLabel="Adresse email" />
            <AppInput label="Mot de passe" value={password} onChangeText={setPassword}
              placeholder="Min. 6 caracteres" isPassword
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              accessibilityLabel="Mot de passe" />
            {isLogin && (
              <TouchableOpacity hitSlop={8} accessibilityLabel="Mot de passe oublie">
                <AppText variant="callout" color={colors.primary} style={styles.right}>
                  Mot de passe oublie ?
                </AppText>
              </TouchableOpacity>
            )}
            <AppButton
              title={isLogin ? 'Se connecter' : "S'inscrire"}
              onPress={handleSubmit} variant="primary" size="lg" loading={loading}
            />
          </View>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <AppText variant="caption1" color={colors.textTertiary}>ou continuer avec</AppText>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.oauthBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleGoogle} disabled={loading} activeOpacity={0.7}
            accessibilityLabel="Continuer avec Google"
          >
            <AppText variant="headline" style={styles.googleG}>G</AppText>
            <AppText variant="callout" color={colors.text}>Continuer avec Google</AppText>
          </TouchableOpacity>

          <View style={[styles.magic, { backgroundColor: colors.borderLight, borderRadius: radii.lg }]}>
            <AppText variant="callout" color={colors.textSecondary} style={styles.centered}>
              Recevoir un lien de connexion
            </AppText>
            <AppInput value={magicEmail} onChangeText={setMagicEmail}
              placeholder="votre@email.fr" keyboardType="email-address" autoCapitalize="none"
              accessibilityLabel="Email pour lien de connexion" />
            <AppButton title="Envoyer le lien" onPress={handleMagicLink}
              variant="outline" size="md" loading={loading} />
          </View>

          <AppText variant="caption2" color={colors.textTertiary} style={styles.centered}>
            En continuant, vous acceptez nos Conditions d utilisation et notre Politique de confidentialite.
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[8],
    gap: spacing[5],
  },
  logoWrap: { alignItems: 'center', gap: spacing[1] },
  centered: { textAlign: 'center' },
  right: { textAlign: 'right' },
  form: { gap: spacing[3] },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  line: { flex: 1, height: 1 },
  oauthBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], borderWidth: 1.5, borderRadius: radii.md, height: 48,
  },
  googleG: { color: '#4285F4' },
  magic: { padding: spacing[4], gap: spacing[3] },
})
