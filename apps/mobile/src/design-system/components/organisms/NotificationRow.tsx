import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Calendar,
  Star,
  CreditCard,
  LucideProps,
} from 'lucide-react-native'
import { AppText } from '../atoms/AppText'
import { useTheme } from '../../theme/useTheme'
import { spacing, radii } from '../../tokens'

type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'message'
  | 'review'
  | 'payment'
  | 'reminder'
  | 'alert'
  | 'general'

interface NotificationRowProps {
  type?: NotificationType
  title: string
  body: string
  timestamp: string | Date
  isRead?: boolean
  onPress: () => void
}

interface IconConfig {
  Icon: React.ComponentType<LucideProps>
  color: string
  bg: string
}

function getIconConfig(type: NotificationType, colors: ReturnType<typeof useTheme>['colors']): IconConfig {
  const configs: Record<NotificationType, IconConfig> = {
    booking_confirmed: { Icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
    booking_cancelled: { Icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
    message:           { Icon: MessageCircle, color: colors.primary, bg: colors.primaryLight },
    review:            { Icon: Star, color: '#F59E0B', bg: '#FFFBEB' },
    payment:           { Icon: CreditCard, color: '#8B5CF6', bg: '#F5F3FF' },
    reminder:          { Icon: Calendar, color: '#F5A623', bg: '#FFFBEB' },
    alert:             { Icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
    general:           { Icon: Bell, color: colors.textSecondary, bg: colors.borderLight },
  }
  return configs[type] ?? configs.general
}

function formatTimestamp(ts: string | Date): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMin < 1) return 'À l\'instant'
  if (diffMin < 60) return `Il y a ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'Hier'
  if (diffD < 7) return `Il y a ${diffD}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function NotificationRow({
  type = 'general',
  title,
  body,
  timestamp,
  isRead = false,
  onPress,
}: NotificationRowProps) {
  const { colors } = useTheme()
  const { Icon, color, bg } = getIconConfig(type, colors)

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: colors.border },
        !isRead && { backgroundColor: colors.primaryLight + '40' },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`${title}. ${isRead ? '' : 'Non lu. '}${body}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <Icon size={20} color={color} strokeWidth={2} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppText
            variant="label"
            numberOfLines={1}
            style={[styles.title, { color: colors.text }, !isRead && styles.bold]}
          >
            {title}
          </AppText>
          <AppText variant="caption" style={{ color: colors.textSecondary }}>
            {formatTimestamp(timestamp)}
          </AppText>
        </View>
        <AppText variant="caption" numberOfLines={2} style={{ color: colors.textSecondary }}>
          {body}
        </AppText>
      </View>

      {!isRead && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[1],
  },
  title: {
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
})
