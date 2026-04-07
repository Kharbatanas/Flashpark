import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

const MAX_STRIKES = 3

interface StrikeWarningBannerProps {
  strikeCount: number
}

export function StrikeWarningBanner({ strikeCount }: StrikeWarningBannerProps) {
  const { colors } = useTheme()

  if (strikeCount <= 0) return null

  const isAtRisk = strikeCount >= MAX_STRIKES - 1
  const color = isAtRisk ? '#EF4444' : '#F5A623'
  const bg = isAtRisk ? '#FEF2F2' : '#FFFBEB'
  const borderColor = isAtRisk ? '#EF444430' : '#F5A62330'
  const progress = Math.min(strikeCount / MAX_STRIKES, 1)

  const message =
    strikeCount >= MAX_STRIKES
      ? 'Votre compte est suspendu suite à 3 avertissements'
      : `Vous avez ${strikeCount} avertissement${strikeCount > 1 ? 's' : ''} sur ${MAX_STRIKES}. Un ${MAX_STRIKES}e entraîne une suspension.`

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor }]} accessibilityRole="alert">
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <AlertTriangle size={20} color={color} strokeWidth={2} />
        </View>
        <View style={styles.textBlock}>
          <AppText variant="label" style={{ color, fontWeight: '700' }}>
            {strikeCount >= MAX_STRIKES ? 'Compte suspendu' : 'Avertissement hôte'}
          </AppText>
          <AppText variant="caption" style={{ color: colors.text }}>
            {message}
          </AppText>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: color + '25' }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: color, width: `${progress * 100}%` },
          ]}
        />
      </View>

      <View style={styles.dotsRow}>
        {Array.from({ length: MAX_STRIKES }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < strikeCount ? color : color + '30',
                borderColor: color,
              },
            ]}
            accessibilityLabel={`Avertissement ${i + 1} ${i < strikeCount ? 'actif' : 'non atteint'}`}
          />
        ))}
        <AppText variant="caption" style={[styles.dotLabel, { color }]}>
          {strikeCount}/{MAX_STRIKES}
        </AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  dotLabel: {
    marginLeft: 'auto',
    fontWeight: '700',
  },
})
