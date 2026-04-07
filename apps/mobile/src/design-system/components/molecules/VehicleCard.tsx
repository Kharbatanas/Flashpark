import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Car, Truck, Bike } from 'lucide-react-native'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { shadows } from '../../tokens/shadows'
import { AppText } from '../atoms/AppText'

interface Vehicle {
  id: string
  plate: string
  brand?: string
  model?: string
  type?: 'car' | 'truck' | 'motorcycle' | 'other'
  length?: number
  width?: number
  height?: number
}

interface VehicleCardProps {
  vehicle: Vehicle
}

function getVehicleIcon(type: Vehicle['type']): React.ReactNode {
  switch (type) {
    case 'truck':
      return <Truck size={24} strokeWidth={1.5} />
    case 'motorcycle':
      return <Bike size={24} strokeWidth={1.5} />
    default:
      return <Car size={24} strokeWidth={1.5} />
  }
}

export function VehicleCard({ vehicle }: VehicleCardProps): React.JSX.Element {
  const { colors } = useTheme()

  const hasDimensions =
    vehicle.length != null || vehicle.width != null || vehicle.height != null

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <View style={{ color: colors.primary } as any}>
          {getVehicleIcon(vehicle.type)}
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <AppText variant="headline" color={colors.text}>
            {vehicle.plate.toUpperCase()}
          </AppText>
          {(vehicle.brand != null || vehicle.model != null) && (
            <AppText variant="callout" color={colors.textSecondary}>
              {[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}
            </AppText>
          )}
        </View>
        {hasDimensions && (
          <AppText variant="caption1" color={colors.textTertiary}>
            {[
              vehicle.length != null ? `L ${vehicle.length}m` : null,
              vehicle.width != null ? `l ${vehicle.width}m` : null,
              vehicle.height != null ? `H ${vehicle.height}m` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
})
