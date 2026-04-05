import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'

const VALID_STATUSES = ['active', 'inactive', 'pending_review']

/**
 * Verify that the request comes from an authenticated admin user.
 * Returns the user ID on success, or a NextResponse error on failure.
 */
async function verifyAdmin(): Promise<{ userId: string } | NextResponse> {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Read-only in route handlers — no-op
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Check admin role using service-role client (bypasses RLS)
  const adminClient = createSupabaseServerClient()
  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Accès interdit — rôle admin requis' }, { status: 403 })
  }

  return { userId: user.id }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  // --- Auth check ---
  const authResult = await verifyAdmin()
  if (authResult instanceof NextResponse) return authResult

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
