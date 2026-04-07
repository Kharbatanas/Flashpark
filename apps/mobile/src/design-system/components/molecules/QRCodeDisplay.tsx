import React from 'react'
import { StyleSheet, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useTheme } from '../../theme/useTheme'
import { radii } from '../../tokens/radii'
import { spacing } from '../../tokens/spacing'
import { shadows } from '../../tokens/shadows'
import { AppText } from '../atoms/AppText'

interface QRCodeDisplayProps {
  value: string
  size?: number
  label?: string
}

export function QRCodeDisplay({
  value,
  size = 180,
  label,
}: QRCodeDisplayProps): React.JSX.Element {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.qrWrap,
          { backgroundColor: '#FFFFFF', borderColor: colors.border },
        ]}
      >
        <QRCode
          value={value}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
        />
      </View>
      {label != null && (
        <AppText
          variant="caption1"
          color={colors.textSecondary}
          style={styles.label}
        >
          {label}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[3],
  },
  qrWrap: {
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  label: {
    textAlign: 'center',
  },
})
