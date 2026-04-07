import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { rateLimit, getClientIp } from '../../../../lib/rate-limit'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
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

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_id', user.id)
    .single()

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
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, driver_id, total_price, platform_fee')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (booking.driver_id !== dbUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const totalCents = Math.round(Number(booking.total_price) * 100)
  const feeCents = Math.round(Number(booking.platform_fee) * 100)

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
    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', bookingId)

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la creation du paiement' },
      { status: 500 }
    )
  }
}
