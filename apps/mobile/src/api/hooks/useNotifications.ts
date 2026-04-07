import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../client'
import { useAuthStore } from '../../stores/authStore'
import { Notification } from '../../types/database'

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  mine: (userId: string) => [...notificationKeys.all, 'mine', userId] as const,
  unread: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
}

// ─── Fetch Functions ────────────────────────────────────────────────────────────

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(`Impossible de charger les notifications: ${error.message}`)
  return data as Notification[]
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw new Error(`Impossible de compter les notifications: ${error.message}`)
  return count ?? 0
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: notificationKeys.mine(user?.id ?? ''),
    queryFn: () => fetchNotifications(user!.id),
    enabled: Boolean(user?.id),
  })
}

export function useUnreadCount() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: notificationKeys.unread(user?.id ?? ''),
    queryFn: () => fetchUnreadCount(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 30 * 1000, // refresh every 30 seconds
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user!.id)
        .is('read_at', null)

      if (error) throw new Error(`Impossible de marquer les notifications: ${error.message}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.mine(user?.id ?? '') })
      qc.invalidateQueries({ queryKey: notificationKeys.unread(user?.id ?? '') })
    },
  })
}
