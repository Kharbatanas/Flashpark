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
    .select('id, email, role, stripe_account_id')
    .eq('supabase_id', user.id)
    .single()
  if (!dbUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const isHost = dbUser.role === 'host' || dbUser.role === 'both' || dbUser.role === 'admin'
  if (!isHost) {
    return NextResponse.json({ error: 'Accès réservé aux hôtes' }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Reuse existing account if already created
  let accountId = dbUser.stripe_account_id

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

    await supabase
      .from('users')
      .update({ stripe_account_id: accountId, updated_at: new Date().toISOString() })
      .eq('id', dbUser.id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/api/stripe/connect`,
    return_url: `${appUrl}/api/stripe/connect/callback`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
