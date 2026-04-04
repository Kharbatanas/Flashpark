import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

type AuthMode = 'login' | 'signup'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')

  async function handleEmailAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: email.split('@')[0] },
        },
      })
      setLoading(false)
      if (error) {
        Alert.alert('Erreur', error.message)
      } else {
        Alert.alert(
          'Compte créé !',
          'Vérifiez vos emails pour confirmer votre compte, ou connectez-vous directement.',
          [{ text: 'OK', onPress: () => setMode('login') }]
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        Alert.alert('Erreur', error.message)
      } else {
        router.replace('/(tabs)/')
      }
    }
  }

  async function handleGoogle() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'flashpark://auth/callback',
        skipBrowserRedirect: true,
      },
    })
    setLoading(false)
    if (error) {
      Alert.alert('Erreur', error.message)
    } else if (data?.url) {
      Linking.openURL(data.url)
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'flashpark://auth/callback' },
    })
    setLoading(false)
    if (error) {
      Alert.alert('Erreur', error.message)
    } else {
      Alert.alert('Lien envoyé !', `Consultez votre boîte mail ${email}`)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.logo}>
          Flash<Text style={styles.logoPrimary}>park</Text>
        </Text>
        <Text style={styles.tagline}>Trouvez votre parking en un éclair</Text>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>
              Connexion
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
              Inscription
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Adresse email</Text>
          <TextInput
            style={styles.input}
            placeholder="vous@exemple.fr"
            placeholderTextColor={COLORS.gray400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.gray400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Se connecter' : "S'inscrire"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continuer avec Google</Text>
          </TouchableOpacity>

          {/* Magic link */}
          <TouchableOpacity
            onPress={handleMagicLink}
            disabled={loading}
          >
            <Text style={styles.magicLinkText}>Recevoir un lien magique par email</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          En continuant, vous acceptez nos Conditions d&apos;utilisation et notre Politique de
          confidentialité.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 10, left: 0 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  logo: { fontSize: 40, fontWeight: '800', color: COLORS.dark, textAlign: 'center' },
  logoPrimary: { color: COLORS.primary },
  tagline: { fontSize: 16, color: COLORS.gray500, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: COLORS.white },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.gray400 },
  modeBtnTextActive: { color: COLORS.dark },
  form: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginTop: 2 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.dark,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray200 },
  dividerText: { fontSize: 13, color: COLORS.gray400 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  googleG: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  magicLinkText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, textAlign: 'center', marginTop: 4 },
  terms: { fontSize: 12, color: COLORS.gray400, textAlign: 'center', marginTop: 24, lineHeight: 18 },
})
