'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { ReviewsSection } from '../../../../components/reviews-section'
import { BookingMessages } from '../../../../components/booking-messages'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem, motion, AnimatePresence } from '../../../../components/motion'
import { api } from '../../../../lib/trpc/client'
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
  LogIn,
  LogOut,
  Timer,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react'

/* ─── constants ─────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmée',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  active:    { label: 'Active',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Terminée',    className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Annulée',     className: 'bg-red-50 text-red-600 border-red-200' },
  refunded:  { label: 'Remboursée',  className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

/* ─── types ──────────────────────────────────────────────────────── */

interface BookingContentProps {
  booking: {
    id: string
    spotId: string
    status: string
    totalPrice: string
    platformFee: string
    startTime: string
    endTime: string
    checkedInAt: string | null
    originalEndTime: string | null
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

/* ─── helpers ────────────────────────────────────────────────────── */

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`
  if (hours > 0) return `${hours} h`
  return `${minutes} min`
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/* ─── countdown / timer display ─────────────────────────────────── */

function BookingTimer({ booking }: {
  booking: Pick<BookingContentProps['booking'], 'status' | 'startTime' | 'endTime' | 'checkedInAt'>
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const startMs = new Date(booking.startTime).getTime()
  const endMs = new Date(booking.endTime).getTime()
  const msUntilStart = startMs - now
  const msRemaining = endMs - now
  const isApproachingEnd = booking.status === 'active' && msRemaining > 0 && msRemaining < 15 * 60 * 1000

  if (booking.status === 'confirmed' && msUntilStart > 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Timer className="h-4 w-4 flex-shrink-0 text-[#0540FF]" />
        <span>Votre réservation commence dans <strong>{formatDuration(msUntilStart)}</strong></span>
      </div>
    )
  }

  if (booking.status === 'active' && msRemaining > 0) {
    if (isApproachingEnd) {
      return (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#F5A623]" />
          <span>Votre créneau se termine dans <strong>{formatDuration(msRemaining)}</strong></span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <Clock className="h-4 w-4 flex-shrink-0 text-[#10B981]" />
        <span>Temps restant : <strong>{formatDuration(msRemaining)}</strong></span>
      </div>
    )
  }

  return null
}

/* ─── extension modal ────────────────────────────────────────────── */

interface ExtensionModalProps {
  booking: Pick<BookingContentProps['booking'], 'id' | 'endTime' | 'originalEndTime'>
  pricePerHour: number
  onClose: () => void
  onSuccess: (newEndTime: string, additionalCost: number) => void
}

function ExtensionModal({ booking, pricePerHour, onClose, onSuccess }: ExtensionModalProps) {
  const currentEnd = new Date(booking.endTime)
  const baseEnd = booking.originalEndTime ? new Date(booking.originalEndTime) : currentEnd
  const maxEnd = new Date(baseEnd.getTime() + 8 * 60 * 60 * 1000)

  // Build 30-min increment options from current end up to max
  const options: Date[] = []
  let cursor = new Date(currentEnd.getTime() + 30 * 60 * 1000)
  while (cursor <= maxEnd) {
    options.push(new Date(cursor))
    cursor = new Date(cursor.getTime() + 30 * 60 * 1000)
  }

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const extendMutation = api.bookings.extend.useMutation()

  const selectedEnd = options[selectedIndex]
  const additionalHours = selectedEnd
    ? (selectedEnd.getTime() - currentEnd.getTime()) / (1000 * 60 * 60)
    : 0
  const estimatedCost = Math.round(additionalHours * pricePerHour * 100) / 100

  async function handleConfirm() {
    if (!selectedEnd) return
    setError(null)
    try {
      await extendMutation.mutateAsync({ bookingId: booking.id, newEndTime: selectedEnd })
      onSuccess(selectedEnd.toISOString(), estimatedCost)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-8 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Prolonger ma réservation</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-500">
          Heure de fin actuelle : <strong className="text-gray-900">{formatTime(booking.endTime)}</strong>
        </p>

        {options.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Vous avez atteint la durée maximale d&apos;extension (8 h).
          </p>
        ) : (
          <>
            <div className="mb-4 relative">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-gray-400">
                Nouvelle heure de fin
              </label>
              <div className="relative">
                <select
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-900 focus:border-[#0540FF] focus:outline-none focus:ring-2 focus:ring-[#0540FF]/20"
                >
                  {options.map((opt, i) => {
                    const addH = (opt.getTime() - currentEnd.getTime()) / (1000 * 60 * 60)
                    const addCost = Math.round(addH * pricePerHour * 100) / 100
                    return (
                      <option key={i} value={i}>
                        {formatTime(opt.toISOString())} — +{addH % 1 === 0 ? addH : addH.toFixed(1)} h (+{addCost.toFixed(2).replace('.', ',')} €)
                      </option>
                    )
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm text-blue-800">
                Coût supplémentaire estimé :{' '}
                <strong>{estimatedCost.toFixed(2).replace('.', ',')} €</strong>
              </p>
            </div>
          </>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          {options.length > 0 && (
            <Button
              onClick={handleConfirm}
              loading={extendMutation.isPending}
              disabled={options.length === 0}
              className="flex-1 rounded-xl bg-[#0540FF] text-sm font-semibold text-white hover:bg-[#0435D2]"
            >
              Confirmer
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── dispute banner ─────────────────────────────────────────────── */

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  spot_occupied:    'Place occupée',
  spot_not_matching: 'Non conforme à l\'annonce',
  access_issue:     'Problème d\'accès',
  safety_concern:   'Problème de sécurité',
  other:            'Autre',
}

const DISPUTE_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  open:                  { label: 'Litige en cours',  className: 'border-amber-200 bg-amber-50 text-amber-800' },
  under_review:          { label: 'En cours d\'examen', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  resolved_refunded:     { label: 'Litige résolu — Remboursé',   className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  resolved_rejected:     { label: 'Litige résolu — Rejeté',      className: 'border-red-200 bg-red-50 text-red-800' },
  resolved_compensation: { label: 'Litige résolu — Compensation', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
}

function DisputeBanner({ bookingId }: { bookingId: string }) {
  const { data: dispute } = api.disputes.byBooking.useQuery({ bookingId }, { retry: false })

  if (!dispute) return null

  const statusConfig = DISPUTE_STATUS_LABELS[dispute.status] ?? { label: dispute.status, className: 'border-gray-200 bg-gray-50 text-gray-800' }

  return (
    <FadeIn>
      <div className={`rounded-xl border px-4 py-4 ${statusConfig.className}`}>
        <p className="font-semibold">{statusConfig.label}</p>
        <p className="mt-0.5 text-sm opacity-80">
          Type : {DISPUTE_TYPE_LABELS[dispute.type] ?? dispute.type}
        </p>
        {dispute.resolution && (
          <p className="mt-2 text-sm">
            <span className="font-medium">Résolution :</span> {dispute.resolution}
          </p>
        )}
      </div>
    </FadeIn>
  )
}

/* ─── toast ──────────────────────────────────────────────────────── */

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg ${
        type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  )
}

/* ─── action buttons section ─────────────────────────────────────── */

interface DriverActionsProps {
  booking: BookingContentProps['booking']
  pricePerHour: number
}

function DriverActions({ booking, pricePerHour }: DriverActionsProps) {
  const router = useRouter()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(booking.status)
  const [currentEndTime, setCurrentEndTime] = useState(booking.endTime)

  const checkInMutation = api.bookings.checkIn.useMutation()
  const checkOutMutation = api.bookings.checkOut.useMutation()

  const now = Date.now()
  const startMs = new Date(booking.startTime).getTime()
  const endMs = new Date(currentEndTime).getTime()
  const msUntilStart = startMs - now
  const canCheckIn = currentStatus === 'confirmed' && msUntilStart <= 15 * 60 * 1000 && now < endMs
  const canCheckOut = currentStatus === 'active' && booking.checkedInAt !== null
  const canExtend = currentStatus === 'active'

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleCheckIn() {
    try {
      await checkInMutation.mutateAsync({ bookingId: booking.id })
      setCurrentStatus('active')
      showToast('Check-in effectué avec succès !', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Une erreur est survenue', 'error')
    }
  }

  async function handleCheckOut() {
    try {
      await checkOutMutation.mutateAsync({ bookingId: booking.id })
      showToast('Check-out effectué. Redirection...', 'success')
      setTimeout(() => router.push(`/review/${booking.id}`), 1500)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Une erreur est survenue', 'error')
    }
  }

  function handleExtensionSuccess(newEndTime: string, additionalCost: number) {
    setCurrentEndTime(newEndTime)
    setShowExtensionModal(false)
    showToast(
      `Réservation prolongée jusqu'à ${formatTime(newEndTime)} (+${additionalCost.toFixed(2).replace('.', ',')} €)`,
      'success'
    )
  }

  if (!canCheckIn && !canCheckOut && !canExtend) return null

  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>

      <FadeIn delay={0.7}>
        <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Actions</p>

          {canCheckIn && (
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCheckIn}
                loading={checkInMutation.isPending}
                className="w-full rounded-xl bg-[#10B981] py-3 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Arrivé — Check-in
              </Button>
            </motion.div>
          )}

          {canCheckOut && (
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCheckOut}
                loading={checkOutMutation.isPending}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: '#F5A623' }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Partir — Check-out
              </Button>
            </motion.div>
          )}

          {canExtend && (
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => setShowExtensionModal(true)}
                className="w-full rounded-xl border-[#0540FF] py-3 text-sm font-semibold text-[#0540FF] hover:bg-blue-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Prolonger ma réservation
              </Button>
            </motion.div>
          )}
        </div>
      </FadeIn>

      <AnimatePresence>
        {showExtensionModal && (
          <ExtensionModal
            booking={{ id: booking.id, endTime: currentEndTime, originalEndTime: booking.originalEndTime }}
            pricePerHour={pricePerHour}
            onClose={() => setShowExtensionModal(false)}
            onSuccess={handleExtensionSuccess}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── main component ─────────────────────────────────────────────── */

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
  const pricePerHour = Number(spot.pricePerHour)

  const canReportDispute = ['active', 'confirmed', 'completed'].includes(booking.status)

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

          {/* ── Timer / countdown ──────────────────────────── */}
          {(booking.status === 'confirmed' || booking.status === 'active') && (
            <FadeIn delay={0.42} direction="up">
              <BookingTimer booking={booking} />
            </FadeIn>
          )}

          {/* ── Dispute banner ──────────────────────────────── */}
          <DisputeBanner bookingId={booking.id} />

          {/* ── Driver actions (check-in/out/extend) ─────────── */}
          <DriverActions booking={booking} pricePerHour={pricePerHour} />

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

              {/* Report dispute link */}
              {canReportDispute && (
                <div className="pt-2 text-center">
                  <Link
                    href={`/booking/${booking.id}/dispute`}
                    className="text-sm font-medium text-red-500 underline underline-offset-2 hover:text-red-700"
                  >
                    Signaler un problème
                  </Link>
                </div>
              )}
            </div>
          </FadeIn>

        </div>
      </div>
    </PageTransition>
  )
}
