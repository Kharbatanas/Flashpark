import { useEffect, useState, useRef } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
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

export default function ChatScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    loadUser()
    loadMessages()
    const interval = setInterval(loadMessages, 8000)
    return () => clearInterval(interval)
  }, [bookingId])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('users').select('id').eq('supabase_id', user.id).single()
    if (data) setUserId(data.id)
  }

  async function loadMessages() {
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
  }

  async function handleSend() {
    if (!text.trim() || !userId || !bookingId) return
    setSending(true)
    await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: userId,
      content: text.trim(),
    })
    setText('')
    setSending(false)
    loadMessages()
    setTimeout(() => flatListRef.current?.scrollToEnd(), 200)
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
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Aucun message — commencez la conversation</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.sender_id === userId
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, isMine && { color: COLORS.white }]}>
                {item.content}
              </Text>
              <Text style={[styles.bubbleTime, isMine && { color: 'rgba(255,255,255,0.6)' }]}>
                {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
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
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Send color={COLORS.white} size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: COLORS.gray100 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  messagesList: { padding: 16, gap: 8, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.gray400 },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: COLORS.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.gray200 },
  bubbleText: { fontSize: 14, color: COLORS.dark, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: COLORS.gray400, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: COLORS.gray200, backgroundColor: COLORS.white,
  },
  input: {
    flex: 1, backgroundColor: COLORS.gray100, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.dark,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
})
