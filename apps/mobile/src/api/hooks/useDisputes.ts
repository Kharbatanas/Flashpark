import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { Dispute, DisputeType } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const disputeKeys = {
  all: ['disputes'] as const,
  mine: (userId: string) => [...disputeKeys.all, 'mine', userId] as const,
  forBooking: (bookingId: string) => [...disputeKeys.all, 'booking', bookingId] as const,
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CreateDisputeInput {
  booking_id: string
  reported_user_id?: string
  type: DisputeType
  description: string
  photos: string[]
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchMyDisputes(userId: string): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Impossible de charger les litiges: ${error.message}`)
  return data as Dispute[]
}

async function fetchDisputeByBooking(bookingId: string): Promise<Dispute | null> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (error) throw new Error(`Impossible de charger le litige: ${error.message}`)
  return data as Dispute | null
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useMyDisputes() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: disputeKeys.mine(user?.id ?? ''),
    queryFn: () => fetchMyDisputes(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useDisputeByBooking(bookingId: string) {
  return useQuery({
    queryKey: disputeKeys.forBooking(bookingId),
    queryFn: () => fetchDisputeByBooking(bookingId),
    enabled: Boolean(bookingId),
  })
}

export function useCreateDispute() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: CreateDisputeInput): Promise<Dispute> => {
      const { data, error } = await supabase
        .from('disputes')
        .insert({ ...input, reporter_id: user!.id })
        .select()
        .single()

      if (error) throw new Error(`Impossible d'ouvrir un litige: ${error.message}`)
      return data as Dispute
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: disputeKeys.mine(user?.id ?? '') })
      qc.invalidateQueries({ queryKey: disputeKeys.forBooking(vars.booking_id) })
    },
  })
}
