import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const wishlistKeys = {
  all: ['wishlists'] as const,
  mine: (userId: string) => [...wishlistKeys.all, 'mine', userId] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchWishlistIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('wishlists')
    .select('spot_id')
    .eq('user_id', userId)

  if (error) throw new Error(`Impossible de charger les favoris: ${error.message}`)
  return (data ?? []).map((row: { spot_id: string }) => row.spot_id)
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useWishlist() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: wishlistKeys.mine(user?.id ?? ''),
    queryFn: () => fetchWishlistIds(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (spotId: string): Promise<void> => {
      const userId = user!.id
      const currentIds: string[] =
        qc.getQueryData(wishlistKeys.mine(userId)) ?? []
      const isFavorited = currentIds.includes(spotId)

      if (isFavorited) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', userId)
          .eq('spot_id', spotId)

        if (error) throw new Error(`Impossible de retirer des favoris: ${error.message}`)
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: userId, spot_id: spotId })

        if (error) throw new Error(`Impossible d'ajouter aux favoris: ${error.message}`)
      }
    },
    onMutate: async (spotId) => {
      const userId = user!.id
      const key = wishlistKeys.mine(userId)

      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<string[]>(key) ?? []

      const updated = previous.includes(spotId)
        ? previous.filter((id) => id !== spotId)
        : [...previous, spotId]

      qc.setQueryData(key, updated)
      return { previous }
    },
    onError: (_err, _spotId, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(wishlistKeys.mine(user!.id), ctx.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: wishlistKeys.mine(user?.id ?? '') })
    },
  })
}
