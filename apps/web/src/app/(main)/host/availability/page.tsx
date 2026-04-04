'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../../../../lib/trpc/client'
import { PageTransition, FadeIn } from '../../../../components/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export default function AvailabilityPage() {
  const { data: mySpots, isLoading: spotsLoading } = api.spots.myListings.useQuery()
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)

  const spotId = selectedSpotId ?? mySpots?.[0]?.id ?? null

  const { data: slots, refetch } = api.availability.bySpot.useQuery(
    { spotId: spotId! },
    { enabled: !!spotId }
  )

  const addSlot = api.availability.set.useMutation({ onSuccess: () => refetch() })
  const deleteSlot = api.availability.delete.useMutation({ onSuccess: () => refetch() })

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  function handleAdd() {
    if (!spotId || !startTime || !endTime) return
    addSlot.mutate({
      spotId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isAvailable,
    })
    setStartTime('')
    setEndTime('')
  }

  if (spotsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0540FF] border-t-transparent" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Disponibilites</h1>
                <p className="mt-1 text-sm text-gray-500">Gerez les creneaux de vos places</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/host">Retour</Link>
              </Button>
            </div>
          </FadeIn>

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
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}

          {!mySpots?.length ? (
            <Card className="p-8 text-center text-sm text-gray-400">
              Vous n&apos;avez pas encore d&apos;annonce.{' '}
              <Link href="/host/listings/new" className="text-[#0540FF] hover:underline">Creer une annonce</Link>
            </Card>
          ) : (
            <>
              {/* Add slot form */}
              <Card className="mb-6">
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <CardTitle className="text-base">Ajouter un creneau</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1 text-xs text-gray-600">Debut</Label>
                      <Input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 text-xs text-gray-600">Fin</Label>
                      <Input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="avail"
                        checked={isAvailable}
                        onChange={() => setIsAvailable(true)}
                        className="accent-[#10B981]"
                      />
                      Disponible
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="avail"
                        checked={!isAvailable}
                        onChange={() => setIsAvailable(false)}
                        className="accent-red-500"
                      />
                      Indisponible (bloquer)
                    </label>
                  </div>
                  <Button
                    className="mt-4"
                    onClick={handleAdd}
                    disabled={!startTime || !endTime || addSlot.isPending}
                    loading={addSlot.isPending}
                  >
                    Ajouter
                  </Button>
                </CardContent>
              </Card>

              {/* Existing slots */}
              <Card>
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <CardTitle className="text-base">Creneaux planifies</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!slots?.length ? (
                    <p className="px-6 py-8 text-center text-sm text-gray-400">Aucun creneau defini — votre place est reservable 24/7</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between px-6 py-3.5">
                          <div>
                            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${slot.isAvailable ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            <span className="text-sm text-gray-700">
                              {formatDate(slot.startTime)} — {formatDate(slot.endTime)}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {slot.isAvailable ? 'Disponible' : 'Bloque'}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-500 hover:bg-red-50"
                            onClick={() => deleteSlot.mutate({ id: slot.id })}
                            disabled={deleteSlot.isPending}
                          >
                            Supprimer
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
