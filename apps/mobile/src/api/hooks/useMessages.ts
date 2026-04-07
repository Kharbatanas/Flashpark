import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { Message, Conversation } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const messageKeys = {
  all: ['messages'] as const,
  conversations: (userId: string) => [...messageKeys.all, 'conversations', userId] as const,
  thread: (bookingId: string) => [...messageKeys.all, 'thread', bookingId] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchConversations(userId: string): Promise<Conversation[]> {
  // Fetch bookings where user is driver or host (via spot)
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, driver_id, spot:spots(id, title, photos)')
    .or(`driver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (bookingsError) throw new Error(`Impossible de charger les conversations: ${bookingsError.message}`)

  const bookingIds = (bookings ?? []).map((b: { id: string }) => b.id)
  if (bookingIds.length === 0) return []

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: false })

  if (msgError) throw new Error(`Impossible de charger les messages: ${msgError.message}`)

  type SpotItem = { id: string; title: string; photos: string[] }
  type BookingRow = { id: string; driver_id: string; spot: SpotItem | SpotItem[] }

  const bookingMap = new Map<string, BookingRow>(
    ((bookings as unknown) as BookingRow[]).map((b) => [b.id, b])
  )

  const grouped = new Map<string, Conversation>()
  for (const msg of (messages ?? []) as Message[]) {
    if (!grouped.has(msg.booking_id)) {
      const booking = bookingMap.get(msg.booking_id)
      if (!booking) continue
      const otherUserId =
        booking.driver_id === userId ? msg.sender_id : booking.driver_id
      const spotItem = Array.isArray(booking.spot) ? booking.spot[0] : booking.spot
      grouped.set(msg.booking_id, {
        booking_id: msg.booking_id,
        latest_message: msg,
        other_user_id: otherUserId,
        spot: spotItem,
        unread_count: 0,
      })
    }
  }
  return Array.from(grouped.values())
}

async function fetchMessages(bookingId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Impossible de charger les messages: ${error.message}`)
  return data as Message[]
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useConversations() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: messageKeys.conversations(user?.id ?? ''),
    queryFn: () => fetchConversations(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useMessages(bookingId: string) {
  return useQuery({
    queryKey: messageKeys.thread(bookingId),
    queryFn: () => fetchMessages(bookingId),
    enabled: Boolean(bookingId),
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: { booking_id: string; content: string }): Promise<Message> => {
      const { data, error } = await supabase
        .from('messages')
        .insert({ ...input, sender_id: user!.id })
        .select()
        .single()

      if (error) throw new Error(`Envoi impossible: ${error.message}`)
      return data as Message
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: messageKeys.thread(vars.booking_id) })
      qc.invalidateQueries({ queryKey: messageKeys.conversations(user?.id ?? '') })
    },
  })
}
