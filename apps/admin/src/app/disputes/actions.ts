'use server'

import { createSupabaseServerClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '../../lib/audit'

export async function resolveDispute(
  disputeId: string,
  resolution: string,
  status: 'resolved_refunded' | 'resolved_rejected' | 'resolved_compensation',
  refundAmount: number | null,
  addStrike: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()

  const { data: dispute, error: fetchError } = await supabase
    .from('disputes')
    .select('id, booking_id, reported_user_id')
    .eq('id', disputeId)
    .single()

  if (fetchError || !dispute) {
    return { ok: false, error: 'Litige introuvable' }
  }

  const { error: updateError } = await supabase
    .from('disputes')
    .update({
      status,
      resolution,
      admin_notes: resolution,
      refund_amount: refundAmount,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId)

  if (updateError) {
    return { ok: false, error: 'Impossible de mettre a jour le litige' }
  }

  if (status === 'resolved_refunded' && dispute.booking_id) {
    await supabase
      .from('bookings')
      .update({ status: 'refunded' })
      .eq('id', dispute.booking_id)
  }

  if (addStrike && dispute.reported_user_id) {
    await supabase.from('host_strikes').insert({
      host_id: dispute.reported_user_id,
      dispute_id: disputeId,
      reason: resolution,
      created_at: new Date().toISOString(),
    })

    const { count } = await supabase
      .from('host_strikes')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', dispute.reported_user_id)

    if (count !== null && count >= 3) {
      await supabase
        .from('spots')
        .update({ status: 'inactive' })
        .eq('host_id', dispute.reported_user_id)
        .eq('status', 'active')
    }
  }

  logAudit({
    action: 'dispute.resolve',
    targetId: disputeId,
    details: { status, resolution, refundAmount, addStrike },
  })

  revalidatePath('/disputes')
  return { ok: true }
}

export async function updateDisputeStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase
    .from('disputes')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { ok: false, error: 'Impossible de mettre a jour le statut' }
  }

  logAudit({
    action: 'dispute.status_update',
    targetId: id,
    details: { status },
  })

  revalidatePath('/disputes')
  return { ok: true }
}
