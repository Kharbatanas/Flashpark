import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { ChevronDown } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

type CancellationPolicy = 'flexible' | 'moderate' | 'strict'

interface PolicyConfig {
  label: string
  summary: string
  color: string
  bg: string
  details: string[]
}

const POLICY_CONFIG: Record<CancellationPolicy, PolicyConfig> = {
  flexible: {
    label: 'Flexible',
    summary: 'Remboursement intégral jusqu\'à 24h avant',
    color: '#10B981',
    bg: '#ECFDF5',
    details: [
      'Annulation gratuite jusqu\'à 24h avant le début',
      'Remboursement de 50% entre 24h et 1h avant',
      'Aucun remboursement à moins de 1h du début',
    ],
  },
  moderate: {
    label: 'Modérée',
    summary: 'Remboursement intégral jusqu\'à 48h avant',
    color: '#F5A623',
    bg: '#FFFBEB',
    details: [
      'Annulation gratuite jusqu\'à 48h avant le début',
      'Remboursement de 50% entre 48h et 24h avant',
      'Aucun remboursement à moins de 24h du début',
    ],
  },
  strict: {
    label: 'Stricte',
    summary: 'Remboursement de 50% jusqu\'à 7 jours avant',
    color: '#EF4444',
    bg: '#FEF2F2',
    details: [
      'Remboursement de 50% jusqu\'à 7 jours avant le début',
      'Aucun remboursement à moins de 7 jours du début',
      'En cas de circonstances exceptionnelles, contactez le support',
    ],
  },
}

interface CancellationPolicyBannerProps {
  policy: CancellationPolicy
}

export function CancellationPolicyBanner({ policy }: CancellationPolicyBannerProps) {
  const { colors } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const rotation = useSharedValue(0)
  const config = POLICY_CONFIG[policy]

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const handleToggle = () => {
    rotation.value = withTiming(expanded ? 0 : 180, { duration: 200 })
    setExpanded(prev => !prev)
  }

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.color + '40' }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.75}
        accessibilityLabel={`Politique d'annulation ${config.label}. ${expanded ? 'Réduire' : 'Voir les détails'}`}
        accessibilityRole="button"
      >
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <AppText variant="caption" style={styles.badgeText}>
            {config.label}
          </AppText>
        </View>
        <AppText variant="caption" style={[styles.summary, { color: config.color, flex: 1 }]}>
          {config.summary}
        </AppText>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={16} color={config.color} strokeWidth={2.5} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.details, { borderTopColor: config.color + '30' }]}>
          {config.details.map((line, i) => (
            <View key={i} style={styles.detailLine}>
              <View style={[styles.bullet, { backgroundColor: config.color }]} />
              <AppText variant="caption" style={[styles.detailText, { color: colors.text }]}>
                {line}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  summary: {
    fontWeight: '500',
  },
  details: {
    borderTopWidth: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  detailText: {
    flex: 1,
    lineHeight: 20,
  },
})
