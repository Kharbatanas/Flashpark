import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { rateLimit, getClientIp } from '../../../../lib/rate-limit'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
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

  const supabase = createSupabaseServerClient()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (!bookingId) {
        return NextResponse.json({ received: true })
      }

      // Cross-validate: booking must exist and be in a confirmable state
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', bookingId)
        .single()

      if (!booking || booking.status === 'cancelled' || booking.status === 'refunded') {
        return NextResponse.json({ received: true })
      }

      // Store the actual PaymentIntent ID (may be null at session creation time)
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : null

      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const bookingId = paymentIntent.metadata?.bookingId

      if (!bookingId) {
        return NextResponse.json({ received: true })
      }

      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
    }

    // Abandoned session cleanup — user opened checkout but never paid
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingId = session.metadata?.bookingId

      if (!bookingId) {
        return NextResponse.json({ received: true })
      }

      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null

      if (paymentIntentId) {
        await supabase
          .from('bookings')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntentId)
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
        await supabase
          .from('users')
          .update({ is_verified: true, updated_at: new Date().toISOString() })
          .eq('stripe_account_id', account.id)
      } else if (!account.charges_enabled) {
        // Account was disabled — remove verification
        await supabase
          .from('users')
          .update({ is_verified: false, updated_at: new Date().toISOString() })
          .eq('stripe_account_id', account.id)
      }
    }
  } catch {
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
