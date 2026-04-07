'use server'

import { createSupabaseServerClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '../../lib/audit'

export async function updateVerificationDoc(
  docId: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()

  const updates: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
  }
  if (adminNotes) updates.admin_notes = adminNotes

  const { error } = await supabase
    .from('verification_documents')
    .update(updates)
    .eq('id', docId)

  if (error) {
    return { ok: false, error: 'Impossible de mettre a jour le document' }
  }

  logAudit({ action: 'verification.update', targetId: docId, details: { status, adminNotes } })
  revalidatePath('/verification')
  return { ok: true }
}

export async function approveSpot(
  spotId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('spots')
    .update({ status: 'active', verified_at: new Date().toISOString() })
    .eq('id', spotId)

  if (error) {
    return { ok: false, error: "Impossible d'approuver l'annonce" }
  }

  logAudit({ action: 'spot.approve', targetId: spotId, details: {} })
  revalidatePath('/verification')
  return { ok: true }
}

export async function rejectSpot(
  spotId: string,
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()

  const updates: Record<string, unknown> = { status: 'inactive' }
  if (notes.trim()) updates.admin_notes = notes

  const { error } = await supabase
    .from('spots')
    .update(updates)
    .eq('id', spotId)

  if (error) {
    return { ok: false, error: "Impossible de rejeter l'annonce" }
  }

  logAudit({ action: 'spot.reject', targetId: spotId, details: { notes } })
  revalidatePath('/verification')
  return { ok: true }
}
