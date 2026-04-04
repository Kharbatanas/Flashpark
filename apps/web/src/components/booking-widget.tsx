'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '../lib/supabase/client'
import { api } from '../lib/trpc/client'
import { motion, AnimatePresence } from './motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Vehicle {
  id: string
  licensePlate: string
  brand: string | null
  model: string | null
  type: string
  isDefault: boolean
}

interface BookingWidgetProps {
  spot: {
    id: string
    title: string
    pricePerHour: string | number
    instantBook: boolean
    maxVehicleHeight?: string | number | null
  }
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d}T${h}:${mi}`
}

function roundToNext30(date: Date): Date {
  const ms = 30 * 60 * 1000
  return new Date(Math.ceil(date.getTime() / ms) * ms)
}

export function BookingWidget({ spot }: BookingWidgetProps) {
  const router = useRouter()
  const now = new Date()
  const defaultStart = roundToNext30(now)
  const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000)

  const [startTime, setStartTime] = useState(formatDateTime(defaultStart))
  const [endTime, setEndTime] = useState(formatDateTime(defaultEnd))
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [newPlate, setNewPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: myVehicles, refetch: refetchVehicles } = api.vehicles.list.useQuery(undefined, {
    enabled: false, // lazy load
  })
  const addVehicle = api.vehicles.create.useMutation()

  // Auto-select default vehicle when loaded
  useEffect(() => {
    if (myVehicles?.length && !selectedVehicleId) {
      const def = myVehicles.find((v: Vehicle) => v.isDefault) ?? myVehicles[0]
      setSelectedVehicleId(def.id)
    }
  }, [myVehicles, selectedVehicleId])

  const pricePerHour = Number(spot.pricePerHour)

  const start = new Date(startTime)
  const end = new Date(endTime)
  const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
  const total = Math.round(hours * pricePerHour * 100) / 100
  const platformFee = Math.round(total * 0.2 * 100) / 100

  const isValid = hours > 0 && hours <= 24 && start > now

  const createBooking = api.bookings.create.useMutation()

  async function handleReserve() {
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login?redirect=/spot/' + spot.id)
      return
    }

    // Load vehicles on first booking attempt — show selector before proceeding
    if (!myVehicles) {
      await refetchVehicles()
      setLoading(false)
      return // show vehicle selector, user clicks again to confirm
    }

    if (!isValid) {
      setError('Les dates sélectionnées sont invalides.')
      return
    }

    if (hours > 24) {
      setError('La durée maximale est de 24 heures. Pour plus, utilisez le tarif journalier.')
      return
    }

    setLoading(true)

    try {
      const result = await createBooking.mutateAsync({
        spotId: spot.id,
        startTime: start,
        endTime: end,
        vehicleId: selectedVehicleId ?? undefined,
      })

      // TODO: Enable Stripe payment when keys are configured
      // For now, skip payment and go directly to confirmation
      const stripeConfigured = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
        !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_...')

      if (stripeConfigured) {
        const res = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: result.booking.id }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Erreur de paiement')
        }
      }

      router.push(`/booking/${result.booking.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6">
        <CardContent className="p-0">
          <div className="mb-5">
            <span className="text-2xl font-bold text-[#1A1A2E]">
              {pricePerHour.toFixed(2).replace('.', ',')} €
            </span>
            <span className="text-gray-500"> / heure</span>
          </div>

          {/* Date/time pickers */}
          <div className="mb-4 space-y-3">
            <div>
              <Label htmlFor="booking-start" className="mb-1 block text-xs uppercase tracking-wide text-gray-600">
                Arrivée
              </Label>
              <Input
                id="booking-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={formatDateTime(now)}
              />
            </div>
            <div>
              <Label htmlFor="booking-end" className="mb-1 block text-xs uppercase tracking-wide text-gray-600">
                Départ
              </Label>
              <Input
                id="booking-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={startTime}
              />
            </div>
          </div>

          {/* Price breakdown */}
          <AnimatePresence>
            {hours > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-5 space-y-2 pt-4"
              >
                <Separator className="mb-4" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {pricePerHour.toFixed(2).replace('.', ',')} € × {hours % 1 === 0 ? hours : hours.toFixed(1)} h
                  </span>
                  <span>{total.toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>dont frais de service (20 %)</span>
                  <span>{platformFee.toFixed(2).replace('.', ',')} €</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between pt-1 font-bold text-[#1A1A2E]">
                  <span>Total</span>
                  <span>{total.toFixed(2).replace('.', ',')} €</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vehicle selector */}
          {myVehicles && (
            <div className="mb-4">
              <Label className="mb-1.5 block text-xs uppercase tracking-wide text-gray-600">
                Vehicule
              </Label>
              <select
                value={selectedVehicleId ?? ''}
                onChange={(e) => setSelectedVehicleId(e.target.value || null)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#0540FF] focus:outline-none focus:ring-1 focus:ring-[#0540FF]"
              >
                <option value="">Aucun vehicule selectionne</option>
                {myVehicles.map((v: Vehicle) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate}{v.brand ? ` — ${v.brand}${v.model ? ` ${v.model}` : ''}` : ''}
                    {v.isDefault ? ' (par defaut)' : ''}
                  </option>
                ))}
              </select>
              {!showAddVehicle ? (
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(true)}
                  className="mt-1.5 text-xs text-[#0540FF] hover:underline"
                >
                  + Ajouter un vehicule
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Ex: AB-123-CD"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!newPlate || newPlate.length < 2}
                    onClick={async () => {
                      const v = await addVehicle.mutateAsync({ licensePlate: newPlate, isDefault: !myVehicles.length })
                      setSelectedVehicleId(v.id)
                      setNewPlate('')
                      setShowAddVehicle(false)
                      refetchVehicles()
                    }}
                  >
                    OK
                  </Button>
                </div>
              )}
            </div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleReserve}
              loading={loading}
              disabled={!isValid}
              className="w-full py-3.5"
              size="lg"
            >
              {loading ? 'Traitement...' : spot.instantBook ? 'Réserver instantanément' : 'Demander à réserver'}
            </Button>
          </motion.div>

          {!spot.instantBook && (
            <p className="mt-2 text-center text-xs text-gray-400">
              L&apos;hôte devra approuver votre demande
            </p>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
