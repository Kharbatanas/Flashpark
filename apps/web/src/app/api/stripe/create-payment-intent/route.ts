import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { db, bookings, users } from '@flashpark/db'
import { eq } from 'drizzle-orm'
import { rateLimit, getClientIp } from '../../../../lib/rate-limit'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  // Rate limit: 10 payment intents per minute per IP
  const ip = getClientIp(request)
  const rl = rateLimit(`payment:${ip}`, { limit: 10, windowSec: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requetes' }, { status: 429, headers: rl.headers })
  }

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

  let bookingId: string
  try {
    const body = await request.json()
    bookingId = body.bookingId
    if (!bookingId) throw new Error('bookingId manquant')
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  // Fetch booking
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  })

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (booking.driverId !== dbUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const totalCents = Math.round(Number(booking.totalPrice) * 100)
  const feeCents = Math.round(Number(booking.platformFee) * 100)

  if (totalCents < 50) {
    return NextResponse.json({ error: 'Montant trop faible' }, { status: 400 })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'eur',
      application_fee_amount: feeCents,
      metadata: {
        bookingId: booking.id,
        userId: user.id,
      },
    })

    // Update booking with paymentIntentId
    await db
      .update(bookings)
      .set({ stripePaymentIntentId: paymentIntent.id })
      .where(eq(bookings.id, bookingId))

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la creation du paiement' },
      { status: 500 }
    )
  }
}
