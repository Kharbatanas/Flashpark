import React from 'react'
import { StyleSheet, View } from 'react-native'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

interface SpotDims {
  width?: string | number | null
  length?: string | number | null
  maxVehicleHeight?: string | number | null
}

interface VehicleDims {
  width?: string | number | null
  length?: string | number | null
  height?: string | number | null
  brand?: string | null
  model?: string | null
}

interface SpotDimensionsCardProps {
  spot: SpotDims
  vehicle?: VehicleDims | null
}

function toNum(v: string | number | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'string' ? parseFloat(v) : v
  return isNaN(n) ? null : n
}

type FitResult = 'fits' | 'too_large' | 'unknown'

function checkFit(spotW: number | null, spotL: number | null, spotH: number | null, veh: VehicleDims): FitResult {
  const vW = toNum(veh.width)
  const vL = toNum(veh.length)
  const vH = toNum(veh.height)

  if (spotW == null && spotL == null && spotH == null) return 'unknown'

  const widthOk = spotW == null || vW == null || vW <= spotW
  const lengthOk = spotL == null || vL == null || vL <= spotL
  const heightOk = spotH == null || vH == null || vH <= spotH

  if (!widthOk || !lengthOk || !heightOk) return 'too_large'
  if (vW == null && vL == null && vH == null) return 'unknown'
  return 'fits'
}

export function SpotDimensionsCard({ spot, vehicle }: SpotDimensionsCardProps) {
  const { colors } = useTheme()

  const spotW = toNum(spot.width)
  const spotL = toNum(spot.length)
  const spotH = toNum(spot.maxVehicleHeight)

  const hasAnyDim = spotW != null || spotL != null || spotH != null

  // Proportional rectangle: scale to fit in 200×100 display area
  const dispW = 200
  const dispH = 100
  const aspectW = spotW ?? 2.5
  const aspectL = spotL ?? 5.0
  const scale = Math.min(dispW / aspectW, dispH / aspectL)
  const rectW = Math.round(aspectW * scale)
  const rectH = Math.round(aspectL * scale)

  const fitResult: FitResult = vehicle ? checkFit(spotW, spotL, spotH, vehicle) : 'unknown'

  const fitColor =
    fitResult === 'fits' ? '#10B981' :
    fitResult === 'too_large' ? '#EF4444' :
    colors.textSecondary

  const FitIcon =
    fitResult === 'fits' ? CheckCircle :
    fitResult === 'too_large' ? XCircle :
    AlertCircle

  const fitLabel =
    fitResult === 'fits' ? 'Votre véhicule est compatible' :
    fitResult === 'too_large' ? 'Votre véhicule pourrait ne pas rentrer' :
    'Compatibilité inconnue'

  if (!hasAnyDim) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText variant="label" style={{ color: colors.text }}>Dimensions</AppText>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          Dimensions non renseignées pour cette place
        </AppText>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="label" style={{ color: colors.text }}>Dimensions de la place</AppText>

      <View style={styles.diagramArea}>
        <View
          style={[
            styles.spotRect,
            {
              width: rectW,
              height: rectH,
              borderColor: colors.primary,
              backgroundColor: colors.primaryLight,
            },
          ]}
        >
          {spotW != null && (
            <AppText variant="caption" style={[styles.dimLabelH, { color: colors.primary }]}>
              {spotW.toFixed(1)} m
            </AppText>
          )}
          {spotL != null && (
            <AppText
              variant="caption"
              style={[styles.dimLabelV, { color: colors.primary }]}
              numberOfLines={1}
            >
              {spotL.toFixed(1)} m
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        {spotW != null && (
          <View style={styles.stat}>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>Largeur</AppText>
            <AppText variant="label" style={{ color: colors.text }}>{spotW.toFixed(2)} m</AppText>
          </View>
        )}
        {spotL != null && (
          <View style={styles.stat}>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>Longueur</AppText>
            <AppText variant="label" style={{ color: colors.text }}>{spotL.toFixed(2)} m</AppText>
          </View>
        )}
        {spotH != null && (
          <View style={styles.stat}>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>Hauteur max</AppText>
            <AppText variant="label" style={{ color: colors.text }}>{spotH.toFixed(2)} m</AppText>
          </View>
        )}
      </View>

      {vehicle && (
        <View style={[styles.fitRow, { backgroundColor: fitColor + '15', borderRadius: radii.md }]}>
          <FitIcon size={18} color={fitColor} strokeWidth={2} />
          <AppText variant="caption" style={{ color: fitColor, fontWeight: '600', flex: 1 }}>
            {fitLabel}
          </AppText>
        </View>
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
  diagramArea: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  spotRect: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: radii.sm,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 40,
  },
  dimLabelH: {
    position: 'absolute',
    bottom: -18,
    alignSelf: 'center',
    fontWeight: '600',
  },
  dimLabelV: {
    position: 'absolute',
    right: -42,
    alignSelf: 'center',
    fontWeight: '600',
    transform: [{ rotate: '90deg' }],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  fitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[2],
  },
})
