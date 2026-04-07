import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/map'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/map'

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
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_id', supabaseUser.id)
      .single()

    if (!existing) {
      // Create user record
      await supabase.from('users').insert({
        supabase_id: supabaseUser.id,
        email: supabaseUser.email!,
        full_name:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.name ??
          supabaseUser.email?.split('@')[0] ??
          'Utilisateur',
        avatar_url: supabaseUser.user_metadata?.avatar_url ?? null,
        role: 'driver',
      })
    }
  } catch (err) {
    console.error('Failed to upsert user in DB:', err)
    return NextResponse.redirect(`${origin}/login?error=db_sync_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
