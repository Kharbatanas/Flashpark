'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../../../../lib/trpc/client'
import { useRequireHost } from '../../../../lib/use-require-host'
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

/* ─── Weekly Calendar Grid ─── */
function WeeklyCalendar({ slots, weekStart }: {
  slots: Array<{ id: string; startTime: string | Date; endTime: string | Date; isAvailable: boolean }>
  weekStart: Date
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const HOURS = Array.from({ length: 24 }, (_, i) => i) // 0–23

  function slotsForDay(day: Date) {
    return slots.filter((s) => {
      const start = new Date(s.startTime)
      const end = new Date(s.endTime)
      // slot overlaps this day
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999)
      return start <= dayEnd && end >= dayStart
    })
  }

  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-gray-100 pb-2 mb-1">
          <div className="text-xs text-gray-400" />
          {days.map((day, i) => (
            <div key={i} className="text-center">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">{DAY_LABELS[i]}</p>
              <p className="text-sm font-bold text-gray-900">{day.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Time grid — show every 6h for compactness */}
        <div className="relative">
          {[0, 6, 12, 18].map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-50 py-1.5">
              <div className="text-[11px] text-gray-400 pr-2 text-right leading-none pt-0.5">
                {String(hour).padStart(2, '0')}h
              </div>
              {days.map((day, di) => {
                const daySlots = slotsForDay(day)
                const hourStart = new Date(day); hourStart.setHours(hour, 0, 0, 0)
                const hourEnd = new Date(day); hourEnd.setHours(hour + 6, 0, 0, 0)
                const active = daySlots.filter((s) => new Date(s.startTime) < hourEnd && new Date(s.endTime) > hourStart)
                const isAvail = active.length > 0 && active[0].isAvailable
                const isBlocked = active.length > 0 && !active[0].isAvailable
                return (
                  <div
                    key={di}
                    className={`mx-0.5 rounded h-6 ${
                      isAvail ? 'bg-emerald-100 border border-emerald-200' :
                      isBlocked ? 'bg-red-100 border border-red-200' :
                      'bg-gray-50'
                    }`}
                    title={isAvail ? 'Disponible' : isBlocked ? 'Bloqué' : ''}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-emerald-100 border border-emerald-200" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-200" />
            Bloqué
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded bg-gray-50 border border-gray-100" />
            Non défini (réservable)
          </span>
        </div>
      </div>
    </div>
  )
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
]

export default function AvailabilityPage() {
  const { isHost } = useRequireHost()
  const { data: mySpots, isLoading: spotsLoading } = api.spots.myListings.useQuery(undefined, { enabled: isHost })
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)

  const spotId = selectedSpotId ?? mySpots?.[0]?.id ?? null

  const { data: slots, refetch } = api.availability.bySpot.useQuery(
    { spotId: spotId! },
    { enabled: !!spotId }
  )

  const addSlot = api.availability.set.useMutation({ onSuccess: () => refetch() })
  const deleteSlot = api.availability.delete.useMutation({ onSuccess: () => refetch() })
  const bulkSet = api.availability.bulkSet.useMutation({ onSuccess: () => refetch() })

  // ── Single slot form ──
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  // ── Calendar navigation ──
  const [weekOffset, setWeekOffset] = useState(0)
  const weekStart = (() => {
    const d = new Date()
    const dow = d.getDay()
    const diffToMon = (dow + 6) % 7
    d.setDate(d.getDate() - diffToMon + weekOffset * 7)
    d.setHours(0, 0, 0, 0)
    return d
  })()

  // ── Recurring template form ──
  const [recurringDays, setRecurringDays] = useState<number[]>([])
  const [recurringStart, setRecurringStart] = useState('08:00')
  const [recurringEnd, setRecurringEnd] = useState('20:00')
  const [recurringType, setRecurringType] = useState(true) // true = available
  const [recurringError, setRecurringError] = useState<string | null>(null)
  const [recurringSuccess, setRecurringSuccess] = useState(false)

  function toggleDay(day: number) {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleApplyRecurring() {
    if (!spotId) return
    if (recurringDays.length === 0) {
      setRecurringError('Sélectionnez au moins un jour')
      return
    }
    if (recurringStart >= recurringEnd) {
      setRecurringError("L'heure de fin doit être après l'heure de début")
      return
    }

    setRecurringError(null)
    setRecurringSuccess(false)

    const slotsToCreate: Array<{ startTime: Date; endTime: Date; isAvailable: boolean }> = []
    const now = new Date()

    // Generate slots for the next 4 weeks
    for (let week = 0; week < 4; week++) {
      for (const dayOfWeek of recurringDays) {
        const base = new Date(now)
        // Find the next occurrence of this day of week
        const currentDow = base.getDay()
        const diff = (dayOfWeek - currentDow + 7) % 7
        base.setDate(base.getDate() + diff + week * 7)
        base.setSeconds(0)
        base.setMilliseconds(0)

        const [startH, startM] = recurringStart.split(':').map(Number)
        const [endH, endM] = recurringEnd.split(':').map(Number)

        const slotStart = new Date(base)
        slotStart.setHours(startH, startM, 0, 0)

        const slotEnd = new Date(base)
        slotEnd.setHours(endH, endM, 0, 0)

        if (slotStart > now) {
          slotsToCreate.push({ startTime: slotStart, endTime: slotEnd, isAvailable: recurringType })
        }
      }
    }

    if (slotsToCreate.length === 0) {
      setRecurringError('Aucun créneau à créer (toutes les dates sont passées)')
      return
    }

    // Chunk into batches of 60 (API max)
    try {
      for (let i = 0; i < slotsToCreate.length; i += 60) {
        await bulkSet.mutateAsync({ spotId, slots: slotsToCreate.slice(i, i + 60) })
      }
      setRecurringSuccess(true)
      setRecurringDays([])
    } catch (err) {
      setRecurringError(err instanceof Error ? err.message : 'Erreur lors de la création des créneaux')
    }
  }

  function handleAdd() {
    if (!spotId || !startTime || !endTime) return
    if (new Date(startTime) >= new Date(endTime)) {
      alert('La date de fin doit être après la date de début')
      return
    }
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

  const serializedSlots = (slots ?? []).map((s) => ({
    ...s,
    startTime: s.startTime instanceof Date ? s.startTime.toISOString() : s.startTime,
    endTime: s.endTime instanceof Date ? s.endTime.toISOString() : s.endTime,
  }))

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Disponibilités</h1>
                <p className="mt-1 text-sm text-gray-500">Gérez les créneaux de vos places</p>
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
              <Link href="/host/listings/new" className="text-[#0540FF] hover:underline">Créer une annonce</Link>
            </Card>
          ) : (
            <>
              {/* ── Weekly Calendar View ── */}
              <Card className="mb-6">
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Vue calendrier</CardTitle>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWeekOffset((w) => w - 1)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        ← Préc.
                      </button>
                      <span className="text-xs text-gray-500">
                        Sem. du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <button
                        onClick={() => setWeekOffset((w) => w + 1)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Suiv. →
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <WeeklyCalendar slots={serializedSlots} weekStart={weekStart} />
                </CardContent>
              </Card>

              {/* ── Add single slot form ── */}
              <Card className="mb-6">
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <CardTitle className="text-base">Ajouter un créneau</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1 text-xs text-gray-600">Début</Label>
                      <Input
                        type="datetime-local"
                        value={startTime}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 text-xs text-gray-600">Fin</Label>
                      <Input
                        type="datetime-local"
                        value={endTime}
                        min={new Date().toISOString().slice(0, 16)}
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
                  >
                    Ajouter
                  </Button>
                </CardContent>
              </Card>

              {/* ── Recurring template ── */}
              <Card className="mb-6">
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <CardTitle className="text-base">Créer un modèle récurrent</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <Label className="mb-2 block text-xs text-gray-600">Jours de la semaine</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                            recurringDays.includes(d.value)
                              ? 'border-[#0540FF] bg-[#0540FF] text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-1 text-xs text-gray-600">Heure de début</Label>
                      <Input
                        type="time"
                        value={recurringStart}
                        onChange={(e) => setRecurringStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 text-xs text-gray-600">Heure de fin</Label>
                      <Input
                        type="time"
                        value={recurringEnd}
                        onChange={(e) => setRecurringEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="recurringType"
                        checked={recurringType}
                        onChange={() => setRecurringType(true)}
                        className="accent-[#10B981]"
                      />
                      Disponible
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="recurringType"
                        checked={!recurringType}
                        onChange={() => setRecurringType(false)}
                        className="accent-red-500"
                      />
                      Bloquer
                    </label>
                  </div>
                  {recurringError && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                      {recurringError}
                    </p>
                  )}
                  {recurringSuccess && (
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                      Créneaux appliqués pour les 4 prochaines semaines.
                    </p>
                  )}
                  <Button
                    onClick={handleApplyRecurring}
                    disabled={bulkSet.isPending || recurringDays.length === 0}
                    className="w-full sm:w-auto"
                  >
                    {bulkSet.isPending ? 'Création...' : 'Appliquer pour les 4 prochaines semaines'}
                  </Button>
                </CardContent>
              </Card>

              {/* ── Existing slots list ── */}
              <Card>
                <CardHeader className="border-b border-gray-100 px-6 py-4">
                  <CardTitle className="text-base">Créneaux planifiés</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!serializedSlots.length ? (
                    <p className="px-6 py-8 text-center text-sm text-gray-400">
                      Aucun créneau défini — votre place est réservable 24/7
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {serializedSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between px-6 py-3.5">
                          <div>
                            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${slot.isAvailable ? 'bg-emerald-500' : 'bg-red-400'}`} />
                            <span className="text-sm text-gray-700">
                              {formatDate(slot.startTime)} — {formatDate(slot.endTime)}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              {slot.isAvailable ? 'Disponible' : 'Bloqué'}
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
