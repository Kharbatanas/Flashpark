import React from 'react'
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native'
import { Edit2 } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { OptimizedImage } from '../atoms/OptimizedImage'
import { IconButton } from '../atoms/IconButton'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii, shadows } from '../../tokens'

interface ListingSpot {
  id: string
  title: string
  address: string
  pricePerHour: string | number
  photos: string[]
  status: 'active' | 'inactive' | 'pending_review' | 'pending_verification'
}

interface SpotListingCardProps {
  spot: ListingSpot
  onEdit: () => void
  onToggleStatus: (active: boolean) => void
}

export function SpotListingCard({ spot, onEdit, onToggleStatus }: SpotListingCardProps) {
  const { colors } = useTheme()

  const isActive = spot.status === 'active'
  const photo = spot.photos?.[0]
  const price = typeof spot.pricePerHour === 'string'
    ? parseFloat(spot.pricePerHour)
    : spot.pricePerHour

  const statusLabel =
    spot.status === 'active' ? 'Active' :
    spot.status === 'inactive' ? 'Inactive' :
    spot.status === 'pending_review' ? 'En révision' :
    'En vérification'

  const statusColor =
    spot.status === 'active' ? '#10B981' :
    spot.status === 'inactive' ? colors.textSecondary :
    '#F5A623'

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <OptimizedImage
        uri={photo ?? ''}
        width={90}
        height={110}
      />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText variant="label" numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {spot.title}
          </AppText>
          <IconButton
            icon={<Edit2 size={16} color={colors.textSecondary} strokeWidth={2} />}
            onPress={onEdit}
          />
        </View>
        <AppText variant="caption" numberOfLines={1} style={{ color: colors.textSecondary }}>
          {spot.address}
        </AppText>
        <AppText variant="label" style={{ color: colors.text }}>
          {price?.toFixed(2)}€/h
        </AppText>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <AppText variant="caption" style={{ color: statusColor, fontWeight: '600' }}>
            {statusLabel}
          </AppText>
          <Switch
            value={isActive}
            onValueChange={onToggleStatus}
            trackColor={{ false: colors.border, true: '#10B981' }}
            thumbColor={colors.surface}
            style={styles.toggle}
            accessibilityLabel={isActive ? 'Désactiver l\'annonce' : 'Activer l\'annonce'}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  image: {
    width: 90,
    height: 110,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: spacing[2],
    gap: 4,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  toggle: {
    marginLeft: 'auto',
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
})
