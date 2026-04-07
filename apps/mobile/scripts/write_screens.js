/* eslint-disable */
// Temporary script to write all refactored screens
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
// 1. app/(auth)/login.tsx
// ──────────────────────────────────────────────────────────────
w('app/(auth)/login.tsx', `import { useState } from 'react'
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
        router.replace('/(tabs)/')
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
`);

// ──────────────────────────────────────────────────────────────
// 2. app/(tabs)/profile.tsx
// ──────────────────────────────────────────────────────────────
w('app/(tabs)/profile.tsx', `import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import {
  UserCircle, Car, CreditCard, Bell, Lock,
  LayoutDashboard, List, TrendingUp, LifeBuoy, FileText, Shield,
  Zap, LogOut, User,
} from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { MenuCard } from '../../src/design-system/components/molecules/MenuCard'
import { EmptyState } from '../../src/design-system/components/molecules/EmptyState'
import { ProfileHeader } from '../../src/design-system/components/organisms/ProfileHeader'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { useCurrentUser, useUserStats } from '../../src/api/hooks/useAuth'
import { useAuthStore } from '../../src/stores/authStore'

export default function ProfileScreen() {
  const { colors } = useTheme()
  const user = useCurrentUser()
  const { data: stats } = useUserStats()
  const { isAuthenticated, signOut } = useAuthStore()

  if (!isAuthenticated || !user) {
    return (
      <ScreenContainer style={styles.container}>
        <EmptyState
          icon={User}
          title="Non connecte"
          subtitle="Connectez-vous pour acceder a votre profil"
          actionLabel="Se connecter"
          onAction={() => router.push('/(auth)/login')}
        />
      </ScreenContainer>
    )
  }

  const isHost = user.role === 'host' || user.role === 'both'

  const accountItems = [
    {
      icon: <UserCircle size={18} color={colors.primary} />,
      label: 'Informations personnelles',
      onPress: () => router.push('/settings/personal'),
    },
    {
      icon: <Car size={18} color={colors.primary} />,
      label: 'Vehicules',
      onPress: () => router.push('/settings/vehicles'),
    },
    {
      icon: <CreditCard size={18} color={colors.primary} />,
      label: 'Paiement',
      onPress: () => {},
    },
    {
      icon: <Lock size={18} color={colors.primary} />,
      label: 'Securite',
      onPress: () => {},
    },
  ]

  const hostItems = [
    {
      icon: <LayoutDashboard size={18} color={colors.success} />,
      label: 'Tableau de bord',
      onPress: () => router.push('/(tabs)/host'),
    },
    {
      icon: <List size={18} color={colors.success} />,
      label: 'Annonces',
      onPress: () => router.push('/(tabs)/host'),
    },
    {
      icon: <TrendingUp size={18} color={colors.success} />,
      label: 'Revenus',
      onPress: () => router.push('/(tabs)/host'),
    },
  ]

  const supportItems = [
    {
      icon: <LifeBuoy size={18} color={colors.textSecondary} />,
      label: "Centre d'aide",
      onPress: () => router.push('/help/index'),
    },
    {
      icon: <FileText size={18} color={colors.textSecondary} />,
      label: "Conditions d'utilisation",
      onPress: () => {},
    },
    {
      icon: <Shield size={18} color={colors.textSecondary} />,
      label: 'Confidentialite',
      onPress: () => {},
    },
  ]

  async function handleSignOut() {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <ScreenContainer scroll style={styles.container}>
      <ProfileHeader
        user={{
          fullName: user.full_name,
          email: user.email,
          avatarUrl: user.avatar_url,
          role: user.role as 'driver' | 'host' | 'both',
          createdAt: user.created_at,
        }}
        stats={{
          bookingsCount: stats?.booking_count,
          reviewsCount: stats?.review_count,
        }}
      />

      <View style={styles.sections}>
        <MenuCard title="Compte" items={accountItems} />
        {isHost && <MenuCard title="Hebergement" items={hostItems} />}
        <MenuCard title="Assistance" items={supportItems} />

        {!isHost && user.role !== 'admin' && (
          <View style={[styles.hostCta, { backgroundColor: colors.primary }]}>
            <Zap size={20} color={colors.textInverse} fill={colors.textInverse} />
            <View style={{ flex: 1 }}>
              <AppText variant="headline" color={colors.textInverse}>Devenir hote Flashpark</AppText>
              <AppText variant="caption1" color={colors.textInverse} style={styles.ctaDesc}>
                Louez votre place et generez des revenus. Gratuit, sans engagement.
              </AppText>
            </View>
          </View>
        )}

        <AppButton
          title="Se deconnecter"
          onPress={handleSignOut}
          variant="danger"
          size="md"
        />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  sections: { padding: spacing[4], gap: spacing[4] },
  hostCta: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[4], borderRadius: 18,
  },
  ctaDesc: { marginTop: 2, opacity: 0.8 },
})
`);

// ──────────────────────────────────────────────────────────────
// 3. app/(tabs)/host.tsx
// ──────────────────────────────────────────────────────────────
w('app/(tabs)/host.tsx', `import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Plus, TrendingUp, Car, CalendarCheck, Clock, LayoutDashboard } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { SectionHeader } from '../../src/design-system/components/layout/SectionHeader'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { EmptyState } from '../../src/design-system/components/molecules/EmptyState'
import { HostBookingCard } from '../../src/design-system/components/organisms/HostBookingCard'
import { SpotListingCard } from '../../src/design-system/components/organisms/SpotListingCard'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { useHostStats, useHostBookings, useHostListings, useAcceptBooking, useRejectBooking } from '../../src/api/hooks/useHost'
import { useAuthStore } from '../../src/stores/authStore'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { hostKeys } from '../../src/api/hooks/useHost'

export default function HostScreen() {
  const { colors } = useTheme()
  const { isAuthenticated, user } = useAuthStore()
  const qc = useQueryClient()

  const { data: stats } = useHostStats()
  const { data: pending = [], isLoading: bookingsLoading } = useHostBookings('pending')
  const { data: listings = [], isLoading: listingsLoading } = useHostListings()
  const acceptMutation = useAcceptBooking()
  const rejectMutation = useRejectBooking()

  const isRefreshing = bookingsLoading || listingsLoading

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: hostKeys.all })
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={LayoutDashboard}
          title="Devenir hote"
          subtitle="Connectez-vous pour proposer votre place de parking et commencer a gagner de l argent"
          actionLabel="Se connecter"
          onAction={() => router.push('/(auth)/login')}
        />
      </ScreenContainer>
    )
  }

  const STAT_CARDS = [
    { label: 'Revenus du mois', value: stats ? stats.total_earnings.toFixed(2) + ' EUR' : '--', color: colors.success, Icon: TrendingUp },
    { label: 'Places actives', value: stats ? String(stats.active_spots) : '--', color: colors.primary, Icon: Car },
    { label: 'Reservations', value: stats ? String(stats.total_bookings) : '--', color: colors.text, Icon: CalendarCheck },
    { label: 'En attente', value: stats ? String(stats.pending_bookings) : '--', color: colors.warning, Icon: Clock },
  ]

  return (
    <ScreenContainer scroll refreshing={isRefreshing} onRefresh={handleRefresh} style={styles.container}>
      <View style={styles.header}>
        <AppText variant="heading1" color={colors.text}>Tableau de bord</AppText>
        <AppText variant="callout" color={colors.textSecondary}>
          {listings.length} annonce{listings.length !== 1 ? 's' : ''}
        </AppText>
      </View>

      <View style={styles.statsGrid}>
        {STAT_CARDS.map((s) => {
          const Icon = s.Icon
          return (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon size={18} color={s.color} strokeWidth={2} />
              <AppText variant="heading2" style={{ color: s.color }}>{s.value}</AppText>
              <AppText variant="caption1" color={colors.textSecondary}>{s.label}</AppText>
            </View>
          )
        })}
      </View>

      {pending.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Reservations a traiter" />
          {pending.map((booking) => (
            <HostBookingCard
              key={booking.id}
              booking={{
                id: booking.id,
                startTime: booking.start_time,
                endTime: booking.end_time,
                totalPrice: booking.total_price,
                spotTitle: booking.spot_id,
              }}
              onAccept={() => acceptMutation.mutate(booking.id)}
              onReject={() => rejectMutation.mutate(booking.id)}
              loading={acceptMutation.isPending || rejectMutation.isPending}
            />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader
          title="Mes annonces"
          actionLabel="Ajouter"
          onAction={() => router.push('/host/new')}
        />
        {listings.length === 0 ? (
          <EmptyState
            icon={Car}
            title="Aucune annonce"
            subtitle="Ajoutez votre premiere place de parking"
          />
        ) : (
          listings.map((spot) => (
            <SpotListingCard
              key={spot.id}
              spot={{
                id: spot.id,
                title: spot.title,
                address: spot.address,
                pricePerHour: spot.price_per_hour,
                photos: Array.isArray(spot.photos) ? spot.photos : [],
                status: spot.status as any,
              }}
              onEdit={() => {}}
              onToggleStatus={async (active) => {
                await supabase.from('spots').update({ status: active ? 'active' : 'inactive' }).eq('id', spot.id)
                qc.invalidateQueries({ queryKey: hostKeys.listings(user?.id ?? '') })
              }}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: { paddingBottom: 100 },
  header: { padding: spacing[4], gap: 4 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3],
    paddingHorizontal: spacing[4],
  },
  statCard: {
    width: '47%',
    borderRadius: radii.lg, borderWidth: 1, padding: spacing[3], gap: spacing[1],
  },
  section: { gap: spacing[3], paddingHorizontal: spacing[4] },
})
`);

console.log('profile.tsx and host.tsx written');
