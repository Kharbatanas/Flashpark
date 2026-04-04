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
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('spots')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Place introuvable' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
