import React from 'react'
import { View } from 'react-native'
import { spacing, SpacingKey } from '../../tokens/spacing'

interface SpacerProps {
  size?: SpacingKey
  flex?: boolean
  horizontal?: boolean
}

export function Spacer({
  size,
  flex = false,
  horizontal = false,
}: SpacerProps): React.JSX.Element {
  if (flex) {
    return <View style={{ flex: 1 }} />
  }

  const px = size != null ? spacing[size] : 0

  return (
    <View
      style={
        horizontal
          ? { width: px }
          : { height: px }
      }
    />
  )
}
