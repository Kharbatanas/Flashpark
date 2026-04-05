'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  active: 'Active',
  completed: 'Terminee',
  cancelled: 'Annulee',
}

function formatDT(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export default function PlanningPage() {
  const searchParams = useSearchParams()
  const preselectedSpot = searchParams.get('spot')

  const { data: mySpots } = api.spots.myListings.useQuery()
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(preselectedSpot)

  const spotId = selectedSpotId ?? mySpots?.[0]?.id ?? null

  // Fetch all bookings for this spot (via host bookings)
  // We need a dedicated query — for now, use availability to show calendar
  const { data: availSlots } = api.availability.bySpot.useQuery(
    { spotId: spotId! },
    { enabled: !!spotId }
  )

  const spotTitle = mySpots?.find((s) => s.id === spotId)?.title ?? 'Place'

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Planning</h1>
            <p className="mt-1 text-sm text-gray-500">Reservations et disponibilites</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/host">Retour</Link>
          </Button>
        </div>

        {/* Spot selector */}
        {mySpots && mySpots.length > 1 && (
          <div className="mb-6">
            <Label className="mb-1.5 block text-xs uppercase tracking-wide text-gray-600">Place</Label>
            <select
              value={spotId ?? ''}
              onChange={(e) => setSelectedSpotId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
            >
              {mySpots.map((s) => (
                <option key={s.id} value={s.id}>{s.title} — {s.address}</option>
              ))}
            </select>
          </div>
        )}

        {!mySpots?.length ? (
          <Card className="p-8 text-center text-sm text-gray-400">
            Aucune annonce.{' '}
            <Link href="/host/listings/new" className="text-[#0540FF] hover:underline">Creer une annonce</Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Availability slots */}
            <Card>
              <CardHeader className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Creneaux de disponibilite</CardTitle>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/host/availability">Gerer</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!availSlots?.length ? (
                  <p className="px-6 py-6 text-center text-sm text-gray-400">
                    Aucun creneau defini — la place est reservable 24/7
                  </p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {availSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-3 px-6 py-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${slot.isAvailable ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">
                            {formatDT(slot.startTime)} — {formatDT(slot.endTime)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {slot.isAvailable ? 'Disponible' : 'Bloque'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-[#1A1A2E]">Protection anti-double reservation</h3>
              <p className="mt-2 text-sm text-gray-500">
                Flashpark verifie automatiquement qu&apos;un creneau n&apos;est pas deja reserve avant chaque nouvelle reservation.
                Si un conducteur tente de reserver un creneau deja pris, il verra le message &quot;Ce creneau est deja reserve&quot;.
                Vos creneaux bloques sont egalement respectes.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
