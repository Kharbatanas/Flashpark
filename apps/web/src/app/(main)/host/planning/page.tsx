'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

const STATUS_COLORS: Record<string, 'pending' | 'active' | 'success' | 'secondary' | 'cancelled'> = {
  pending: 'pending',
  confirmed: 'success',
  active: 'active',
  completed: 'secondary',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmee',
  active: 'Active',
  completed: 'Terminee',
}

function formatDT(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export default function PlanningPage() {
  const searchParams = useSearchParams()
  const preselectedSpot = searchParams.get('spot')

  const { data: mySpots } = api.spots.myListings.useQuery()
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(preselectedSpot)

  const spotId = selectedSpotId ?? mySpots?.[0]?.id ?? null

  const { data: spotBookings } = api.bookings.bySpot.useQuery(
    { spotId: spotId! },
    { enabled: !!spotId }
  )

  const { data: availSlots } = api.availability.bySpot.useQuery(
    { spotId: spotId! },
    { enabled: !!spotId }
  )

  const now = new Date()
  const upcoming = spotBookings?.filter((b) => new Date(b.endTime) >= now) ?? []
  const past = spotBookings?.filter((b) => new Date(b.endTime) < now) ?? []

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Planning</h1>
            <p className="mt-1 text-sm text-gray-500">Reservations et disponibilites par place</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/host">Retour</Link>
          </Button>
        </div>

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
          <div className="space-y-6">
            {/* Upcoming bookings */}
            <Card>
              <CardHeader className="border-b border-gray-100 px-6 py-4">
                <CardTitle className="text-base">Reservations a venir ({upcoming.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!upcoming.length ? (
                  <p className="px-6 py-8 text-center text-sm text-gray-400">Aucune reservation a venir</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {upcoming.map((b) => (
                      <div key={b.id} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={STATUS_COLORS[b.status] ?? 'secondary'}>
                              {STATUS_LABELS[b.status] ?? b.status}
                            </Badge>
                            <span className="text-sm font-medium text-[#1A1A2E]">
                              {Number(b.hostPayout).toFixed(2)} EUR
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDT(b.startTime)} → {formatDT(b.endTime)}
                          </p>
                          {b.qrCode && (
                            <p className="mt-0.5 text-xs font-mono text-gray-400">{b.qrCode}</p>
                          )}
                        </div>
                        <Link href={`/booking/${b.id}`} className="text-xs text-[#0540FF] hover:underline">
                          Details
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blocked slots */}
            <Card>
              <CardHeader className="border-b border-gray-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Creneaux bloques</CardTitle>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/host/availability">Gerer</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!availSlots?.filter((s) => !s.isAvailable).length ? (
                  <p className="px-6 py-6 text-center text-sm text-gray-400">
                    Aucun creneau bloque — la place est reservable 24/7
                  </p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {availSlots?.filter((s) => !s.isAvailable).map((slot) => (
                      <div key={slot.id} className="flex items-center gap-3 px-6 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <p className="text-sm text-gray-700">
                          {formatDT(slot.startTime)} → {formatDT(slot.endTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past bookings */}
            {past.length > 0 && (
              <Card>
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <CardTitle className="text-base text-gray-400">Historique ({past.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-50">
                    {past.slice(0, 10).map((b) => (
                      <div key={b.id} className="flex items-center justify-between px-6 py-3 opacity-60">
                        <div>
                          <p className="text-xs text-gray-500">
                            {formatDT(b.startTime)} → {formatDT(b.endTime)}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-gray-400">
                          {Number(b.hostPayout).toFixed(2)} EUR
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
