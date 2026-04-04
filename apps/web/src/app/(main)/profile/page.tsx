'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import { api } from '../../../lib/trpc/client'
import {
  PageTransition,
  FadeIn,
  motion,
  AnimatePresence,
} from '../../../components/motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export default function ProfilePage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login?redirect=/profile')
      } else {
        setAuthed(true)
        setAuthChecked(true)
      }
    })
  }, [router])

  if (!authChecked) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-[#0540FF]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!authed) return null

  return <ProfileContent />
}

function ProfileContent() {
  const router = useRouter()
  const { data: user, isLoading, refetch } = api.users.me.useQuery()
  const updateProfile = api.users.updateProfile.useMutation({ onSuccess: () => refetch() })
  const becomeHost = api.users.becomeHost.useMutation({ onSuccess: () => refetch() })

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hostLoading, setHostLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? '')
      setPhone(user.phoneNumber ?? '')
    }
  }, [user])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateProfile.mutateAsync({
        fullName: fullName || undefined,
        phoneNumber: phone || undefined,
      })
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function handleBecomeHost() {
    setHostLoading(true)
    setError(null)
    try {
      await becomeHost.mutateAsync()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setHostLoading(false)
    }
  }

  const ROLE_BADGE_VARIANT = {
    driver: 'blue',
    host: 'active',
    both: 'secondary',
    admin: 'outline',
  } as const

  const ROLE_LABEL = {
    driver: 'Conducteur',
    host: 'Hôte',
    both: 'Conducteur & Hôte',
    admin: 'Administrateur',
  } as const

  type RoleKey = keyof typeof ROLE_LABEL

  const roleKey = user?.role as RoleKey | undefined

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-[#0540FF]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-lg">
          <FadeIn>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Mon profil</h1>
              <p className="mt-1 text-sm text-gray-500">Gérez vos informations personnelles</p>
            </div>
          </FadeIn>

          {/* Avatar + basic info */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="mb-6"
          >
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="flex items-center gap-4 p-6">
                <Avatar className="h-16 w-16">
                  {user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt="Avatar" />
                  ) : null}
                  <AvatarFallback className="bg-[#0540FF]/10 text-xl font-bold text-[#0540FF]">
                    {user?.fullName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A1A2E]">{user?.fullName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {roleKey && ROLE_LABEL[roleKey] && (
                    <Badge
                      variant={ROLE_BADGE_VARIANT[roleKey] ?? 'outline'}
                      className="mt-1.5"
                    >
                      {ROLE_LABEL[roleKey]}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Edit form */}
          <Card className="mb-6 border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-0">
              <CardTitle className="text-base font-semibold text-[#1A1A2E]">
                Informations personnelles
              </CardTitle>
              {!editing && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="link"
                    onClick={() => setEditing(true)}
                    className="h-auto p-0 text-xs font-medium text-[#0540FF]"
                  >
                    Modifier
                  </Button>
                </motion.div>
              )}
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Nom complet
                        </Label>
                        <Input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Téléphone
                        </Label>
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Email
                        </Label>
                        <p className="text-sm text-gray-400">{user?.email}</p>
                      </div>
                    </div>

                    <Separator className="my-5" />

                    <div className="flex gap-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          loading={saving}
                          className="rounded-xl text-sm font-semibold"
                        >
                          Enregistrer
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => { setEditing(false); setError(null) }}
                          className="rounded-xl text-sm font-medium"
                        >
                          Annuler
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Nom complet
                        </Label>
                        <p className="text-sm text-[#1A1A2E]">{user?.fullName || '—'}</p>
                      </div>

                      <div>
                        <Label className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Téléphone
                        </Label>
                        <p className="text-sm text-[#1A1A2E]">{user?.phoneNumber || '—'}</p>
                      </div>

                      <div>
                        <Label className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Email
                        </Label>
                        <p className="text-sm text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Become host */}
          {user && user.role !== 'host' && user.role !== 'both' && user.role !== 'admin' && (
            <FadeIn delay={0.2}>
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-base font-semibold text-[#1A1A2E]">
                    Devenir hôte
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Louez votre place de parking et générez des revenus supplémentaires. C&apos;est gratuit, sans engagement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleBecomeHost}
                      disabled={hostLoading}
                      loading={hostLoading}
                      variant="secondary"
                      className="rounded-xl bg-[#1A1A2E] text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      Devenir hôte Flashpark
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* Feedback messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700 shadow-lg"
              >
                Modifications enregistrées
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 shadow-lg"
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
