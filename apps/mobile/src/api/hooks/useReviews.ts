import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { Review } from '../../types/database'
import { spotKeys } from './useSpots'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const reviewKeys = {
  all: ['reviews'] as const,
  forSpot: (spotId: string) => [...reviewKeys.all, 'spot', spotId] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchSpotReviews(spotId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('spot_id', spotId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Impossible de charger les avis: ${error.message}`)
  return data as Review[]
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useSpotReviews(spotId: string) {
  return useQuery({
    queryKey: reviewKeys.forSpot(spotId),
    queryFn: () => fetchSpotReviews(spotId),
    enabled: Boolean(spotId),
  })
}

interface CreateReviewInput {
  booking_id: string
  spot_id: string
  rating_access: number
  rating_accuracy: number
  rating_cleanliness: number
  comment?: string
}

export function useCreateReview() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (input: CreateReviewInput): Promise<Review> => {
      const { data, error } = await supabase
        .from('reviews')
        .insert({ ...input, reviewer_id: user!.id })
        .select()
        .single()

      if (error) throw new Error(`Impossible de publier l'avis: ${error.message}`)
      return data as Review
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: reviewKeys.forSpot(vars.spot_id) })
      qc.invalidateQueries({ queryKey: spotKeys.detail(vars.spot_id) })
    },
  })
}
