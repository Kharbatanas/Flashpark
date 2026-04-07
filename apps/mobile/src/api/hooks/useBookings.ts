import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { Booking, BookingStatus, BookingWithSpot } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (userId: string) => [...bookingKeys.lists(), userId] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('driver_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Impossible de charger les réservations: ${error.message}`)
  return data as Booking[]
}

async function fetchBookingWithSpot(id: string): Promise<BookingWithSpot> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, spot:spots(*)')
    .eq('id', id)
    .single()

  if (error) throw new Error(`Réservation introuvable: ${error.message}`)
  return data as BookingWithSpot
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CreateBookingInput {
  spot_id: string
  vehicle_id: string | null
  start_time: string
  end_time: string
  total_price: number
  platform_fee: number
  host_payout: number
  stripe_payment_intent_id?: string
}

interface ExtendBookingInput {
  bookingId: string
  new_end_time: string
  additional_amount: number
}

interface CancelBookingInput {
  bookingId: string
  cancelled_by: string
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useBookings() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: bookingKeys.list(user?.id ?? ''),
    queryFn: () => fetchBookings(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => fetchBookingWithSpot(id),
    enabled: Boolean(id),
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: CreateBookingInput): Promise<Booking> => {
      const { data, error } = await supabase
        .from('bookings')
        .insert({ ...input, driver_id: user!.id })
        .select()
        .single()

      if (error) throw new Error(`Réservation impossible: ${error.message}`)
      return data as Booking
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}

export function useCheckIn(bookingId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase
        .from('bookings')
        .update({ checked_in_at: new Date().toISOString(), status: 'active' as BookingStatus })
        .eq('id', bookingId)

      if (error) throw new Error(`Check-in impossible: ${error.message}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) })
      qc.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}

export function useCheckOut(bookingId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase
        .from('bookings')
        .update({ checked_out_at: new Date().toISOString(), status: 'completed' as BookingStatus })
        .eq('id', bookingId)

      if (error) throw new Error(`Check-out impossible: ${error.message}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) })
      qc.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}

export function useExtendBooking() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: ExtendBookingInput): Promise<void> => {
      const { data: current, error: fetchError } = await supabase
        .from('bookings')
        .select('extension_count, total_price, host_payout, platform_fee')
        .eq('id', input.bookingId)
        .single()

      if (fetchError) throw new Error(`Réservation introuvable: ${fetchError.message}`)

      const { error } = await supabase
        .from('bookings')
        .update({
          end_time: input.new_end_time,
          extension_count: (current.extension_count as number) + 1,
          total_price: (parseFloat(current.total_price as string) + input.additional_amount).toFixed(2),
          host_payout: (parseFloat(current.host_payout as string) + input.additional_amount * 0.8).toFixed(2),
          platform_fee: (parseFloat(current.platform_fee as string) + input.additional_amount * 0.2).toFixed(2),
        })
        .eq('id', input.bookingId)

      if (error) throw new Error(`Extension impossible: ${error.message}`)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(vars.bookingId) })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CancelBookingInput): Promise<void> => {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled' as BookingStatus,
          cancelled_at: new Date().toISOString(),
          cancelled_by: input.cancelled_by,
        })
        .eq('id', input.bookingId)

      if (error) throw new Error(`Annulation impossible: ${error.message}`)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(vars.bookingId) })
      qc.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}

export function useMarkNoShow(bookingId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase
        .from('bookings')
        .update({ no_show: true, status: 'cancelled' as BookingStatus })
        .eq('id', bookingId)

      if (error) throw new Error(`Impossible de marquer le no-show: ${error.message}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) })
      qc.invalidateQueries({ queryKey: bookingKeys.lists() })
    },
  })
}
