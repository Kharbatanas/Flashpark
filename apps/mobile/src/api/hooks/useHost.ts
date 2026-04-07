import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { Booking, BookingStatus, Spot, HostStats } from '../../types/database'
import { bookingKeys } from './useBookings'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const hostKeys = {
  all: ['host'] as const,
  stats: (hostId: string) => [...hostKeys.all, 'stats', hostId] as const,
  bookings: (hostId: string, status?: string) =>
    [...hostKeys.all, 'bookings', hostId, status ?? 'all'] as const,
  listings: (hostId: string) => [...hostKeys.all, 'listings', hostId] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchHostStats(hostId: string): Promise<HostStats> {
  // First get spot IDs for this host
  const { data: spotData, error: spotErr } = await supabase
    .from('spots')
    .select('id')
    .eq('host_id', hostId)
  if (spotErr) throw new Error(`Impossible de charger les stats: ${spotErr.message}`)
  const spotIds = (spotData ?? []).map((s: { id: string }) => s.id)

  const [earningsRes, spotsRes, pendingRes, totalRes] = await Promise.all([
    spotIds.length > 0
      ? supabase.from('bookings').select('host_payout').eq('status', 'completed').in('spot_id', spotIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('spots').select('id', { count: 'exact', head: true }).eq('host_id', hostId).eq('status', 'active'),
    spotIds.length > 0
      ? supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending').in('spot_id', spotIds)
      : Promise.resolve({ count: 0, error: null }),
    spotIds.length > 0
      ? supabase.from('bookings').select('id', { count: 'exact', head: true }).in('spot_id', spotIds)
      : Promise.resolve({ count: 0, error: null }),
  ])

  if (earningsRes.error) throw new Error(`Impossible de charger les stats: ${earningsRes.error.message}`)

  const totalEarnings = (earningsRes.data ?? []).reduce(
    (sum: number, row: { host_payout: string }) => sum + parseFloat(row.host_payout),
    0
  )

  return {
    total_earnings: totalEarnings,
    active_spots: spotsRes.count ?? 0,
    pending_bookings: pendingRes.count ?? 0,
    total_bookings: totalRes.count ?? 0,
  }
}

async function fetchHostBookings(hostId: string, status?: string): Promise<Booking[]> {
  const spotIds = await supabase
    .from('spots')
    .select('id')
    .eq('host_id', hostId)

  if (spotIds.error) throw new Error(`Impossible de charger les réservations: ${spotIds.error.message}`)

  const ids = (spotIds.data ?? []).map((s: { id: string }) => s.id)
  if (ids.length === 0) return []

  let query = supabase
    .from('bookings')
    .select('*')
    .in('spot_id', ids)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status as BookingStatus)
  }

  const { data, error } = await query
  if (error) throw new Error(`Impossible de charger les réservations: ${error.message}`)
  return data as Booking[]
}

async function fetchHostListings(hostId: string): Promise<Spot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Impossible de charger vos annonces: ${error.message}`)
  return data as Spot[]
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useHostStats() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: hostKeys.stats(user?.id ?? ''),
    queryFn: () => fetchHostStats(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useHostBookings(status?: string) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: hostKeys.bookings(user?.id ?? '', status),
    queryFn: () => fetchHostBookings(user!.id, status),
    enabled: Boolean(user?.id),
  })
}

export function useHostListings() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: hostKeys.listings(user?.id ?? ''),
    queryFn: () => fetchHostListings(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useAcceptBooking() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (bookingId: string): Promise<void> => {
      const qrCode = `flashpark-${bookingId}-${Date.now()}`

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' as BookingStatus, qr_code: qrCode })
        .eq('id', bookingId)

      if (error) throw new Error(`Impossible d'accepter la réservation: ${error.message}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hostKeys.bookings(user?.id ?? '') })
      qc.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}

export function useRejectBooking() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (bookingId: string): Promise<void> => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled' as BookingStatus,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user!.id,
        })
        .eq('id', bookingId)

      if (error) throw new Error(`Impossible de refuser la réservation: ${error.message}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hostKeys.bookings(user?.id ?? '') })
      qc.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}
