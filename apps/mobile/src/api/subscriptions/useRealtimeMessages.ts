import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { messageKeys } from '../hooks/useMessages'

export function useRealtimeMessages() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`messages:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const bookingId = (payload.new as { booking_id: string }).booking_id
          qc.invalidateQueries({ queryKey: messageKeys.thread(bookingId) })
          qc.invalidateQueries({ queryKey: messageKeys.conversations(user.id) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, qc])
}
