import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { db, users } from '@flashpark/db'
import { eq } from 'drizzle-orm'

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

  const isHost = dbUser.role === 'host' || dbUser.role === 'both' || dbUser.role === 'admin'
  if (!isHost) {
    return NextResponse.json({ error: 'Accès réservé aux hôtes' }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Reuse existing account if already created
  let accountId = dbUser.stripeAccountId

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: dbUser.email,
      capabilities: {
        transfers: { requested: true },
      },
    })
    accountId = account.id

    await db
      .update(users)
      .set({ stripeAccountId: accountId, updatedAt: new Date() })
      .where(eq(users.id, dbUser.id))
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/api/stripe/connect`,
    return_url: `${appUrl}/api/stripe/connect/callback`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
