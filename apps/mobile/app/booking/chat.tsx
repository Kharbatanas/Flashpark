import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, Send } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { COLORS } from '../../lib/constants'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

function formatGroupTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (isToday) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ChatScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [otherPersonName, setOtherPersonName] = useState('Conversation')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const loadUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('users').select('id').eq('supabase_id', user.id).single()
    if (data) {
      setUserId(data.id)
      return data.id
    }
    return null
  }, [])

  const loadMessages = useCallback(async () => {
    if (!bookingId) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
    if (data) {
      setMessages(data)
      setLoading(false)
    }
  }, [bookingId])

  const loadOtherPerson = useCallback(async (myId: string) => {
    if (!bookingId) return
    const { data: booking } = await supabase
      .from('bookings')
      .select('driver_id, host_id, driver:users!bookings_driver_id_fkey(full_name), host:users!bookings_host_id_fkey(full_name)')
      .eq('id', bookingId)
      .single()

    if (booking) {
      const isDriver = booking.driver_id === myId
      const other = isDriver ? (booking as any).host : (booking as any).driver
      setOtherPersonName(other?.full_name ?? 'Utilisateur')
    }
  }, [bookingId])

  useEffect(() => {
    let mounted = true

    async function init() {
      const myId = await loadUser()
      await loadMessages()
      if (myId) await loadOtherPerson(myId)

      if (!bookingId || !mounted) return

      // Subscribe to realtime new messages
      const channel = supabase
        .channel(`chat-${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `booking_id=eq.${bookingId}`,
          },
          (payload) => {
            if (!mounted) return
            setMessages((prev) => {
              // avoid duplicates
              if (prev.some((m) => m.id === payload.new.id)) return prev
              return [...prev, payload.new as Message]
            })
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    init()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [bookingId, loadUser, loadMessages, loadOtherPerson])

  async function handleSend() {
    if (!text.trim() || !userId || !bookingId) return
    const content = text.trim()
    setText('')
    setSending(true)
    await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: userId,
      content,
    })
    setSending(false)
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={COLORS.dark} size={20} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{otherPersonName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Aucun message — commencez la conversation</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMine = item.sender_id === userId
          const prevMsg = index > 0 ? messages[index - 1] : null
          const showTimestamp =
            !prevMsg ||
            new Date(item.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000

          return (
            <View>
              {showTimestamp && (
                <Text style={styles.timestamp}>{formatGroupTime(item.created_at)}</Text>
              )}
              <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            </View>
          )
        }}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Votre message..."
            placeholderTextColor={COLORS.gray400}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.7}
          >
            {sending
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Send color={COLORS.white} size={18} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },

  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray400,
    textAlign: 'center',
  },

  // Timestamp
  timestamp: {
    fontSize: 11,
    color: COLORS.gray400,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '500',
  },

  // Bubbles
  bubbleWrap: {
    marginBottom: 4,
  },
  bubbleWrapMine: {
    alignItems: 'flex-end',
  },
  bubbleWrapOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.gray100,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: COLORS.white,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: COLORS.dark,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
