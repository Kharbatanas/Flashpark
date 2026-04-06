'use server'

import { createSupabaseServerClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '../../lib/audit'

export async function deleteReview(reviewId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)

  if (error) {
    return { ok: false, error: 'Impossible de supprimer cet avis' }
  }

  logAudit({ action: 'review.delete', targetId: reviewId })
  revalidatePath('/reviews')
  return { ok: true }
}
