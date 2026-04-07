import React from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { LogIn } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { spacing } from '../../tokens/spacing'
import { radii } from '../../tokens/radii'
import { AppText } from '../atoms/AppText'
import { AppButton } from '../atoms/AppButton'

interface AuthGateProps {
  children: React.ReactNode
  isAuthenticated: boolean
  message?: string
}

export function AuthGate({
  children,
  isAuthenticated,
  message = 'Connectez-vous pour continuer',
}: AuthGateProps): React.JSX.Element {
  const { colors } = useTheme()

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <LogIn size={28} color={colors.primary} strokeWidth={1.5} />
      </View>
      <AppText variant="title3" color={colors.text} style={styles.message}>
        {message}
      </AppText>
      <AppText
        variant="callout"
        color={colors.textSecondary}
        style={styles.hint}
      >
        Créez un compte gratuitement pour accéder à toutes les fonctionnalités.
      </AppText>
      <AppButton
        title="Se connecter"
        onPress={() => router.push('/(auth)/login')}
        variant="primary"
        size="lg"
      />
      <AppButton
        title="Créer un compte"
        onPress={() => router.push('/(auth)/login')}
        variant="outline"
        size="md"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: spacing[4],
    padding: spacing[6],
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  message: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[2],
  },
})
