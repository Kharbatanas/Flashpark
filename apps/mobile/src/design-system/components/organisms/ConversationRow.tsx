import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { AppText } from '../atoms/AppText'
import { Avatar } from '../atoms/Avatar'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

interface ConversationRowProps {
  contactName: string
  avatarUrl?: string | null
  latestMessage?: string | null
  timestamp?: string | Date | null
  unreadCount?: number
  onPress: () => void
}

function formatTimestamp(ts: string | Date): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'À l\'instant'
  if (diffMin < 60) return `${diffMin}m`
  if (diffH < 24) return `${diffH}h`
  if (diffD < 7) return `${diffD}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function ConversationRow({
  contactName,
  avatarUrl,
  latestMessage,
  timestamp,
  unreadCount = 0,
  onPress,
}: ConversationRowProps) {
  const { colors } = useTheme()
  const hasUnread = unreadCount > 0

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`Conversation avec ${contactName}${hasUnread ? `, ${unreadCount} message(s) non lu(s)` : ''}`}
    >
      <Avatar uri={avatarUrl} initials={contactName} size="lg" />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppText
            variant="label"
            style={[styles.name, { color: colors.text }, hasUnread && styles.bold]}
            numberOfLines={1}
          >
            {contactName}
          </AppText>
          {timestamp && (
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              {formatTimestamp(timestamp)}
            </AppText>
          )}
        </View>
        <View style={styles.bottomRow}>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={[
              styles.preview,
              { color: hasUnread ? colors.text : colors.textSecondary },
              hasUnread && styles.bold,
            ]}
          >
            {latestMessage ?? 'Aucun message'}
          </AppText>
          {hasUnread && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <AppText variant="caption" style={styles.unreadText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </AppText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    marginRight: spacing[1],
  },
  preview: {
    flex: 1,
    marginRight: spacing[1],
  },
  bold: {
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
})
