'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  motion,
} from '../../../components/motion'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/login?message=password_reset')
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
                <p className="mt-2 text-sm text-gray-500">Choisissez un nouveau mot de passe</p>
              </CardHeader>

              <CardContent className="p-0">
                <StaggerContainer>
                  <StaggerItem>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="password" className="mb-1.5 text-sm font-medium text-gray-700">
                          Nouveau mot de passe
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="mt-1.5"
                          minLength={6}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm" className="mb-1.5 text-sm font-medium text-gray-700">
                          Confirmer le mot de passe
                        </Label>
                        <Input
                          id="confirm"
                          type="password"
                          required
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="••••••••"
                          className="mt-1.5"
                          minLength={6}
                        />
                      </div>

                      {error && (
                        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                          {error}
                        </p>
                      )}

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          disabled={loading || !password || !confirm}
                          loading={loading}
                          className="w-full rounded-xl py-3 text-sm font-semibold"
                        >
                          Réinitialiser le mot de passe
                        </Button>
                      </motion.div>
                    </form>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="mt-4 text-center">
                      <Link href="/login" className="text-sm text-[#0540FF] hover:underline">
                        Retour à la connexion
                      </Link>
                    </div>
                  </StaggerItem>
                </StaggerContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
