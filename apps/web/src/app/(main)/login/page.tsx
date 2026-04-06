'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  motion,
  AnimatePresence,
} from '../../../components/motion'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    if (mode === 'register') {
      if (password.length < 12) {
        setError('Le mot de passe doit contenir au moins 12 caractères')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: email.split('@')[0] } },
      })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else {
        setSuccessMessage('Compte créé ! Vous pouvez maintenant vous connecter.')
        setMode('login')
        setPassword('')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccessMessage('Un email de réinitialisation a été envoyé à ' + email)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Entrez votre adresse email pour recevoir un lien magique.')
      return
    }
    setMagicLinkLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setMagicLinkLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8FAFC] px-4 py-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Card className="border-gray-100 px-8 py-10 shadow-sm">
              <CardHeader className="mb-8 p-0 text-center">
                <Link href="/" className="text-3xl font-extrabold text-[#1A1A2E]">
                  Flash<span className="text-[#0540FF]">park</span>
                </Link>
                <p className="mt-2 text-sm text-gray-500">
                  {mode === 'login'
                    ? 'Connectez-vous pour réserver votre parking'
                    : 'Créez votre compte Flashpark'}
                </p>
              </CardHeader>

              <CardContent className="p-0">
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <svg className="h-8 w-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-[#1A1A2E]">Vérifiez vos emails</h2>
                      <p className="mt-2 text-sm text-gray-500">
                        Nous avons envoyé un lien de connexion à{' '}
                        <span className="font-medium text-[#1A1A2E]">{email}</span>.
                        <br />
                        Cliquez sur le lien pour vous connecter.
                      </p>
                      <Button
                        variant="link"
                        onClick={() => { setSent(false); setEmail('') }}
                        className="mt-6 text-sm text-[#0540FF]"
                      >
                        Utiliser un autre email
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <StaggerContainer>
                        {/* Tab toggle */}
                        {mode !== 'forgot' && (
                          <StaggerItem>
                            <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
                              <button
                                type="button"
                                onClick={() => { setMode('login'); setError(null); setSuccessMessage(null) }}
                                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                                  mode === 'login'
                                    ? 'bg-white text-[#1A1A2E] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                Connexion
                              </button>
                              <button
                                type="button"
                                onClick={() => { setMode('register'); setError(null); setSuccessMessage(null) }}
                                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                                  mode === 'register'
                                    ? 'bg-white text-[#1A1A2E] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                Inscription
                              </button>
                            </div>
                          </StaggerItem>
                        )}

                        {/* Success message */}
                        {successMessage && (
                          <StaggerItem>
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700"
                            >
                              {successMessage}
                            </motion.div>
                          </StaggerItem>
                        )}

                        {/* Forgot password form */}
                        {mode === 'forgot' ? (
                          <StaggerItem>
                            <div className="mb-4 text-center">
                              <h2 className="text-lg font-bold text-[#1A1A2E]">Mot de passe oublié ?</h2>
                              <p className="mt-1 text-sm text-gray-500">
                                Entrez votre email et nous vous enverrons un lien de réinitialisation.
                              </p>
                            </div>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                              <div>
                                <Label htmlFor="email-forgot" className="mb-1.5 text-sm font-medium text-gray-700">
                                  Adresse email
                                </Label>
                                <Input
                                  id="email-forgot"
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="vous@exemple.com"
                                  className="mt-1.5"
                                />
                              </div>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  type="submit"
                                  disabled={loading || !email}
                                  loading={loading}
                                  className="w-full rounded-xl py-3 text-sm font-semibold"
                                >
                                  Envoyer le lien
                                </Button>
                              </motion.div>
                              <div className="text-center">
                                <button
                                  type="button"
                                  onClick={() => { setMode('login'); setError(null); setSuccessMessage(null) }}
                                  className="text-sm text-[#0540FF] hover:underline"
                                >
                                  Retour à la connexion
                                </button>
                              </div>
                            </form>
                          </StaggerItem>
                        ) : (
                        /* Email + Password form */
                        <StaggerItem>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="email" className="mb-1.5 text-sm font-medium text-gray-700">
                                Adresse email
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vous@exemple.com"
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                  Mot de passe
                                </Label>
                                {mode === 'login' && (
                                  <button
                                    type="button"
                                    onClick={() => { setMode('forgot'); setError(null); setSuccessMessage(null) }}
                                    className="text-xs text-[#0540FF] hover:underline"
                                  >
                                    Mot de passe oublié ?
                                  </button>
                                )}
                              </div>
                              <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="mt-1.5"
                                minLength={12}
                              />
                              {mode === 'register' && (
                                <p className="text-xs text-gray-400 mt-1">12 caractères minimum</p>
                              )}
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                type="submit"
                                disabled={loading || !email || !password}
                                loading={loading}
                                className="w-full rounded-xl py-3 text-sm font-semibold"
                              >
                                {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                              </Button>
                            </motion.div>
                          </form>
                        </StaggerItem>
                        )}

                        {/* Divider */}
                        {mode !== 'forgot' && <StaggerItem>
                          <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                              <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center">
                              <span className="bg-white px-3 text-xs text-gray-400">ou</span>
                            </div>
                          </div>
                        </StaggerItem>}

                        {/* Google OAuth */}
                        {mode !== 'forgot' && <StaggerItem>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="mb-4"
                          >
                            <Button
                              variant="outline"
                              onClick={handleGoogle}
                              disabled={googleLoading}
                              loading={googleLoading}
                              className="w-full gap-3 rounded-xl border-gray-200 py-3 text-sm font-medium text-gray-700"
                            >
                              {!googleLoading && (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                              )}
                              Continuer avec Google
                            </Button>
                          </motion.div>
                        </StaggerItem>}

                        {/* Magic link */}
                        {mode !== 'forgot' && <StaggerItem>
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={handleMagicLink}
                              disabled={magicLinkLoading}
                              className="text-sm text-[#0540FF] hover:underline disabled:opacity-50"
                            >
                              {magicLinkLoading ? 'Envoi en cours...' : 'Recevoir un lien magique par email'}
                            </button>
                          </div>
                        </StaggerItem>}

                        <StaggerItem>
                          <p className="mt-6 text-center text-xs text-gray-400">
                            En vous connectant, vous acceptez nos{' '}
                            <Link href="/terms" className="text-[#0540FF] hover:underline">
                              conditions d&apos;utilisation
                            </Link>
                            .
                          </p>
                        </StaggerItem>
                      </StaggerContainer>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}
