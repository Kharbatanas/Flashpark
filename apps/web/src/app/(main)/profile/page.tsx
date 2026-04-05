'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import { api } from '../../../lib/trpc/client'
import {
  PageTransition,
  FadeIn,
  motion,
  AnimatePresence,
} from '../../../components/motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  ShieldCheck,
  ParkingCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react'

// ── Auth gate ─────────────────────────────────────────────────
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
        <Loader2 className="h-8 w-8 animate-spin text-[#0540FF]" />
      </div>
    )
  }
  if (!authed) return null
  return <ProfileContent />
}

// ── Role config ───────────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  driver: { label: 'Conducteur',        className: 'bg-blue-50 text-blue-700 border-blue-200' },
  host:   { label: 'Hôte',             className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  both:   { label: 'Conducteur & Hôte', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  admin:  { label: 'Administrateur',    className: 'bg-gray-100 text-gray-700 border-gray-300' },
}

type Tab = 'info' | 'security'

// ── Profile content ───────────────────────────────────────────
function ProfileContent() {
  const router = useRouter()
  const { data: user, isLoading, refetch } = api.users.me.useQuery()
  const updateProfile = api.users.updateProfile.useMutation({ onSuccess: () => refetch() })
  const becomeHost    = api.users.becomeHost.useMutation({ onSuccess: () => refetch() })

  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [fullName, setFullName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [hostLoading, setHostLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

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

  const roleKey  = user?.role as keyof typeof ROLE_BADGE | undefined
  const roleCfg  = roleKey ? ROLE_BADGE[roleKey] : undefined
  const initials = user?.fullName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'
  const isHost   = user?.role === 'host' || user?.role === 'both' || user?.role === 'admin'
  const joinYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : null

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0540FF]" />
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'info',     label: 'Informations personnelles', icon: <User className="h-4 w-4" /> },
    { key: 'security', label: 'Sécurité',                  icon: <Lock className="h-4 w-4" /> },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <FadeIn>
            <h1 className="mb-8 text-2xl font-bold text-gray-900">Mon compte</h1>
          </FadeIn>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

            {/* ── Sidebar ────────────────────────────────────── */}
            <FadeIn delay={0.05}>
              <div className="w-full lg:w-64 flex-shrink-0">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
                  <Avatar className="mx-auto mb-4 h-20 w-20">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt="Avatar" />
                    ) : null}
                    <AvatarFallback className="bg-[#EFF6FF] text-2xl font-bold text-[#0540FF]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <p className="font-semibold text-gray-900">{user?.fullName || '—'}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{user?.email}</p>

                  {roleCfg && (
                    <span className={`mt-2 inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${roleCfg.className}`}>
                      {roleCfg.label}
                    </span>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-2 text-left">
                    {user?.isVerified && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Identité vérifiée
                      </div>
                    )}
                    {user?.phoneNumber && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                        Téléphone renseigné
                      </div>
                    )}
                    {joinYear && (
                      <p className="text-xs text-gray-400">Membre depuis {joinYear}</p>
                    )}
                  </div>
                </div>

                {/* Nav links on desktop */}
                <div className="mt-4 hidden lg:block">
                  <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    {tabs.map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          activeTab === key
                            ? 'bg-[#EFF6FF] font-semibold text-[#0540FF]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {icon}
                          {label}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* ── Right content ──────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Mobile tab pills */}
              <div className="flex gap-2 lg:hidden">
                {tabs.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      activeTab === key
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* ── Tab: Informations personnelles ──────────── */}
                {activeTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <h2 className="mb-5 text-base font-semibold text-gray-900">Informations personnelles</h2>
                      <div className="space-y-5">

                        <div>
                          <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                            <User className="h-3 w-3" /> Nom complet
                          </Label>
                          <Input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Votre nom complet"
                            className="rounded-xl"
                          />
                        </div>

                        <div>
                          <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                            <Phone className="h-3 w-3" /> Téléphone
                          </Label>
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+33 6 12 34 56 78"
                            className="rounded-xl"
                          />
                        </div>

                        <div>
                          <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                            <Mail className="h-3 w-3" /> Email
                          </Label>
                          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                            <span className="text-sm text-gray-400">{user?.email}</span>
                            <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              Non modifiable
                            </span>
                          </div>
                        </div>

                        <div className="pt-1">
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-xl bg-[#0540FF] px-6 font-semibold hover:bg-[#0435D2]"
                          >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Enregistrer les modifications
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Become host CTA */}
                    {!isHost && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <div className="rounded-2xl border border-[#0540FF]/20 bg-gradient-to-br from-[#EFF6FF] to-white p-6 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0540FF]/10">
                              <ParkingCircle className="h-6 w-6 text-[#0540FF]" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900">Devenez hôte Flashpark</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Louez votre place de parking et générez jusqu&apos;à 300 € / mois. Gratuit, sans engagement.
                              </p>
                              <Button
                                onClick={handleBecomeHost}
                                disabled={hostLoading}
                                className="mt-4 rounded-xl bg-[#0540FF] px-5 font-semibold hover:bg-[#0435D2]"
                              >
                                {hostLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Devenir hôte
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* ── Tab: Sécurité ───────────────────────────── */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <h2 className="mb-5 text-base font-semibold text-gray-900">Sécurité</h2>

                      <div className="space-y-5">
                        <div>
                          <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                            <Lock className="h-3 w-3" /> Nouveau mot de passe
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled
                            className="rounded-xl bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                            <Lock className="h-3 w-3" /> Confirmer le mot de passe
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled
                            className="rounded-xl bg-gray-50"
                          />
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                          La modification du mot de passe sera disponible prochainement.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast notifications ─────────────────────────────── */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4" />
            Modifications enregistrées
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700 shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
