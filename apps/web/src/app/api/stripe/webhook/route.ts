import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, bookings } from '@flashpark/db'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (!bookingId) {
        console.error('checkout.session.completed: missing bookingId in metadata', session.id)
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
        console.error('payment_intent.payment_failed: missing bookingId in metadata', paymentIntent.id)
        return NextResponse.json({ received: true })
      }

      await db
        .update(bookings)
        .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(bookings.id, bookingId))
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Internal handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
