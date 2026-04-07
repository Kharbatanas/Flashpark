import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function POST(_request: Request, { params }: RouteParams) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Get the user's internal ID
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_id', user.id)
    .single()

  if (!dbUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  // Fetch the booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, driver_id')
    .eq('id', params.id)
    .eq('driver_id', dbUser.id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (booking.status === 'active' || booking.status === 'completed') {
    return NextResponse.json(
      { error: "Impossible d'annuler une réservation active ou terminée" },
      { status: 400 }
    )
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ error: 'Réservation déjà annulée' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: dbUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('driver_id', dbUser.id)
    .in('status', ['pending', 'confirmed'])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Échec de l\'annulation' }, { status: 500 })
  }

  return NextResponse.json({ success: true, booking: updated })
}
