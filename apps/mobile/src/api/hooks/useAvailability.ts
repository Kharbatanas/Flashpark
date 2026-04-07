import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { Availability } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const availabilityKeys = {
  all: ['availability'] as const,
  forSpot: (spotId: string) => [...availabilityKeys.all, 'spot', spotId] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchAvailability(spotId: string): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('spot_id', spotId)
    .gte('end_time', new Date().toISOString())
    .order('start_time', { ascending: true })

  if (error) throw new Error(`Impossible de charger les disponibilités: ${error.message}`)
  return data as Availability[]
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CreateAvailabilityInput {
  spot_id: string
  start_time: string
  end_time: string
  is_available: boolean
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useAvailability(spotId: string) {
  return useQuery({
    queryKey: availabilityKeys.forSpot(spotId),
    queryFn: () => fetchAvailability(spotId),
    enabled: Boolean(spotId),
  })
}

export function useCreateAvailabilityBlock() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAvailabilityInput): Promise<Availability> => {
      const { data, error } = await supabase
        .from('availability')
        .insert(input)
        .select()
        .single()

      if (error) throw new Error(`Impossible de bloquer ce créneau: ${error.message}`)
      return data as Availability
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: availabilityKeys.forSpot(vars.spot_id) })
    },
  })
}

export function useDeleteAvailabilityBlock() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, spot_id }: { id: string; spot_id: string }): Promise<void> => {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', id)

      if (error) throw new Error(`Impossible de supprimer ce créneau: ${error.message}`)
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: availabilityKeys.forSpot(vars.spot_id) })
    },
  })
}
