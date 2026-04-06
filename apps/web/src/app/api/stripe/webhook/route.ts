import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, bookings, users } from '@flashpark/db'
import { eq } from 'drizzle-orm'
import { rateLimit, getClientIp } from '../../../../lib/rate-limit'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  // Rate limit: 100 webhook events per minute per IP (Stripe sends bursts)
  const ip = getClientIp(request)
  const rl = rateLimit(`webhook:${ip}`, { limit: 100, windowSec: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: rl.headers })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (!bookingId) {
        return NextResponse.json({ received: true })
      }

      // Cross-validate: booking must exist and be in a confirmable state
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      })
      if (!booking || booking.status === 'cancelled' || booking.status === 'refunded') {
        return NextResponse.json({ received: true })
      }

      // Store the actual PaymentIntent ID (may be null at session creation time)
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null

      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const bookingId = paymentIntent.metadata?.bookingId

      if (!bookingId) {
        return NextResponse.json({ received: true })
      }

      await db
        .update(bookings)
        .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(bookings.id, bookingId))
    }

    // Abandoned session cleanup — user opened checkout but never paid
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (!bookingId) {
        return NextResponse.json({ received: true })
      }

      await db
        .update(bookings)
        .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(bookings.id, bookingId))
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null

      if (paymentIntentId) {
        await db
          .update(bookings)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(bookings.stripePaymentIntentId, paymentIntentId))
      }
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account
      // Full verification: charges enabled AND no outstanding requirements
      const isFullyVerified =
        account.charges_enabled &&
        account.payouts_enabled &&
        (!account.requirements?.currently_due?.length) &&
        (!account.requirements?.past_due?.length)

      if (isFullyVerified) {
        await db
          .update(users)
          .set({ isVerified: true, updatedAt: new Date() })
          .where(eq(users.stripeAccountId, account.id))
      } else if (!account.charges_enabled) {
        // Account was disabled — remove verification
        await db
          .update(users)
          .set({ isVerified: false, updatedAt: new Date() })
          .where(eq(users.stripeAccountId, account.id))
      }
    }
  } catch {
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
