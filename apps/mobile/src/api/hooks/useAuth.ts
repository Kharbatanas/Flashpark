import { useQuery } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { DbUser, UserStats } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const authKeys = {
  all: ['auth'] as const,
  profile: (userId: string) => [...authKeys.all, 'profile', userId] as const,
  stats: (userId: string) => [...authKeys.all, 'stats', userId] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchUserProfile(userId: string): Promise<DbUser> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`Profil introuvable: ${error.message}`)
  return data as DbUser
}

async function fetchUserStats(userId: string): Promise<UserStats> {
  const [bookingsRes, reviewsRes, userRes] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('driver_id', userId),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', userId),
    supabase.from('users').select('created_at').eq('id', userId).single(),
  ])

  if (bookingsRes.error) throw new Error(`Impossible de charger les statistiques: ${bookingsRes.error.message}`)
  if (reviewsRes.error) throw new Error(`Impossible de charger les statistiques: ${reviewsRes.error.message}`)
  if (userRes.error) throw new Error(`Impossible de charger les statistiques: ${userRes.error.message}`)

  return {
    booking_count: bookingsRes.count ?? 0,
    review_count: reviewsRes.count ?? 0,
    member_since: (userRes.data as { created_at: string }).created_at,
  }
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useCurrentUser(): DbUser | null {
  return useAuthStore((s) => s.user)
}

export function useUserProfile(userId?: string) {
  const currentUser = useAuthStore((s) => s.user)
  const targetId = userId ?? currentUser?.id

  return useQuery({
    queryKey: authKeys.profile(targetId ?? ''),
    queryFn: () => fetchUserProfile(targetId!),
    enabled: Boolean(targetId),
  })
}

export function useUserStats(userId?: string) {
  const currentUser = useAuthStore((s) => s.user)
  const targetId = userId ?? currentUser?.id

  return useQuery({
    queryKey: authKeys.stats(targetId ?? ''),
    queryFn: () => fetchUserStats(targetId!),
    enabled: Boolean(targetId),
  })
}
