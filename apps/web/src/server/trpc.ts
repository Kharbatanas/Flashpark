import { createTRPCContext } from '@flashpark/api'
import { createSupabaseServerClient } from '../lib/supabase/server'
import { createServerClient, type User } from '@supabase/ssr'
import { db, users } from '@flashpark/db'
import { eq } from 'drizzle-orm'

export async function createContext(opts?: { req?: Request }) {
  let supabaseUserId: string | null = null
  let supabaseUser: User | null = null

  // For tRPC API route calls from the browser — read Bearer token
  const authHeader = opts?.req?.headers?.get?.('authorization') ?? null
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data } = await supabase.auth.getUser(token)
    supabaseUser = data.user ?? null
    supabaseUserId = supabaseUser?.id ?? null
  }

  // Fallback to cookie session (SSR / Server Components)
  if (!supabaseUserId) {
    const supabase = createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    supabaseUser = data.user ?? null
    supabaseUserId = supabaseUser?.id ?? null
  }

  // Look up the real DB user by supabase_id to get the correct id + role
  let dbUserId: string | null = null
  let userRole: string | null = null

  if (supabaseUserId) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseUserId),
    })

    // If no DB user exists, the user hasn't completed the signup flow via /auth/callback.
    // Do NOT auto-create — return null userId so protectedProcedure blocks them.
    dbUserId = dbUser?.id ?? null
    userRole = dbUser?.role ?? null
  }

  return createTRPCContext({ userId: dbUserId, userRole })
}
