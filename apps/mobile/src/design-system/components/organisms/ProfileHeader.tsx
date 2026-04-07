import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Avatar } from '../atoms/Avatar'
import { AppText } from '../atoms/AppText'
import { Badge } from '../atoms/Badge'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

type UserRole = 'driver' | 'host' | 'both'

interface ProfileUser {
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
  role?: UserRole
  createdAt?: string | Date | null
}

interface ProfileStats {
  bookingsCount?: number
  reviewsCount?: number
}

interface ProfileHeaderProps {
  user: ProfileUser
  stats?: ProfileStats
}

const ROLE_LABELS: Record<UserRole, string> = {
  driver: 'Conducteur',
  host: 'Hôte',
  both: 'Hôte & Conducteur',
}

function formatHostSince(d: string | Date): string {
  return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const { colors } = useTheme()

  const name = user.fullName ?? 'Utilisateur'
  const role = user.role ?? 'driver'

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Avatar uri={user.avatarUrl} initials={name} size="xl" />

      <View style={styles.info}>
        <AppText variant="heading2" style={{ color: colors.text }}>{name}</AppText>

        {user.email && (
          <AppText variant="caption" style={{ color: colors.textSecondary }}>{user.email}</AppText>
        )}

        <Badge
          label={ROLE_LABELS[role]}
          color={role === 'host' || role === 'both' ? 'primary' : 'neutral'}
        />
      </View>

      {(stats != null || user.createdAt != null) && (
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          {stats?.bookingsCount != null && (
            <View style={styles.stat} accessibilityLabel={`${stats.bookingsCount} réservations`}>
              <AppText variant="heading3" style={{ color: colors.text }}>
                {stats.bookingsCount}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                Réservations
              </AppText>
            </View>
          )}
          {stats?.reviewsCount != null && (
            <View style={[styles.stat, styles.statBorder, { borderColor: colors.border }]} accessibilityLabel={`${stats.reviewsCount} avis`}>
              <AppText variant="heading3" style={{ color: colors.text }}>
                {stats.reviewsCount}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                Avis
              </AppText>
            </View>
          )}
          {user.createdAt && (
            <View style={styles.stat} accessibilityLabel={`Membre depuis ${formatHostSince(user.createdAt)}`}>
              <AppText variant="label" style={{ color: colors.text }}>
                {formatHostSince(user.createdAt)}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                Membre depuis
              </AppText>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[8],
    paddingBottom: 0,
    borderRadius: radii.xl,
  },
  info: {
    alignItems: 'center',
    gap: spacing[1],
  },
  roleBadge: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    marginTop: spacing[4],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: 2,
  },
  statBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
})
