'use client'

import Link from 'next/link'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  motion,
} from '../../../components/motion'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const STATUS_VARIANT: Record<string, 'pending' | 'active' | 'success' | 'secondary' | 'cancelled' | 'outline'> = {
  pending: 'pending',
  confirmed: 'success',
  active: 'active',
  completed: 'secondary',
  cancelled: 'cancelled',
  refunded: 'outline',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  active: 'Active',
  completed: 'Terminée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
}

function formatDateTime(d: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d))
}

interface BookingData {
  id: string
  spotId: string
  startTime: Date | string
  endTime: Date | string
  status: string
  totalPrice: string
}

interface SpotInfo {
  title: string
  address: string
}

interface DashboardContentProps {
  userBookings: BookingData[]
  spotMap: Record<string, SpotInfo>
}

// Client component for cancel action
function CancelButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={`/api/bookings/${bookingId}/cancel`} method="POST">
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={(e) => {
          if (!confirm('Annuler cette réservation ?')) e.preventDefault()
        }}
      >
        Annuler
      </Button>
    </form>
  )
}

export default function DashboardContent({ userBookings, spotMap }: DashboardContentProps) {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Mes réservations</h1>
              <p className="mt-1 text-sm text-gray-500">
                {userBookings.length} réservation{userBookings.length !== 1 ? 's' : ''} au total
              </p>
            </div>
          </FadeIn>

          {userBookings.length === 0 ? (
            <FadeIn>
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0540FF]/10">
                  <svg className="h-8 w-8 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Aucune réservation</h2>
                <p className="mt-1 text-sm text-gray-500">Trouvez votre prochain parking sur la carte</p>
                <Button asChild className="mt-6">
                  <Link href="/map">
                    Trouver un parking
                  </Link>
                </Button>
              </Card>
            </FadeIn>
          ) : (
            <StaggerContainer className="space-y-4">
              {userBookings.map((booking) => {
                const spotInfo = spotMap[booking.spotId]
                const badgeVariant = STATUS_VARIANT[booking.status] ?? 'outline'
                const label = STATUS_LABEL[booking.status] ?? booking.status
                const canCancel = booking.status === 'pending' || booking.status === 'confirmed'

                return (
                  <StaggerItem key={booking.id}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[#1A1A2E] truncate">
                                  {spotInfo?.title ?? 'Parking'}
                                </h3>
                                <Badge variant={badgeVariant}>{label}</Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500 truncate">{spotInfo?.address}</p>
                            </div>
                            <p className="flex-shrink-0 text-base font-bold text-[#1A1A2E]">
                              {Number(booking.totalPrice).toFixed(2).replace('.', ',')} €
                            </p>
                          </div>
                        </CardContent>

                        <Separator />

                        <div className="grid grid-cols-2 gap-px bg-gray-100">
                          <div className="bg-white px-5 py-3">
                            <p className="text-xs text-gray-400">Arrivée</p>
                            <p className="text-sm font-medium text-[#1A1A2E]">{formatDateTime(booking.startTime)}</p>
                          </div>
                          <div className="bg-white px-5 py-3">
                            <p className="text-xs text-gray-400">Départ</p>
                            <p className="text-sm font-medium text-[#1A1A2E]">{formatDateTime(booking.endTime)}</p>
                          </div>
                        </div>

                        <Separator />

                        <CardFooter className="justify-between px-5 py-3">
                          <Button variant="link" size="sm" asChild className="px-0">
                            <Link href={`/booking/${booking.id}`}>
                              Voir les détails
                            </Link>
                          </Button>
                          {canCancel && (
                            <CancelButton bookingId={booking.id} />
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
