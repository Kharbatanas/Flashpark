import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { db, bookings, spots, users } from '@flashpark/db'
import { eq, and, or, not, gt, lt, lte, gte } from 'drizzle-orm'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const dbUser = await db.query.users.findFirst({ where: eq(users.supabaseId, user.id) })
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

  const spot = await db.query.spots.findFirst({
    where: and(eq(spots.id, spotId), eq(spots.status, 'active')),
  })
  if (!spot) return NextResponse.json({ error: 'Place non disponible' }, { status: 404 })

  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  const pricePerHour = parseFloat(spot.pricePerHour)
  const totalPrice = Math.round(hours * pricePerHour * 100) / 100
  const platformFee = Math.round(totalPrice * 0.2 * 100) / 100
  const hostPayout = Math.round((totalPrice - platformFee) * 100) / 100

  // TRANSACTION: conflict check + insert (atomic — prevents race condition)
  let booking: typeof bookings.$inferSelect
  try {
    const [inserted] = await db.transaction(async (tx) => {
      // Check conflicts (strict boundary: adjacent bookings are allowed)
      const conflict = await tx.query.bookings.findFirst({
        where: and(
          eq(bookings.spotId, spotId),
          not(eq(bookings.status, 'cancelled')),
          not(eq(bookings.status, 'refunded')),
          or(
            and(gt(bookings.startTime, start), lt(bookings.startTime, end)),
            and(gt(bookings.endTime, start), lt(bookings.endTime, end)),
            and(lte(bookings.startTime, start), gte(bookings.endTime, end))
          )
        ),
      })
      if (conflict) {
        throw new Error('CONFLICT')
      }

      return tx
        .insert(bookings)
        .values({
          driverId: dbUser.id,
          spotId,
          startTime: start,
          endTime: end,
          totalPrice: String(totalPrice),
          platformFee: String(platformFee),
          hostPayout: String(hostPayout),
          status: 'pending',
        })
        .returning()
    })
    booking = inserted
  } catch (err) {
    if (err instanceof Error && err.message === 'CONFLICT') {
      return NextResponse.json({ error: 'Créneau déjà réservé' }, { status: 409 })
    }
    throw err
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
      driverName: dbUser.fullName ?? '',
      spotTitle: spot.title,
      spotAddress: spot.address,
    },
    customer_email: user.email ?? undefined,
    success_url: `${appUrl}/booking/${booking.id}?success=true`,
    cancel_url: `${appUrl}/spot/${spotId}?cancelled=true`,
  })

  // payment_intent may be null at session creation; webhook will update it on completion
  if (typeof session.payment_intent === 'string') {
    await db
      .update(bookings)
      .set({ stripePaymentIntentId: session.payment_intent })
      .where(eq(bookings.id, booking.id))
  }

  return NextResponse.json({ url: session.url, bookingId: booking.id })
}
