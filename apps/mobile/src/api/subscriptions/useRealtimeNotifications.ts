import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { notificationKeys } from '../hooks/useNotifications'

export function useRealtimeNotifications() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: notificationKeys.mine(user.id) })
          qc.invalidateQueries({ queryKey: notificationKeys.unread(user.id) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, qc])
}
