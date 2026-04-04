'use client'

import Link from 'next/link'
import { ReviewsSection } from '../../../../components/reviews-section'
import { BookingMessages } from '../../../../components/booking-messages'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, motion } from '../../../../components/motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const STATUS_VARIANT: Record<string, 'pending' | 'active' | 'success' | 'secondary' | 'cancelled' | 'outline' | 'blue'> = {
  pending: 'pending',
  confirmed: 'blue',
  active: 'active',
  completed: 'secondary',
  cancelled: 'cancelled',
  refunded: 'outline',
}

interface BookingContentProps {
  booking: {
    id: string
    spotId: string
    status: string
    totalPrice: string
    platformFee: string
  }
  spot: {
    id: string
    title: string
    address: string
    pricePerHour: string
    hasSmartGate: boolean
  }
  startDate: string
  endDate: string
  hours: number
  statusInfo: { label: string; color: string }
  formattedStartDate: string
  formattedEndDate: string
  formattedStartTime: string
  formattedEndTime: string
  qrCode?: string | null
  currentUserId: string
}

export function BookingContent({
  booking,
  spot,
  hours,
  statusInfo,
  formattedStartDate,
  formattedEndDate,
  formattedStartTime,
  formattedEndTime,
  qrCode,
  currentUserId,
}: BookingContentProps) {
  const badgeVariant = STATUS_VARIANT[booking.status] ?? 'outline'

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
        <div className="mx-auto max-w-lg">
          {/* Success header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
            >
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="h-10 w-10 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>
            <FadeIn delay={0.4}>
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Réservation créée !</h1>
              <p className="mt-1 text-sm text-gray-500">
                Votre place de parking est réservée.
              </p>
            </FadeIn>
          </div>

          {/* Booking card */}
          <FadeIn delay={0.5} direction="up">
            <Card className="overflow-hidden">
              {/* Spot name */}
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Parking</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1A1A2E]">{spot.title}</h2>
                    <p className="mt-0.5 text-sm text-gray-500">{spot.address}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.7 }}
                  >
                    <Badge variant={badgeVariant}>{statusInfo.label}</Badge>
                  </motion.div>
                </div>
              </CardHeader>

              <div className="px-6 py-4">
                <Separator />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                <div className="bg-white px-6 py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Arrivée</p>
                  <p className="mt-1 text-sm font-semibold text-[#1A1A2E]">{formattedStartDate}</p>
                  <p className="text-sm text-[#0540FF]">{formattedStartTime}</p>
                </div>
                <div className="bg-white px-6 py-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Départ</p>
                  <p className="mt-1 text-sm font-semibold text-[#1A1A2E]">{formattedEndDate}</p>
                  <p className="text-sm text-[#0540FF]">{formattedEndTime}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <StaggerContainer delay={0.6} className="px-6 py-5 space-y-2">
                <h3 className="mb-3 text-sm font-semibold text-[#1A1A2E]">Détail du prix</h3>
                <StaggerItem>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {Number(spot.pricePerHour).toFixed(2).replace('.', ',')} € × {hours % 1 === 0 ? hours : hours.toFixed(1)} h
                    </span>
                    <span>
                      {(Number(booking.totalPrice) - Number(booking.platformFee)).toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de service</span>
                    <span>{Number(booking.platformFee).toFixed(2).replace('.', ',')} €</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <Separator className="my-2" />
                  <div className="flex justify-between pt-2 font-bold text-[#1A1A2E]">
                    <span>Total payé</span>
                    <span>{Number(booking.totalPrice).toFixed(2).replace('.', ',')} €</span>
                  </div>
                </StaggerItem>
              </StaggerContainer>

              {/* Booking reference / QR placeholder */}
              <FadeIn delay={0.8}>
                <div className="px-6 pb-6">
                  <Separator className="mb-5" />
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Référence de réservation
                  </p>
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white">
                      <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-[#1A1A2E]">
                        {qrCode ?? booking.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 break-all">{booking.id}</p>
                      {spot.hasSmartGate && (
                        <p className="mt-1 text-xs text-[#10B981]">Acces Smart Gate active</p>
                      )}
                    </div>
                  </div>
                </div>
              </FadeIn>
            </Card>
          </FadeIn>

          {/* Messages — show for active bookings */}
          {['pending', 'confirmed', 'active'].includes(booking.status) && (
            <FadeIn delay={0.85}>
              <div className="mt-6">
                <BookingMessages bookingId={booking.id} currentUserId={currentUserId} />
              </div>
            </FadeIn>
          )}

          {/* Review prompt for completed bookings */}
          {booking.status === 'completed' && (
            <FadeIn delay={0.9}>
              <div className="mt-6">
                <ReviewsSection spotId={spot.id} bookingId={booking.id} />
              </div>
            </FadeIn>
          )}

          {/* Actions */}
          <FadeIn delay={1.0}>
            <div className="mt-6 flex flex-col gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    Voir mes réservations
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/map">
                    Retour à la carte
                  </Link>
                </Button>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  )
}
