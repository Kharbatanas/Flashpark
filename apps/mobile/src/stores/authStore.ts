import { create } from 'zustand'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../api/client'
import { DbUser } from '../types/database'

interface AuthState {
  session: Session | null
  user: DbUser | null
  isLoading: boolean
  isAuthenticated: boolean
  initialize: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

async function fetchDbUser(supabaseId: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_id', supabaseId)
    .single()

  if (error) return null
  return data as DbUser
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    set({ isLoading: true })

    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const user = await fetchDbUser(session.user.id)
      set({ session, user, isAuthenticated: true })
    }

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        const user = await fetchDbUser(newSession.user.id)
        set({ session: newSession, user, isAuthenticated: true })
      } else {
        set({ session: null, user: null, isAuthenticated: false })
      }
    })

    set({ isLoading: false })
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Connexion échouée')

    const user = await fetchDbUser(data.session.user.id)
    set({ session: data.session, user, isAuthenticated: true })
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw new Error(error.message)
    if (!data.session) return // email confirmation required

    const user = await fetchDbUser(data.session.user.id)
    set({ session: data.session, user, isAuthenticated: true })
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) throw new Error(error.message)
  },

  signInWithMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw new Error(error.message)
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
    set({ session: null, user: null, isAuthenticated: false })
  },

  refreshUser: async () => {
    const { session } = get()
    if (!session) return
    const user = await fetchDbUser(session.user.id)
    set({ user })
  },
}))
