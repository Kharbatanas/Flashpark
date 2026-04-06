'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { ReviewsSection } from '../../../../components/reviews-section'
import { BookingMessages } from '../../../../components/booking-messages'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, motion } from '../../../../components/motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Calendar,
  Clock,
  MessageCircle,
  ListChecks,
  Map,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Navigation,
  Info,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmée',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  active:    { label: 'Active',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Terminée',    className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Annulée',     className: 'bg-red-50 text-red-600 border-red-200' },
  refunded:  { label: 'Remboursée',  className: 'bg-gray-100 text-gray-600 border-gray-200' },
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
    latitude: string
    longitude: string
    parkingInstructions: string | null
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
  formattedStartDate,
  formattedEndDate,
  formattedStartTime,
  formattedEndTime,
  qrCode,
  currentUserId,
}: BookingContentProps) {
  const statusCfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, className: 'bg-gray-100 text-gray-600 border-gray-200' }
  const hostBase = Number(booking.totalPrice) - Number(booking.platformFee)

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-lg space-y-4">

          {/* ── Status header ──────────────────────────────── */}
          <div className="mb-6 text-center">
            {booking.status === 'confirmed' || booking.status === 'active' ? (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.35 }}
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" strokeWidth={1.75} />
                  </motion.div>
                </motion.div>
                <FadeIn delay={0.4}>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">Réservation confirmée !</h1>
                  <p className="mt-1 text-sm text-gray-500">Votre place de parking est réservée.</p>
                </FadeIn>
              </>
            ) : booking.status === 'pending' ? (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100"
                >
                  <AlertCircle className="h-10 w-10 text-amber-500" strokeWidth={1.75} />
                </motion.div>
                <FadeIn delay={0.4}>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">En attente de paiement</h1>
                  <p className="mt-1 text-sm text-gray-500">Votre réservation est en cours de traitement.</p>
                </FadeIn>
              </>
            ) : booking.status === 'cancelled' || booking.status === 'refunded' ? (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100"
                >
                  <XCircle className="h-10 w-10 text-red-500" strokeWidth={1.75} />
                </motion.div>
                <FadeIn delay={0.4}>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    {booking.status === 'refunded' ? 'Réservation remboursée' : 'Réservation annulée'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">Cette réservation n&apos;est plus active.</p>
                </FadeIn>
              </>
            ) : (
              <FadeIn delay={0.4}>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Réservation terminée</h1>
                <p className="mt-1 text-sm text-gray-500">Merci d&apos;avoir utilisé Flashpark.</p>
              </FadeIn>
            )}
          </div>

          {/* ── Spot details card ───────────────────────────── */}
          <FadeIn delay={0.45} direction="up">
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Parking</p>
                  <h2 className="mt-1 text-lg font-semibold leading-snug text-gray-900">{spot.title}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {spot.address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${spot.latitude},${spot.longitude}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#0540FF] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0435D2] transition-colors"
                  >
                    <Navigation className="h-3 w-3" />
                    Naviguer
                  </a>
                </div>
                <span className={`mt-0.5 flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              </div>

              {/* Parking instructions */}
              {spot.parkingInstructions && (
                <>
                  <Separator />
                  <div className="flex gap-3 px-6 py-4">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0540FF]" />
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Instructions d&apos;accès</p>
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{spot.parkingInstructions}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Dates grid */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                <div className="px-6 py-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    <Calendar className="h-3 w-3" /> Arrivée
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{formattedStartDate}</p>
                  <p className="flex items-center gap-1 text-sm text-[#0540FF]">
                    <Clock className="h-3 w-3" />{formattedStartTime}
                  </p>
                </div>
                <div className="px-6 py-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    <Calendar className="h-3 w-3" /> Départ
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{formattedEndDate}</p>
                  <p className="flex items-center gap-1 text-sm text-[#0540FF]">
                    <Clock className="h-3 w-3" />{formattedEndTime}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Price breakdown */}
              <StaggerContainer delay={0.55} className="px-6 py-5 space-y-2.5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Détail du prix</p>
                <StaggerItem>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {Number(spot.pricePerHour).toFixed(2).replace('.', ',')} € × {hours % 1 === 0 ? hours : hours.toFixed(1)} h
                    </span>
                    <span>{hostBase.toFixed(2).replace('.', ',')} €</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Frais de service</span>
                    <span>{Number(booking.platformFee).toFixed(2).replace('.', ',')} €</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <Separator className="my-1" />
                  <div className="flex justify-between pt-1 text-sm font-bold text-gray-900">
                    <span>Total payé</span>
                    <span>{Number(booking.totalPrice).toFixed(2).replace('.', ',')} €</span>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </FadeIn>

          {/* ── QR Code card ────────────────────────────────── */}
          <FadeIn delay={0.65} direction="up">
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm px-6 py-6 text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                Code d&apos;accès
              </p>
              <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 p-4">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify?code=${encodeURIComponent(qrCode ?? booking.id)}`}
                  size={120}
                  bgColor="#f9fafb"
                  fgColor="#111827"
                  level="M"
                />
              </div>
              <p className="font-mono text-xl font-bold tracking-widest text-gray-900">
                {qrCode ?? booking.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="mt-1 font-mono text-[10px] text-gray-400 break-all">{booking.id}</p>
              {spot.hasSmartGate && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Zap className="h-3 w-3" />
                  Accès Smart Gate activé
                </div>
              )}
            </div>
          </FadeIn>

          {/* ── Messages (active bookings) ───────────────────── */}
          {['pending', 'confirmed', 'active'].includes(booking.status) && (
            <FadeIn delay={0.75}>
              <BookingMessages bookingId={booking.id} currentUserId={currentUserId} />
            </FadeIn>
          )}

          {/* ── Review (completed) ───────────────────────────── */}
          {booking.status === 'completed' && (
            <FadeIn delay={0.75}>
              <ReviewsSection spotId={spot.id} bookingId={booking.id} />
            </FadeIn>
          )}

          {/* ── Action buttons ───────────────────────────────── */}
          <FadeIn delay={0.8}>
            <div className="flex flex-col gap-3 pt-2">
              {['pending', 'confirmed', 'active'].includes(booking.status) && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full rounded-full border-gray-300 font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900"
                  >
                    <Link href={`/booking/${booking.id}#messages`}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contacter l&apos;hôte
                    </Link>
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  asChild
                  className="w-full rounded-full bg-[#0540FF] font-semibold hover:bg-[#0435D2]"
                >
                  <Link href="/dashboard">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Mes réservations
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  asChild
                  className="w-full rounded-full font-semibold text-gray-500 hover:text-gray-900"
                >
                  <Link href="/map">
                    <Map className="mr-2 h-4 w-4" />
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
