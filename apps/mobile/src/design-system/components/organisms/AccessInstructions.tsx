import React from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { MapPin, Hash, Layers, Key, Navigation, LucideProps } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { AppButton } from '../atoms/AppButton'
import { PhotoCarousel } from '../molecules/PhotoCarousel'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

interface AccessSpot {
  accessInstructions?: string | null
  accessPhotos?: string[]
  floorNumber?: string | null
  spotNumber?: string | null
  buildingCode?: string | null
  gpsPinLat?: string | number | null
  gpsPinLng?: string | number | null
}

interface AccessInstructionsProps {
  spot: AccessSpot
}

interface DetailRowProps {
  Icon: React.ComponentType<LucideProps>
  label: string
  value: string
}

function DetailRow({ Icon, label, value }: DetailRowProps) {
  const { colors } = useTheme()
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.detailIcon, { backgroundColor: colors.primaryLight }]}>
        <Icon size={16} color={colors.primary} strokeWidth={2} />
      </View>
      <View style={styles.detailText}>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>{label}</AppText>
        <AppText variant="label" style={{ color: colors.text }}>{value}</AppText>
      </View>
    </View>
  )
}

export function AccessInstructions({ spot }: AccessInstructionsProps) {
  const { colors } = useTheme()

  const hasCoords = spot.gpsPinLat != null && spot.gpsPinLng != null
  const hasPhotos = (spot.accessPhotos?.length ?? 0) > 0
  const hasDetails = spot.buildingCode || spot.floorNumber || spot.spotNumber

  const handleOpenMaps = () => {
    if (!hasCoords) return
    const lat = spot.gpsPinLat
    const lng = spot.gpsPinLng
    const label = encodeURIComponent('Ma place de parking')
    const url = `https://maps.google.com/?q=${lat},${lng}&label=${label}`
    Linking.openURL(url).catch(() => {
      // Fallback: open with Apple Maps on iOS
      Linking.openURL(`maps://?ll=${lat},${lng}&q=${label}`)
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="heading3" style={[styles.title, { color: colors.text }]}>
        Accès à la place
      </AppText>

      {spot.accessInstructions && (
        <View style={[styles.instructionsBox, { backgroundColor: colors.backgroundSecondary, borderRadius: radii.md }]}>
          <AppText variant="body" style={[styles.instructions, { color: colors.text }]}>
            {spot.accessInstructions}
          </AppText>
        </View>
      )}

      {!spot.accessInstructions && (
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          Aucune instruction spécifique fournie.
        </AppText>
      )}

      {hasDetails && (
        <View style={[styles.detailsCard, { borderColor: colors.border, borderRadius: radii.md }]}>
          {spot.buildingCode && (
            <DetailRow Icon={Key} label="Code d'accès" value={spot.buildingCode} />
          )}
          {spot.floorNumber && (
            <DetailRow Icon={Layers} label="Étage" value={spot.floorNumber} />
          )}
          {spot.spotNumber && (
            <DetailRow Icon={Hash} label="Numéro de place" value={spot.spotNumber} />
          )}
        </View>
      )}

      {hasPhotos && spot.accessPhotos && (
        <View>
          <AppText variant="label" style={[styles.photosLabel, { color: colors.text }]}>
            Photos d'accès
          </AppText>
          <PhotoCarousel photos={spot.accessPhotos} />
        </View>
      )}

      {hasCoords && (
        <AppButton
          title="Ouvrir dans Maps"
          onPress={handleOpenMaps}
          variant="outline"
          icon={<Navigation size={16} color={colors.primary} strokeWidth={2} />}
          accessibilityLabel="Ouvrir la localisation dans Maps"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[6],
    gap: spacing[4],
  },
  title: {
    fontWeight: '700',
  },
  instructionsBox: {
    padding: spacing[4],
  },
  instructions: {
    lineHeight: 22,
  },
  detailsCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    gap: 1,
  },
  photosLabel: {
    marginBottom: spacing[1],
    fontWeight: '600',
  },
  mapsBtn: {
    width: '100%',
  },
})
