import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { Vehicle, VehicleType, VehicleSizeCategory } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const vehicleKeys = {
  all: ['vehicles'] as const,
  mine: (userId: string) => [...vehicleKeys.all, 'mine', userId] as const,
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CreateVehicleInput {
  license_plate: string
  brand?: string
  model?: string
  color?: string
  type: VehicleType
  height?: number
  width?: number
  length?: number
  size_category: VehicleSizeCategory
  is_electric: boolean
  is_default: boolean
}

interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
  id: string
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchVehicles(userId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('owner_id', userId)
    .order('is_default', { ascending: false })

  if (error) throw new Error(`Impossible de charger les véhicules: ${error.message}`)
  return data as Vehicle[]
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useVehicles() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: vehicleKeys.mine(user?.id ?? ''),
    queryFn: () => fetchVehicles(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: CreateVehicleInput): Promise<Vehicle> => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({ ...input, owner_id: user!.id })
        .select()
        .single()

      if (error) throw new Error(`Impossible d'ajouter le véhicule: ${error.message}`)
      return data as Vehicle
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.mine(user?.id ?? '') })
    },
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateVehicleInput): Promise<Vehicle> => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(`Impossible de modifier le véhicule: ${error.message}`)
      return data as Vehicle
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.mine(user?.id ?? '') })
    },
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (vehicleId: string): Promise<void> => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw new Error(`Impossible de supprimer le véhicule: ${error.message}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.mine(user?.id ?? '') })
    },
  })
}
