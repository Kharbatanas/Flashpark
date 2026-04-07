import { StyleSheet, View } from 'react-native'
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
      onPress: () => router.push('/help' as any),
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
