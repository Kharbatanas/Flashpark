import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, full_name, stripe_account_id')
    .eq('supabase_id', user.id)
    .single()
  if (!dbUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  let spotId: string, startTime: string, endTime: string
  try {
    const body = await request.json()
    spotId = body.spotId
    startTime = body.startTime
    endTime = body.endTime
    if (!spotId || !startTime || !endTime) throw new Error('Missing fields')
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const start = new Date(startTime)
  const end = new Date(endTime)

  if (start >= end) return NextResponse.json({ error: 'Dates invalides' }, { status: 400 })

  const { data: spot } = await supabase
    .from('spots')
    .select('id, title, address, price_per_hour, host_id, status')
    .eq('id', spotId)
    .eq('status', 'active')
    .single()
  if (!spot) return NextResponse.json({ error: 'Place non disponible' }, { status: 404 })

  const { data: host } = await supabase
    .from('users')
    .select('id, stripe_account_id')
    .eq('id', spot.host_id)
    .single()
  if (!host?.stripe_account_id) {
    return NextResponse.json(
      { error: "L'hôte n'a pas encore configuré ses paiements" },
      { status: 400 }
    )
  }

  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  const pricePerHour = parseFloat(spot.price_per_hour)
  const totalPrice = Math.round(hours * pricePerHour * 100) / 100
  const platformFee = Math.round(totalPrice * 0.2 * 100) / 100
  const hostPayout = Math.round((totalPrice - platformFee) * 100) / 100

  // Check conflicts (strict boundary: adjacent bookings are allowed)
  const { data: conflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('spot_id', spotId)
    .not('status', 'in', '("cancelled","refunded")')
    .or(
      `and(start_time.gt.${start.toISOString()},start_time.lt.${end.toISOString()}),` +
      `and(end_time.gt.${start.toISOString()},end_time.lt.${end.toISOString()}),` +
      `and(start_time.lte.${start.toISOString()},end_time.gte.${end.toISOString()})`
    )
    .limit(1)
    .maybeSingle()

  if (conflict) {
    return NextResponse.json({ error: 'Créneau déjà réservé' }, { status: 409 })
  }

  // Insert booking
  const { data: inserted, error: insertError } = await supabase
    .from('bookings')
    .insert({
      driver_id: dbUser.id,
      spot_id: spotId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      total_price: String(totalPrice),
      platform_fee: String(platformFee),
      host_payout: String(hostPayout),
      status: 'pending',
    })
    .select()
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500 })
  }

  const booking = inserted

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    payment_intent_data: {
      transfer_data: {
        destination: host.stripe_account_id,
      },
    },
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: spot.title,
            description: `${spot.address} — ${hours % 1 === 0 ? hours : hours.toFixed(1)}h de parking`,
          },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id,
      driverEmail: user.email ?? '',
      driverName: dbUser.full_name ?? '',
      spotTitle: spot.title,
      spotAddress: spot.address,
    },
    customer_email: user.email ?? undefined,
    success_url: `${appUrl}/booking/${booking.id}?success=true`,
    cancel_url: `${appUrl}/spot/${spotId}?cancelled=true`,
  })

  // payment_intent may be null at session creation; webhook will update it on completion
  if (typeof session.payment_intent === 'string') {
    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: session.payment_intent })
      .eq('id', booking.id)
  }

  return NextResponse.json({ url: session.url, bookingId: booking.id })
}
