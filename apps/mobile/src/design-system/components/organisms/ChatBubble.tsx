import React from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '../atoms/AppText'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

interface ChatBubbleProps {
  message: string
  timestamp: string | Date
  isMine: boolean
}

function formatTime(ts: string | Date): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function ChatBubble({ message, timestamp, isMine }: ChatBubbleProps) {
  const { colors } = useTheme()

  const bubbleBg = isMine ? colors.primary : colors.surface
  const textColor = isMine ? '#fff' : colors.text
  const timeColor = isMine ? 'rgba(255,255,255,0.65)' : colors.textSecondary

  const bubbleRadius = {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomLeftRadius: isMine ? radii.xl : radii.xs,
    borderBottomRightRadius: isMine ? radii.xs : radii.xl,
  }

  return (
    <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          bubbleRadius,
          { backgroundColor: bubbleBg },
          !isMine && { borderWidth: 1, borderColor: colors.border },
        ]}
        accessibilityLabel={`${isMine ? 'Moi' : 'Contact'}: ${message}`}
      >
        <AppText variant="body" style={{ color: textColor }}>
          {message}
        </AppText>
        <AppText variant="caption" style={[styles.time, { color: timeColor }]}>
          {formatTime(timestamp)}
        </AppText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing[4],
    paddingVertical: 3,
    flexDirection: 'row',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    gap: 4,
  },
  time: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
})
