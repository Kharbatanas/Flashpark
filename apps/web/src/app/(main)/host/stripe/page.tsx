'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../../../../lib/trpc/client'
import { PageTransition, FadeIn } from '../../../../components/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HostStripePage() {
  const { data: me, isLoading } = api.users.me.useQuery()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Impossible de contacter le serveur. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const hasStripeAccount = !!me?.stripeAccountId

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Paiements</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Connectez votre compte bancaire pour recevoir vos revenus
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/host">Retour</Link>
              </Button>
            </div>
          </FadeIn>

          <Card>
            <CardHeader className="border-b border-gray-100 px-6 py-4">
              <CardTitle className="text-base">Compte Stripe Connect</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {isLoading ? (
                <p className="text-sm text-gray-400">Chargement...</p>
              ) : hasStripeAccount ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Compte bancaire connecté</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Vos revenus sont transférés automatiquement après chaque réservation.
                    </p>
                  </div>
                  <Badge variant="success">Actif</Badge>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Pour recevoir vos paiements, vous devez connecter votre compte bancaire via
                    Stripe. Ce processus prend environ 5 minutes.
                  </p>
                  {error && (
                    <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
                  )}
                  <Button onClick={handleConnect} loading={loading} disabled={loading}>
                    Configurer les paiements
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
