import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'
import { db, bookings, users } from '@flashpark/db'
import { and, eq } from 'drizzle-orm'

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

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, params.id), eq(bookings.driverId, dbUser.id)),
  })

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

  await db
    .update(bookings)
    .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: dbUser.id })
    .where(eq(bookings.id, params.id))

  return NextResponse.redirect(new URL('/dashboard', _request.url))
}
