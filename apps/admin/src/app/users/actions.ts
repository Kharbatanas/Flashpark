'use server'

import { createSupabaseServerClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '../../lib/audit'

export async function toggleUserVerified(
  userId: string,
  currentlyVerified: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('users')
    .update({ is_verified: !currentlyVerified })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'Impossible de modifier la verification' }
  }

  logAudit({ action: 'user.verify_toggle', targetId: userId, details: { newVerified: !currentlyVerified } })
  revalidatePath('/users')
  return { ok: true }
}

export async function demoteUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from('users')
    .update({ role: 'driver', is_verified: false })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'Impossible de bannir cet utilisateur' }
  }

  logAudit({ action: 'user.demote', targetId: userId })
  revalidatePath('/users')
  return { ok: true }
}
