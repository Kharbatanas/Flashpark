import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { bookingKeys } from '../hooks/useBookings'

export function useRealtimeBookingStatus(bookingId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!bookingId) return

    const channel = supabase
      .channel(`booking:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) })
          qc.invalidateQueries({ queryKey: bookingKeys.lists() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId, qc])
}
