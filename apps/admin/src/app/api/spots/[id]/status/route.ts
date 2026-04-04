import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'

const VALID_STATUSES = ['active', 'inactive', 'pending_review']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // First check the spot exists
    const { data: spot, error: fetchError } = await supabase
      .from('spots')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !spot) {
      return NextResponse.json(
        { error: `Place introuvable: ${fetchError?.message ?? 'ID invalide'}` },
        { status: 404 }
      )
    }

    // Update the status
    const { error: updateError } = await supabase
      .from('spots')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json(
        { error: `Erreur de mise à jour: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, previousStatus: spot.status, newStatus: status })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: `Erreur serveur: ${err instanceof Error ? err.message : 'inconnue'}` },
      { status: 500 }
    )
  }
}
