'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '../../../../lib/trpc/client'
import { useRequireHost } from '../../../../lib/use-require-host'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../../../../components/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, CreditCard, Shield, Download, Check, Loader2 } from 'lucide-react'

const DOC_STATUS_LABELS: Record<string, { label: string; variant: 'pending' | 'success' | 'cancelled' }> = {
  pending: { label: 'En cours de vérification', variant: 'pending' },
  approved: { label: 'Approuvé', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'cancelled' },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: "Carte d'identité",
  passport: 'Passeport',
  drivers_license: 'Permis de conduire',
  proof_of_address: 'Justificatif de domicile',
  property_proof: 'Justificatif de propriété',
}

export default function HostSettingsPage() {
  const router = useRouter()
  const { isHost, isLoading: hostLoading } = useRequireHost()

  const { data: me, isLoading: meLoading } = api.users.me.useQuery()
  const { data: docs } = api.verification.myDocuments.useQuery(undefined, { enabled: isHost })
  const { data: mySpots } = api.spots.myListings.useQuery(undefined, { enabled: isHost })

  const updateProfile = api.users.updateProfile.useMutation()

  // Profile form
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileInitialized, setProfileInitialized] = useState(false)

  // Initialize form once me is loaded
  if (me && !profileInitialized) {
    setFullName(me.fullName ?? '')
    setPhoneNumber(me.phoneNumber ?? '')
    setProfileInitialized(true)
  }

  // CSV export
  const [exportingCsv, setExportingCsv] = useState(false)
  const { data: hostBookings } = api.bookings.bySpot.useQuery(
    { spotId: mySpots?.[0]?.id ?? '' },
    { enabled: isHost && !!mySpots?.[0]?.id }
  )

  async function handleSaveProfile() {
    setProfileError(null)
    setProfileSaved(false)
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    }
  }

  function exportBookingsCsv() {
    if (!mySpots?.length) return
    setExportingCsv(true)

    // We export from the data already loaded (first spot). For multi-spot hosts
    // a real implementation would aggregate all spots — kept simple for MVP.
    const rows = [
      ['ID Réservation', 'Place', 'Début', 'Fin', 'Prix total', 'Frais plateforme', 'Payout hôte', 'Statut'],
      ...(hostBookings ?? []).map((b) => [
        b.id,
        b.spotId,
        new Date(b.startTime).toLocaleString('fr-FR'),
        new Date(b.endTime).toLocaleString('fr-FR'),
        b.totalPrice,
        b.platformFee,
        b.hostPayout,
        b.status,
      ]),
    ]

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flashpark-reservations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportingCsv(false)
  }

  if (hostLoading || meLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0540FF] border-t-transparent" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 pb-24 md:pb-8">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <FadeIn className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Paramètres hôte</h1>
              <p className="mt-1 text-sm text-gray-500">Gérez votre profil, vos paiements et vos documents</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/host">Retour</Link>
            </Button>
          </FadeIn>

          <StaggerContainer className="space-y-6">

            {/* ── Section 1: Profil hôte ── */}
            <StaggerItem>
              <Card>
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0540FF]" />
                    <CardTitle className="text-base">Profil hôte</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">Nom complet</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jean Dupont"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">Téléphone</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">Email</label>
                    <input
                      type="email"
                      value={me?.email ?? ''}
                      disabled
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-400">L&apos;email ne peut pas être modifié ici</p>
                  </div>

                  {profileError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                      {profileError}
                    </p>
                  )}

                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : profileSaved ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                    {profileSaved ? 'Sauvegardé !' : 'Sauvegarder le profil'}
                  </Button>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* ── Section 2: Paiements ── */}
            <StaggerItem>
              <Card>
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#0540FF]" />
                    <CardTitle className="text-base">Paiements</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="mb-4 text-sm text-gray-600">
                    Configurez votre compte Stripe Connect pour recevoir vos revenus de parking directement sur votre compte bancaire.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild>
                      <Link href="/host/stripe">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Configurer Stripe Connect
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/host/earnings">
                        Voir mes revenus
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* ── Section 3: Documents de vérification ── */}
            <StaggerItem>
              <Card>
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#0540FF]" />
                    <CardTitle className="text-base">Documents de vérification</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!docs?.length ? (
                    <div className="px-6 py-5">
                      <p className="mb-3 text-sm text-gray-500">Aucun document soumis.</p>
                      <Button variant="outline" asChild>
                        <Link href="/host/verification">
                          Soumettre des documents
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-gray-50">
                        {docs.map((doc) => {
                          const info = DOC_STATUS_LABELS[doc.status] ?? DOC_STATUS_LABELS.pending
                          const typeLabel = DOC_TYPE_LABELS[doc.type] ?? doc.type
                          return (
                            <div key={doc.id} className="flex items-center justify-between px-6 py-3.5">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{typeLabel}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <Badge variant={info.variant}>{info.label}</Badge>
                            </div>
                          )
                        })}
                      </div>
                      <div className="border-t border-gray-100 px-6 py-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/host/verification">Gérer les documents</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* ── Section 4: Export données ── */}
            <StaggerItem>
              <Card>
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-[#0540FF]" />
                    <CardTitle className="text-base">Exporter mes données</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="mb-4 text-sm text-gray-600">
                    Téléchargez l&apos;historique complet de vos réservations au format CSV pour votre comptabilité.
                  </p>
                  <Button
                    variant="outline"
                    onClick={exportBookingsCsv}
                    disabled={exportingCsv || !mySpots?.length}
                    className="flex items-center gap-2"
                  >
                    {exportingCsv ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Exporter mes données (CSV)
                  </Button>
                  {!mySpots?.length && (
                    <p className="mt-2 text-xs text-gray-400">Créez une annonce pour pouvoir exporter vos données.</p>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  )
}
