import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/host', '/profile', '/booking']

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // unsafe-eval required by Mapbox GL JS for WebGL shader compilation
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://api.mapbox.com https://js.stripe.com blob:`,
    // unsafe-inline kept for style-src (Tailwind + library inline styles)
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.mapbox.com https://*.stripe.com",
    "font-src 'self' https://fonts.gstatic.com https://api.mapbox.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.mapbox.com https://api.mapbox.com https://events.mapbox.com https://api.stripe.com",
    "worker-src 'self' blob:",
    "child-src blob:",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ')
}

export async function middleware(request: NextRequest) {
  // Generate per-request nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  let response = NextResponse.next({
    request,
  })

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

  // Refresh session — important: do NOT remove this call
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (isProtected(pathname) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Set CSP and nonce headers on the response
  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', buildCsp(nonce))

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
