import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'

const VALID_STATUSES = ['active', 'inactive', 'pending_review']

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { status } = body as { status?: string }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Statut invalide: ${status}` }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServerClient()

    // Update the status and return the updated row to verify it worked
    const { data: updated, error: updateError } = await supabase
      .from('spots')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single()

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json(
        { error: `Erreur de mise à jour: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updated) {
      return NextResponse.json(
        { error: 'Place introuvable ou mise à jour impossible' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, previousStatus: updated.status, newStatus: status })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: `Erreur serveur: ${err instanceof Error ? err.message : 'inconnue'}` },
      { status: 500 }
    )
  }
}
