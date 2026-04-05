import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Admin middleware — enforces authentication + admin role on every route.
 * Unauthenticated users are redirected to /login.
 * Authenticated non-admin users get a 403.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth callback (otherwise we get redirect loops)
  if (pathname === '/login' || pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  // Build cookie-aware Supabase client
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must call getUser() to refresh the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // --- Not logged in → redirect to login ---
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // --- Verify admin role ---
  // Use the service-role key here to bypass RLS and read the users table
  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('supabase_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    // For API routes, return JSON 403
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Accès interdit — rôle admin requis' },
        { status: 403 }
      )
    }

    // For pages, return a simple 403 response
    return new NextResponse(
      '<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>403 — Accès interdit</h1><p>Votre compte ne dispose pas des droits administrateur.</p><a href="/login">Se connecter avec un autre compte</a></div></body></html>',
      { status: 403, headers: { 'Content-Type': 'text/html' } }
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - Static assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
