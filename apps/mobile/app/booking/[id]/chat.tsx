import React, { useEffect, useRef } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, MessageCircle } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChatBubble } from '../../../src/design-system/components/organisms/ChatBubble'
import { ChatInput } from '../../../src/design-system/components/organisms/ChatInput'
import { AppText } from '../../../src/design-system/components/atoms/AppText'
import { EmptyState } from '../../../src/design-system/components/molecules/EmptyState'
import { useTheme } from '../../../src/design-system/theme/useTheme'
import { useMessages, useSendMessage } from '../../../src/api/hooks/useMessages'
import { useRealtimeMessages } from '../../../src/api/subscriptions/useRealtimeMessages'
import { useAuthStore } from '../../../src/stores/authStore'
import { useBooking } from '../../../src/api/hooks/useBookings'
import { Message, Spot } from '../../../src/types/database'
import { spacing } from '../../../src/design-system/tokens/spacing'

const GROUP_THRESHOLD_MS = 5 * 60 * 1000

function shouldShowTimestamp(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true
  return new Date(current.created_at).getTime() - new Date(previous.created_at).getTime() > GROUP_THRESHOLD_MS
}

function formatGroupTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ChatScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors } = useTheme()
  const user = useAuthStore((s) => s.user)
  const flatListRef = useRef<FlatList>(null)

  const { data: booking } = useBooking(id)
  const { data: messages = [], isLoading } = useMessages(id)
  const sendMessage = useSendMessage()
  useRealtimeMessages()

  // Auto-scroll to newest message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  function handleSend(text: string): void {
    sendMessage.mutate({ booking_id: id, content: text })
  }

  const spot = booking?.spot as Spot | undefined
  const contactName = booking
    ? booking.driver_id === user?.id ? 'Hôte' : 'Conducteur'
    : 'Conversation'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppText variant="headline" color={colors.text} numberOfLines={1}>
            {contactName}
          </AppText>
          {spot && (
            <AppText variant="caption1" color={colors.textSecondary} numberOfLines={1}>
              {spot.title}
            </AppText>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.skeletonBubble,
                  i % 2 === 0 ? styles.bubbleRight : styles.bubbleLeft,
                  { backgroundColor: colors.borderLight },
                ]}
              />
            ))}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                icon={MessageCircle}
                title="Aucun message"
                subtitle="Commencez la conversation"
              />
            }
            renderItem={({ item, index }) => {
              const isMine = item.sender_id === user?.id
              const previous = index > 0 ? messages[index - 1] : undefined
              const showTimestamp = shouldShowTimestamp(item, previous)

              return (
                <View>
                  {showTimestamp && (
                    <AppText
                      variant="caption1"
                      color={colors.textSecondary}
                      style={styles.timestamp}
                    >
                      {formatGroupTime(item.created_at)}
                    </AppText>
                  )}
                  <ChatBubble
                    message={item.content}
                    timestamp={item.created_at}
                    isMine={isMine}
                  />
                </View>
              )
            }}
          />
        )}

        <ChatInput
          onSend={handleSend}
          disabled={sendMessage.isPending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  loadingWrap: {
    flex: 1,
    padding: spacing[4],
    gap: spacing[3],
  },
  skeletonBubble: {
    height: 44,
    maxWidth: '70%',
    borderRadius: 20,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  messagesList: {
    paddingVertical: spacing[3],
    flexGrow: 1,
  },
  timestamp: {
    textAlign: 'center',
    marginVertical: spacing[3],
  },
})
