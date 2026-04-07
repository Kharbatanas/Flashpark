import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { spacing } from '../../tokens/spacing'
import { AppText } from './AppText'

interface DividerProps {
  label?: string
  marginVertical?: number
}

export function Divider({
  label,
  marginVertical = spacing[4],
}: DividerProps): React.JSX.Element {
  const { colors } = useTheme()

  if (label == null) {
    return (
      <View
        style={[
          styles.line,
          { backgroundColor: colors.border, marginVertical },
        ]}
      />
    )
  }

  return (
    <View style={[styles.row, { marginVertical }]}>
      <View style={[styles.flex, { backgroundColor: colors.border }]} />
      <AppText
        variant="caption1"
        color={colors.textTertiary}
        style={styles.labelText}
      >
        {label}
      </AppText>
      <View style={[styles.flex, { backgroundColor: colors.border }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  labelText: {
    marginHorizontal: spacing[3],
  },
})
