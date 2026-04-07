import React from 'react'
import { Text, TextProps, StyleSheet } from 'react-native'
import { useTheme } from '../../theme/useTheme'
import { typography, TypographyVariant } from '../../tokens/typography'

interface AppTextProps extends TextProps {
  variant?: TypographyVariant
  color?: string
}

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: AppTextProps): React.JSX.Element {
  const { colors } = useTheme()
  const typeStyle = typography[variant]

  return (
    <Text
      style={[
        styles.base,
        {
          fontSize: typeStyle.fontSize,
          lineHeight: typeStyle.lineHeight,
          fontWeight: typeStyle.fontWeight,
          letterSpacing: typeStyle.letterSpacing,
          textTransform: typeStyle.textTransform,
          color: color ?? colors.text,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
})
