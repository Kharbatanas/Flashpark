import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { db, users } from '@flashpark/db'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/map'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const supabaseUser = data.user

  try {
    // Check if user exists in our DB
    const existing = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseUser.id),
    })

    if (!existing) {
      // Create user record
      await db.insert(users).values({
        supabaseId: supabaseUser.id,
        email: supabaseUser.email!,
        fullName:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.name ??
          supabaseUser.email?.split('@')[0] ??
          'Utilisateur',
        avatarUrl: supabaseUser.user_metadata?.avatar_url ?? null,
        role: 'driver',
      })
    }
  } catch (err) {
    console.error('Failed to upsert user in DB:', err)
    // Non-fatal: user is authed but DB sync failed
  }

  return NextResponse.redirect(`${origin}${next}`)
}
